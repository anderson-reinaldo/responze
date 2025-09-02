import { useState, useEffect } from "react";
import { Settings, Plus, Edit, Trash2, Check, X, Brain, FileText, Shuffle, Play, Clock, Eraser, History, Calendar, Users } from "lucide-react";
import { QuizButton } from "@/components/ui/quiz-button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuizConfig, useSaveQuizConfig, useResetQuizConfig } from "@/hooks/useQuizConfig";
import { useClearRanking, useRankingHistory, useDeleteHistoryEntry } from "@/hooks/useQuizAPI";
import { getConfig } from "@/lib/config";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";

const config = getConfig();

// Componente para exibir o histórico de rankings
const HistoryTab = () => {
  const { data: historyData, isLoading, error } = useRankingHistory();
  const deleteHistoryMutation = useDeleteHistoryEntry();

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta entrada do histórico?')) {
      deleteHistoryMutation.mutate(entryId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white/60">Carregando histórico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">Erro ao carregar histórico</div>
        <div className="text-white/40 text-sm">{error.message}</div>
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/60 text-sm sm:text-base">Nenhum histórico de rankings ainda</p>
        <p className="text-white/40 text-xs sm:text-sm">O histórico será criado quando limpar o ranking</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg sm:text-xl font-bold text-white">Histórico de Rankings</h3>
      </div>

      <div className="grid gap-4">
        {historyData.map((entry) => (
          <Card key={entry.id} className="bg-black/20 border-white/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {entry.startDateFormatted} - {entry.endDateFormatted}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-white/40 text-xs">Total de Grupos</div>
                      <div className="text-white font-bold">{entry.totalPlayers}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs">Total de Sessões</div>
                      <div className="text-white font-bold">{entry.totalSessions}</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="text-white/40 text-xs">Arquivado em</div>
                      <div className="text-white text-sm">{entry.archivedAtFormatted}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-white/60 text-sm font-medium">Ranking Final:</div>
                    <div className="space-y-1">
                      {entry.players.slice(0, 5).map((player, index) => (
                        <div key={index} className="flex justify-between items-center py-1 px-2 bg-white/5 rounded text-sm">
                          <span className="text-white/80">
                            {player.position}º {player.group}
                          </span>
                          <span className="text-blue-400 font-bold">{player.score} pts</span>
                        </div>
                      ))}
                      {entry.players.length > 5 && (
                        <div className="text-white/40 text-xs text-center py-1">
                          ... e mais {entry.players.length - 5} grupos
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <QuizButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={deleteHistoryMutation.isPending}
                    className="w-full sm:w-auto bg-red-600/20 hover:bg-red-600/30 border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Remover</span>
                  </QuizButton>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  timeLimit?: number; // Tempo em segundos (padrão: 60)
}

interface QuizConfigProps {
  onStartQuiz: (questions: Question[]) => void;
  onBack: () => void;
}

// Perguntas extraídas do quiz.json
const predefinedQuestions: Question[] = [
  {
    id: 1,
    question: "O método PEPS é mais indicado quando:",
    options: [
      "Os preços de compra estão em queda constante",
      "Os produtos são perecíveis e têm prazo de validade",
      "O objetivo é reduzir a carga tributária",
      "Se deseja inflar artificialmente o lucro"
    ],
    correctAnswer: 1,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 2,
    question: "Qual o objetivo principal do CPC 16?",
    options: [
      "Definir regras fiscais para cálculo de tributos",
      "Estabelecer critérios de mensuração e reconhecimento dos estoques",
      "Determinar métodos de precificação",
      "Regular apenas estoques de mercadorias para revenda"
    ],
    correctAnswer: 1,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 3,
    question: "Estoque inicial: 200 unidades a R$ 5,00 cada.\nCompra: 100 unidades a R$ 6,00.\nVenda: 150 unidades.\nQual o custo da venda pelo método PEPS?",
    options: [
      "R$ 750,00",
      "R$ 780,00",
      "R$ 810,00",
      "R$ 900,00"
    ],
    correctAnswer: 0,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 4,
    question: "Qual a diferença entre inventário rotativo e inventário geral?",
    options: [
      "O rotativo é feito apenas por auditores externos, e o geral é feito por funcionários internos",
      "O rotativo é feito em pequenas partes ao longo do ano, enquanto o geral envolve todo o estoque de uma só vez",
      "O geral é menos confiável que o rotativo",
      "Ambos significam a mesma coisa"
    ],
    correctAnswer: 1,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 5,
    question: "Custos fixos aumentaram, mas o custo direto permanece:",
    options: [
      "Maior",
      "Menor",
      "Depende do preço de venda",
      "Inalterado"
    ],
    correctAnswer: 3,
    category: "Contabilidade - Custos",
    timeLimit: 40
  },
  {
    id: 6,
    question: "Em uma análise de mix de produtos, a margem de contribuição ajuda a:",
    options: [
      "Determinar quais produtos contribuem mais para cobrir custos fixos e gerar lucro",
      "Ajustar o valor de estoque pelo VRL",
      "Substituir o cálculo do custo variável",
      "Definir apenas os custos fixos"
    ],
    correctAnswer: 0,
    category: "Contabilidade - Custos",
    timeLimit: 40
  },
  {
    id: 7,
    question: "Estoque inicial: 200 unid. a R$ 15,00.\nCompra: 100 unid. a R$ 18,00.\nVenda: 150 unid.\nQual o CMV pela média ponderada?",
    options: [
      "R$ 2.200,00",
      "R$ 2.300,00",
      "R$ 2.400,00",
      "R$ 2.500,00"
    ],
    correctAnswer: 2,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 8,
    question: "Qual é a principal desvantagem do método UEPS?",
    options: [
      "Mostra um custo de mercadoria vendida mais alto e lucro menor",
      "Não é aceito pela legislação brasileira",
      "Pode deixar produtos antigos parados no estoque",
      "Todas as alternativas anteriores"
    ],
    correctAnswer: 3,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 9,
    question: "Conhecer os métodos de custeio ajuda principalmente a:",
    options: [
      "Cumprir apenas a legislação fiscal",
      "Avaliar corretamente o impacto dos custos sobre a DRE e o resultado",
      "Substituir a análise de margem de contribuição",
      "Ajustar automaticamente o preço de venda"
    ],
    correctAnswer: 1,
    category: "Contabilidade - Custos",
    timeLimit: 40
  },
  {
    id: 10,
    question: "Qual demonstração contábil é diretamente influenciada pela escolha do custeio por absorção?",
    options: [
      "DRE",
      "Balanço Patrimonial",
      "Fluxo de Caixa",
      "Demonstração do Valor Adicionado"
    ],
    correctAnswer: 0,
    category: "Contabilidade - Demonstrações Contábeis",
    timeLimit: 40
  },
  {
    id: 11,
    question: "Estoque inicial: 50 unidades a R$ 20\nCompra 1: 70 unidades a R$ 22\nCompra 2: 30 unidades a R$ 25\nVenda: 80 unidades\n\nQual o CMV pelo UEPS?",
    options: [
      "R$ 1.850",
      "R$ 1.780",
      "R$ 1.800",
      "R$ 1.900"
    ],
    correctAnswer: 0,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 12,
    question: "O VRL (Valor Realizável Liquido) não inclui:",
    options: [
      "Custos de venda estimado",
      "Custos de conclusão do produto",
      "Preço de venda",
      "Impostos incidentes sobre a venda"
    ],
    correctAnswer: 2,
    category: "Contabilidade - Estoques",
    timeLimit: 40
  },
  {
    id: 13,
    question: "Qual das alternativas é verdadeira sobre a tomada de decisão gerencial?",
    options: [
      "O custeio por absorção sempre fornece a melhor base para decisões de curto prazo",
      "O custeio direto (variável) é mais útil para decisões de curto prazo",
      "O VRL deve ser ignorado",
      "Custos fixos devem sempre ser considerados integralmente"
    ],
    correctAnswer: 1,
    category: "Contabilidade - Decisões Gerenciais",
    timeLimit: 40
  }
];

export const QuizConfig = () => {
  // Estados locais
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("predefined");
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);
  const [tempTimeValue, setTempTimeValue] = useState<number>(config.quiz.timePerQuestion);
  
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    category: "",
    timeLimit: config.quiz.timePerQuestion
  } as {
    question: string;
    options: string[];
    correctAnswer: number;
    category: string;
    timeLimit: number;
  });

  // Hooks da API
  const { data: quizConfig, isLoading: configLoading } = useQuizConfig();
  const saveQuizConfigMutation = useSaveQuizConfig();
  const resetQuizConfigMutation = useResetQuizConfig();
  const clearRankingMutation = useClearRanking();

  // Perguntas selecionadas vêm da API
  const selectedQuestions = quizConfig?.selectedQuestions || [];

  useEffect(() => {
    // Carrega perguntas customizadas do localStorage
    const saved = localStorage.getItem('customQuestions');
    if (saved) {
      setCustomQuestions(JSON.parse(saved));
    }
  }, []);

  const saveCustomQuestions = (questions: Question[]) => {
    localStorage.setItem('customQuestions', JSON.stringify(questions));
    setCustomQuestions(questions);
  };

  const updateSelectedQuestions = (questions: Question[]) => {
    // Salva sempre, backend decide se é válido ou temporário
    saveQuizConfigMutation.mutate(questions);
  };

  const saveGlobalQuizConfig = () => {
    if (selectedQuestions.length < 7) {
      toast.error("Selecione pelo menos 7 perguntas para salvar como configuração padrão!");
      return;
    }
    
    toast.success("Configuração salva com sucesso!");
  };

  const clearGlobalQuizConfig = () => {
    resetQuizConfigMutation.mutate();
  };

  const handleClearRanking = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o ranking? Esta ação não pode ser desfeita.')) {
      clearRankingMutation.mutate();
    }
  };

  const toggleQuestionSelection = (question: Question) => {
    const isSelected = selectedQuestions.find(q => q.id === question.id);
    if (isSelected) {
      updateSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      updateSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const selectRandomQuestions = (count: number) => {
    const allQuestions = [...predefinedQuestions, ...customQuestions];
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    updateSelectedQuestions(shuffled.slice(0, Math.min(count, allQuestions.length)));
  };

  const updateQuestionTime = (questionId: number, newTime: number, isPredefined: boolean = true) => {
    if (isPredefined) {
      // Para perguntas predefinidas, atualiza apenas na configuração selecionada
      const updatedSelected = selectedQuestions.map(q => 
        q.id === questionId ? { ...q, timeLimit: newTime } : q
      );
      updateSelectedQuestions(updatedSelected);
    } else {
      // Para perguntas customizadas, atualiza no localStorage também
      const updatedCustom = customQuestions.map(q => 
        q.id === questionId ? { ...q, timeLimit: newTime } : q
      );
      saveCustomQuestions(updatedCustom);
      
      // E atualiza nas selecionadas se estiver lá
      const updatedSelected = selectedQuestions.map(q => 
        q.id === questionId ? { ...q, timeLimit: newTime } : q
      );
      updateSelectedQuestions(updatedSelected);
    }
  };

  const startEditingTime = (questionId: number, currentTime: number) => {
    setEditingTimeId(questionId);
    setTempTimeValue(currentTime);
  };

  const saveTimeEdit = (questionId: number, isPredefined: boolean = true) => {
    if (tempTimeValue >= 10 && tempTimeValue <= 120) {
      updateQuestionTime(questionId, tempTimeValue, isPredefined);
      setEditingTimeId(null);
      toast.success("Tempo atualizado!");
    } else {
      toast.error("Tempo deve estar entre 10 e 120 segundos");
    }
  };

  const cancelTimeEdit = () => {
    setEditingTimeId(null);
    setTempTimeValue(config.quiz.timePerQuestion);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim() || !newQuestion.category.trim()) return;
    if (newQuestion.options.some(opt => !opt.trim())) return;

    const question: Question = {
      id: Date.now(),
      question: newQuestion.question,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      category: newQuestion.category,
      timeLimit: newQuestion.timeLimit
    };

    const updated = [...customQuestions, question];
    saveCustomQuestions(updated);

    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      category: "",
      timeLimit: config.quiz.timePerQuestion
    } as {
      question: string;
      options: string[];
      correctAnswer: number;
      category: string;
      timeLimit: number;
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src={logoImage} 
                alt="Responze Logo" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-xl"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Configurar Quiz</h1>
                <p className="text-white/70 text-sm sm:text-base">Selecione ou crie suas perguntas</p>
              </div>
            </div>
          </div>

          {/* Status da Configuração */}
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-white/10 rounded-xl border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold text-sm sm:text-base">
                  {selectedQuestions.length} perguntas selecionadas
                </p>
                <p className="text-white/60 text-xs sm:text-sm">
                  {selectedQuestions.length >= 7 ? "✅ Pronto para jogar!" : `⚠️ Selecione mais ${7 - selectedQuestions.length} pergunta(s)`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <QuizButton onClick={saveGlobalQuizConfig} disabled={selectedQuestions.length < 7} className="w-full sm:w-auto">
                  Salvar Configuração
                </QuizButton>
                {selectedQuestions.length > 0 && (
                  <QuizButton onClick={clearGlobalQuizConfig} variant="secondary" className="w-full sm:w-auto">
                    Limpar Seleção
                  </QuizButton>
                )}
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
            <QuizButton onClick={() => selectRandomQuestions(7)} variant="secondary" size="sm" className="flex-1 sm:flex-none">
              <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">7 Aleatórias</span>
              <span className="xs:hidden">7</span>
            </QuizButton>
            <QuizButton onClick={() => selectRandomQuestions(10)} variant="secondary" size="sm" className="flex-1 sm:flex-none">
              <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">10 Aleatórias</span>
              <span className="xs:hidden">10</span>
            </QuizButton>
            <QuizButton onClick={() => selectRandomQuestions(13)} variant="secondary" size="sm" className="flex-1 sm:flex-none">
              <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Todas</span>
              <span className="xs:hidden">13</span>
            </QuizButton>
            
            {/* Separador visual - oculto em mobile */}
            <div className="hidden sm:block w-px bg-white/20 mx-2"></div>
            
            {/* Controles Administrativos */}
            <QuizButton 
              onClick={handleClearRanking} 
              variant="secondary" 
              size="sm"
              disabled={clearRankingMutation.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-300 w-full sm:w-auto mt-2 sm:mt-0"
            >
              <Eraser className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">{clearRankingMutation.isPending ? 'Limpando...' : 'Limpar Ranking'}</span>
              <span className="sm:hidden">Limpar</span>
            </QuizButton>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
              <TabsTrigger value="predefined" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Perguntas Pré-definidas</span>
                <span className="sm:hidden">Pré-definidas</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Perguntas Personalizadas</span>
                <span className="sm:hidden">Personalizadas</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Histórico Rankings</span>
                <span className="sm:hidden">Histórico</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predefined">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Perguntas de Contabilidade</h3>
                  <QuizButton 
                    onClick={() => {
                      const allSelected = predefinedQuestions.every(q => 
                        selectedQuestions.find(sq => sq.id === q.id)
                      );
                      if (allSelected) {
                        updateSelectedQuestions(selectedQuestions.filter(sq => 
                          !predefinedQuestions.find(pq => pq.id === sq.id)
                        ));
                      } else {
                        const newSelections = predefinedQuestions.filter(pq => 
                          !selectedQuestions.find(sq => sq.id === pq.id)
                        );
                        updateSelectedQuestions([...selectedQuestions, ...newSelections]);
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {predefinedQuestions.every(q => selectedQuestions.find(sq => sq.id === q.id))
                      ? "Desmarcar Todas"
                      : "Selecionar Todas"
                    }
                  </QuizButton>
                </div>

                <div className="grid gap-4">
                  {predefinedQuestions.map((question) => {
                      const isSelected = selectedQuestions.find(q => q.id === question.id);
                      const selectedQuestion = selectedQuestions.find(q => q.id === question.id);
                      const currentTimeLimit = selectedQuestion?.timeLimit ?? question.timeLimit ?? config.quiz.timePerQuestion;
                      const isEditingTime = editingTimeId === question.id;                    return (
                      <Card 
                        key={question.id} 
                        className={`transition-all duration-200 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50' 
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div 
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 cursor-pointer flex-shrink-0 ${
                                isSelected ? 'bg-green-500 border-green-500' : 'border-white/30'
                              }`}
                              onClick={() => toggleQuestionSelection(question)}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                <p className="font-medium text-white cursor-pointer text-sm sm:text-base break-words" onClick={() => toggleQuestionSelection(question)}>
                                  {question.question}
                                </p>
                                <div className="flex items-center gap-2 flex-shrink-0 self-start">
                                  {isEditingTime ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="10"
                                        max="120"
                                        value={tempTimeValue}
                                        onChange={(e) => setTempTimeValue(Number(e.target.value))}
                                        className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <QuizButton 
                                        size="sm" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveTimeEdit(question.id, true);
                                        }}
                                        className="p-1 h-6 w-6"
                                      >
                                        <Check className="w-3 h-3" />
                                      </QuizButton>
                                      <QuizButton 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelTimeEdit();
                                        }}
                                        className="p-1 h-6 w-6"
                                      >
                                        <X className="w-3 h-3" />
                                      </QuizButton>
                                    </div>
                                  ) : (
                                    <div 
                                      className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingTime(question.id, currentTimeLimit);
                                      }}
                                    >
                                      <Clock className="w-3 h-3 text-white/70" />
                                      <span className="text-xs text-white/70">{currentTimeLimit}s</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-1 mb-2 cursor-pointer" onClick={() => toggleQuestionSelection(question)}>
                                {question.options.map((option, index) => (
                                  <p key={index} className={`text-xs sm:text-sm break-words ${
                                    index === question.correctAnswer ? 'text-green-300 font-medium' : 'text-white/70'
                                  }`}>
                                    {String.fromCharCode(65 + index)}) {option}
                                  </p>
                                ))}
                              </div>
                              <p className="text-xs text-blue-300 font-medium cursor-pointer" onClick={() => toggleQuestionSelection(question)}>
                                {question.category}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Suas Perguntas Personalizadas</h3>
                  <QuizButton onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Pergunta
                  </QuizButton>
                </div>

                {customQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60 text-sm sm:text-base">Nenhuma pergunta personalizada ainda</p>
                    <p className="text-white/40 text-xs sm:text-sm">Clique em "Nova Pergunta" para criar</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {customQuestions.map((question) => {
                      const isSelected = selectedQuestions.find(q => q.id === question.id);
                      const selectedQuestion = selectedQuestions.find(q => q.id === question.id);
                      const currentTimeLimit = selectedQuestion?.timeLimit ?? question.timeLimit ?? config.quiz.timePerQuestion;
                      const isEditingTime = editingTimeId === question.id;
                      
                      return (
                        <Card 
                          key={question.id} 
                          className={`transition-all duration-200 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50' 
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div 
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 cursor-pointer flex-shrink-0 ${
                                  isSelected ? 'bg-green-500 border-green-500' : 'border-white/30'
                                }`}
                                onClick={() => toggleQuestionSelection(question)}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                  <p className="font-medium text-white cursor-pointer text-sm sm:text-base break-words" onClick={() => toggleQuestionSelection(question)}>
                                    {question.question}
                                  </p>
                                  <div className="flex items-center gap-2 flex-shrink-0 self-start">
                                    {isEditingTime ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="10"
                                          max="120"
                                          value={tempTimeValue}
                                          onChange={(e) => setTempTimeValue(Number(e.target.value))}
                                          className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <QuizButton 
                                          size="sm" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            saveTimeEdit(question.id, false);
                                          }}
                                          className="p-1 h-6 w-6"
                                        >
                                          <Check className="w-3 h-3" />
                                        </QuizButton>
                                        <QuizButton 
                                          variant="secondary" 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            cancelTimeEdit();
                                          }}
                                          className="p-1 h-6 w-6"
                                        >
                                          <X className="w-3 h-3" />
                                        </QuizButton>
                                      </div>
                                    ) : (
                                      <div 
                                        className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingTime(question.id, currentTimeLimit);
                                        }}
                                      >
                                        <Clock className="w-3 h-3 text-white/70" />
                                        <span className="text-xs text-white/70">{currentTimeLimit}s</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-1 mb-2 cursor-pointer" onClick={() => toggleQuestionSelection(question)}>
                                  {question.options.map((option, index) => (
                                    <p key={index} className={`text-xs sm:text-sm break-words ${
                                      index === question.correctAnswer ? 'text-green-300 font-medium' : 'text-white/70'
                                    }`}>
                                      {String.fromCharCode(65 + index)}) {option}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-xs text-purple-300 font-medium cursor-pointer" onClick={() => toggleQuestionSelection(question)}>
                                  {question.category}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog para Nova Pergunta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Criar Nova Pergunta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Pergunta</label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                className="w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base min-h-[60px] sm:min-h-[80px]"
                rows={2}
                placeholder="Digite sua pergunta..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Opções de Resposta</label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex flex-col gap-2 mb-3">
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 w-6 h-8 sm:w-8 sm:h-10 bg-gray-100 rounded flex items-center justify-center text-xs sm:text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                      className="flex-1 p-2 border rounded text-sm sm:text-base"
                      placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                  <div className="flex items-center justify-start pl-8 sm:pl-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                        className="text-blue-600"
                      />
                      <span className="text-xs sm:text-sm text-gray-600">Resposta Correta</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Categoria</label>
              <input
                type="text"
                value={newQuestion.category}
                onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                className="w-full p-2 border rounded text-sm sm:text-base"
                placeholder="Ex: Contabilidade - Custos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 sm:mb-2">Tempo Limite (segundos)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={newQuestion.timeLimit}
                  onChange={(e) => setNewQuestion({...newQuestion, timeLimit: Number(e.target.value)})}
                  className="w-full sm:w-24 p-2 border rounded text-sm sm:text-base"
                />
                <span className="text-xs sm:text-sm text-gray-500">Entre 10 e 120 segundos</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 sm:pt-4">
              <QuizButton variant="secondary" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </QuizButton>
              <QuizButton onClick={handleAddQuestion} className="w-full sm:w-auto">
                Adicionar Pergunta
              </QuizButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
