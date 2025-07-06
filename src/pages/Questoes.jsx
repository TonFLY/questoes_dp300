import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PageTitle } from '../components/PageTitle';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  HomeIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function Questoes() {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]); // Mudança: array para múltiplas seleções
  const [showResult, setShowResult] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false); // Estado para controle da navegação mobile

  const currentQuestion = questions[currentQuestionIndex];
  const isMultipleChoice = currentQuestion?.respostasCorretas && currentQuestion.respostasCorretas.length > 1;

  useEffect(() => {
    async function loadQuestionsOnMount() {
      try {
        setLoading(true);
        
        // Buscar questões
        const questionsRef = collection(db, 'questoes');
        const questionsSnapshot = await getDocs(questionsRef);
        
        const questionsData = [];
        questionsSnapshot.forEach(doc => {
          questionsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        if (questionsData.length === 0) {
          setError('Nenhuma questão encontrada. Entre em contato com o administrador.');
          return;
        }

        setQuestions(questionsData);

        // Buscar respostas do usuário
        if (currentUser) {
          const answersRef = collection(db, 'usuarios', currentUser.uid, 'respostas');
          const answersSnapshot = await getDocs(answersRef);
          
          const answersData = {};
          answersSnapshot.forEach(doc => {
            answersData[doc.id] = doc.data();
          });
          
          setUserAnswers(answersData);
        }

      } catch (error) {
        console.error('Erro ao carregar questões:', error);
        setError('Erro ao carregar questões. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    
    loadQuestionsOnMount();
  }, [currentUser]);

  useEffect(() => {
    if (currentQuestion) {
      // Carrega a resposta salva para a questão atual
      const savedAnswer = userAnswers[currentQuestion.id];
      if (savedAnswer) {
        // Converter resposta salva para array se necessário
        const savedAnswerArray = Array.isArray(savedAnswer.selectedAnswer) 
          ? savedAnswer.selectedAnswer 
          : [savedAnswer.selectedAnswer].filter(Boolean);
        setSelectedAnswers(savedAnswerArray);
        setShowResult(savedAnswer.answered || false);
      } else {
        setSelectedAnswers([]);
        setShowResult(false);
      }
      setShowComment(false);
    }
  }, [currentQuestionIndex, currentQuestion, userAnswers]);

  async function handleAnswerSubmit() {
    if (selectedAnswers.length === 0 || !currentQuestion) return;

    try {
      // Verificar se a resposta está correta (suporte a múltiplas respostas)
      let isCorrect = false;
      if (currentQuestion.respostasCorretas && currentQuestion.respostasCorretas.length > 0) {
        // Formato novo: múltiplas respostas corretas
        // Deve selecionar EXATAMENTE as respostas corretas (nem mais, nem menos)
        const correctAnswers = [...currentQuestion.respostasCorretas].sort();
        const userAnswers = [...selectedAnswers].sort();
        isCorrect = correctAnswers.length === userAnswers.length && 
                   correctAnswers.every((answer, index) => answer === userAnswers[index]);
      } else if (currentQuestion.respostaCorreta) {
        // Formato antigo: uma resposta correta
        isCorrect = selectedAnswers.length === 1 && selectedAnswers[0] === currentQuestion.respostaCorreta;
      }
      
      // Verificar se já existe resposta anterior para esta questão
      let existingAnswer = null;
      try {
        const existingDoc = await getDoc(doc(db, 'usuarios', currentUser.uid, 'respostas', currentQuestion.id));
        if (existingDoc.exists()) {
          existingAnswer = existingDoc.data();
        }
      } catch {
        // Documento não existe ainda
      }

      const answerData = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.enunciado,
        selectedAnswer: selectedAnswers,
        correctAnswer: currentQuestion.respostasCorretas || [currentQuestion.respostaCorreta],
        correct: isCorrect,
        answeredAt: new Date(),
        alternatives: currentQuestion.alternativas,
        // Incrementar contador de erros apenas se errou
        errorCount: !isCorrect ? (existingAnswer?.errorCount || 0) + 1 : 0
      };

      // Salvar tentativa no histórico (sempre salva, para contar todas as tentativas)
      const attemptData = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.enunciado,
        selectedAnswer: selectedAnswers,
        correctAnswer: currentQuestion.respostasCorretas || [currentQuestion.respostaCorreta],
        correct: isCorrect,
        answeredAt: new Date()
      };

      // Salvar tentativa no histórico com ID único baseado em timestamp
      const attemptId = `${currentQuestion.id}_${Date.now()}`;
      await setDoc(
        doc(db, 'usuarios', currentUser.uid, 'tentativas', attemptId),
        attemptData
      );

      // Salvar ou atualizar resposta única (para revisão)
      await setDoc(
        doc(db, 'usuarios', currentUser.uid, 'respostas', currentQuestion.id),
        answerData
      );

      // Atualizar estado local
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: { ...answerData, answered: true }
      }));

      setShowResult(true);

    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      setError('Erro ao salvar resposta. Tente novamente.');
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }

  function goToQuestion(index) {
    setCurrentQuestionIndex(index);
  }

  function resetCurrentQuestion() {
    setSelectedAnswers([]);
    setShowResult(false);
    setShowComment(false);
  }

  // Função para lidar com seleção de respostas (única ou múltipla)
  const handleAnswerSelection = (letter) => {
    if (showResult) return;
    
    if (isMultipleChoice) {
      // Múltipla escolha: toggle da seleção
      setSelectedAnswers(prev => {
        if (prev.includes(letter)) {
          return prev.filter(ans => ans !== letter);
        } else {
          return [...prev, letter];
        }
      });
    } else {
      // Escolha única: substituir seleção
      setSelectedAnswers([letter]);
    }
  };

  // Função para verificar se uma resposta está selecionada
  const isAnswerSelected = (letter) => {
    return selectedAnswers.includes(letter);
  };

  // Função para verificar se há respostas selecionadas
  const hasSelectedAnswers = () => {
    return selectedAnswers.length > 0;
  };

  // useEffect para gerenciar tecla ESC na navegação mobile
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showMobileNav) {
        setShowMobileNav(false);
      }
    };

    if (showMobileNav) {
      document.addEventListener('keydown', handleEscKey);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileNav]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">{error}</h2>
          <Link to="/dashboard" className="btn btn-primary">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">
            Nenhuma questão disponível
          </h2>
          <Link to="/dashboard" className="btn btn-primary">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="questions-layout">
      <PageTitle title="DP-300 | Questões" />
      {/* Header */}
      <header className="questions-header">
        <div className="container">
          <div className="questions-nav">
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              <HomeIcon className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            
            <div className="question-counter">
              <span className="text-sm text-gray-600">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </span>
            </div>

            <div className="question-status">
              {userAnswers[currentQuestion?.id]?.answered && (
                <span className={`status-badge ${userAnswers[currentQuestion.id].correct ? 'correct' : 'incorrect'}`}>
                  {userAnswers[currentQuestion.id].correct ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Correto
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="h-4 w-4" />
                      Incorreto
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="questions-container">
        <div className="questions-grid">
          {/* Sidebar com navegação */}
          <aside className="questions-sidebar">
            <div className="sidebar-content">
              <h3 className="sidebar-title">Navegação</h3>
              
              <div className="questions-list">
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  const isAnswered = userAnswer?.answered;
                  const isCorrect = userAnswer?.correct;
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      className={`question-nav-item ${isCurrent ? 'current' : ''} ${
                        isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered'
                      }`}
                    >
                      <span className="question-number">{index + 1}</span>
                      {isAnswered && (
                        <span className="question-status-icon">
                          {isCorrect ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <XMarkIcon className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="questions-main">
            {currentQuestion && (
              <div className="question-card">
                <div className="question-header">
                  <h2 className="question-title">Questão {currentQuestionIndex + 1}</h2>
                  {currentQuestion.tags && (
                    <div className="question-tags">
                      {currentQuestion.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="question-content">
                  <div className="question-statement">
                    <p>{currentQuestion.enunciado}</p>
                    {isMultipleChoice && (
                      <div className="multiple-choice-notice">
                        <span className="info-icon">ℹ️</span>
                        <span>Esta questão possui múltiplas respostas corretas. Selecione todas as alternativas corretas.</span>
                      </div>
                    )}
                  </div>

                  <div className="question-alternatives">
                    {currentQuestion.alternativas?.map((alternative, index) => {
                      const letter = String.fromCharCode(65 + index); // A, B, C, D...
                      const isSelected = isAnswerSelected(letter);
                      
                      // Verificar se é correto (suporte a múltiplas respostas)
                      let isCorrect = false;
                      if (currentQuestion.respostasCorretas && currentQuestion.respostasCorretas.length > 0) {
                        isCorrect = currentQuestion.respostasCorretas.includes(letter);
                      } else if (currentQuestion.respostaCorreta) {
                        isCorrect = letter === currentQuestion.respostaCorreta;
                      }
                      
                      const showCorrect = showResult && isCorrect;
                      const showIncorrect = showResult && isSelected && !isCorrect;

                      return (
                        <button
                          key={index}
                          onClick={() => !showResult && handleAnswerSelection(letter)}
                          disabled={showResult}
                          className={`alternative-button ${isSelected ? 'selected' : ''} ${
                            showCorrect ? 'correct' : showIncorrect ? 'incorrect' : ''
                          }`}
                        >
                          <span className="alternative-letter">{letter}</span>
                          <span className="alternative-text">{alternative}</span>
                          {showResult && isCorrect && (
                            <span className="check-icon">✓</span>
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <span className="wrong-icon">✗</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Ações */}
                  <div className="question-actions">
                    {!showResult ? (
                      <button
                        onClick={handleAnswerSubmit}
                        disabled={!hasSelectedAnswers()}
                        className="btn btn-primary"
                      >
                        Confirmar Resposta
                      </button>
                    ) : (
                      <div className="result-actions">
                        <button
                          onClick={() => setShowComment(!showComment)}
                          className="btn btn-secondary"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          {showComment ? 'Ocultar' : 'Ver'} Comentário
                        </button>
                        
                        <button
                          onClick={resetCurrentQuestion}
                          className="btn btn-secondary"
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comentário */}
                  {showComment && currentQuestion.comentario && (
                    <div className="question-comment">
                      <h4 className="comment-title">Comentário:</h4>
                      <p className="comment-text">{currentQuestion.comentario}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navegação entre questões */}
            <div className="navigation-controls">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="btn btn-secondary"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Anterior
              </button>

              <span className="navigation-info">
                {currentQuestionIndex + 1} / {questions.length}
              </span>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="btn btn-secondary"
              >
                Próxima
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Indicador mobile de navegação */}
      <div className="mobile-question-nav">
        <div className="mobile-nav-indicator">
          <span className="question-counter">
            Questão {currentQuestionIndex + 1} de {questions.length}
          </span>
          <button 
            className="mobile-nav-toggle"
            onClick={() => setShowMobileNav(!showMobileNav)}
          >
            📋 Navegar
          </button>
        </div>
        
        {showMobileNav && (
          <div className="mobile-nav-dropdown">
            <div className="mobile-nav-overlay" onClick={() => setShowMobileNav(false)}></div>
            <div className="mobile-nav-content">
              <div className="mobile-nav-header">
                <h3>Navegação das Questões</h3>
                <button 
                  className="mobile-nav-close"
                  onClick={() => setShowMobileNav(false)}
                >
                  ✕
                </button>
              </div>
              <div className="mobile-questions-grid">
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  const isAnswered = userAnswer?.answered;
                  const isCorrect = userAnswer?.correct;
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      onClick={() => {
                        goToQuestion(index);
                        setShowMobileNav(false);
                      }}
                      className={`mobile-question-nav-item ${isCurrent ? 'current' : ''} ${
                        isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered'
                      }`}
                    >
                      <span className="question-number">{index + 1}</span>
                      {isAnswered && (
                        <span className="question-status-icon">
                          {isCorrect ? '✓' : '✕'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
