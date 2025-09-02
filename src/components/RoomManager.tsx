import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Settings, Home, Monitor, Trophy, Calendar, Clock, SkipForward, Trash2, Play, Copy } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/axios';
import confetti from 'canvas-confetti';
import { Separator } from '@radix-ui/react-separator';
import { Label } from '@radix-ui/react-label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@radix-ui/react-alert-dialog';
import { AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';

interface Room {
  id: string;
  name: string;
  password: string;
  adminId?: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  participants: Participant[];
  currentQuestion: number;
  questions: any[];
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

interface Participant {
  id: string;
  groupName: string;
  score: number;
  answers: any[];
  joinedAt: number;
  isActive: boolean;
}

interface RoomManagerProps {
  questions: any[];
  onStartTVMode: (room: Room) => void;
}


  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

export default function AdminDashboard({ questions, onStartTVMode }:RoomManagerProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    totalParticipants: 0
  });

  const [loading, setLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', password: '' });
  // Não há mais adminTokens

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const { data } = await api.get('/rooms-all');
      setRooms(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao carregar salas');
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim() || !newRoom.password.trim()) {
      toast.error('Nome e senha da sala são obrigatórios');
      return;
    }
    setLoading(true);
    try {
      await api.post('/rooms', {
        roomName: newRoom.name,
        roomPassword: newRoom.password
      });
      setNewRoom({ name: '', password: '' });
      toast.success('Sala criada com sucesso!');
      loadRooms();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (roomId: string) => {
    try {
      await api.post(`/rooms/${roomId}/start`, { questions });
      toast.success('Quiz iniciado!');
      
      // Buscar dados atualizados da sala e iniciar TV Mode automaticamente
      const { data: roomData } = await api.get(`/rooms/${roomId}`);
      if (roomData) {
        onStartTVMode(roomData);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao iniciar quiz');
    }
  };

  const nextQuestion = async (roomId: string) => {
    try {
      const { data } = await api.post(`/rooms/${roomId}/next`);
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
      loadRooms();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao avançar pergunta');
    }
  };

  const deleteRoom = async (roomId: string, roomName: string) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      toast.success(`Sala "${roomName}" deletada`);
      loadRooms();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao deletar sala');
    }
  };

  const copyRoomInfo = (room: Room) => {
    const info = `Sala: ${room.name}\nSenha: ${room.password}\nLink: ${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(info);
    toast.success('Informações da sala copiadas!');
  };


  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getRanking = (participants: Participant[]) => {
    return [...participants]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  useEffect(() => {
    // Verificar se admin já está autenticado (sessionStorage)
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(loadDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1545') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast.success('Bem-vindo ao painel administrativo!');
      loadDashboardData();
    } else {
      toast.error('Senha incorreta!');
      setPassword('');
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data } = await api.get('/rooms-all');
      setRooms(data);
      // Calcular estatísticas
      const totalParticipants = data.reduce((sum: number, room: Room) => sum + room.participants.length, 0);
      const activeRooms = data.filter((room: Room) => room.status === 'waiting' || room.status === 'playing').length;
      setStats({
        totalRooms: data.length,
        activeRooms,
        totalParticipants
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao carregar dados');
    }
  };

  const getStatusBadge = (status: string) => {
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
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <CardTitle className="text-white text-2xl">Painel Administrativo</CardTitle>
            <CardDescription className="text-blue-200">
              Digite a senha para acessar o dashboard
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full px-4 py-3 text-lg bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none backdrop-blur-sm"
                autoFocus
              />
              
              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Entrar
                </Button>
                
                <Button
                  type="button"
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Responze Quiz
            </h1>
            <p className="text-blue-200">
              Gerencie salas e monitore atividades do quiz
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="text-center py-6">
              <Home className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.totalRooms}</div>
              <div className="text-blue-200">Total de Salas</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="text-center py-6">
              <Monitor className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.activeRooms}</div>
              <div className="text-blue-200">Salas Ativas</div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="text-center py-6">
              <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.totalParticipants}</div>
              <div className="text-blue-200">Participantes</div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/admin/create-room')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Nova Sala
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Perguntas
              </Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Estatísticas Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white">Salas Aguardando:</span>
                <span className="text-yellow-400 font-bold">
                  {rooms.filter(r => r.status === 'waiting').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Salas Em Jogo:</span>
                <span className="text-green-400 font-bold">
                  {rooms.filter(r => r.status === 'playing').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Salas Finalizadas:</span>
                <span className="text-blue-400 font-bold">
                  {rooms.filter(r => r.status === 'finished').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Salas */}
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Home className="w-5 h-5" />
              Salas Recentes
            </CardTitle>
            <CardDescription className="text-blue-200">
              Últimas salas criadas e seu status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
        {/* Lista de Salas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{room.name}</CardTitle>
                  {getStatusBadge(room.status)}
                </div>
                <CardDescription className="text-blue-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {room.participants.length} participantes
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatTime(room.createdAt)}
                  </div>
                  {room.status === 'playing' && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pergunta {room.currentQuestion + 1} de {room.questions.length}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Participantes */}
                {room.participants.length > 0 && (
                  <div>
                    <Label className="text-white text-sm font-medium">Participantes:</Label>
                    <div className="mt-2 space-y-1">
                      {room.participants.map((participant) => (
                        <div key={participant.id} className="flex justify-between items-center bg-white/5 rounded p-2">
                          <span className="text-white text-sm">{participant.groupName}</span>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold">{participant.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ranking Final */}
                {room.status === 'finished' && room.participants.length > 0 && (
                  <div>
                    <Label className="text-white text-sm font-medium">🏆 Ranking Final:</Label>
                    <div className="mt-2 space-y-1">
                      {getRanking(room.participants).map((participant, index) => (
                        <div key={participant.id} className="flex justify-between items-center bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                            <span className="text-white font-medium">{participant.groupName}</span>
                          </div>
                          <span className="text-yellow-400 font-bold">{participant.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="bg-white/20" />

                <div className="text-xs text-blue-200">
                  Senha: <span className="font-mono bg-white/10 px-2 py-1 rounded">{room.password}</span>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-2">
                <Button
                  onClick={() => copyRoomInfo(room)}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar Info
                </Button>

                {/* Botões de controle sempre visíveis para admin simplificado */}
                {room.status === 'waiting' && room.participants.length > 0 && (
                  <Button
                    onClick={() => startQuiz(room.id)}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Iniciar
                  </Button>
                )}

                {room.status === 'playing' && (
                  <>
                    <Button
                      onClick={() => nextQuestion(room.id)}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <SkipForward className="w-4 h-4 mr-1" />
                      Próxima
                    </Button>
                    <Button
                      onClick={() => onStartTVMode(room)}
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Monitor className="w-4 h-4 mr-1" />
                      TV
                    </Button>
                  </>
                )}

                {(room.status === 'finished' || room.status === 'waiting') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500/80 hover:bg-red-600/80"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deletar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Deletar Sala</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Tem certeza que deseja deletar a sala "{room.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRoom(room.id, room.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white text-lg">Nenhuma sala criada ainda</p>
              <p className="text-blue-200">Crie uma nova sala para começar!</p>
            </CardContent>
          </Card>
        )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
