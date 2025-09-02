const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5163;

// Middleware
app.use(cors());
app.use(express.json());

// Função para gerar ID único
function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Configuração dos arquivos JSON
const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const QUIZ_CONFIG_FILE = path.join(DATA_DIR, 'quiz-config.json');
const RANKING_HISTORY_FILE = path.join(DATA_DIR, 'ranking-history.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Garante que o diretório de dados existe
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Funções auxiliares para leitura/escrita de arquivos
async function readJsonFile(filePath, defaultValue = []) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existe, retorna valor padrão
    if (error.code === 'ENOENT') {
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Delay simulado para simular latência de rede
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Rotas da API

// GET /api/players - Busca ranking de jogadores
app.get('/api/players', async (req, res) => {
  try {
    await delay(); // Simula latência
    
    const players = await readJsonFile(PLAYERS_FILE, []);
    
    // Ordena por score (decrescente) e depois por timestamp (crescente)
    const sortedPlayers = players
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    res.json(sortedPlayers);
  } catch (error) {
    console.error('Erro ao buscar players:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/players - Limpa ranking de jogadores e salva no histórico
app.delete('/api/players', async (req, res) => {
  try {
    await delay(); // Simula latência
    
    const players = await readJsonFile(PLAYERS_FILE, []);
    const sessions = await readJsonFile(SESSIONS_FILE, []);
    
    // Se há dados para preservar no histórico
    if (players.length > 0 || sessions.length > 0) {
      const history = await readJsonFile(RANKING_HISTORY_FILE, []);
      
      // Encontra as datas de início e fim das sessões
      const sessionDates = sessions.map(s => s.startedAt).filter(Boolean);
      const startDate = sessionDates.length > 0 ? Math.min(...sessionDates) : Date.now();
      const endDate = Date.now();
      
      const historyEntry = {
        id: generateId(),
        startDate,
        endDate,
        players: players.map(p => ({
          group: p.group,
          score: p.score,
          position: p.position,
          timestamp: p.timestamp
        })),
        sessions: sessions.map(s => ({
          groupName: s.groupName,
          currentScore: s.currentScore,
          startedAt: s.startedAt
        })),
        totalPlayers: players.length,
        totalSessions: sessions.length,
        archivedAt: Date.now()
      };
      
      history.push(historyEntry);
      await writeJsonFile(RANKING_HISTORY_FILE, history);
      console.log('📈 Ranking arquivado no histórico antes da limpeza');
    }
    
    // Limpa o arquivo de players (reseta para array vazio)
    await writeJsonFile(PLAYERS_FILE, []);
    
    console.log('📊 Ranking limpo por administrador');
    res.json({ success: true, message: 'Ranking limpo e salvo no histórico com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sessions - Cria nova sessão de quiz
app.post('/api/sessions', async (req, res) => {
  try {
    // await delay(); // Comentado temporariamente
    
    const { groupName } = req.body;
    
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
    }

    // Valida formato do nome do grupo ANTES de converter (apenas letras maiúsculas, números e espaços)
    const trimmedGroupName = groupName.trim();
    console.log('Validando grupo:', trimmedGroupName);
    console.log('Regex test result:', /^[A-Z0-9\s]+$/.test(trimmedGroupName));
    
    if (!/^[A-Z0-9\s]+$/.test(trimmedGroupName)) {
      console.log('Rejeitando grupo inválido:', trimmedGroupName);
      return res.status(400).json({ error: 'Nome do grupo deve conter apenas letras maiúsculas, números e espaços' });
    }
    
    const cleanGroupName = trimmedGroupName; // Já está no formato correto

    const sessions = await readJsonFile(SESSIONS_FILE, []);
    
    // Finaliza sessões ativas existentes do mesmo grupo
    const updatedSessions = sessions.map(session => 
      session.groupName === cleanGroupName 
        ? { ...session, isActive: false }
        : session
    );

    const newSession = {
      id: generateId(),
      groupName: cleanGroupName,
      currentScore: 0,
      isActive: true,
      startedAt: Date.now()
    };

    updatedSessions.push(newSession);
    await writeJsonFile(SESSIONS_FILE, updatedSessions);

    res.json(newSession);
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/sessions/:id/score - Atualiza score da sessão
app.put('/api/sessions/:id/score', async (req, res) => {
  try {
    await delay();
    
    const { id } = req.params;
    const { score } = req.body;
    
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Score deve ser um número' });
    }

    const sessions = await readJsonFile(SESSIONS_FILE, []);
    const sessionIndex = sessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    sessions[sessionIndex].currentScore = score;
    await writeJsonFile(SESSIONS_FILE, sessions);

    res.json(sessions[sessionIndex]);
  } catch (error) {
    console.error('Erro ao atualizar score:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sessions/:id/finish - Finaliza sessão e salva no ranking
app.post('/api/sessions/:id/finish', async (req, res) => {
  try {
    await delay();
    
    const { id } = req.params;
    
    const sessions = await readJsonFile(SESSIONS_FILE, []);
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Marca sessão como inativa
    const updatedSessions = sessions.map(s => 
      s.id === id ? { ...s, isActive: false } : s
    );
    await writeJsonFile(SESSIONS_FILE, updatedSessions);

    // Adiciona ao ranking
    let players = await readJsonFile(PLAYERS_FILE, []);
    
    // Remove entry anterior do mesmo grupo (mantém apenas o melhor score)
    players = players.filter(p => p.group !== session.groupName);

    const newPlayer = {
      id: generateId(),
      group: session.groupName,
      score: session.currentScore,
      position: 0, // Será calculado
      timestamp: Date.now(),
      sessionId: id
    };

    players.push(newPlayer);

    // Reordena e atualiza posições
    const sortedPlayers = players
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    await writeJsonFile(PLAYERS_FILE, sortedPlayers);

    const savedPlayer = sortedPlayers.find(p => p.id === newPlayer.id);
    res.json(savedPlayer);
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/sessions/active/:groupName - Busca sessão ativa
app.get('/api/sessions/active/:groupName', async (req, res) => {
  try {
    await delay(50);
    
    const { groupName } = req.params;
    const cleanGroupName = decodeURIComponent(groupName).trim().toUpperCase();
    const sessions = await readJsonFile(SESSIONS_FILE, []);
    
    const activeSession = sessions.find(s => 
      s.groupName === cleanGroupName && s.isActive
    );

    res.json(activeSession || null);
  } catch (error) {
    console.error('Erro ao buscar sessão ativa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/data - Limpa dados atuais e salva no histórico
app.delete('/api/data', async (req, res) => {
  try {
    const players = await readJsonFile(PLAYERS_FILE, []);
    const sessions = await readJsonFile(SESSIONS_FILE, []);
    
    // Se há dados para preservar no histórico
    if (players.length > 0 || sessions.length > 0) {
      const history = await readJsonFile(RANKING_HISTORY_FILE, []);
      
      // Encontra as datas de início e fim das sessões
      const sessionDates = sessions.map(s => s.startedAt).filter(Boolean);
      const startDate = sessionDates.length > 0 ? Math.min(...sessionDates) : Date.now();
      const endDate = Date.now();
      
      const historyEntry = {
        id: generateId(),
        startDate,
        endDate,
        players: players.map(p => ({
          group: p.group,
          score: p.score,
          position: p.position,
          timestamp: p.timestamp
        })),
        sessions: sessions.map(s => ({
          groupName: s.groupName,
          currentScore: s.currentScore,
          startedAt: s.startedAt
        })),
        totalPlayers: players.length,
        totalSessions: sessions.length,
        archivedAt: Date.now()
      };
      
      history.push(historyEntry);
      await writeJsonFile(RANKING_HISTORY_FILE, history);
    }
    
    // Limpa os dados atuais
    await writeJsonFile(PLAYERS_FILE, []);
    await writeJsonFile(SESSIONS_FILE, []);
    
    res.json({ message: 'Dados limpos e salvos no histórico com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/ranking-history - Busca histórico de rankings
app.get('/api/ranking-history', async (req, res) => {
  try {
    await delay();
    
    const history = await readJsonFile(RANKING_HISTORY_FILE, []);
    
    // Ordena por data de arquivo (mais recente primeiro)
    const sortedHistory = history
      .sort((a, b) => b.archivedAt - a.archivedAt)
      .map(entry => ({
        ...entry,
        startDateFormatted: new Date(entry.startDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        endDateFormatted: new Date(entry.endDate).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        archivedAtFormatted: new Date(entry.archivedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

    res.json(sortedHistory);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/ranking-history/:id - Remove entrada específica do histórico
app.delete('/api/ranking-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await readJsonFile(RANKING_HISTORY_FILE, []);
    
    const filteredHistory = history.filter(entry => entry.id !== id);
    
    if (filteredHistory.length === history.length) {
      return res.status(404).json({ error: 'Entrada do histórico não encontrada' });
    }
    
    await writeJsonFile(RANKING_HISTORY_FILE, filteredHistory);
    res.json({ message: 'Entrada do histórico removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover entrada do histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/backup - Exporta backup dos dados
app.get('/api/backup', async (req, res) => {
  try {
    const players = await readJsonFile(PLAYERS_FILE, []);
    const sessions = await readJsonFile(SESSIONS_FILE, []);
    const rankingHistory = await readJsonFile(RANKING_HISTORY_FILE, []);
    
    const backup = {
      players,
      sessions,
      rankingHistory,
      exportDate: new Date().toISOString(),
      version: '2.1.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="responze-backup.json"');
    res.json(backup);
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/restore - Restaura dados de backup
app.post('/api/restore', async (req, res) => {
  try {
    const { players, sessions, rankingHistory } = req.body;
    
    if (Array.isArray(players)) {
      await writeJsonFile(PLAYERS_FILE, players);
    }
    
    if (Array.isArray(sessions)) {
      await writeJsonFile(SESSIONS_FILE, sessions);
    }
    
    if (Array.isArray(rankingHistory)) {
      await writeJsonFile(RANKING_HISTORY_FILE, rankingHistory);
    }
    
    res.json({ message: 'Dados restaurados com sucesso' });
  } catch (error) {
    console.error('Erro ao restaurar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === ENDPOINTS DE CONFIGURAÇÃO DE PERGUNTAS ===

// GET /api/quiz-config - Busca configuração atual das perguntas
app.get('/api/quiz-config', async (req, res) => {
  try {
    const config = await readJsonFile(QUIZ_CONFIG_FILE, {
      selectedQuestions: [],
      lastUpdated: null,
      minQuestions: 7
    });
    
    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/quiz-config - Salva configuração das perguntas
app.post('/api/quiz-config', async (req, res) => {
  try {
    const { selectedQuestions } = req.body;
    
    if (!Array.isArray(selectedQuestions)) {
      return res.status(400).json({ error: 'selectedQuestions deve ser um array' });
    }
    
    const config = {
      selectedQuestions,
      lastUpdated: new Date().toISOString(),
      minQuestions: 7,
      isValid: selectedQuestions.length >= 7
    };
    
    await writeJsonFile(QUIZ_CONFIG_FILE, config);
    
    const message = selectedQuestions.length >= 7 
      ? 'Configuração salva com sucesso'
      : 'Seleção temporária salva';
    
    res.json({ 
      message,
      config 
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/quiz-config - Remove configuração (volta ao padrão)
app.delete('/api/quiz-config', async (req, res) => {
  try {
    const defaultConfig = {
      selectedQuestions: [],
      lastUpdated: null,
      minQuestions: 7
    };
    
    await writeJsonFile(QUIZ_CONFIG_FILE, defaultConfig);
    
    res.json({ 
      message: 'Configuração resetada com sucesso',
      config: defaultConfig 
    });
  } catch (error) {
    console.error('Erro ao resetar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === ENDPOINTS DE SISTEMA DE SALAS ===


// GET /api/rooms/:roomId - Busca informações da sala
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const room = rooms.find(room => room.id === roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    // Remove senha da resposta
    const { password: _, ...roomResponse } = room;
    res.json(roomResponse);
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/rooms/:roomId/start - Inicia o jogo na sala (apenas host)
app.post('/api/rooms/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Perguntas são obrigatórios' });
    }

    const rooms = await readJsonFile(ROOMS_FILE, []);
    const roomIndex = rooms.findIndex(room => room.id === roomId);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const room = rooms[roomIndex];

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'O jogo já foi iniciado ou finalizado' });
    }

    if (room.participants.length === 0) {
      return res.status(400).json({ error: 'Não há participantes na sala' });
    }

    room.status = 'playing';
    room.questions = questions;
    room.currentQuestionIndex = 0;
    room.currentQuestion = 0; // Sempre índice
    room.startedAt = Date.now();

    rooms[roomIndex] = room;
    await writeJsonFile(ROOMS_FILE, rooms);

    res.json({ 
      message: 'Jogo iniciado com sucesso',
      room: {
        id: room.id,
        status: room.status,
        currentQuestion: room.currentQuestion,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        participantCount: room.participants.length
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar jogo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/rooms/:roomId/answer - Participante responde pergunta
app.post('/api/rooms/:roomId/answer', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { participantId, questionIndex, selectedAnswer, answer, timeSpent } = req.body;
    
    console.log('Payload recebido:', { participantId, questionIndex, selectedAnswer, answer, timeSpent });
    
    // Aceita tanto selectedAnswer (número) quanto answer (string)
    const userAnswer = selectedAnswer !== undefined ? selectedAnswer : answer;
    
    console.log('userAnswer:', userAnswer, 'tipo:', typeof userAnswer);
    console.log('questionIndex:', questionIndex, 'tipo:', typeof questionIndex);
    
    if (typeof questionIndex !== 'number') {
      console.log('Erro: questionIndex não é número');
      return res.status(400).json({ error: 'questionIndex deve ser um número' });
    }
    
    if (userAnswer === undefined || userAnswer === null) {
      console.log('Erro: resposta é obrigatória');
      return res.status(400).json({ error: 'Resposta é obrigatória' });
    }

    const rooms = await readJsonFile(ROOMS_FILE, []);
    const roomIndex = rooms.findIndex(room => room.id === roomId);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const room = rooms[roomIndex];

    if (room.status !== 'playing') {
      return res.status(400).json({ error: 'O jogo não está em andamento' });
    }

    const participantIndex = room.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }

    const participant = room.participants[participantIndex];
    const question = room.questions[questionIndex];

    if (!question) {
      return res.status(400).json({ error: 'Pergunta não encontrada' });
    }

    // Verifica se já respondeu esta pergunta
    const existingAnswer = participant.answers.find(a => a.questionIndex === questionIndex);
    if (existingAnswer) {
      return res.status(400).json({ error: 'Pergunta já respondida' });
    }

    // Determina se a resposta está correta
    let isCorrect = false;
    
    if (typeof question.correctAnswer === 'number') {
      // Se correctAnswer é número (índice), compara com selectedAnswer ou converte answer para índice
      if (typeof userAnswer === 'number') {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (typeof userAnswer === 'string') {
        // Converte string para índice
        const answerIndex = question.options.indexOf(userAnswer);
        isCorrect = answerIndex === question.correctAnswer;
      }
    } else if (typeof question.correctAnswer === 'string') {
      // Se correctAnswer é string, compara diretamente
      isCorrect = userAnswer === question.correctAnswer;
    }

    const points = isCorrect ? 1 : 0;

    const answerRecord = {
      questionIndex,
      answer: userAnswer,
      isCorrect,
      points,
      timeSpent: timeSpent || 0,
      answeredAt: Date.now()
    };

    participant.answers.push(answerRecord);
    participant.score += points;

    rooms[roomIndex] = room;
    await writeJsonFile(ROOMS_FILE, rooms);

    res.json({ 
      message: 'Resposta registrada',
      isCorrect,
      points,
      currentScore: participant.score
    });
  } catch (error) {
    console.error('Erro ao registrar resposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/rooms/:roomId/next-question - Avança para próxima pergunta (apenas host)
app.post('/api/rooms/:roomId/next-question', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { hostName } = req.body;
    
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const roomIndex = rooms.findIndex(room => room.id === roomId);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const room = rooms[roomIndex];

    if (room.hostName !== hostName) {
      return res.status(403).json({ error: 'Apenas o host pode controlar o jogo' });
    }

    if (room.status !== 'playing') {
      return res.status(400).json({ error: 'O jogo não está em andamento' });
    }

    const nextIndex = room.currentQuestionIndex + 1;

    if (nextIndex >= room.questions.length) {
      // Jogo finalizado
      room.status = 'finished';
      room.currentQuestion = null;
      room.currentQuestionIndex = -1;
      
      // Calcula resultados finais
      room.gameResults = room.participants
        .map(p => ({
          groupName: p.groupName,
          score: p.score,
          totalAnswers: p.answers.length,
          correctAnswers: p.answers.filter(a => a.isCorrect).length
        }))
        .sort((a, b) => b.score - a.score)
        .map((result, index) => ({
          ...result,
          position: index + 1
        }));
    } else {
      room.currentQuestionIndex = nextIndex;
      room.currentQuestion = room.questions[nextIndex];
    }

    rooms[roomIndex] = room;
    await writeJsonFile(ROOMS_FILE, rooms);

    res.json({ 
      message: room.status === 'finished' ? 'Jogo finalizado' : 'Próxima pergunta',
      room: {
        id: room.id,
        status: room.status,
        currentQuestion: room.currentQuestion,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        gameResults: room.gameResults || null
      }
    });
  } catch (error) {
    console.error('Erro ao avançar pergunta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/rooms/:roomId/ranking - Busca ranking atual da sala
app.get('/api/rooms/:roomId/ranking', async (req, res) => {
  try {
    const { roomId } = req.params;
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const room = rooms.find(room => room.id === roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const ranking = room.participants
      .map(p => ({
        id: p.id,
        groupName: p.groupName,
        score: p.score,
        totalAnswers: p.answers.length,
        correctAnswers: p.answers.filter(a => a.isCorrect).length,
        lastAnswerAt: p.answers.length > 0 ? Math.max(...p.answers.map(a => a.answeredAt)) : p.joinedAt
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.lastAnswerAt - b.lastAnswerAt; // Em caso de empate, quem respondeu primeiro
      })
      .map((participant, index) => ({
        ...participant,
        position: index + 1
      }));

    res.json({
      roomId: room.id,
      roomName: room.name,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      participantCount: room.participants.length,
      ranking,
      gameResults: room.gameResults || null
    });
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/rooms - Lista todas as salas ativas
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await readJsonFile(ROOMS_FILE, []);
    
    const roomsList = rooms
      .filter(room => room.status !== 'finished') // Apenas salas não finalizadas
      .map(room => ({
        id: room.id,
        name: room.name,
        hostName: room.hostName,
        status: room.status,
        participantCount: room.participants.length,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(roomsList);
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/rooms/:roomId - Remove uma sala (apenas host)
app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { hostName } = req.body;
    
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const roomIndex = rooms.findIndex(room => room.id === roomId);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const room = rooms[roomIndex];

    if (room.hostName !== hostName) {
      return res.status(403).json({ error: 'Apenas o host pode remover a sala' });
    }

    rooms.splice(roomIndex, 1);
    await writeJsonFile(ROOMS_FILE, rooms);

    res.json({ message: 'Sala removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === SISTEMA DE SALAS ===

// POST /api/rooms - Cria uma nova sala (apenas nome e senha)
app.post('/api/rooms', async (req, res) => {
  try {
    const { roomName, roomPassword } = req.body;
    if (!roomName || !roomPassword) {
      return res.status(400).json({ error: 'Nome da sala e senha são obrigatórios' });
    }
    const rooms = await readJsonFile(ROOMS_FILE, []);
    // Não permite nome duplicado ativo
    const existingRoom = rooms.find(room => room.name === roomName && room.status !== 'finished');
    if (existingRoom) {
      return res.status(400).json({ error: 'Já existe uma sala ativa com este nome' });
    }
    const newRoom = {
      id: generateId(),
      name: roomName,
      password: roomPassword,
      status: 'waiting',
      participants: [],
      currentQuestionIndex: -1,
      questions: [],
      createdAt: Date.now(),
      startedAt: null,
      finishedAt: null
    };
    rooms.push(newRoom);
    await writeJsonFile(ROOMS_FILE, rooms);
    res.json({ id: newRoom.id, name: newRoom.name, createdAt: newRoom.createdAt });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/rooms/:roomId/join - Entra em uma sala
app.post('/api/rooms/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(400).json({ error: 'Nome do grupo é obrigatórios' });
    }
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    // Verifica se grupo já existe na sala
    const existingParticipant = room.participants.find(p => p.groupName === groupName);
    if (existingParticipant) {
      return res.json({ participant: existingParticipant, room: { id: room.id, name: room.name, status: room.status } });
    }
    const participant = {
      id: generateId(),
      groupName,
      score: 0,
      answers: [],
      joinedAt: Date.now(),
      isActive: true
    };
    room.participants.push(participant);
    const updatedRooms = rooms.map(r => r.id === roomId ? room : r);
    await writeJsonFile(ROOMS_FILE, updatedRooms);
    res.json({ participant, room: { id: room.id, name: room.name, status: room.status } });
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/rooms/:roomId/start - Admin inicia o quiz
app.post('/api/rooms/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { questions } = req.body;
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'A sala já está em andamento ou finalizada' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Perguntas são obrigatórias' });
    }
    if (room.participants.length === 0) {
      return res.status(400).json({ error: 'Nenhum participante na sala' });
    }
    room.status = 'playing';
    room.questions = questions;
    room.currentQuestionIndex = 0;
    room.startedAt = Date.now();
    const updatedRooms = rooms.map(r => r.id === roomId ? room : r);
    await writeJsonFile(ROOMS_FILE, updatedRooms);
    res.json({ message: 'Quiz iniciado com sucesso', room });
  } catch (error) {
    console.error('Erro ao iniciar quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/rooms/:roomId/next - Admin avança para próxima pergunta
app.post('/api/rooms/:roomId/next', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const room = rooms[roomIndex];
    
    if (room.status !== 'playing') {
      return res.status(400).json({ error: 'Sala não está em jogo' });
    }

    const nextIndex = room.currentQuestionIndex + 1;
    
    if (nextIndex >= room.questions.length) {
      // Jogo finalizado
      room.status = 'finished';
      room.finishedAt = Date.now();
      room.currentQuestionIndex = -1; // Indica fim
      
      // Calcula resultados finais
      room.gameResults = room.participants
        .map(p => ({
          groupName: p.groupName,
          score: p.score,
          totalAnswers: p.answers.length,
          correctAnswers: p.answers.filter(a => a.isCorrect).length
        }))
        .sort((a, b) => b.score - a.score)
        .map((result, index) => ({
          ...result,
          position: index + 1
        }));
    } else {
      room.currentQuestionIndex = nextIndex;
    }

    rooms[roomIndex] = room;
    await writeJsonFile(ROOMS_FILE, rooms);

    console.log(`📝 Sala ${room.name}: ${room.status === 'finished' ? 'Quiz finalizado' : `Avançou para pergunta ${room.currentQuestionIndex + 1}`}`);

    res.json({ 
      message: room.status === 'finished' ? 'Jogo finalizado' : 'Próxima pergunta',
      room: {
        id: room.id,
        status: room.status,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        gameResults: room.gameResults || null
      }
    });
  } catch (error) {
    console.error('Erro ao avançar pergunta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/rooms/:roomId - Admin deleta sala
app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const rooms = await readJsonFile(ROOMS_FILE, []);
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    const updatedRooms = rooms.filter(r => r.id !== roomId);
    await writeJsonFile(ROOMS_FILE, updatedRooms);

    console.log(`🗑️ Sala ${room.name} foi deletada`);
    res.json({ message: 'Sala deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/rooms-all', async (req, res) => {
  try {
    const rooms = await readJsonFile(ROOMS_FILE, []);
    console.log('Listando salas...', rooms);
    res.json(rooms);
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.1.0'
  });
});

// Middleware de erro global
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicializa o servidor
async function startServer() {
  try {
    await ensureDataDir();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📁 Dados salvos em: ${DATA_DIR}`);
      console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
