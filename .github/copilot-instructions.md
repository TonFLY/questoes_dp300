<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Site de Questões DP-300

Este é um projeto React com Firebase para estudos da certificação DP-300 da Microsoft.

## Tecnologias utilizadas:
- React com Vite
- Firebase (Authentication, Firestore, Hosting)
- TailwindCSS para estilização
- React Router para navegação

## Estrutura do projeto:
- `/src/components` - Componentes reutilizáveis
- `/src/pages` - Páginas da aplicação
- `/src/services` - Serviços do Firebase
- `/src/contexts` - Contextos React
- `/src/hooks` - Hooks customizados

## Funcionalidades:
- Sistema de autenticação com Firebase
- Dashboard com estatísticas do usuário
- Sistema de questões com múltiplas alternativas
- CRUD de questões para usuários logados
- Filtros por idioma, tags e status
- Sistema de respostas salvo no Firestore

## Padrões de código:
- Use componentes funcionais com hooks
- Mantenha a tipagem implícita do JavaScript
- Use TailwindCSS para estilização
- Organize imports: React, bibliotecas, componentes locais
- Use async/await para operações assíncronas
