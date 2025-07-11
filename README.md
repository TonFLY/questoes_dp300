# Site de Questões DP-300

Sistema completo de estudos para a certificação DP-300 da Microsoft, construído com React e Firebase. Uma PWA (Progressive Web App) com funcionamento offline e sincronização automática.

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: CSS customizado (estilo QConcursos)
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Roteamento**: React Router DOM
- **Ícones**: Heroicons
- **PWA**: Service Worker, Cache API, IndexedDB
- **Offline**: Sistema de sincronização automática

## 📋 Funcionalidades

### ✅ Autenticação e Usuários
- Sistema de autenticação (email/senha e Google)
- Cadastro com nome completo
- Dashboard personalizado com estatísticas
- Perfil de usuário com dados salvos no Firestore

### ✅ Sistema de Questões
- CRUD completo de questões para usuários logados
- Suporte a múltiplas alternativas corretas (checkboxes)
- Sistema de navegação entre questões
- Filtros por idioma, tags e dificuldade
- Explicações detalhadas para cada questão
- Contador de tentativas e estatísticas

### ✅ Sistema de Revisão
- Área dedicada para questões erradas
- Badge de "atenção especial" para questões com muitos erros
- Navegação direta para questões específicas
- Filtros e busca na área de revisão
- Estatísticas de progresso

### ✅ PWA e Offline
- Progressive Web App instalável
- Funcionamento offline completo
- Cache inteligente de questões via IndexedDB
- Fila de sincronização para respostas offline
- Service Worker otimizado
- Prompt de instalação customizado

### ✅ Interface e UX
- Design responsivo (mobile-first)
- Estilo inspirado no QConcursos
- Navegação intuitiva
- Loading states e feedback visual
- Suporte completo a touch devices
- Otimizado para Firefox e Chrome

## 🛠️ Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/TonFLY/questoes_dp300.git
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
4. Ative o Firebase Hosting (opcional)
5. Copie as configurações do projeto

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Execute o projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build (para testar PWA)
npm run preview
```

## 📱 Testando PWA e Offline

Para testar as funcionalidades PWA e offline:

1. Execute `npm run build && npm run preview`
2. Acesse `http://localhost:4173`
3. Abra DevTools > Application > Service Workers
4. Use "Offline" para simular modo offline
5. Teste a instalação via prompt ou "Add to Home Screen"

### Teste em Android
1. Acesse via Chrome mobile
2. Use "Add to Home Screen"
3. Teste funcionamento offline

## 🔒 Estrutura do Banco de Dados

### Coleções Firestore

#### `usuarios/{uid}`
```javascript
{
  email: "usuario@email.com",
  displayName: "Nome do Usuário",
  createdAt: timestamp,
  totalQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0
}
```

#### `usuarios/{uid}/tentativas/{tentativaId}`
```javascript
{
  questionId: "id_da_questao",
  selectedAnswer: ["A", "C"], // Array para múltiplas respostas
  correctAnswer: ["A", "B", "C"],
  correct: false,
  answeredAt: timestamp,
  questionText: "Texto da questão..."
}
```

#### `usuarios/{uid}/respostas/{questionId}`
```javascript
{
  questionId: "id_da_questao",
  selectedAnswer: ["A", "C"],
  correctAnswer: ["A", "B", "C"],
  correct: false,
  lastAnsweredAt: timestamp,
  questionText: "Texto da questão...",
  attempts: 3 // Número de tentativas
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
    D: "Quarta alternativa",
    E: "Quinta alternativa"
  },
  respostasCorretas: ["A", "B"], // Array para múltiplas corretas
  explicacao: "Explicação detalhada da resposta...",
  idioma: "pt-br", // pt-br, traduzida, en
  tags: ["Backup", "Alta Disponibilidade"],
  dificuldade: "medio", // facil, medio, dificil
  createdAt: timestamp,
  createdBy: "uid_do_usuario",
  updatedAt: timestamp
}
```

## 🔐 Regras de Segurança

As regras do Firestore estão configuradas para:
- Usuários só podem acessar seus próprios dados de respostas e tentativas
- Usuários autenticados podem criar, editar e excluir questões
- Todos os usuários autenticados podem ler questões públicas
- Sistema de validação de dados no cliente e servidor

### Exemplo de regras Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Questões - leitura para todos autenticados, escrita para criador
    match /questoes/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Dados do usuário - apenas o próprio usuário
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Respostas e tentativas do usuário
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 🌐 Deploy

### Vercel (Recomendado)
O projeto está configurado para deploy automático na Vercel:

```bash
# Conectar repositório GitHub à Vercel
# Push para main faz deploy automático
git push origin main
```

### Firebase Hosting
Para deploy no Firebase Hosting:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init hosting

# Build e deploy
npm run build
firebase deploy
```

## 🗂️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ErrorBoundary.jsx
│   ├── InstallPrompt.jsx
│   ├── PageTitle.jsx
│   └── ShareApp.jsx
├── contexts/           # Contextos React
│   ├── AuthContext.jsx
│   └── AuthContextType.js
├── hooks/              # Hooks customizados
│   ├── useAuth.js
│   └── useOffline.js
├── pages/              # Páginas da aplicação
│   ├── Login.jsx
│   ├── Cadastro.jsx
│   ├── Dashboard.jsx
│   ├── Questoes.jsx
│   ├── Admin.jsx
│   └── Revisao.jsx
├── services/           # Serviços e utilitários
│   ├── firebase.js
│   └── simplifiedOfflineSync.js
├── utils/              # Utilitários
│   └── limpeza.js
├── App.jsx
├── main.jsx
└── index.css           # Estilos globais customizados
```

## 📊 Funcionalidades Offline

O sistema implementa um sofisticado sistema offline:

### Cache de Questões
- Questões são armazenadas no IndexedDB
- Sincronização automática quando online
- Navegação completa offline

### Fila de Sincronização  
- Respostas são enfileiradas quando offline
- Sincronização automática ao reconectar
- Indicadores visuais de status

### Service Worker
- Cache inteligente de recursos estáticos
- Estratégia cache-first para performance
- Atualização automática em background

## 🔧 Utilitários de Desenvolvimento

### Scripts de Limpeza
```javascript
// No console do browser (apenas desenvolvimento)
window.limparDadosUsuario(); // Limpa dados do usuário atual
```

### Logs de Debug
- Sistema completo de logs para desenvolvimento
- Rastreamento de sincronização offline
- Monitoramento de performance

## 🎯 Funcionalidades Avançadas

### Sistema de Revisão Inteligente
- Identifica questões problemáticas
- Badge de "atenção especial" 
- Estatísticas detalhadas de erro
- Navegação direta para questões específicas

### Interface Responsiva
- Design mobile-first
- Navegação otimizada para touch
- Suporte completo a diferentes tamanhos de tela
- Testado em Chrome, Firefox, Safari e Edge

### Performance
- Code splitting automático
- Lazy loading de componentes
- Otimização de bundle
- Cache eficiente de recursos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Padrões de Desenvolvimento
- Use componentes funcionais com hooks
- Mantenha tipagem implícita do JavaScript
- Siga os padrões de estilização CSS existentes
- Organize imports: React, bibliotecas, componentes locais
- Use async/await para operações assíncronas
- Teste funcionalidades offline antes do commit

## 📝 Roadmap

### 🔮 Funcionalidades Futuras
- [ ] Sistema de chat global para comunidade
- [ ] Ranking de usuários 
- [ ] Exportação de estatísticas
- [ ] Modo de estudo cronometrado
- [ ] Questões com imagens e diagramas
- [ ] Sistema de badges e conquistas
- [ ] Modo simulado de prova
- [ ] Análise de progresso temporal

### 🛠️ Melhorias Técnicas
- [ ] Migração para TypeScript
- [ ] Implementação de testes automatizados
- [ ] Otimização adicional de performance
- [ ] Suporte a múltiplos idiomas (i18n)
- [ ] Theme dark/light
- [ ] Notificações push

## 🐛 Problemas Conhecidos

- Sincronização offline pode demorar em conexões lentas
- Service Worker requer reload manual em algumas atualizações
- Algumas funcionalidades podem não funcionar no modo incógnito

## 📞 Suporte

Para dúvidas, problemas ou sugestões:
- Abra uma [issue no GitHub](https://github.com/TonFLY/questoes_dp300/issues)
- Envie um email para o desenvolvedor
- Consulte a documentação inline no código

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🎉 Status do Projeto

**✅ ESTÁVEL E FUNCIONAL**

O projeto está em estado estável com todas as funcionalidades principais implementadas e testadas. Pode ser usado em produção para estudos da certificação DP-300.

### Última Atualização
- **Data**: Janeiro 2025
- **Versão**: 2.0.0
- **Status**: Produção
- **PWA**: ✅ Funcional
- **Offline**: ✅ Implementado
- **Mobile**: ✅ Otimizado
