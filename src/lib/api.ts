// Simulação de API para produção com múltiplos usuários
import { getConfig } from './config';

export interface Player {
  id: string;
  group: string;
  score: number;
  position: number;
  timestamp: number;
  sessionId: string;
}

export interface QuizSession {
  id: string;
  groupName: string;
  currentScore: number;
  isActive: boolean;
  startedAt: number;
}

// Simulação de banco de dados usando localStorage com fallback para memória
class QuizAPI {
  private storageKey = 'responze_players_db';
  private sessionsKey = 'responze_sessions_db';
  private config = getConfig();
  
  // Fallback para caso localStorage não esteja disponível
  private memoryPlayers: Player[] = [];
  private memorySessions: QuizSession[] = [];

  private getPlayers(): Player[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return this.memoryPlayers;
    }
  }

  private setPlayers(players: Player[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(players));
    } catch {
      this.memoryPlayers = players;
    }
  }

  private getSessions(): QuizSession[] {
    try {
      const data = localStorage.getItem(this.sessionsKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return this.memorySessions;
    }
  }

  private setSessions(sessions: QuizSession[]): void {
    try {
      localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    } catch {
      this.memorySessions = sessions;
    }
  }

  // Simula delay de rede
  private async delay(ms?: number): Promise<void> {
    const delayTime = ms || (
      this.config.api.networkDelay.min + 
      Math.random() * (this.config.api.networkDelay.max - this.config.api.networkDelay.min)
    );
    
    if (this.config.production.enableDebugLogs) {
      console.log(`API delay: ${delayTime}ms`);
    }
    
    return new Promise(resolve => setTimeout(resolve, delayTime));
  }

  // Gera ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cria uma nova sessão de quiz
  async createSession(groupName: string): Promise<QuizSession> {
    await this.delay();
    
    if (!groupName.trim()) {
      throw new Error('Nome do grupo é obrigatório');
    }

    const sessions = this.getSessions();
    
    // Finaliza sessões ativas existentes do mesmo grupo
    const updatedSessions = sessions.map(session => 
      session.groupName === groupName.trim() 
        ? { ...session, isActive: false }
        : session
    );

    const newSession: QuizSession = {
      id: this.generateId(),
      groupName: groupName.trim(),
      currentScore: 0,
      isActive: true,
      startedAt: Date.now()
    };

    updatedSessions.push(newSession);
    this.setSessions(updatedSessions);

    return newSession;
  }

  // Atualiza o score da sessão
  async updateSessionScore(sessionId: string, score: number): Promise<QuizSession> {
    await this.delay();
    
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Sessão não encontrada');
    }

    sessions[sessionIndex].currentScore = score;
    this.setSessions(sessions);

    return sessions[sessionIndex];
  }

  // Finaliza uma sessão e salva no ranking
  async finishSession(sessionId: string): Promise<Player> {
    await this.delay();
    
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    // Marca sessão como inativa
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, isActive: false } : s
    );
    this.setSessions(updatedSessions);

    // Adiciona ao ranking
    let players = this.getPlayers();
    
    // Remove entry anterior do mesmo grupo (mantém apenas o melhor score)
    players = players.filter(p => p.group !== session.groupName);

    const newPlayer: Player = {
      id: this.generateId(),
      group: session.groupName,
      score: session.currentScore,
      position: 0, // Será calculado
      timestamp: Date.now(),
      sessionId: sessionId
    };

    players.push(newPlayer);

    // Reordena e atualiza posições
    const sortedPlayers = players
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp; // Critério de desempate por tempo
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    this.setPlayers(sortedPlayers);

    return sortedPlayers.find(p => p.id === newPlayer.id)!;
  }

  // Busca ranking atualizado
  async getRanking(): Promise<Player[]> {
    await this.delay(100); // Delay menor para ranking
    
    const players = this.getPlayers();
    return players.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timestamp - b.timestamp;
    }).map((player, index) => ({
      ...player,
      position: index + 1
    }));
  }

  // Busca sessão ativa
  async getActiveSession(groupName: string): Promise<QuizSession | null> {
    await this.delay(50);
    
    const sessions = this.getSessions();
    return sessions.find(s => 
      s.groupName === groupName && s.isActive
    ) || null;
  }

  // Limpa dados (para desenvolvimento/teste)
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.sessionsKey);
    } catch {
      this.memoryPlayers = [];
      this.memorySessions = [];
    }
  }

  // Simula falha de rede (para testes)
  async simulateNetworkError(): Promise<never> {
    await this.delay();
    throw new Error('Erro de rede simulado');
  }
}

export const quizAPI = new QuizAPI();
