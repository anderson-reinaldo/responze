import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Copy, Dice3, RefreshCw, Users, Lock, Link } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import api from '@/services/axios';

interface RoomInfo {
  id: string;
  name: string;
  password: string;
  link: string;
  adminToken: string;
}

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('adminAuthenticated') === 'true';
  });
  const [password, setPassword] = useState('');
  const [roomForm, setRoomForm] = useState({
    name: '',
    password: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<RoomInfo | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1545') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast.success('Acesso liberado!');
    } else {
      toast.error('Senha incorreta!');
      setPassword('');
    }
  };

  const generateRandomName = () => {
    const adjectives = ['Rápida', 'Inteligente', 'Desafiadora', 'Épica', 'Fantástica', 'Incrível', 'Poderosa', 'Suprema'];
    const nouns = ['Competição', 'Batalha', 'Arena', 'Disputa', 'Torneio', 'Partida', 'Duelo', 'Quiz'];
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    setRoomForm(prev => ({
      ...prev,
      name: `${randomAdj} ${randomNoun}`
    }));
  };

  const generateRandomPassword = () => {
    const password = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomForm(prev => ({
      ...prev,
      password
    }));
  };

  const createQuickRoom = async () => {
    const quickName = `Sala ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const quickPassword = Math.floor(1000 + Math.random() * 9000).toString();
    
    await createRoom(quickName, quickPassword);
  };

  const createCustomRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim() || !roomForm.password.trim()) {
      toast.error('Nome e senha da sala são obrigatórios');
      return;
    }
    
    await createRoom(roomForm.name, roomForm.password);
  };

  const createRoom = async (roomName: string, roomPassword: string) => {
    setIsCreating(true);
    try {
      const { data } = await api.post('/rooms', {
        roomName,
        roomPassword
      });
      const roomLink = `${window.location.origin}/room/${data.id}`;
      setCreatedRoom({
        id: data.id,
        name: roomName,
        password: roomPassword,
        link: roomLink,
        adminToken: ''
      });
      toast.success('Sala criada com sucesso!');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Erro ao criar sala');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const copyFullInfo = () => {
    if (!createdRoom) return;
    
    const info = `🏠 SALA CRIADA!\n\n📝 Nome: ${createdRoom.name}\n🔑 🔗 Link: ${createdRoom.link}\n\n📱 Instruções:\n1. Acesse o link\n2. Digite a senha\n3. Insira o nome do grupo\n4. Aguarde o início da partida`;
    
    navigator.clipboard.writeText(info);
    toast.success('Informações completas copiadas!');
  };

  const resetForm = () => {
    setCreatedRoom(null);
    setRoomForm({ name: '', password: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <CardTitle className="text-white text-2xl">Acesso Restrito</CardTitle>
            <CardDescription className="text-blue-200">
              Digite a senha administrativa para continuar
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
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }

  if (createdRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="text-8xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-white mb-2">Sala Criada!</h1>
            <p className="text-blue-200">Compartilhe essas informações com os participantes</p>
          </div>

          {/* Informações da Sala */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardContent className="py-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">{createdRoom.name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-200">Senha da Sala</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold text-white">{createdRoom.password}</span>
                    <Button
                      onClick={() => copyToClipboard(createdRoom.password, 'Senha')}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-blue-200">ID da Sala</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono text-white">{createdRoom.id}</span>
                    <Button
                      onClick={() => copyToClipboard(createdRoom.id, 'ID')}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-blue-200">Link de Acesso</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white break-all flex-1 font-mono bg-black/20 p-2 rounded">
                    {createdRoom.link}
                  </span>
                  <Button
                    onClick={() => copyToClipboard(createdRoom.link, 'Link')}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-white/20" />

              <div className="text-center space-y-4">
                <Button
                  onClick={copyFullInfo}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  size="lg"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copiar Informações Completas
                </Button>

                <div className="text-xs text-blue-200 bg-white/5 rounded-lg p-3">
                  <strong>📱 Instruções para os participantes:</strong><br />
                  1. Acesse o link fornecido<br />
                  2. Digite a senha da sala<br />
                  3. Insira o nome do grupo<br />
                  4. Aguarde o administrador iniciar a partida
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4">
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Outra Sala
            </Button>
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🏠 Criar Nova Sala
            </h1>
            <p className="text-blue-200">
              Configure uma sala para o quiz e compartilhe com os participantes
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sala Rápida */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Criação Rápida
              </CardTitle>
              <CardDescription className="text-blue-200">
                Gere uma sala automaticamente com nome e senha aleatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⚡</div>
                <p className="text-white text-lg mb-2">Nome automático baseado no horário</p>
                <p className="text-blue-200">Senha de 4 dígitos gerada aleatoriamente</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={createQuickRoom}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isCreating ? 'Criando...' : 'Criar Sala Rápida'}
              </Button>
            </CardFooter>
          </Card>

          {/* Sala Personalizada */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Criação Personalizada
              </CardTitle>
              <CardDescription className="text-blue-200">
                Configure o nome e senha da sala do seu jeito
              </CardDescription>
            </CardHeader>
            <form onSubmit={createCustomRoom}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomName" className="text-white">Nome da Sala</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="roomName"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Quiz da Empresa 2024"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    />
                    <Button
                      type="button"
                      onClick={generateRandomName}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Dice3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="roomPassword" className="text-white">Senha da Sala</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="roomPassword"
                      value={roomForm.password}
                      onChange={(e) => setRoomForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Ex: 1234"
                      maxLength={10}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    />
                    <Button
                      type="button"
                      onClick={generateRandomPassword}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Dice3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-blue-200 bg-white/5 rounded p-3">
                  💡 <strong>Dicas:</strong><br />
                  • Use nomes descritivos para facilitar identificação<br />
                  • Senhas curtas são mais fáceis de compartilhar<br />
                  • Clique nos dados para gerar sugestões aleatórias
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isCreating || !roomForm.name.trim() || !roomForm.password.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {isCreating ? 'Criando...' : 'Criar Sala Personalizada'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">1️⃣</div>
                <h3 className="text-white font-bold mb-2">Criar Sala</h3>
                <p className="text-blue-200 text-sm">
                  Escolha um nome e senha para sua sala de quiz
                </p>
              </div>
              <div>
                <div className="text-4xl mb-2">2️⃣</div>
                <h3 className="text-white font-bold mb-2">Compartilhar</h3>
                <p className="text-blue-200 text-sm">
                  Envie o link e senha para os participantes
                </p>
              </div>
              <div>
                <div className="text-4xl mb-2">3️⃣</div>
                <h3 className="text-white font-bold mb-2">Iniciar Quiz</h3>
                <p className="text-blue-200 text-sm">
                  Gerencie a partida e controle as perguntas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
