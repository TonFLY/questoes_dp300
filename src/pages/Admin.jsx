import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { PageTitle } from '../components/PageTitle';

const Admin = () => {
  const { currentUser } = useAuth();
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    enunciado: '',
    alternativas: ['', ''],
    respostaCorreta: 0,
    categoria: '',
    nivel: 'medio',
    tags: '',
    comentario: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      carregarQuestoes();
    }
  }, [currentUser]);

  const carregarQuestoes = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'questoes'));
      const questoesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuestoes(questoesData);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      setError('Erro ao carregar questões');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      enunciado: '',
      alternativas: ['', ''],
      respostaCorreta: 0,
      categoria: '',
      nivel: 'medio',
      tags: '',
      comentario: ''
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.enunciado || formData.alternativas.some(alt => !alt.trim())) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const questaoData = {
        ...formData,
        alternativas: formData.alternativas.filter(alt => alt.trim()),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        // Converter resposta correta de número para letra
        respostaCorreta: String.fromCharCode(65 + formData.respostaCorreta),
        criadoPor: currentUser.uid,
        criadoEm: new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'questoes', editingId), questaoData);
        setSuccess('Questão atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'questoes'), questaoData);
        setSuccess('Questão criada com sucesso!');
      }

      resetForm();
      carregarQuestoes();
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
      setError('Erro ao salvar questão');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (questao) => {
    setFormData({
      titulo: questao.titulo,
      enunciado: questao.enunciado,
      alternativas: questao.alternativas,
      // Converter resposta correta de letra para número
      respostaCorreta: typeof questao.respostaCorreta === 'string' 
        ? questao.respostaCorreta.charCodeAt(0) - 65 
        : questao.respostaCorreta,
      categoria: questao.categoria,
      nivel: questao.nivel,
      tags: questao.tags?.join(', ') || '',
      comentario: questao.comentario || ''
    });
    setEditingId(questao.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta questão?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'questoes', id));
        setSuccess('Questão excluída com sucesso!');
        carregarQuestoes();
      } catch (error) {
        console.error('Erro ao excluir questão:', error);
        setError('Erro ao excluir questão');
      } finally {
        setLoading(false);
      }
    }
  };

  const adicionarAlternativa = () => {
    if (formData.alternativas.length < 6) {
      setFormData({
        ...formData,
        alternativas: [...formData.alternativas, '']
      });
    }
  };

  const removerAlternativa = (index) => {
    if (formData.alternativas.length > 2) {
      const novasAlternativas = formData.alternativas.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        alternativas: novasAlternativas,
        respostaCorreta: formData.respostaCorreta >= novasAlternativas.length ? 0 : formData.respostaCorreta
      });
    }
  };

  const handleAlternativaChange = (index, value) => {
    const novasAlternativas = [...formData.alternativas];
    novasAlternativas[index] = value;
    setFormData({
      ...formData,
      alternativas: novasAlternativas
    });
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div className="alert alert-warning">
          <p>Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <PageTitle title="DP-300 | Admin" />
      
      <div className="page-header">
        <h1>Gerenciar Questões</h1>
        <p>Crie, edite e exclua questões do sistema</p>
      </div>
      
      <div className="page-actions">
        <Link to="/dashboard" className="btn btn-secondary">
          🏠 Voltar ao Dashboard
        </Link>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? '❌ Cancelar' : '➕ Nova Questão'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h2>{editingId ? 'Editar Questão' : 'Nova Questão'}</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="titulo">Título *</label>
                <input
                  type="text"
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="enunciado">Enunciado *</label>
                <textarea
                  id="enunciado"
                  value={formData.enunciado}
                  onChange={(e) => setFormData({...formData, enunciado: e.target.value})}
                  className="form-control"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Alternativas *</label>
                {formData.alternativas.map((alternativa, index) => (
                  <div key={index} className="alternativa-input">
                    <div className="alternativa-row">
                      <span className="alternativa-letter">{String.fromCharCode(65 + index)}</span>
                      <input
                        type="text"
                        value={alternativa}
                        onChange={(e) => handleAlternativaChange(index, e.target.value)}
                        className="form-control"
                        placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                        required
                      />
                      {formData.alternativas.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removerAlternativa(index)}
                          className="btn btn-danger btn-sm"
                        >
                          ➖
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {formData.alternativas.length < 6 && (
                  <button
                    type="button"
                    onClick={adicionarAlternativa}
                    className="btn btn-outline btn-sm"
                  >
                    ➕ Adicionar Alternativa
                  </button>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="respostaCorreta">Resposta Correta *</label>
                <select
                  id="respostaCorreta"
                  value={formData.respostaCorreta}
                  onChange={(e) => setFormData({...formData, respostaCorreta: parseInt(e.target.value)})}
                  className="form-control"
                >
                  {formData.alternativas.map((_, index) => (
                    <option key={index} value={index}>
                      {String.fromCharCode(65 + index)} - {formData.alternativas[index] || `Alternativa ${String.fromCharCode(65 + index)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="categoria">Categoria</label>
                  <input
                    type="text"
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="form-control"
                    placeholder="Ex: SQL, Performance, Backup"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nivel">Nível</label>
                  <select
                    id="nivel"
                    value={formData.nivel}
                    onChange={(e) => setFormData({...formData, nivel: e.target.value})}
                    className="form-control"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="form-control"
                  placeholder="Separe as tags por vírgula (ex: sql, index, performance)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="comentario">Comentário/Explicação</label>
                <textarea
                  id="comentario"
                  value={formData.comentario}
                  onChange={(e) => setFormData({...formData, comentario: e.target.value})}
                  className="form-control"
                  rows="3"
                  placeholder="Explicação da resposta correta (opcional)"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'} Questão
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Questões Cadastradas ({questoes.length})</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : questoes.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma questão cadastrada ainda.</p>
              <p>Use o botão acima para criar sua primeira questão.</p>
            </div>
          ) : (
            <div className="questoes-list">
              {questoes.map((questao) => (
                <div key={questao.id} className="questao-item">
                  <div className="questao-header">
                    <h3>{questao.titulo}</h3>
                    <div className="questao-meta">
                      <span className={`badge badge-${questao.nivel}`}>{questao.nivel}</span>
                      {questao.categoria && (
                        <span className="badge badge-secondary">{questao.categoria}</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="questao-enunciado">{questao.enunciado}</p>
                  
                  <div className="questao-alternativas">
                    {questao.alternativas?.map((alt, index) => {
                      const letter = String.fromCharCode(65 + index);
                      const isCorrect = letter === questao.respostaCorreta || index === questao.respostaCorreta;
                      
                      return (
                        <div 
                          key={index} 
                          className={`alternativa ${isCorrect ? 'correta' : ''}`}
                        >
                          <span className="alternativa-letter">{letter}</span>
                          <span>{alt}</span>
                          {isCorrect && (
                            <span className="check-icon">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {questao.tags && questao.tags.length > 0 && (
                    <div className="questao-tags">
                      {questao.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {questao.comentario && (
                    <div className="questao-comentario">
                      <strong>Explicação:</strong> {questao.comentario}
                    </div>
                  )}

                  <div className="questao-actions">
                    <button
                      onClick={() => handleEdit(questao)}
                      className="btn btn-outline btn-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(questao.id)}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
