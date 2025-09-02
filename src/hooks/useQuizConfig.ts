import { getApiBase } from '@/lib/realApi';
import api from '@/services/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  timeLimit?: number; // Tempo em segundos (padrão: 40)
}

interface QuizConfig {
  selectedQuestions: Question[];
  lastUpdated: string | null;
  minQuestions: number;
}

const API_BASE = getApiBase();

// Hook para buscar configuração atual
export const useQuizConfig = () => {
  return useQuery<QuizConfig>({
    queryKey: ['quiz-config'],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/quiz-config`);
        return data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.error || error?.message || 'Erro ao buscar configuração');
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para salvar configuração
export const useSaveQuizConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedQuestions: Question[]) => {
      try {
        const { data } = await api.post(`/quiz-config`, { selectedQuestions });
        return data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.error || error?.message || 'Erro ao salvar configuração');
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-config'] });
      if (data.config?.selectedQuestions?.length >= 7) {
        toast.success('Configuração salva com sucesso!');
      }
    },
    onError: (error: Error) => {
      // Não mostra erro para seleções temporárias
      if (!error.message.includes('temporária')) {
        toast.error(error.message);
      }
    },
  });
};

// Hook para resetar configuração
export const useResetQuizConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const { data } = await api.delete(`/quiz-config`);
        return data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.error || error?.message || 'Erro ao resetar configuração');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-config'] });
      toast.success('Configuração resetada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
