import { getApiBase } from '@/lib/realApi';
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
      const response = await fetch(`${API_BASE}/quiz-config`);
      if (!response.ok) {
        throw new Error('Erro ao buscar configuração');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para salvar configuração
export const useSaveQuizConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedQuestions: Question[]) => {
      const response = await fetch(`${API_BASE}/quiz-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedQuestions }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar configuração');
      }

      return response.json();
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
      const response = await fetch(`${API_BASE}/quiz-config`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao resetar configuração');
      }

      return response.json();
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
