console.log('📱 App.jsx carregado');

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { useAuth } from './hooks/useAuth';
import { InstallPrompt } from './components/InstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Questoes from './pages/Questoes';
import Admin from './pages/Admin';
import Revisao from './pages/Revisao';

console.log('📦 App: Dependências importadas');

// Importar utilitários de limpeza para desenvolvimento (comentado para evitar problemas)
// import './utils/limpeza-revisao.js';

// Componente para proteger rotas
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

// Componente para redirecionar usuários logados
function PublicRoute({ children }) {
function AppRoutes() {
  console.log('🗺️ AppRoutes renderizando');
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/cadastro" element={
        <PublicRoute>
          <Cadastro />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      {/* Rotas futuras */}
      <Route path="/questoes" element={
        <ProtectedRoute>
          <Questoes />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/revisao" element={
        <ProtectedRoute>
          <Revisao />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  console.log('🎯 App component renderizando');
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <InstallPrompt />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}       </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
