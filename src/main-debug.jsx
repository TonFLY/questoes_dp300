// Debug para tela branca
console.log('🚀 Main.jsx carregado');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('📦 Dependências importadas');

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado com sucesso: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW falhou ao registrar: ', registrationError);
      });
  });
}

console.log('🎯 Criando root element');

const rootElement = document.getElementById('root');
console.log('🔍 Root element:', rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log('✅ Root criado, renderizando App...');
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  
  console.log('🎉 App renderizado!');
} else {
  console.error('❌ Root element não encontrado!');
}

console.log('🏁 Main.jsx executado completamente');
