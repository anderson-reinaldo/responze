import { useState, useEffect } from "react";
import { Podium } from "@/components/Podium";
import { QuizGame } from "@/components/QuizGame";
import { QuizConfig } from "@/components/QuizConfig";
import { AdminLogin } from "@/components/AdminLogin";
import RoomManager from "@/components/RoomManager";
import TVMode from "@/components/TVMode";
import { toast } from "sonner";
import { useQuizConfig } from "@/hooks/useQuizConfig";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

// Interface comum para Room que funciona com todos os componentes
interface RoomData {
  id: string;
  name: string;
  password?: string;
  adminId?: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  participants: any[];
  currentQuestion: number;
  currentQuestionIndex?: number;
  questions: any[];
  createdAt?: number;
  startedAt?: number;
  finishedAt?: number;
}

type GameState = "podium" | "quiz" | "config" | "admin-login" | "room-manager" | "tv-mode";


const Index = () => {
  const [gameState, setGameState] = useState<GameState>("room-manager");
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);

  // Busca configuração global das perguntas
  const { data: quizConfig } = useQuizConfig();
  // Perguntas configuradas globalmente
  const globalQuestions = quizConfig?.selectedQuestions || [];

  const handleStartTVMode = (room: RoomData) => {
    setSelectedRoom(room);
    setGameState("tv-mode");
  };

  const handleBackToRoomManager = () => {
    setSelectedRoom(null);
    setGameState("room-manager");
  };

  if (gameState === "tv-mode" && selectedRoom) {
    return (
      <TVMode 
        room={selectedRoom as any}
        onBack={handleBackToRoomManager}
      />
    );
  }

  return (
    <RoomManager
      questions={globalQuestions.length >= 7 ? globalQuestions : []}
      onStartTVMode={handleStartTVMode}
    />
  );
};

export default Index;