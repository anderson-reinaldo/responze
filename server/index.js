import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Caminhos dos arquivos de dados
const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const RANKING_HISTORY_FILE = path.join(DATA_DIR, 'ranking-history.json');

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

// Gera ID único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
    await delay();
    
    const { groupName } = req.body;
    
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
    }

    const sessions = await readJsonFile(SESSIONS_FILE, []);
    
    // Finaliza sessões ativas existentes do mesmo grupo
    const updatedSessions = sessions.map(session => 
      session.groupName === groupName.trim() 
        ? { ...session, isActive: false }
        : session
    );

    const newSession = {
      id: generateId(),
      groupName: groupName.trim(),
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
    const sessions = await readJsonFile(SESSIONS_FILE, []);
    
    const activeSession = sessions.find(s => 
      s.groupName === groupName && s.isActive
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
