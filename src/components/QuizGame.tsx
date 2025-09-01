import { useState, useEffect } from "react";
import { Clock, ArrowLeft, Brain } from "lucide-react";
import { QuizButton } from "@/components/ui/quiz-button";
import { Progress } from "@/components/ui/progress";
import { Confetti } from "@/components/Confetti";
import { useUpdateSessionScore } from "@/hooks/useQuizAPI";
import { getConfig } from "@/lib/config";
import logoImage from "@/assets/logo.png";

const config = getConfig();

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category?: string;
  timeLimit?: number; // Tempo em segundos (padrão: 60)
}

interface QuizGameProps {
  sessionId: string;
  customQuestions?: Question[];
  onFinish: (score: number, groupName: string) => void;
  onBack: () => void;
  isGroupMode?: boolean;
}

export const QuizGame = ({ sessionId, customQuestions, onFinish, onBack, isGroupMode }: QuizGameProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(config.quiz.timePerQuestion); // Será atualizado com o timeLimit da primeira pergunta
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groupName, setGroupName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Hook para atualizar score da sessão
  const updateScoreMutation = useUpdateSessionScore();

  // Sample questions - using all questions from quiz.json
  const sampleQuestions: Question[] = [
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
      timeLimit: 60
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
      category: "Contabilidade - CPC",
      timeLimit: 60
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
      category: "Contabilidade - PEPS",
      timeLimit: 90
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
      category: "Contabilidade - Inventário",
      timeLimit: 60
    },
    {
      id: 5,
      question: "Custos fixos aumentaram, mas o custo direto permanece:",
      options: ["Maior", "Menor", "Depende do preço de venda", "Inalterado"],
      correctAnswer: 3,
      category: "Contabilidade - Custos",
      timeLimit: 45
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
      category: "Gestão - Margem de Contribuição",
      timeLimit: 60
    },
    {
      id: 7,
      question: "Estoque inicial: 200 unid. a R$ 15,00.\nCompra: 100 unid. a R$ 18,00.\nVenda: 150 unid.\nQual o CMV pela média ponderada?",
      options: ["R$ 2.200,00", "R$ 2.300,00", "R$ 2.400,00", "R$ 2.500,00"],
      correctAnswer: 2,
      category: "Contabilidade - Média Ponderada",
      timeLimit: 90
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
      category: "Contabilidade - UEPS",
      timeLimit: 60
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
      timeLimit: 60
    },
    {
      id: 10,
      question: "Qual demonstração contábil é diretamente influenciada pela escolha do custeio por absorção?",
      options: ["DRE", "Balanço Patrimonial", "Fluxo de Caixa", "Demonstração do Valor Adicionado"],
      correctAnswer: 0,
      category: "Contabilidade - Demonstrações",
      timeLimit: 60
    },
    {
      id: 11,
      question: "Estoque inicial: 50 unidades a R$ 20\nCompra 1: 70 unidades a R$ 22\nCompra 2: 30 unidades a R$ 25\nVenda: 80 unidades\n\nQual o CMV pelo UEPS?",
      options: ["R$ 1.850", "R$ 1.780", "R$ 1.800", "R$ 1.900"],
      correctAnswer: 0,
      category: "Contabilidade - UEPS",
      timeLimit: 90
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
      category: "Contabilidade - Avaliação de Estoques",
      timeLimit: 60
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
      category: "Gestão - Decisão Gerencial",
      timeLimit: 60
    }
  ];

  const generateQuestions = async () => {
    setIsLoading(true);
    
    // Debug: Log das perguntas recebidas
    console.log('Custom questions received:', customQuestions);
    
    // Se perguntas customizadas foram fornecidas (incluindo configuração global), usa elas
    if (customQuestions && customQuestions.length > 0) {
      console.log('Using custom questions:', customQuestions.length);
      setQuestions(customQuestions);
      setIsLoading(false);
      return;
    }
    
    // Se não há perguntas customizadas, usa perguntas padrão de contabilidade
    console.log('Using default questions:', sampleQuestions.length);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setQuestions(sampleQuestions);
    setIsLoading(false);
  };

  useEffect(() => {
    if (gameStarted && questions.length > 0 && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleNextQuestion();
    }
  }, [timeLeft, gameStarted, questions.length, showResult]);

  // Atualiza o timer quando as perguntas são carregadas ou a pergunta atual muda
  useEffect(() => {
    if (questions.length > 0) {
      const currentQ = questions[currentQuestion];
      setTimeLeft(currentQ?.timeLimit || config.quiz.timePerQuestion);
    }
  }, [questions, currentQuestion]);

  const handleStartGame = () => {
    if (isGroupMode && !groupName.trim()) {
      alert("Informe o nome do grupo para jogar!");
      return;
    }
    setGameStarted(true);
    generateQuestions();
  };

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas letras maiúsculas, números e espaços
    const filteredValue = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    setGroupName(filteredValue);
  };

  // Inicia automaticamente se já temos sessionId
  useEffect(() => {
    if (sessionId && !gameStarted) {
      setGameStarted(true);
      generateQuestions();
    }
  }, [sessionId, gameStarted]);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    
    const newScore = answerIndex === questions[currentQuestion].correctAnswer ? score + 1 : score;
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(newScore);
    }
    
    // Atualiza score na sessão apenas se não for modo customizado
    if (sessionId !== "custom") {
      updateScoreMutation.mutate({ 
        sessionId, 
        score: newScore 
      });
    }
    
    // Auto-advance after showing result
    setTimeout(() => {
      handleNextQuestion();
    }, config.quiz.answerRevealDelay);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      // Usa o timeLimit da próxima pergunta, ou a configuração padrão
      const nextQuestion = questions[currentQuestion + 1];
      setTimeLeft(nextQuestion?.timeLimit || config.quiz.timePerQuestion);
    } else {
      setShowResult(true);
      // Aguarda um pouco para garantir que o score foi atualizado
      setTimeout(() => {
        // Calcula o score atual considerando a última resposta
        let finalScore = score;
        if (selectedAnswer !== null && selectedAnswer === questions[currentQuestion].correctAnswer) {
          finalScore = score + 1;
        }
        
        // Mostra confetes se a pontuação for maior que 50%
        const percentage = (finalScore / questions.length) * 100;
        if (percentage > 50) {
          setShowConfetti(true);
          // Para os confetes após 4 segundos
          setTimeout(() => setShowConfetti(false), 4000);
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Component */}
      <Confetti active={showConfetti} duration={4000} particleCount={200} />
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-2xl"></div>
      
      {!gameStarted ? (
        <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-white/20 shadow-2xl max-w-md w-full animate-fade-in mx-4">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <img 
                src={logoImage} 
                alt="Responze Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2 sm:mb-3">Quiz Responze</h1>
            <p className="text-white/70 text-sm sm:text-lg">Teste seus conhecimentos</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2 sm:mb-3">
                {isGroupMode ? "Nome do grupo:" : "Como você gostaria de ser chamado?"}
              </label>
              <input
                type="text"
                placeholder={isGroupMode ? "GRUPO A1, EQUIPE 2024, etc." : "Digite seu nome"}
                value={groupName}
                onChange={handleGroupNameChange}
                className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm sm:text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
              />
              {isGroupMode && (
                <p className="text-white/50 text-xs sm:text-sm mt-2">Use apenas letras maiúsculas e números</p>
              )}
            </div>
            <QuizButton 
              onClick={handleStartGame}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg text-sm sm:text-base"
              disabled={!groupName.trim() || isLoading}
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Preparando perguntas...</span>
                  <span className="sm:hidden">Preparando...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 sm:gap-3">
                  Começar Quiz
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </span>
              )}
            </QuizButton>
            <QuizButton 
              onClick={onBack}
              variant="secondary"
              size="lg"
              className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white text-sm sm:text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Menu
            </QuizButton>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="relative z-10 text-center animate-fade-in">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="w-20 h-20 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-4">Preparando Quiz</h3>
            <p className="text-white/70 text-lg">Gerando perguntas inteligentes para você...</p>
          </div>
        </div>
      ) : showResult ? (
        <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-white/20 shadow-2xl max-w-2xl w-full animate-fade-in mx-3 sm:mx-0">
          <div className="text-center mb-6 sm:mb-10">
            <div className="mb-6 sm:mb-8">
              {score >= 4 ? (
                <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-bounce-in">🏆</div>
              ) : score >= 3 ? (
                <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-bounce-in">🥈</div>
              ) : score >= 2 ? (
                <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-bounce-in">🥉</div>
              ) : (
                <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-bounce-in">📚</div>
              )}
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 sm:mb-6">
                {score >= 4 ? "Excelente!" : score >= 3 ? "Muito Bom!" : score >= 2 ? "Bom!" : "Continue Tentando!"}
                {showConfetti && <span className="block text-lg sm:text-2xl mt-2 text-yellow-300">🎉 Parabéns! 🎉</span>}
              </h2>
              <p className="text-xl sm:text-3xl text-blue-300 font-bold mb-2 sm:mb-3 break-words">
                {groupName}
              </p>
              <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-8">
                Você acertou <span className="text-yellow-300 font-bold text-lg sm:text-2xl">{score}</span> de {questions.length} perguntas
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-10 border border-white/20">
              <p className="text-white/90 text-sm sm:text-lg mb-4 sm:mb-6 font-medium">Desempenho Final</p>
              <div className="relative">
                <Progress 
                  value={(score / questions.length) * 100} 
                  className="h-3 sm:h-4 mb-3 sm:mb-4"
                />
                <div className="flex justify-between text-xs sm:text-sm text-white/60">
                  <span>0%</span>
                  <span className="text-yellow-300 font-bold text-sm sm:text-lg">
                    {Math.round((score / questions.length) * 100)}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <QuizButton 
              onClick={() => onFinish(score, groupName)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg text-sm sm:text-base"
              size="lg"
            >
              Ver Ranking 🏆
            </QuizButton>
                        <QuizButton 
              onClick={() => {
                setCurrentQuestion(0);
                setScore(0);
                setSelectedAnswer(null);
                setShowResult(false);
                generateQuestions();
                // Usa o timeLimit da primeira pergunta
                const firstQuestion = questions[0];
                setTimeLeft(firstQuestion?.timeLimit || config.quiz.timePerQuestion);
              }}
              variant="secondary"
              size="lg"
              className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white text-sm sm:text-base"
            >
              Jogar Novamente
            </QuizButton>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="relative z-10 text-center animate-fade-in mx-3 sm:mx-0">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4 sm:mb-6"></div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Preparando Quiz</h3>
            <p className="text-white/70 text-sm sm:text-lg">Gerando perguntas inteligentes para você...</p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-4xl animate-fade-in px-3 sm:px-0">
          {/* Header with progress - Improved layout with group name */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-6 border border-white/20 shadow-xl">
            {/* Top row with group name and back button */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <QuizButton 
                  onClick={onBack}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-lg p-1.5 sm:p-2"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </QuizButton>
                
                <div>
                  <p className="text-white/60 text-xs font-medium">Grupo</p>
                  <p className="text-white font-bold text-sm sm:text-base break-words">{groupName}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-white/60 text-xs font-medium">Pontuação</p>
                <p className="text-lg sm:text-xl font-bold text-blue-300">{score} pts</p>
              </div>
            </div>
            
            {/* Bottom row with timer, progress and question info */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg transition-colors ${
                timeLeft <= 10 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              }`}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-bold text-xs sm:text-sm">{timeLeft}s</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-white/70 font-medium text-xs sm:text-sm">
                  Pergunta {currentQuestion + 1} de {questions.length}
                </span>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-12 sm:w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300"
                      style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-white/60 text-xs font-medium">
                    {Math.round(((currentQuestion) / questions.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-white/20 shadow-2xl">
            <div className="mb-6 sm:mb-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-500/20 text-blue-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-blue-500/30">
                  {questions[currentQuestion].category}
                </span>
              </div>
              
              <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 leading-relaxed break-words">
                {questions[currentQuestion].question}
              </h2>
            </div>
            
            <div className="grid gap-2 sm:gap-4">
              {questions[currentQuestion].options.map((option, index) => {
                const isCorrect = index === questions[currentQuestion].correctAnswer;
                const isSelected = selectedAnswer === index;
                const showResult = selectedAnswer !== null;
                
                let buttonClass = "w-full text-left justify-start p-3 sm:p-6 h-auto min-h-[3rem] sm:min-h-[4rem] group transition-all duration-300";
                let bgClass = "";
                let textClass = "text-white";
                let circleClass = "";
                
                if (!showResult) {
                  // Estado inicial - não respondido
                  bgClass = "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30";
                  circleClass = "bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30 border border-blue-500/30";
                } else if (isSelected && isCorrect) {
                  // Resposta selecionada e correta
                  bgClass = "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50";
                  circleClass = "bg-green-500 text-white border border-green-400";
                } else if (isSelected && !isCorrect) {
                  // Resposta selecionada e incorreta
                  bgClass = "bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/50";
                  circleClass = "bg-red-500 text-white border border-red-400";
                } else if (!isSelected && isCorrect) {
                  // Resposta correta não selecionada (mostrar a correta)
                  bgClass = "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30";
                  circleClass = "bg-green-500 text-white border border-green-400";
                } else {
                  // Outras opções quando já respondeu
                  bgClass = "bg-white/5 border border-white/10";
                  circleClass = "bg-white/10 text-white/50 border border-white/20";
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`${buttonClass} ${bgClass} ${textClass} rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl backdrop-blur-sm`}
                  >
                    <span className="flex items-center gap-3 sm:gap-6 w-full">
                      <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${circleClass}`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm sm:text-lg font-medium flex-1 text-left break-words">{option}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};