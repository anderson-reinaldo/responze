import { Trophy, Medal, Star, RefreshCw, Settings, Crown, Award, Zap, Play, Users } from "lucide-react";
import { QuizButton } from "@/components/ui/quiz-button";
import { AdminPanel } from "@/components/AdminPanel";
import { Confetti } from "@/components/Confetti";
import { Footer } from "@/components/Footer";
import { Player } from "@/lib/realApi";
import { useState, useEffect } from "react";
import logoImage from "@/assets/logo.png";

interface PodiumProps {
  players: Player[];
  onStartQuiz: (groupName: string) => void;
  onConfigQuiz: () => void;
  isLoading?: boolean;
  isAdminAuthenticated?: boolean;
}

export const Podium = ({ 
  players, 
  onStartQuiz, 
  onConfigQuiz, 
  isLoading = false, 
  isAdminAuthenticated = false 
}: PodiumProps) => {
  const [groupName, setGroupName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousPlayers, setPreviousPlayers] = useState<Player[]>([]);

  // Detecta novos jogadores com boa pontuação
  useEffect(() => {
    if (players.length > previousPlayers.length) {
      // Há novos jogadores
      const newPlayers = players.filter(player => 
        !previousPlayers.some(prev => prev.id === player.id)
      );
      
      // Verifica se algum novo jogador tem mais de 50%
      const hasGoodScore = newPlayers.some(player => {
        const percentage = (player.score / 10) * 100; // Assumindo 10 perguntas no total
        return percentage > 50;
      });

      if (hasGoodScore) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
    
    setPreviousPlayers(players);
  }, [players, previousPlayers]);

  const handleStartQuiz = () => {
    if (groupName.trim()) {
      onStartQuiz(groupName.trim());
    }
  };

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas letras maiúsculas, números e espaços
    const filteredValue = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    setGroupName(filteredValue);
  };

  // Preparar dados do pódio
  const sortedPlayers = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const topThree = sortedPlayers.slice(0, 3);
  const restOfPlayers = sortedPlayers.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Confetti Component */}
      <Confetti active={showConfetti} duration={3000} particleCount={100} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Animated particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Admin Config Button - Discrete position */}
        <div className="absolute top-4 right-4 z-20">
          <QuizButton 
            onClick={onConfigQuiz}
            variant="secondary"
            className={`w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full ${isAdminAuthenticated ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-400' : 'bg-white/10 border-white/20 hover:bg-white/20'} backdrop-blur-sm transition-all duration-200 shadow-lg opacity-60 hover:opacity-100`}
            title="Configurações Admin"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            {isAdminAuthenticated && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-green-900 rounded-full"></div>
              </div>
            )}
          </QuizButton>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <img 
                src={logoImage} 
                alt="Responze Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                RESPONZE
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium mt-1">Sistema de Quiz Interativo</p>
            </div>
          </div>
        </div>

        {/* Game Start Section */}
        <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">Iniciar Nova Partida</h2>
              <p className="text-sm sm:text-base text-white/70 mb-1">Digite o nome do seu grupo e comece a competição!</p>
              <p className="text-xs sm:text-sm text-white/50">Use apenas letras maiúsculas e números</p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={groupName}
                  onChange={handleGroupNameChange}
                  onKeyPress={(e) => e.key === "Enter" && handleStartQuiz()}
                  placeholder="GRUPO A1, EQUIPE 2024, etc."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl bg-white/20 border-2 border-white/30 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:border-yellow-400 focus:outline-none backdrop-blur-sm"
                />
                <Users className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-white/50" />
              </div>
              
              <div className="flex justify-center">
                <QuizButton 
                  onClick={handleStartQuiz}
                  disabled={!groupName.trim() || isLoading}
                  className="w-full sm:w-auto px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-2xl"
                  size="xl"
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  {isLoading ? "Iniciando..." : "Jogar Agora"}
                </QuizButton>
              </div>
            </div>
          </div>
        </div>

        {/* Podium Section */}
        {sortedPlayers.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">🏆 Ranking dos Campeões</h2>
              <p className="text-sm sm:text-lg text-white/70">Os melhores jogadores da competição</p>
            </div>

            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div className="flex items-end justify-center gap-2 sm:gap-8 mb-8 sm:mb-12 perspective-1000 px-2">
                {/* 2º Lugar */}
                {topThree[1] && (
                  <div className="flex flex-col items-center">
                    <div className="bg-white/20 backdrop-blur-lg rounded-xl sm:rounded-2xl p-2 sm:p-4 mb-2 sm:mb-4 border border-white/30 shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-center">
                        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 mx-auto shadow-lg">
                          <Medal className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-sm sm:text-lg break-words max-w-[80px] sm:max-w-none">{topThree[1].group}</h3>
                        <p className="text-lg sm:text-2xl font-bold text-gray-300">{topThree[1].score}</p>
                        <p className="text-xs sm:text-sm text-white/60">pontos</p>
                      </div>
                    </div>
                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl shadow-2xl border-t-4 border-gray-300 relative">
                      <div className="absolute -top-1 sm:-top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-300 to-gray-500 text-white text-sm sm:text-xl font-bold w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg">
                        2
                      </div>
                    </div>
                  </div>
                )}

                {/* 1º Lugar */}
                {topThree[0] && (
                  <div className="flex flex-col items-center relative">
                    {/* Coroa flutuante */}
                    <div className="absolute -top-4 sm:-top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                      <Crown className="w-6 h-6 sm:w-12 sm:h-12 text-yellow-400" />
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-2 sm:mb-4 border-2 border-yellow-400/50 shadow-2xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-2xl">
                          <Trophy className="w-6 h-6 sm:w-12 sm:h-12 text-white" />
                        </div>
                        <h3 className="font-bold text-yellow-400 text-sm sm:text-xl break-words max-w-[90px] sm:max-w-none">{topThree[0].group}</h3>
                        <p className="text-xl sm:text-3xl font-bold text-yellow-300">{topThree[0].score}</p>
                        <p className="text-xs sm:text-sm text-yellow-200">pontos</p>
                      </div>
                    </div>
                    <div className="w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl shadow-2xl border-t-4 border-yellow-300 relative">
                      <div className="absolute -top-1 sm:-top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-lg sm:text-2xl font-bold w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg">
                        1
                      </div>
                    </div>
                  </div>
                )}

                {/* 3º Lugar */}
                {topThree[2] && (
                  <div className="flex flex-col items-center">
                    <div className="bg-white/20 backdrop-blur-lg rounded-xl sm:rounded-2xl p-2 sm:p-4 mb-2 sm:mb-4 border border-white/30 shadow-xl transform hover:scale-105 transition-all duration-300">
                      <div className="text-center">
                        <div className="w-8 h-8 sm:w-14 sm:h-14 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-2 sm:mb-3 mx-auto shadow-lg">
                          <Award className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-sm break-words max-w-[70px] sm:max-w-none">{topThree[2].group}</h3>
                        <p className="text-base sm:text-xl font-bold text-amber-400">{topThree[2].score}</p>
                        <p className="text-xs sm:text-sm text-white/60">pontos</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-xl shadow-2xl border-t-4 border-amber-400 relative">
                      <div className="absolute -top-1 sm:-top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-800 text-white text-sm sm:text-lg font-bold w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg">
                        3
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rest of Rankings */}
            {restOfPlayers.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/20 shadow-2xl">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">Demais Classificados</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {restOfPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 hover:bg-white/20 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base flex-shrink-0">
                            {index + 4}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white text-sm sm:text-lg truncate">{player.group}</h4>
                            <p className="text-white/60 text-xs sm:text-sm">Participante</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg sm:text-2xl font-bold text-white">{player.score}</p>
                          <p className="text-white/60 text-xs sm:text-sm">pontos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {sortedPlayers.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-white/50" />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-white/80 mb-2">Nenhuma Partida Ainda</h3>
            <p className="text-sm sm:text-base text-white/60">Seja o primeiro a jogar e aparecer no ranking!</p>
          </div>
        )}

        {/* Admin Panel */}
        {showAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl max-w-xs sm:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
              <AdminPanel isOpen={true} onClose={() => setShowAdmin(false)} />
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};
