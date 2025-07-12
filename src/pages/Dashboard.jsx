import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PageTitle } from '../components/PageTitle';
import { ShareApp } from '../components/ShareApp';
import { ForumLinks } from '../components/ForumLinks';

// Importar utilitário de limpeza
import { limpezaCompleta } from '../utils/limpeza';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    accuracy: 0
  });
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expor função de limpeza no console para emergências
  useEffect(() => {
    if (currentUser) {
      window.limparDadosUsuario = () => limpezaCompleta(currentUser.uid);
    }
  }, [currentUser]);

  // Função para navegar para uma questão específica
  const goToSpecificQuestion = (questionId) => {
    // Redirecionar para página de questões com parâmetro para questão específica
    window.location.href = `/questoes?goto=${questionId}`;
  };

  useEffect(() => {
    async function loadUserStats() {
      if (!currentUser) return;

      try {
        // Buscar histórico de tentativas do usuário (todas as respostas)
        const attemptsRef = collection(db, 'usuarios', currentUser.uid, 'tentativas');
        const attemptsSnapshot = await getDocs(attemptsRef);
        
        // Buscar respostas únicas (para questões erradas)
        const answersRef = collection(db, 'usuarios', currentUser.uid, 'respostas');
        const answersSnapshot = await getDocs(answersRef);
        
        let correct = 0;
        let wrong = 0;
        
        // Contar tentativas corretas/incorretas
        attemptsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.correct) {
            correct++;
          } else {
            wrong++;
          }
        });

        const total = correct + wrong;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;

        // Coletar questões erradas para revisão
        const wrongQuestionsList = [];
        answersSnapshot.forEach(doc => {
          const data = doc.data();
          if (!data.correct) {
            wrongQuestionsList.push({
              id: doc.id,
              questionId: data.questionId,
              questionText: data.questionText,
              selectedAnswer: data.selectedAnswer,
              correctAnswer: data.correctAnswer,
              timestamp: data.timestamp
            });
          }
        });

        // Ordenar por timestamp mais recente
        wrongQuestionsList.sort((a, b) => {
          const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return timestampB - timestampA;
        });

        setStats({
          totalQuestions: total,
          correctAnswers: correct,
          wrongAnswers: wrong,
          accuracy: accuracy
        });

        setWrongQuestions(wrongQuestionsList);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setLoading(false);
      }
    }

    loadUserStats();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <PageTitle title="DP-300 | Dashboard" />
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <div className="dashboard-nav">
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">Bem-vindo, {currentUser?.displayName || currentUser?.email}!</p>
            </div>
            <div className="nav-actions">
              <button
                onClick={() => window.location.href = '/questoes'}
                className="btn btn-primary"
              >
                Resolver Questões
              </button>
              
              <button
                onClick={() => window.location.href = '/admin'}
                className="btn btn-secondary"
              >
                Criar Questões
              </button>
              
              <ShareApp />
              
              <button
                onClick={logout}
                className="btn btn-secondary"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <PageTitle title="Dashboard" />

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon primary">
                <span>📚</span>
              </div>
              <div className="stat-info">
                <p className="stat-label">Total de Tentativas</p>
                <p className="stat-value">{stats.totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon success">
                <span>✅</span>
              </div>
              <div className="stat-info">
                <p className="stat-label">Acertos</p>
                <p className="stat-value">{stats.correctAnswers}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon error">
                <span>❌</span>
              </div>
              <div className="stat-info">
                <p className="stat-label">Erros</p>
                <p className="stat-value">{stats.wrongAnswers}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon info">
                <span>📊</span>
              </div>
              <div className="stat-info">
                <p className="stat-label">Taxa de Acerto</p>
                <p className="stat-value">{stats.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wrong Questions Review */}
        {wrongQuestions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center">
                <span className="dashboard-icon">🕒</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Questões para Revisão ({wrongQuestions.length})
                </h2>
              </div>
            </div>
            
            <div className="card-body">
              <div className="space-y-4">
                {wrongQuestions.slice(0, 5).map((question, index) => (
                  <button 
                    key={question.id} 
                    onClick={() => goToSpecificQuestion(question.questionId)}
                    className="question-review-item clickable"
                  >
                    <p className="question-number">Questão {index + 1}</p>
                    <p className="question-text">{question.questionText || 'Questão sem texto'}</p>
                    <p className="question-result">
                      Sua resposta: {Array.isArray(question.selectedAnswer) ? question.selectedAnswer.join(', ') : question.selectedAnswer} | 
                      Correta: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                    </p>
                    <div className="review-action">
                      <span className="action-hint">Clique para revisar →</span>
                    </div>
                  </button>
                ))}
                
                {wrongQuestions.length > 5 && (
                  <button 
                    onClick={() => window.location.href = '/revisao'}
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    Ver todas as {wrongQuestions.length} questões para revisão →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="actions-grid">
          <button 
            onClick={() => window.location.href = '/questoes'}
            className="action-card"
          >
            <span className="action-icon">📚</span>
            <h3 className="action-title">Resolver Questões</h3>
            <p className="action-description">Pratique com questões da certificação DP-300</p>
          </button>

          <button 
            onClick={() => window.location.href = '/videoaulas'}
            className="action-card"
          >
            <span className="action-icon">🎥</span>
            <h3 className="action-title">Videoaulas</h3>
            <p className="action-description">Assista videoaulas para aprofundar seus conhecimentos</p>
          </button>

          <button 
            onClick={() => window.location.href = '/revisao'}
            className="action-card"
          >
            <span className="action-icon">�</span>
            <h3 className="action-title">Revisar Erros</h3>
            <p className="action-description">Revise questões que você errou anteriormente</p>
          </button>
        </div>

        {/* Forum de Links */}
        <div className="forum-section">
          <ForumLinks />
        </div>
      </main>
    </div>
  );
}
