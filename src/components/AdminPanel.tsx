import { useState } from "react";
import { Settings, Trash2, Download, Upload, RefreshCw, Brain, Home, Plus, Copy } from "lucide-react";
import { QuizButton } from "@/components/ui/quiz-button";
import { useClearData, useRanking } from "@/hooks/useQuizAPI";
import { Player } from "@/lib/realApi";
import { quizAPI } from "@/lib/realApi";
import { toast } from "sonner";
import confetti from 'canvas-confetti';
import instance from "@/services/axios";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuizConfig?: () => void;
  onOpenRoomManager?: () => void;
}

export const AdminPanel = ({ isOpen, onClose, onOpenQuizConfig, onOpenRoomManager }: AdminPanelProps) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{name: string, password: string, link: string, id: string} | null>(null);
  
  const { data: players = [], refetch: refetchRanking } = useRanking();
  const clearDataMutation = useClearData();

  // Check if there's a global quiz configuration
  const globalQuizConfig = localStorage.getItem('globalQuizConfig');
  const hasGlobalConfig = globalQuizConfig && (() => {
    try {
      const config = JSON.parse(globalQuizConfig);
      return Array.isArray(config) && config.length >= 7;
    } catch {
      return false;
    }
  })();

  const handleExportData = async () => {
    try {
      const blob = await quizAPI.exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `responze-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.players && Array.isArray(data.players)) {
          await quizAPI.restoreBackup(data);
          refetchRanking();
          toast.success("Dados importados com sucesso!");
        } else {
          toast.error("Formato de arquivo inválido");
        }
      } catch (error) {
        toast.error("Erro ao importar dados");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleClearData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    
    clearDataMutation.mutate();
    setConfirmClear(false);
    onClose();
  };

  const handleCreateQuickRoom = async () => {
    setIsCreatingRoom(true);
    try {
      // Gerar nome e senha automáticos
      const roomName = `Sala ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const roomPassword = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos

      // Modelo padrão para requests
      const response = await instance.post('/rooms', {
        hostName: 'Administrador',
        password: roomPassword,
        roomName
      });

      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        const roomLink = `${window.location.origin}/room/${data.id}`;
        setRoomInfo({
          name: roomName,
          password: roomPassword,
          link: roomLink,
          id: data.id
        });
        toast.success('Sala criada com sucesso!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast.error(data.error || 'Erro ao criar sala');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao conectar com o servidor');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const copyRoomInfo = () => {
    if (!roomInfo) return;
    
    const info = `🏠 SALA CRIADA!\n\n📝 Nome: ${roomInfo.name}\n🔑 🔗 Link: ${roomInfo.link}`;
    navigator.clipboard.writeText(info);
    toast.success('Informações copiadas!');
  };

  const copyRoomLink = () => {
    if (!roomInfo) return;
    
    navigator.clipboard.writeText(roomInfo.link);
    toast.success('Link copiado!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md w-full card-elevated">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gradient">Painel Admin</h2>
        </div>

        <div className="space-y-4">
          {/* Configuração de Quiz */}
          {hasGlobalConfig && (
            <div className="glass rounded-2xl p-4 mb-4">
              <h3 className="font-semibold text-foreground mb-2">Configuração Global</h3>
              <p className="text-sm text-accent mb-3">
                ✓ Perguntas padrão configuradas para todos os grupos
              </p>
            </div>
          )}

          {/* Estatísticas */}
          <div className="glass rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{players.length}</div>
                <div className="text-sm text-foreground/60">Grupos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">
                  {players.length > 0 ? Math.max(...players.map(p => p.score)) : 0}
                </div>
                <div className="text-sm text-foreground/60">Melhor Score</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            {/* Botão de Criar Sala Rápida */}
            <QuizButton
              onClick={handleCreateQuickRoom}
              disabled={isCreatingRoom}
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Plus className="w-4 h-4" />
              {isCreatingRoom ? 'Criando Sala...' : 'Criar Sala Rápida'}
            </QuizButton>

            {onOpenRoomManager && (
              <QuizButton
                onClick={() => {
                  onOpenRoomManager();
                  onClose();
                }}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <Home className="w-4 h-4" />
                Gerenciar Salas
              </QuizButton>
            )}

            {onOpenQuizConfig && (
              <QuizButton
                onClick={() => {
                  onOpenQuizConfig();
                  onClose();
                }}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <Brain className="w-4 h-4" />
                Configurar Perguntas
              </QuizButton>
            )}

            <QuizButton
              onClick={() => refetchRanking()}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar Ranking
            </QuizButton>

            <QuizButton
              onClick={handleExportData}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <Download className="w-4 h-4" />
              Exportar Dados
            </QuizButton>

            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <QuizButton
                asChild
                variant="secondary"
                size="lg"
                className="w-full cursor-pointer"
              >
                <span>
                  <Upload className="w-4 h-4" />
                  Importar Dados
                </span>
              </QuizButton>
            </label>

            <QuizButton
              onClick={handleClearData}
              variant={confirmClear ? "incorrect" : "secondary"}
              size="lg"
              className="w-full"
              disabled={clearDataMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              {confirmClear ? "Confirmar Limpeza" : "Limpar Dados"}
            </QuizButton>

            {confirmClear && (
              <p className="text-sm text-quiz-error text-center">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            )}
          </div>

          <QuizButton
            onClick={onClose}
            variant="hero"
            size="lg"
            className="w-full mt-6"
          >
            Fechar
          </QuizButton>
        </div>

        {/* Modal de Informações da Sala */}
        {roomInfo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🏠</div>
                <h3 className="text-xl font-bold text-gradient">Sala Criada!</h3>
                <p className="text-sm text-accent">Compartilhe essas informações com os participantes</p>
              </div>

              <div className="space-y-4">
                <div className="glass rounded-2xl p-4">
                  <div className="text-sm text-foreground/60 mb-1">Nome da Sala</div>
                  <div className="font-bold text-foreground">{roomInfo.name}</div>
                </div>

                <div className="glass rounded-2xl p-4">
                  <div className="text-sm text-foreground/60 mb-1">Senha</div>
                  <div className="font-mono text-xl font-bold text-primary">{roomInfo.password}</div>
                </div>

                <div className="glass rounded-2xl p-4">
                  <div className="text-sm text-foreground/60 mb-1">Link de Acesso</div>
                  <div className="text-xs text-foreground break-all mb-2">{roomInfo.link}</div>
                  <QuizButton
                    onClick={copyRoomLink}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar Link
                  </QuizButton>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <QuizButton
                  onClick={copyRoomInfo}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Tudo
                </QuizButton>
                <QuizButton
                  onClick={() => setRoomInfo(null)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Fechar
                </QuizButton>
              </div>

              <div className="text-xs text-center text-foreground/60 mt-4">
                💡 Os participantes devem acessar o link e inserir a senha para entrar na sala
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
