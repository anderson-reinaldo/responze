// Configurações para ambiente de produção
export const config = {
  // Configurações de atualização do ranking
  ranking: {
    // Intervalo de atualização automática (em ms)
    refetchInterval: 10000, // 10 segundos
    // Tempo que os dados são considerados "frescos" (em ms)
    staleTime: 5000, // 5 segundos
    // Número de tentativas em caso de erro
    retryAttempts: 3,
  },

  // Configurações do quiz
  quiz: {
    // Tempo por pergunta (em segundos)
    timePerQuestion: 40,
    // Número de perguntas por quiz
    questionsPerQuiz: 5,
    // Delay para mostrar resultado da pergunta (em ms)
    answerRevealDelay: 2000,
  },

  // Configurações de notificações
  notifications: {
    // Duração das notificações (em ms)
    successDuration: 4000,
    infoDuration: 3000,
    errorDuration: 5000,
    // Habilitar notificações em tempo real
    enableRealtimeNotifications: true,
  },

  // Configurações de API
  api: {
    // Delay simulado de rede (em ms) - para desenvolvimento
    networkDelay: {
      min: 200,
      max: 500,
    },
    // Timeout para requests (em ms)
    timeout: 10000,
  },

  // Configurações de produção
  production: {
    // Habilitar logs de debug
    enableDebugLogs: false,
    // Habilitar painel de admin
    enableAdminPanel: true,
    // Backup automático dos dados
    enableAutoBackup: true,
    // Intervalo de backup automático (em ms)
    autoBackupInterval: 300000, // 5 minutos
  },

  // Configurações de UI
  ui: {
    // Máximo de grupos exibidos no ranking sem scroll
    maxVisibleGroups: 10,
    // Habilitar animações
    enableAnimations: true,
    // Tema padrão
    defaultTheme: 'dark',
  },
} as const;

// Função para verificar se está em ambiente de desenvolvimento
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

// Função para verificar se está em ambiente de produção
export const isProduction = () => {
  return import.meta.env.PROD;
};

// Função para obter configuração baseada no ambiente
export const getConfig = () => {
  if (isDevelopment()) {
    return {
      ...config,
      production: {
        ...config.production,
        enableDebugLogs: true,
      },
      api: {
        ...config.api,
        networkDelay: {
          min: 100,
          max: 200,
        },
      },
    };
  }
  
  return config;
};
