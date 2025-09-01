import { useState, useEffect } from "react";
import { Podium } from "@/components/Podium";
import { QuizGame } from "@/components/QuizGame";
import { QuizConfig } from "@/components/QuizConfig";
import { AdminLogin } from "@/components/AdminLogin";
import { toast } from "sonner";
import { useRanking, useCreateSession, useFinishSession } from "@/hooks/useQuizAPI";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useQuizConfig } from "@/hooks/useQuizConfig";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

type GameState = "podium" | "quiz" | "config" | "admin-login";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("podium");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Busca ranking com auto-refresh a cada 10 segundos
  const { data: players = [], isLoading: rankingLoading, error: rankingError } = useRanking(10000);
  
  // Busca configuração global das perguntas
  const { data: quizConfig } = useQuizConfig();
  
  // Notificações em tempo real
  useRealtimeNotifications();
  
  // Mutations para gerenciar sessões
  const createSessionMutation = useCreateSession();
  const finishSessionMutation = useFinishSession();

  // Perguntas configuradas globalmente
  const globalQuestions = quizConfig?.selectedQuestions || [];

  const handleStartQuiz = async (groupName: string) => {
    if (!groupName.trim()) {
      toast.error("Nome do grupo é obrigatório!");
      return;
    }

    // Verificar se há configuração global suficiente
    if (globalQuestions.length > 0 && globalQuestions.length < 7) {
      toast.error("A configuração atual tem menos de 7 perguntas. Configure pelo menos 7 perguntas no painel admin.");
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync(groupName);
      setCurrentSessionId(session.id);
      setGameState("quiz");
    } catch (error) {
      console.error("Erro ao iniciar quiz:", error);
    }
  };

  const handleStartWithCustomQuestions = async (questions: Question[]) => {
    if (questions.length === 0) {
      toast.error("Selecione pelo menos uma pergunta!");
      return;
    }
    
    setCustomQuestions(questions);
    setGameState("quiz");
  };

  const handleConfigQuiz = () => {
    if (isAdminAuthenticated) {
      setGameState("config");
    } else {
      setGameState("admin-login");
    }
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setGameState("config");
    toast.success("Bem-vindo ao painel administrativo!");
  };

  const handleBackToPodium = () => {
    setGameState("podium");
    setCurrentSessionId(null);
    setCustomQuestions([]);
    // Manter autenticação admin ativa por esta sessão
  };

  const handleQuizFinish = async (score: number, groupName: string) => {
    if (!currentSessionId) {
      toast.error("Sessão inválida");
      return;
    }

    try {
      await finishSessionMutation.mutateAsync(currentSessionId);
      setGameState("podium");
      setCurrentSessionId(null);
      setCustomQuestions([]);
    } catch (error) {
      console.error("Erro ao finalizar quiz:", error);
    }
  };

  // Tratamento de erro de rede
  if (rankingError) {
    toast.error("Erro ao carregar ranking. Tentando reconectar...");
  }

  return (
    <>
      {gameState === "podium" && (
        <Podium 
          players={players} 
          onStartQuiz={handleStartQuiz}
          onConfigQuiz={handleConfigQuiz}
          isLoading={rankingLoading || createSessionMutation.isPending}
          isAdminAuthenticated={isAdminAuthenticated}
        />
      )}
      
      {gameState === "admin-login" && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onBack={handleBackToPodium}
        />
      )}
      
      {gameState === "config" && (
        <QuizConfig
          onStartQuiz={handleStartWithCustomQuestions}
          onBack={handleBackToPodium}
        />
      )}
      
      {gameState === "quiz" && (
        <QuizGame 
          sessionId={currentSessionId || "custom"}
          customQuestions={globalQuestions.length >= 7 ? globalQuestions : (customQuestions.length > 0 ? customQuestions : undefined)}
          onFinish={handleQuizFinish}
          onBack={handleBackToPodium}
          isGroupMode={true}
        />
      )}
    </>
  );
};

export default Index;