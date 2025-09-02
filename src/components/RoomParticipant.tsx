import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Users, Lock, Play, Clock, Trophy, CheckCircle, XCircle, Home, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Interfaces mais robustas
interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  participants: Participant[];
  currentQuestionIndex: number;
  questions: Question[];
  createdAt?: number;
  startedAt?: number;
  finishedAt?: number;
}

interface Participant {
  id: string;
  groupName: string;
  score: number;
  answers: Answer[];
  isActive: boolean;
  joinedAt?: number;
}

interface Answer {
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
  answeredAt: number;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string | number; // Aceita tanto string quanto número (índice)
  id?: number;
  category?: string;
  timeLimit?: number;
}

interface RoomParticipantProps {
  roomId: string;
  onGoHome: () => void;
}

// Estados de erro
enum ErrorState {
  NONE = 'none',
  ROOM_NOT_FOUND = 'room_not_found',
  CONNECTION_ERROR = 'connection_error',
  INVALID_ROOM_DATA = 'invalid_room_data'
}

export default function RoomParticipant({ roomId, onGoHome }: RoomParticipantProps) {
  // Estados principais
  const [room, setRoom] = useState<Room | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(ErrorState.NONE);
  
  // Estados do formulário
  const [joinForm, setJoinForm] = useState({ password: '', groupName: '' });
  
  // Estados do jogo
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<{ isCorrect: boolean; score: number } | null>(null);
  
  // Estados do timer
  const [timeLeft, setTimeLeft] = useState<number>(60); // Tempo padrão
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Refs para controlar quando resetar timer
  const currentQuestionIndexRef = useRef<number>(-1);
  const timerInitializedRef = useRef<boolean>(false);

  // Função para validar dados da sala
  const isValidRoom = useCallback((roomData: any): roomData is Room => {
    if (!roomData || typeof roomData !== 'object') return false;
    if (!roomData.id || !roomData.name || !roomData.status) return false;
    if (!Array.isArray(roomData.participants)) return false;
    if (typeof roomData.currentQuestionIndex !== 'number') return false;
    if (!Array.isArray(roomData.questions)) return false;
    return true;
  }, []);

  // Função para validar pergunta
  const isValidQuestion = useCallback((question: any): question is Question => {
    if (!question || typeof question !== 'object') return false;
    if (!question.question || typeof question.question !== 'string') return false;
    if (!Array.isArray(question.options) || question.options.length === 0) return false;
    // Aceita correctAnswer como string ou number
    if (question.correctAnswer === undefined || question.correctAnswer === null) return false;
    if (typeof question.correctAnswer !== 'string' && typeof question.correctAnswer !== 'number') return false;
    return true;
  }, []);

  // Carregamento de dados da sala com proteção completa
  const loadRoomData = useCallback(async () => {
    try {
      setError(ErrorState.NONE);
      const { data } = await api.get(`/rooms/${roomId}`);
      
      if (!isValidRoom(data)) {
        console.error('Dados da sala inválidos:', data);
        setError(ErrorState.INVALID_ROOM_DATA);
        return;
      }

      setRoom(data);

      // Atualizar dados do participante se já entrou
      if (participant && data.participants) {
        const updatedParticipant = data.participants.find((p: Participant) => p.id === participant.id);
        if (updatedParticipant) {
          setParticipant(updatedParticipant);
          
          // Verificar se já respondeu a pergunta atual apenas se não estamos mudando de pergunta
          const currentQuestionIndex = data.currentQuestionIndex;
          if (typeof currentQuestionIndex === 'number' && currentQuestionIndex >= 0) {
            const hasAnsweredCurrent = updatedParticipant.answers?.some(a => a.questionIndex === currentQuestionIndex) || false;
            // Só atualiza hasAnswered se realmente respondeu, não reset automaticamente aqui
            if (hasAnsweredCurrent && !hasAnswered) {
              setHasAnswered(true);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados da sala:', error);
      if (error?.response?.status === 404) {
        setError(ErrorState.ROOM_NOT_FOUND);
      } else {
        setError(ErrorState.CONNECTION_ERROR);
      }
    }
  }, [roomId, participant?.id, isValidRoom]); // Dependências mínimas

  // Efeito para carregamento inicial e polling
  useEffect(() => {
    // Carregamento inicial
    loadRoomData();
    
    // Se já entrou na sala, inicia o polling
    if (isJoined && error === ErrorState.NONE) {
      const interval = setInterval(() => {
        loadRoomData();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [roomId, isJoined, error, loadRoomData]); // Agora é seguro incluir loadRoomData

  // Timer para as perguntas
  useEffect(() => {
    if (room?.status === 'playing' && !hasAnswered && !isTimeUp && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !hasAnswered && room?.status === 'playing') {
      setIsTimeUp(true);
      toast.error('Tempo esgotado! ⏰');
    }
  }, [timeLeft, hasAnswered, isTimeUp, room?.status]);

  // Resetar timer quando a pergunta muda
  useEffect(() => {
    if (room?.questions && room.currentQuestionIndex >= 0) {
      const currentQuestion = room.questions[room.currentQuestionIndex];
      
      // Só reseta se realmente mudou a pergunta OU se é a primeira inicialização
      if (currentQuestion && 
          (currentQuestionIndexRef.current !== room.currentQuestionIndex || !timerInitializedRef.current)) {
        
        console.log('Resetando timer para pergunta:', room.currentQuestionIndex);
        
        const questionTimeLimit = currentQuestion.timeLimit || 60;
        setTimeLeft(questionTimeLimit);
        setIsTimeUp(false);
        setHasAnswered(false);
        setCurrentAnswer('');
        setLastAnswerResult(null);
        
        // Atualiza as refs
        currentQuestionIndexRef.current = room.currentQuestionIndex;
        timerInitializedRef.current = true;
      }
    }
  }, [room?.currentQuestionIndex, room?.questions]);

  // Função para entrar na sala
  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const groupName = joinForm.groupName?.trim();
    
    if (!groupName) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }

    setLoading(true);
    setError(ErrorState.NONE);
    
    try {
      const { data } = await api.post(`/rooms/${roomId}/join`, {
        groupName
      });

      if (data?.room && data?.participant) {
        setRoom(data.room);
        setParticipant(data.participant);
        setIsJoined(true);
        setHasAnswered(false);
        setCurrentAnswer('');
        setLastAnswerResult(null);
        
        toast.success('Entrou na sala com sucesso!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao entrar na sala';
      toast.error(errorMessage);
      console.error('Erro ao entrar na sala:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar resposta
  const submitAnswer = async () => {
    if (!currentAnswer || !participant || !room) {
      toast.error('Dados incompletos para enviar resposta');
      return;
    }

    if (typeof room.currentQuestionIndex !== 'number' || room.currentQuestionIndex < 0) {
      toast.error('Pergunta atual inválida');
      return;
    }

    if (isTimeUp) {
      toast.error('Tempo esgotado! Não é possível enviar resposta.');
      return;
    }

    setLoading(true);
    
    try {
      const currentQuestion = room.questions[room.currentQuestionIndex];
      const questionTimeLimit = currentQuestion?.timeLimit || 60;
      const timeSpent = questionTimeLimit - timeLeft;

      const { data } = await api.post(`/rooms/${roomId}/answer`, {
        participantId: participant.id,
        questionIndex: room.currentQuestionIndex,
        answer: currentAnswer,
        timeSpent: timeSpent
      });

      if (typeof data?.isCorrect === 'boolean' && typeof data?.currentScore === 'number') {
        setHasAnswered(true);
        setLastAnswerResult({ 
          isCorrect: data.isCorrect, 
          score: data.currentScore 
        });

        if (data.isCorrect) {
          toast.success('Resposta correta! 🎉');
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        } else {
          toast.error('Resposta incorreta 😞');
        }
        
        setCurrentAnswer('');
        
        // Recarrega dados da sala após enviar resposta
        setTimeout(() => {
          loadRoomData();
        }, 500);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao enviar resposta';
      toast.error(errorMessage);
      console.error('Erro ao enviar resposta:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter ranking
  const getRanking = useCallback(() => {
    if (!room?.participants || !Array.isArray(room.participants)) return [];
    return [...room.participants]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [room?.participants]);

  // Função para badge de status
  const getStatusBadge = useCallback((status: string) => {
    const variants = {
      waiting: 'default',
      playing: 'destructive',
      paused: 'secondary',
      finished: 'outline'
    } as const;

    const labels = {
      waiting: 'Aguardando',
      playing: 'Em Jogo',
      paused: 'Pausado',
      finished: 'Finalizado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  }, []);

  // Telas de erro
  if (error !== ErrorState.NONE) {
    let errorTitle = 'Erro';
    let errorMessage = 'Algo deu errado';
    let errorIcon = '❌';

    switch (error) {
      case ErrorState.ROOM_NOT_FOUND:
        errorTitle = 'Sala não encontrada';
        errorMessage = 'A sala que você está tentando acessar não existe ou foi removida.';
        errorIcon = '🔍';
        break;
      case ErrorState.CONNECTION_ERROR:
        errorTitle = 'Erro de conexão';
        errorMessage = 'Não foi possível conectar com o servidor. Verifique sua conexão.';
        errorIcon = '📡';
        break;
      case ErrorState.INVALID_ROOM_DATA:
        errorTitle = 'Dados inválidos';
        errorMessage = 'Os dados da sala estão corrompidos ou incompletos.';
        errorIcon = '⚠️';
        break;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-8xl mb-6">{errorIcon}</div>
            <h2 className="text-2xl font-bold text-white mb-4">{errorTitle}</h2>
            <p className="text-blue-200 mb-8">{errorMessage}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setError(ErrorState.NONE);
                  loadRoomData();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={onGoHome}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de entrada na sala (se ainda não entrou)
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🚪</div>
            <CardTitle className="text-white text-2xl">Entrar na Sala</CardTitle>
            <CardDescription className="text-blue-200">
              {room?.name ? `Sala: ${room.name}` : 'Digite o nome do seu grupo'}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={joinRoom}>
            <CardContent className="space-y-4">              
              <div>
                <Label htmlFor="groupName" className="text-white">Nome do Grupo</Label>
                <Input
                  id="groupName"
                  value={joinForm.groupName}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Ex: Equipe Alpha"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  disabled={loading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="space-y-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                {loading ? 'Entrando...' : 'Entrar na Sala'}
              </Button>
              
              <Button
                type="button"
                onClick={onGoHome}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={loading}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!room || !participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-white text-xl">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de aguardo (sala criada mas quiz não iniciado)
  if (room.status === 'waiting') {
    const participantCount = room.participants?.length || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">{room.name || 'Sala'}</h1>
            <p className="text-blue-200">Grupo: {participant.groupName}</p>
            <div className="mt-2">
              {getStatusBadge(room.status)}
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="text-center py-12">
              <div className="text-8xl mb-8">⏳</div>
              <h2 className="text-3xl font-bold text-white mb-4">Aguardando Início</h2>
              <p className="text-blue-200 text-lg mb-8">
                O administrador irá iniciar o quiz em breve
              </p>
              
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-blue-400" />
                  <span className="text-xl font-bold text-white">{participantCount} Participantes</span>
                </div>
                
                {participantCount > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {room.participants.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded ${
                          p.id === participant.id ? 'bg-blue-500/30 border border-blue-400' : 'bg-white/10'
                        }`}
                      >
                        <p className="text-white font-medium text-center">{p.groupName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={onGoHome}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Home className="w-4 h-4 mr-2" />
              Sair da Sala
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela do quiz finalizado
  if (room.status === 'finished') {
    const ranking = getRanking();
    const myPosition = ranking.findIndex(p => p.id === participant.id) + 1;
    const totalQuestions = room.questions?.length || 0;
    const correctAnswers = participant.answers?.filter(a => a.isCorrect)?.length || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold text-white mb-2">Quiz Finalizado!</h1>
            <p className="text-blue-200 text-lg">Sala: {room.name}</p>
          </div>

          {/* Resultado do participante */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">
                Resultado do {participant.groupName}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-bold text-yellow-400">{participant.score || 0}</div>
              <p className="text-white text-lg">
                {correctAnswers} de {totalQuestions} corretas
              </p>
              
              {myPosition > 0 && (
                <div className="text-2xl text-white">
                  🏅 {myPosition}º lugar
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ranking */}
          {ranking.length > 0 && (
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl text-center">🏆 Top 5</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ranking.map((p, index) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        p.id === participant.id ? 'bg-blue-500/30 border border-blue-400' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                        </span>
                        <span className="text-white font-medium">{p.groupName}</span>
                      </div>
                      <span className="text-yellow-400 font-bold text-lg">{p.score || 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button onClick={onGoHome} size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Home className="w-5 h-5 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela do quiz em andamento
  if (room.status === 'playing') {
    // Validações robustas
    const hasValidQuestions = room.questions && Array.isArray(room.questions) && room.questions.length > 0;
    const hasValidCurrentQuestion = typeof room.currentQuestionIndex === 'number' && room.currentQuestionIndex >= 0;
    const currentQuestionExists = hasValidQuestions && hasValidCurrentQuestion && room.currentQuestionIndex < room.questions.length;
    
    // Se não há dados válidos para o quiz
    if (!hasValidQuestions || !hasValidCurrentQuestion || !currentQuestionExists) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">{room.name}</h1>
              <p className="text-blue-200">Grupo: {participant.groupName}</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                {getStatusBadge(room.status)}
                <div className="flex items-center gap-2 text-yellow-400">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">{participant.score || 0} pontos</span>
                </div>
              </div>
            </div>

            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="text-center py-12">
                <div className="text-8xl mb-8">⏳</div>
                <h2 className="text-3xl font-bold text-white mb-4">Aguardando Próxima Pergunta</h2>
                <p className="text-blue-200 text-lg">
                  O administrador está preparando a próxima pergunta...
                </p>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={onGoHome}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                Sair da Sala
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    const currentQuestion = room.questions[room.currentQuestionIndex];
    const progress = ((room.currentQuestionIndex + 1) / room.questions.length) * 100;

    // Validar se a pergunta atual é válida
    if (!isValidQuestion(currentQuestion)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">{room.name}</h1>
              <p className="text-blue-200">Grupo: {participant.groupName}</p>
            </div>

            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="text-center py-12">
                <div className="text-8xl mb-8">⚠️</div>
                <h2 className="text-3xl font-bold text-white mb-4">Pergunta Inválida</h2>
                <p className="text-blue-200 text-lg">
                  Há um problema com a pergunta atual. Aguarde o administrador corrigir.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{room.name}</h1>
            <p className="text-blue-200">Grupo: {participant.groupName}</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              {getStatusBadge(room.status)}
              <div className="flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">{participant.score || 0} pontos</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-white text-sm">
              <span>Pergunta {room.currentQuestionIndex + 1} de {room.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>

          {/* Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-white">
              <Clock className="w-5 h-5" />
              <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-400' : timeLeft <= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                {timeLeft}s
              </span>
            </div>
            <Progress 
              value={(timeLeft / (currentQuestion.timeLimit || 60)) * 100} 
              className={`h-2 ${timeLeft <= 10 ? 'bg-red-500/20' : timeLeft <= 30 ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}
            />
          </div>

          {/* Pergunta */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                {currentQuestion.question}
              </h2>

              {!hasAnswered && !isTimeUp ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentAnswer(option)}
                        disabled={loading || isTimeUp}
                        className={`p-4 rounded-lg border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          currentAnswer === option
                            ? 'bg-blue-500/30 border-blue-400 text-white'
                            : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="font-bold mr-3">{String.fromCharCode(65 + index)})</span>
                        {option}
                      </button>
                    ))}
                  </div>

                  <Separator className="bg-white/20" />

                  <div className="text-center">
                    <Button
                      onClick={submitAnswer}
                      disabled={!currentAnswer || loading || isTimeUp}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {loading ? 'Enviando...' : isTimeUp ? 'Tempo Esgotado' : 'Confirmar Resposta'}
                    </Button>
                  </div>
                </div>
              ) : hasAnswered ? (
                <div className="text-center space-y-6">
                  <div className="text-6xl">
                    {lastAnswerResult?.isCorrect ? '✅' : '❌'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {lastAnswerResult?.isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}
                    </h3>
                    <p className="text-blue-200">
                      Aguardando próxima pergunta...
                    </p>
                  </div>
                  <div className="text-yellow-400 text-xl">
                    Pontuação atual: {participant.score || 0}
                  </div>
                </div>
              ) : isTimeUp ? (
                <div className="text-center space-y-6">
                  <div className="text-6xl">⏰</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Tempo Esgotado!</h3>
                    <p className="text-blue-200">
                      Aguardando próxima pergunta...
                    </p>
                  </div>
                  <div className="text-yellow-400 text-xl">
                    Pontuação atual: {participant.score || 0}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Mini ranking */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">🏆 Ranking Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {getRanking().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getRanking().map((p, index) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        p.id === participant.id ? 'bg-blue-500/30' : 'bg-white/5'
                      }`}
                    >
                      <span className="text-white text-sm">
                        {index + 1}º {p.groupName}
                      </span>
                      <span className="text-yellow-400 font-bold">{p.score || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-blue-200">
                  Nenhum participante no ranking ainda
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={onGoHome}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Home className="w-4 h-4 mr-2" />
              Sair da Sala
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado desconhecido - fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <Card className="backdrop-blur-sm bg-white/10 border-white/20 max-w-md w-full">
        <CardContent className="text-center py-12">
          <div className="text-8xl mb-6">❓</div>
          <h2 className="text-2xl font-bold text-white mb-4">Estado Desconhecido</h2>
          <p className="text-blue-200 mb-8">A sala está em um estado inesperado.</p>
          <Button
            onClick={onGoHome}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
