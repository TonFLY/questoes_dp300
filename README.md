# Site de Questões DP-300

Sistema de estudos para a certificação DP-30  email: "usuario@exemplo.com",
  displayName: "Nome do Usuário",
  createdAt: timestamp,
  totalQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0crosoft, construído com React e Firebase.

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Roteamento**: React Router DOM
- **Ícones**: Heroicons

## 📋 Funcionalidades

- ✅ Sistema de autenticação (email/senha e Google)
- ✅ Dashboard com estatísticas do usuário
- ✅ Perfil de usuário personalizado
- 🔄 Sistema de questões com múltiplas alternativas (em desenvolvimento)
- 🔄 CRUD de questões para usuários logados
- 🔄 Filtros por idioma, tags e status (em desenvolvimento)
- 🔄 Sistema de revisão de erros (em desenvolvimento)

## 🛠️ Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd site_questoes
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Email/Senha e Google)
3. Crie um banco Firestore
4. Copie as configurações do projeto

### 4. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações do Firebase
```

### 5. Execute o projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🔒 Estrutura do Banco de Dados

### Coleções Firestore

#### `usuarios/{uid}`
```javascript
{
  email: "usuario@email.com",
  displayName: "Nome do Usuário",
  admin: false,
  createdAt: timestamp,
  totalQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0
}
```

#### `usuarios/{uid}/respostas/{questionId}`
```javascript
{
  questionId: "id_da_questao",
  selectedAnswer: "A",
  correctAnswer: "B",
  correct: false,
  answeredAt: timestamp,
  questionText: "Texto da questão..."
}
```

#### `questoes/{questionId}`
```javascript
{
  enunciado: "Pergunta da questão...",
  alternativas: {
    A: "Primeira alternativa",
    B: "Segunda alternativa",
    C: "Terceira alternativa",
    D: "Quarta alternativa"
  },
  respostaCorreta: "B",
  explicacao: "Explicação da resposta...",
  idioma: "pt-br", // pt-br, traduzida, en
  tags: ["Backup", "Alta Disponibilidade"],
  createdAt: timestamp,
  createdBy: "uid_do_admin"
}
```

## 🔐 Regras de Segurança

As regras do Firestore estão configuradas para:
- Usuários só podem acessar seus próprios dados
- Usuários autenticados podem criar/editar questões
- Todos os usuários autenticados podem ler questões

## 🚀 Deploy

Para fazer deploy no Firebase Hosting:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (se necessário)
firebase init

# Build e deploy
npm run build
firebase deploy
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de interface
│   └── AuthProvider.jsx
├── contexts/           # Contextos React
│   └── AuthContext.js
├── hooks/              # Hooks customizados
│   └── useAuth.js
├── pages/              # Páginas da aplicação
│   ├── Login.jsx
│   ├── Cadastro.jsx
│   └── Dashboard.jsx
├── services/           # Serviços externos
│   └── firebase.js
├── App.jsx
└── main.jsx
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
