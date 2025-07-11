import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';
import { PageTitle } from '../components/PageTitle';

export default function Revisao() {
  const { currentUser } = useAuth();
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, attention, recent
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState({});

  useEffect(() => {
    if (currentUser) {
      loadWrongQuestions();
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterQuestions();
  }, [wrongQuestions, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadWrongQuestions() {
    if (!currentUser) return;

    try {
      setLoading(true);
      const answersRef = collection(db, 'usuarios', currentUser.uid, 'respostas');
      const answersSnapshot = await getDocs(answersRef);
      
      const wrongQuestionsList = [];

      answersSnapshot.forEach(doc => {
        const answer = doc.data();
        if (!answer.correct) {
          wrongQuestionsList.push({
            id: doc.id,
            ...answer,
            errorCount: answer.errorCount || 1,
            lastError: answer.answeredAt?.toDate() || new Date(),
            needsAttention: (answer.errorCount || 1) >= 3
          });
        }
      });

      // Ordenar por contagem de erros (mais erros primeiro)
      wrongQuestionsList.sort((a, b) => {
        if (a.needsAttention && !b.needsAttention) return -1;
        if (!a.needsAttention && b.needsAttention) return 1;
        return (b.errorCount || 1) - (a.errorCount || 1);
      });

      setWrongQuestions(wrongQuestionsList);
    } catch (error) {
      console.error('Erro ao carregar questões para revisão:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterQuestions() {
    let filtered = [...wrongQuestions];

    switch (filter) {
      case 'attention':
        filtered = filtered.filter(q => q.needsAttention);
        break;
      case 'recent': {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(q => q.lastError > oneWeekAgo);
        break;
      }
      default:
        // 'all' - não filtra
        break;
    }

    setFilteredQuestions(filtered);
  }

  async function handleAnswerSubmit(questionId, questionData) {
    const selectedAnswer = selectedAnswers[questionId];
    if (!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) return;

    try {
      console.log('Debug - selectedAnswer:', selectedAnswer);
      console.log('Debug - correctAnswer:', questionData.correctAnswer);
      console.log('Debug - questionData:', questionData);
      
      // Verificar se a resposta está correta (suporte a múltiplas respostas)
      let isCorrect = false;
      
      if (Array.isArray(selectedAnswer)) {
        // Questão de múltipla escolha - comparar arrays
        let correctAnswers = [];
        
        // Determinar o formato das respostas corretas
        if (questionData.respostasCorretas && Array.isArray(questionData.respostasCorretas)) {
          correctAnswers = questionData.respostasCorretas;
        } else if (Array.isArray(questionData.correctAnswer)) {
          correctAnswers = questionData.correctAnswer;
        } else if (questionData.correctAnswer) {
          correctAnswers = [questionData.correctAnswer];
        }
        
        // Verificar se todas as respostas selecionadas estão corretas e se não faltou nenhuma
        isCorrect = selectedAnswer.length === correctAnswers.length &&
                   selectedAnswer.every(answer => correctAnswers.includes(answer)) &&
                   correctAnswers.every(answer => selectedAnswer.includes(answer));
      } else {
        // Questão de única escolha
        if (questionData.respostasCorretas && Array.isArray(questionData.respostasCorretas)) {
          // Novo formato: múltiplas respostas corretas
          isCorrect = questionData.respostasCorretas.includes(selectedAnswer);
        } else if (Array.isArray(questionData.correctAnswer)) {
          // Formato antigo: múltiplas respostas corretas
          isCorrect = questionData.correctAnswer.includes(selectedAnswer);
        } else if (questionData.correctAnswer) {
          // Formato muito antigo: uma resposta correta
          isCorrect = selectedAnswer === questionData.correctAnswer;
        }
      }
        
        console.log('Debug - isCorrect:', isCorrect);
      
      // Salvar tentativa no histórico (sempre salva)
      const attemptData = {
        questionId: questionId,
        questionText: questionData.questionText,
        selectedAnswer: selectedAnswer,
        correctAnswer: questionData.correctAnswer,
        correct: isCorrect,
        answeredAt: new Date(),
        isRevision: true // Flag para identificar que é uma revisão
      };

      const attemptId = `${questionId}_${Date.now()}`;
      await setDoc(
        doc(db, 'usuarios', currentUser.uid, 'tentativas', attemptId),
        attemptData
      );
      
      if (isCorrect) {
        // Se acertou, remove da lista de revisão
        await deleteDoc(doc(db, 'usuarios', currentUser.uid, 'respostas', questionId));
        
        // Remove da lista local
        setWrongQuestions(prev => prev.filter(q => q.id !== questionId));
        
        // Limpa estados relacionados
        setSelectedAnswers(prev => {
          const newAnswers = { ...prev };
          delete newAnswers[questionId];
          return newAnswers;
        });
        
        setShowResults(prev => {
          const newResults = { ...prev };
          delete newResults[questionId];
          return newResults;
        });
      } else {
        // Se errou novamente, incrementa contador de erros
        const currentErrorCount = questionData.errorCount || 1;
        const newErrorCount = currentErrorCount + 1;
        
        await updateDoc(doc(db, 'usuarios', currentUser.uid, 'respostas', questionId), {
          errorCount: newErrorCount,
          lastError: new Date(),
          selectedAnswer: selectedAnswer,
          answeredAt: new Date()
        });

        // Atualiza lista local
        setWrongQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                errorCount: newErrorCount, 
                needsAttention: newErrorCount >= 3,
                lastError: new Date(),
                selectedAnswer: selectedAnswer
              }
            : q
        ));
      }

      setShowResults(prev => ({ ...prev, [questionId]: { isCorrect, selectedAnswer } }));

    } catch (error) {
      console.error('Erro ao salvar resposta de revisão:', error);
    }
  }

  function getAttentionBadge(question) {
    if (question.needsAttention) {
      return (
        <span className="attention-badge">
          ⚠️ ATENÇÃO ESPECIAL ({question.errorCount}x erros)
        </span>
      );
    }
    
    if (question.errorCount > 1) {
      return (
        <span className="error-count-badge">
          {question.errorCount}x erros
        </span>
      );
    }
    
    return null;
  }

  // Funções para lidar com múltiplas seleções
  function isMultipleChoice(question) {
    // Verificar novo formato (respostasCorretas)
    if (question.respostasCorretas && Array.isArray(question.respostasCorretas)) {
      return question.respostasCorretas.length > 1;
    }
    // Verificar formato antigo (correctAnswer como array)
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.length > 1;
    }
    // Formato muito antigo ou questão de resposta única
    return false;
  }
  
  function handleMultipleSelection(questionId, letter) {
    setSelectedAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      const isSelected = Array.isArray(currentAnswers) 
        ? currentAnswers.includes(letter)
        : currentAnswers === letter;
      
      if (isSelected) {
        // Remover seleção
        return {
          ...prev,
          [questionId]: Array.isArray(currentAnswers)
            ? currentAnswers.filter(answer => answer !== letter)
            : ''
        };
      } else {
        // Adicionar seleção
        return {
          ...prev,
          [questionId]: Array.isArray(currentAnswers)
            ? [...currentAnswers, letter]
            : [letter]
        };
      }
    });
  }
  
  function handleSingleSelection(questionId, letter) {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: letter }));
  }
  
  function isAnswerSelected(questionId, letter) {
    const selected = selectedAnswers[questionId];
    if (Array.isArray(selected)) {
      return selected.includes(letter);
    }
    return selected === letter;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <PageTitle title="DP-300 | Revisão" />
      <div className="page-header">
        <div>
          <h1>Área de Revisão</h1>
          <p>Revise e pratique questões que você errou anteriormente</p>
        </div>
        <div className="page-actions">
          <Link to="/dashboard" className="btn btn-secondary">
            🏠 Dashboard
          </Link>
          <Link to="/questoes" className="btn btn-primary">
            📚 Resolver Novas Questões
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-buttons">
          <button 
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            Todas ({wrongQuestions.length})
          </button>
          <button 
            onClick={() => setFilter('attention')}
            className={`filter-btn ${filter === 'attention' ? 'active' : ''}`}
          >
            ⚠️ Atenção Especial ({wrongQuestions.filter(q => q.needsAttention).length})
          </button>
          <button 
            onClick={() => setFilter('recent')}
            className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
          >
            🕒 Últimos 7 dias ({wrongQuestions.filter(q => {
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return q.lastError > oneWeekAgo;
            }).length})
          </button>
        </div>
      </div>

      {/* Lista de questões */}
      {filteredQuestions.length === 0 ? (
        <div className="empty-state">
          <h3>🎉 Parabéns!</h3>
          <p>
            {filter === 'all' 
              ? 'Você não tem questões para revisar. Continue praticando!'
              : `Nenhuma questão encontrada com o filtro "${filter === 'attention' ? 'Atenção Especial' : 'Últimos 7 dias'}".`
            }
          </p>
          <Link to="/questoes" className="btn btn-primary">
            Resolver Novas Questões
          </Link>
        </div>
      ) : (
        <div className="revision-questions">
          {filteredQuestions.map((question, index) => (
            <div key={question.id} className="revision-question-card">
              <div className="question-header">
                <div className="question-info">
                  <h3>Questão {index + 1}</h3>
                  {getAttentionBadge(question)}
                </div>
                <div className="question-meta">
                  <span className="error-date">
                    Último erro: {question.lastError?.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="question-content">
                <p className="question-text">{question.questionText}</p>

                <div className="question-alternatives">
                  {/* Indicador de múltipla escolha */}
                  {isMultipleChoice(question) && (
                    <div className="multiple-choice-indicator">
                      📝 <strong>Múltipla escolha:</strong> Selecione todas as alternativas corretas
                    </div>
                  )}
                  
                  {question.alternatives?.map((alternative, altIndex) => {
                    const letter = String.fromCharCode(65 + altIndex);
                    const isSelected = isAnswerSelected(question.id, letter);
                    
                    // Verificar se é correto (suporte a múltiplas respostas)
                    let isCorrect = false;
                    
                    // Verificar novo formato primeiro (respostasCorretas)
                    if (question.respostasCorretas && Array.isArray(question.respostasCorretas)) {
                      isCorrect = question.respostasCorretas.includes(letter);
                    } 
                    // Verificar formato antigo (correctAnswer como array)
                    else if (Array.isArray(question.correctAnswer)) {
                      isCorrect = question.correctAnswer.includes(letter);
                    } 
                    // Formato muito antigo (correctAnswer como string)
                    else if (question.correctAnswer) {
                      isCorrect = letter === question.correctAnswer;
                    }
                    
                    const showResult = showResults[question.id];
                    const showCorrect = showResult && isCorrect;
                    const showIncorrect = showResult && isSelected && !isCorrect;

                    // Debug logs
                    if (altIndex === 0) {
                      console.log('Debug render - question.correctAnswer:', question.correctAnswer);
                      console.log('Debug render - letter comparison:', { letter, correctAnswer: question.correctAnswer, isCorrect });
                    }

                    return (
                      <button
                        key={altIndex}
                        onClick={() => {
                          if (!showResult) {
                            if (isMultipleChoice(question)) {
                              handleMultipleSelection(question.id, letter);
                            } else {
                              handleSingleSelection(question.id, letter);
                            }
                          }
                        }}
                        disabled={showResult}
                        className={`revision-alternative ${isSelected ? 'selected' : ''} ${
                          showCorrect ? 'correct' : showIncorrect ? 'incorrect' : ''
                        } ${isMultipleChoice(question) ? 'multiple-choice' : ''}`}
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

                <div className="question-actions">
                  {!showResults[question.id] ? (
                    <button
                      onClick={() => handleAnswerSubmit(question.id, question)}
                      disabled={(() => {
                        const selected = selectedAnswers[question.id];
                        return !selected || (Array.isArray(selected) && selected.length === 0);
                      })()}
                      className="btn btn-primary"
                    >
                      Confirmar Resposta
                    </button>
                  ) : (
                    <div className="result-feedback">
                      {showResults[question.id].isCorrect ? (
                        <span className="success-message">
                          ✅ Correto! Questão removida da revisão.
                        </span>
                      ) : (
                        <span className="error-message">
                          ❌ Incorreto. Questão mantida na revisão.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Histórico de erros */}
                <div className="error-history">
                  <p className="error-summary">
                    📊 Sua resposta anterior: <strong>{question.selectedAnswer}</strong> | 
                    Resposta{Array.isArray(question.correctAnswer) && question.correctAnswer.length > 1 ? 's' : ''} correta{Array.isArray(question.correctAnswer) && question.correctAnswer.length > 1 ? 's' : ''}: <strong>
                      {Array.isArray(question.correctAnswer) 
                        ? question.correctAnswer.join(', ') 
                        : question.correctAnswer}
                    </strong> | 
                    Total de erros: <strong>{question.errorCount}</strong>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
