# 🎯 Responze - Sistema de Quiz Interativo

![Responze Banner](https://via.placeholder.com/800x200/6366f1/ffffff?text=RESPONZE+-+Quiz+System)

## 📋 Descrição

O **Responze** é um sistema completo de quiz interativo desenvolvido para competições em grupo. Oferece uma experiência gamificada com interface moderna, ranking em tempo real, confete para celebrações e painel administrativo robusto.

## ✨ Funcionalidades Principais

### 🎮 **Sistema de Quiz**
- ✅ Quiz interativo com múltiplas escolhas (A, B, C, D)
- ⏱️ Tempo configurável por pergunta (10-120 segundos)
- 🎯 Feedback visual imediato (verde para correto, vermelho para incorreto)
- 📊 Sistema de pontuação em tempo real
- 🏆 Ranking automático dos participantes

### 👥 **Modo Grupo**
- 👨‍👩‍👧‍👦 Suporte para grupos/equipes
- 🔤 Validação de nome (apenas letras maiúsculas e números)
- 📝 Persistência de dados no backend
- 🔄 Sincronização em tempo real

### 🎨 **Interface Moderna**
- 🌈 Design glassmorphism com gradientes
- 📱 **Totalmente responsivo** (mobile-first)
- 🎆 **Confete automático** para boas pontuações
- ⚡ Animações fluidas e transições suaves
- 🎭 Tema gaming profissional

### 🏆 **Sistema de Ranking**
- 🥇 Pódio visual para top 3
- 📊 Lista completa de classificação
- 🔄 Atualização automática a cada 10 segundos
- 👑 Indicadores visuais especiais para o primeiro lugar

### ⚙️ **Painel Administrativo**
- 🔐 **Autenticação segura**
- 📝 **Gestão completa de perguntas**:
  - ➕ Adicionar perguntas personalizadas
  - ✏️ Editar perguntas existentes
  - ⏰ Configurar tempo individual por pergunta
  - 🗂️ Organizar por categorias
- 🎯 **Configuração de quiz**:
  - 📋 13 perguntas pré-definidas de qualidade
  - ✅ Seleção de perguntas ativas
  - ⚡ Preview em tempo real
- 📊 **Monitoramento**:
  - 👀 Visualização de sessões ativas
  - 📈 Estatísticas de participação

## 🛠️ Tecnologias

### **Frontend**
- ⚛️ **React 18** com TypeScript
- ⚡ **Vite** para build ultrarrápido
- 🎨 **Tailwind CSS** para estilização
- 🔄 **React Query** para gerenciamento de estado
- 🧩 **Shadcn/ui** para componentes
- 📊 **Recharts** para gráficos
- 🎉 **Confetti** para celebrações

### **Backend**
- 🟢 **Node.js** com Express
- 📁 **Sistema de arquivos JSON** para persistência
- 🔄 **API RESTful** completa
- 🌐 **CORS** configurado
- 📝 **Logging** detalhado

### **DevOps**
- 📦 **Bun** como package manager
- 🔧 **ESLint** para qualidade de código
- 📱 **PostCSS** para otimização CSS
- 🏗️ **Build otimizado** para produção

## 🚀 Instalação e Execução

### **Pré-requisitos**
- Node.js 18+ ou Bun
- Git

### **1. Clone o repositório**
```bash
git clone https://github.com/anderson-reinaldo/responze.git
cd responze
```

### **2. Instale as dependências**
```bash
# Com Bun (recomendado)
bun install

# Ou com npm
npm install
```

### **3. Execute o servidor backend**
```bash
# Terminal 1
cd server
node server.js
```

### **4. Execute o frontend**
```bash
# Terminal 2
bun run dev
# ou
npm run dev
```

### **5. Acesse a aplicação**
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 📱 Como Usar

### **Para Participantes**

1. **🏠 Acesse a tela inicial**
2. **✍️ Digite o nome do grupo** (ex: GRUPO A1, EQUIPE 2024)
3. **🎯 Clique em "Jogar Agora"**
4. **❓ Responda as perguntas** dentro do tempo limite
5. **🏆 Visualize sua pontuação** e posição no ranking

### **Para Administradores**

1. **⚙️ Clique no ícone de configurações** (canto superior direito)
2. **🔐 Digite a senha**: `1545`
3. **📋 Gerencie perguntas**:
   - Selecione perguntas pré-definidas
   - Adicione perguntas personalizadas
   - Configure tempo por pergunta
4. **💾 Salve as configurações**
5. **🎮 Inicie quiz personalizado** (opcional)

## 🎯 Funcionalidades Avançadas

### **🎆 Sistema de Celebração**
- Confete automático para pontuações > 50%
- Emojis dinâmicos baseados na performance
- Animações especiais para o pódio

### **⏰ Gestão de Tempo**
- Tempo padrão: 40 segundos por pergunta
- Configuração individual por pergunta
- Indicador visual quando restam ≤ 10 segundos
- Timer com cores dinâmicas

### **📊 Persistência de Dados**
- **`players.json`**: Histórico completo de jogadores
- **`sessions.json`**: Registro de todas as sessões
- **`quiz-config.json`**: Configurações e perguntas personalizadas

### **🔄 Sincronização Real-time**
- Ranking atualizado automaticamente
- Notificações de novos participantes
- Estado sincronizado entre sessões

## 📁 Estrutura do Projeto

```
responze/
├── 📂 src/
│   ├── 📂 components/         # Componentes React
│   │   ├── 🎮 QuizGame.tsx   # Jogo principal
│   │   ├── 🏆 Podium.tsx     # Tela inicial e ranking
│   │   ├── ⚙️ QuizConfig.tsx # Painel admin
│   │   └── 🧩 ui/            # Componentes base
│   ├── 📂 hooks/             # Hooks customizados
│   ├── 📂 lib/               # Utilitários
│   └── 📂 pages/             # Páginas principais
├── 📂 server/                # Backend Node.js
│   ├── 📄 server.js          # Servidor principal
│   └── 📂 data/              # Arquivos JSON
├── 📄 package.json           # Dependências
├── 📄 tailwind.config.ts     # Configuração Tailwind
└── 📄 vite.config.ts         # Configuração Vite
```

## 🎨 Design System

### **🌈 Paleta de Cores**
- **Primária**: Gradientes azul/roxo/rosa
- **Sucesso**: Verde esmeralda
- **Erro**: Vermelho/rosa
- **Aviso**: Amarelo/laranja
- **Background**: Glassmorphism com blur

### **📏 Componentes Responsivos**
- **Mobile First**: Otimizado para dispositivos móveis
- **Breakpoints**: `sm:`, `md:`, `lg:` do Tailwind
- **Touch Friendly**: Botões com tamanho adequado
- **Texto Adaptativo**: Fontes que se ajustam à tela

## 🔧 Configuração Avançada

### **⚙️ Variáveis de Ambiente**
```env
# Backend
PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=http://localhost:3001
```

### **🎯 Personalização de Perguntas**
```json
{
  "id": 1,
  "question": "Qual é a capital do Brasil?",
  "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "correctAnswer": 2,
  "category": "Geografia",
  "timeLimit": 30
}
```

## 🚀 Deploy em Produção

### **📦 Build**
```bash
# Frontend
bun run build

# Backend (copie server/ para o servidor)
```

### **🌐 Nginx (exemplo)**
```nginx
server {
    listen 80;
    server_name seudominio.com;
    
    # Frontend
    location / {
        root /var/www/responze/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🤝 Contribuição

1. **🍴 Faça um fork** do projeto
2. **🌿 Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **💾 Commit suas mudanças** (`git commit -m 'Add some AmazingFeature'`)
4. **📤 Push para a branch** (`git push origin feature/AmazingFeature`)
5. **🔄 Abra um Pull Request**

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Anderson Reinaldo**
- 🐙 GitHub: [@anderson-reinaldo](https://github.com/anderson-reinaldo)
- 💼 LinkedIn: [Anderson Reinaldo](http://www.linkedin.com/in/dev-anderson-reinaldo)
- 📸 Instagram: [@dev.reinaldo](https://www.instagram.com/dev.reinaldo/)

## 🙏 Agradecimentos

- 🎨 Inspiração no design de aplicativos de quiz modernos
- 🧩 Comunidade React e Tailwind CSS
- 🎯 Feedback dos usuários beta
- ⚡ Ecossistema Vite pela velocidade de desenvolvimento

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

**🔗 Conecte-se comigo:**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/anderson-reinaldo)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](http://www.linkedin.com/in/dev-anderson-reinaldo)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/dev.reinaldo/)

Made with ❤️ and ⚛️ React

</div>
