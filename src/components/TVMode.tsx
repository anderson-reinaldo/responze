import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Users, Trophy, Clock, PlayCircle, CheckCircle, SkipForward } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '@/services/axios';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  participants: Participant[];
  currentQuestion: number;
  currentQuestionIndex: number;
  questions: Question[];
  startedAt?: number;
  finishedAt?: number;
}

interface Participant {
  id: string;
  groupName: string;
  score: number;
  answers: Answer[];
  isActive: boolean;
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
  correctAnswer: string | number;
  timeLimit?: number;
  id?: number;
  category?: string;
}

interface TVModeProps {
  room: Room;
  onBack: () => void;
}

export default function TVMode({ room: initialRoom, onBack }: TVModeProps) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [participantStats, setParticipantStats] = useState<Record<string, number>>({});
  
  // Estados do timer
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [timerActive, setTimerActive] = useState(false);
  
  // Estado para controlar loading do botão avançar
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    const interval = setInterval(loadRoomData, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (room.status === 'finished') {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [room.status]);

  // Timer para as perguntas
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      toast.error('Tempo esgotado! ⏰');
    }
  }, [timeLeft, timerActive]);

  // Resetar timer quando pergunta muda
  useEffect(() => {
    if (room.status === 'playing' && room.questions[room.currentQuestionIndex || room.currentQuestion]) {
      const currentQ = room.questions[room.currentQuestionIndex || room.currentQuestion];
      const questionTimeLimit = currentQ?.timeLimit || 60;
      setTimeLeft(questionTimeLimit);
      setTimerActive(true);
      setShowCorrectAnswer(false);
    }
  }, [room.currentQuestionIndex, room.currentQuestion, room.status]);

  const loadRoomData = async () => {
    try {
      const { data } = await api.get(`/rooms/${room.id}`);
      setRoom(data);
      // Calcular estatísticas de respostas para a pergunta atual
      if (data.status === 'playing' && data.questions[data.currentQuestionIndex || data.currentQuestion]) {
        const currentQuestionIndex = data.currentQuestionIndex || data.currentQuestion;
        const stats: Record<string, number> = {};
        data.participants.forEach((participant: Participant) => {
          const answer = participant.answers.find(a => a.questionIndex === currentQuestionIndex);
          if (answer) {
            stats[answer.answer] = (stats[answer.answer] || 0) + 1;
          }
        });
        setParticipantStats(stats);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados da sala:', error);
    }
  };

  const nextQuestion = async () => {
    setIsAdvancing(true);
    try {
      const { data } = await api.post(`/rooms/${room.id}/next`);
      if (data.room?.status === 'finished') {
        toast.success('Quiz finalizado!');
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });
      } else {
        toast.success('Próxima pergunta!');
      }
      // Dados serão atualizados pelo polling
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao avançar pergunta');
    } finally {
      setIsAdvancing(false);
    }
  };

  const currentQuestionIndex = room.currentQuestionIndex >= 0 ? room.currentQuestionIndex : room.currentQuestion;
  const currentQuestion = room.questions[currentQuestionIndex];
  const progress = room.questions.length > 0 ? ((currentQuestionIndex + 1) / room.questions.length) * 100 : 0;
  const totalAnswered = Object.values(participantStats).reduce((sum, count) => sum + count, 0);
  const totalParticipants = room.participants.length;

  const getRanking = () => {
    return [...room.participants]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  const getOptionStats = (option: string) => {
    const count = participantStats[option] || 0;
    const percentage = totalAnswered > 0 ? (count / totalAnswered) * 100 : 0;
    return { count, percentage };
  };

  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 max-w-2xl w-full">
          <CardContent className="text-center py-16">
            <div className="text-8xl mb-8">⏳</div>
            <h1 className="text-4xl font-bold text-white mb-4">Aguardando Início</h1>
            <p className="text-xl text-blue-200 mb-8">Sala: {room.name}</p>
            
            <div className="bg-white/5 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold text-white">{room.participants.length} Participantes</span>
              </div>
              
              {room.participants.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {room.participants.map((participant) => (
                    <div key={participant.id} className="bg-white/10 rounded p-3">
                      <p className="text-white font-medium text-center">{participant.groupName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={onBack} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Gerenciador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (room.status === 'finished') {
    const ranking = getRanking();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-5xl font-bold text-white mb-2">Quiz Finalizado!</h1>
            <p className="text-2xl text-blue-200">Sala: {room.name}</p>
          </div>

          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-3xl text-center">🏅 Ranking Final</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ranking.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-6 rounded-lg ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border-2 border-yellow-400/50'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-400/30 to-gray-500/30 border-2 border-gray-400/50'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-600/30 to-orange-700/30 border-2 border-orange-600/50'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{participant.groupName}</h3>
                        <p className="text-blue-200">
                          {participant.answers.filter(a => a.isCorrect).length} de {room.questions.length} corretas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-yellow-400">{participant.score}</div>
                      <div className="text-blue-200">pontos</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={onBack} size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Gerenciador
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (room.status === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{room.name}</h1>
              <p className="text-blue-200">Pergunta {currentQuestionIndex + 1} de {room.questions.length}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="destructive" className="px-4 py-2 text-lg">
                <PlayCircle className="w-5 h-5 mr-2" />
                Em Andamento
              </Badge>
              <Button onClick={onBack} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-white">
              <span>Progresso do Quiz</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-white/20" />
          </div>

          {/* Timer */}
          {timerActive && (
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-4">
                  <Clock className="w-8 h-8 text-yellow-400" />
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${timeLeft <= 10 ? 'text-red-400' : timeLeft <= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {timeLeft}s
                    </div>
                    <div className="text-blue-200">Tempo restante</div>
                  </div>
                  <div className="flex-1 max-w-md">
                    <Progress 
                      value={(timeLeft / (currentQuestion?.timeLimit || 60)) * 100} 
                      className={`h-4 ${timeLeft <= 10 ? 'bg-red-500/20' : timeLeft <= 30 ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pergunta */}
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-sm bg-white/10 border-white/20">
                <CardContent className="py-12">
                  <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-8">
                    {currentQuestion.question}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                      const stats = getOptionStats(option);
                      const isCorrect = option === currentQuestion.correctAnswer || index === currentQuestion.correctAnswer;
                      
                      return (
                        <div
                          key={index}
                          className={`relative p-4 rounded-lg border-2 ${
                            showCorrectAnswer && isCorrect
                              ? 'bg-green-500/30 border-green-400'
                              : 'bg-white/5 border-white/20'
                          } transition-colors duration-500`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg lg:text-xl font-bold text-white">
                              {String.fromCharCode(65 + index)}) {option}
                            </span>
                            {showCorrectAnswer && isCorrect && (
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            )}
                          </div>
                          
                          {totalAnswered > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-blue-200">
                                <span>{stats.count} respostas</span>
                                <span>{stats.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${stats.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking */}
            <div>
              <Card className="backdrop-blur-sm bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    Ranking Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getRanking().slice(0, 8).map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-yellow-500/20 border border-yellow-400/50' :
                          index === 1 ? 'bg-gray-400/20 border border-gray-400/50' :
                          index === 2 ? 'bg-orange-600/20 border border-orange-600/50' :
                          'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                          </span>
                          <div>
                            <div className="text-white font-medium text-sm">{participant.groupName}</div>
                            <div className="text-blue-200 text-xs">
                              {participant.answers.filter(a => a.isCorrect).length}/{room.questions.length}
                            </div>
                          </div>
                        </div>
                        <span className="text-yellow-400 font-bold">{participant.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="text-center py-6">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{totalParticipants}</div>
                <div className="text-blue-200">Participantes</div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{totalAnswered}</div>
                <div className="text-blue-200">Responderam</div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="text-center py-6">
                <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{totalParticipants - totalAnswered}</div>
                <div className="text-blue-200">Aguardando</div>
              </CardContent>
            </Card>
          </div>

          {/* Controles */}
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              {!showCorrectAnswer && (
                <Button
                  onClick={() => setShowCorrectAnswer(true)}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mostrar Resposta Correta
                </Button>
              )}
              
              <Button
                onClick={nextQuestion}
                disabled={isAdvancing}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                {isAdvancing ? 'Avançando...' : 'Próxima Pergunta'}
              </Button>
            </div>
            
            <div className="text-blue-200 text-sm">
              {totalAnswered} de {totalParticipants} participantes responderam
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
