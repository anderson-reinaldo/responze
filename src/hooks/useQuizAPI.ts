import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizAPI, Player, QuizSession } from '@/lib/realApi';
import { getConfig } from '@/lib/config';
import { toast } from 'sonner';

const config = getConfig();

// Hook para buscar ranking com auto-refresh
export function useRanking(refetchInterval: number = config.ranking.refetchInterval) {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: () => quizAPI.getRanking(),
    refetchInterval,
    staleTime: config.ranking.staleTime,
    retry: config.ranking.retryAttempts,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook para criar sessão de quiz
export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (groupName: string) => quizAPI.createSession(groupName),
    onSuccess: (session) => {
      // Invalida cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      toast.success(`Sessão iniciada para o grupo ${session.groupName}`, {
        duration: config.notifications.successDuration,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar sessão: ${error.message}`, {
        duration: config.notifications.errorDuration,
      });
    },
  });
}

// Hook para atualizar score da sessão
export function useUpdateSessionScore() {
  return useMutation({
    mutationFn: ({ sessionId, score }: { sessionId: string; score: number }) => 
      quizAPI.updateSessionScore(sessionId, score),
    onError: (error) => {
      toast.error(`Erro ao atualizar pontuação: ${error.message}`, {
        duration: config.notifications.errorDuration,
      });
    },
  });
}

// Hook para finalizar sessão
export function useFinishSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => quizAPI.finishSession(sessionId),
    onSuccess: (player) => {
      // Atualiza cache do ranking imediatamente
      queryClient.setQueryData(['ranking'], (oldData: Player[] | undefined) => {
        if (!oldData) return [player];
        
        // Remove entry anterior do mesmo grupo e adiciona nova
        const filtered = oldData.filter(p => p.group !== player.group);
        const updated = [...filtered, player]
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timestamp - b.timestamp;
          })
          .map((p, index) => ({ ...p, position: index + 1 }));
        
        return updated;
      });
      
      // Força refresh para sincronizar com outros usuários
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      
      toast.success(`Grupo ${player.group} adicionado ao ranking com ${player.score} pontos!`, {
        duration: config.notifications.successDuration,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao finalizar quiz: ${error.message}`, {
        duration: config.notifications.errorDuration,
      });
    },
  });
}

// Hook para buscar sessão ativa
export function useActiveSession(groupName: string) {
  return useQuery({
    queryKey: ['activeSession', groupName],
    queryFn: () => quizAPI.getActiveSession(groupName),
    enabled: !!groupName,
    staleTime: config.ranking.staleTime,
  });
}

// Hook para limpar dados (desenvolvimento)
export function useClearData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => quizAPI.clearAllData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Dados limpos com sucesso');
    },
  });
}

// Hook para limpar ranking
export function useClearRanking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => quizAPI.clearRanking(),
    onSuccess: () => {
      // Atualiza o cache do ranking imediatamente para array vazio
      queryClient.setQueryData(['ranking'], []);
      
      // Invalida histórico para atualizar com nova entrada
      queryClient.invalidateQueries({ queryKey: ['rankingHistory'] });
      
      // Força refresh para sincronizar com outros usuários
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      
      toast.success('Ranking limpo e salvo no histórico com sucesso!', {
        duration: config.notifications.successDuration,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao limpar ranking: ${error.message}`, {
        duration: config.notifications.errorDuration,
      });
    },
  });
}

// Hook para buscar histórico de rankings
export function useRankingHistory() {
  return useQuery({
    queryKey: ['rankingHistory'],
    queryFn: () => quizAPI.getRankingHistory(),
    staleTime: config.ranking.staleTime,
    retry: config.ranking.retryAttempts,
  });
}

// Hook para remover entrada do histórico
export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (entryId: string) => quizAPI.deleteHistoryEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingHistory'] });
      toast.success('Entrada do histórico removida com sucesso!', {
        duration: config.notifications.successDuration,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao remover entrada do histórico: ${error.message}`, {
        duration: config.notifications.errorDuration,
      });
    },
  });
}
