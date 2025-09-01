// API real que se comunica com o backend
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

export interface RankingHistoryEntry {
  id: string;
  startDate: number;
  endDate: number;
  players: {
    group: string;
    score: number;
    position: number;
    timestamp: number;
  }[];
  sessions: {
    groupName: string;
    currentScore: number;
    startedAt: number;
  }[];
  totalPlayers: number;
  totalSessions: number;
  archivedAt: number;
  startDateFormatted: string;
  endDateFormatted: string;
  archivedAtFormatted: string;
}

const config = getConfig();

// URL base da API baseada no ambiente
export const getApiBase = () => {
  // Em desenvolvimento, usa proxy do Vite
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Em produção, usa variável de ambiente ou fallback
  return import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';
};

const API_BASE = getApiBase();

class RealQuizAPI {
  // Função auxiliar para fazer requisições
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro de rede' }));
      throw new Error(error.error || `Erro ${response.status}`);
    }

    return response.json();
  }

  // Busca ranking de jogadores
  async getRanking(): Promise<Player[]> {
    return this.request<Player[]>('/players');
  }

  // Limpa o ranking de jogadores
  async clearRanking(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/players', {
      method: 'DELETE',
    });
  }

  // Cria uma nova sessão de quiz
  async createSession(groupName: string): Promise<QuizSession> {
    return this.request<QuizSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ groupName }),
    });
  }

  // Atualiza o score da sessão
  async updateSessionScore(sessionId: string, score: number): Promise<QuizSession> {
    return this.request<QuizSession>(`/sessions/${sessionId}/score`, {
      method: 'PUT',
      body: JSON.stringify({ score }),
    });
  }

  // Finaliza uma sessão e salva no ranking
  async finishSession(sessionId: string): Promise<Player> {
    return this.request<Player>(`/sessions/${sessionId}/finish`, {
      method: 'POST',
    });
  }

  // Busca sessão ativa de um grupo
  async getActiveSession(groupName: string): Promise<QuizSession | null> {
    return this.request<QuizSession | null>(`/sessions/active/${encodeURIComponent(groupName)}`);
  }

  // Limpa todos os dados
  async clearAllData(): Promise<void> {
    await this.request<{ message: string }>('/data', {
      method: 'DELETE',
    });
  }

  // Exporta backup dos dados
  async exportBackup(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/backup`);
    if (!response.ok) {
      throw new Error('Erro ao exportar backup');
    }
    return response.blob();
  }

  // Restaura dados de backup
  async restoreBackup(backupData: any): Promise<void> {
    await this.request<{ message: string }>('/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    });
  }

  // Health check do servidor
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.request<{ status: string; timestamp: string; version: string }>('/health');
  }

  // Busca histórico de rankings
  async getRankingHistory(): Promise<RankingHistoryEntry[]> {
    return this.request<RankingHistoryEntry[]>('/ranking-history');
  }

  // Remove entrada específica do histórico
  async deleteHistoryEntry(entryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/ranking-history/${entryId}`, {
      method: 'DELETE',
    });
  }
}

export const quizAPI = new RealQuizAPI();
