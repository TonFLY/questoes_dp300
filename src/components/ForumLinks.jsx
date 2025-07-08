import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  query, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LinkIcon,
  TrashIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export function ForumLinks() {
  const { currentUser } = useAuth();
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Escutar links em tempo real
  useEffect(() => {
    const linksRef = collection(db, 'forum_links');
    const q = query(linksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = [];
      snapshot.forEach((doc) => {
        linksData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setLinks(linksData);
    });

    return () => unsubscribe();
  }, []);

  const addLink = async (e) => {
    e.preventDefault();
    
    if (!newLink.title.trim() || !newLink.url.trim() || loading) return;

    // Validar URL
    try {
      new URL(newLink.url);
    } catch {
      alert('Por favor, insira uma URL válida (ex: https://exemplo.com)');
      return;
    }

    setLoading(true);
    
    try {
      await addDoc(collection(db, 'forum_links'), {
        title: newLink.title.trim(),
        url: newLink.url.trim(),
        description: newLink.description.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        timestamp: new Date()
      });
      
      setNewLink({ title: '', url: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao adicionar link:', error);
      alert('Erro ao adicionar link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async (linkId, linkUserId) => {
    if (linkUserId !== currentUser.uid) {
      alert('Você só pode excluir seus próprios links');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este link?')) return;

    try {
      await deleteDoc(doc(db, 'forum_links', linkId));
    } catch (error) {
      console.error('Erro ao excluir link:', error);
      alert('Erro ao excluir link. Tente novamente.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="forum-links">
      {/* Header */}
      <div className="forum-header">
        <div className="forum-title">
          <LinkIcon className="heroicon" />
          <h3>Links Úteis da Comunidade</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary btn-sm"
          title="Adicionar novo link"
        >
          <PlusIcon className="heroicon" />
          Adicionar Link
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={addLink} className="forum-form">
          <div className="form-group">
            <label className="label">Título do Link</label>
            <input
              type="text"
              value={newLink.title}
              onChange={(e) => setNewLink({...newLink, title: e.target.value})}
              placeholder="Ex: Documentação oficial do Azure"
              className="input-field"
              maxLength={100}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label">URL</label>
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({...newLink, url: e.target.value})}
              placeholder="https://exemplo.com"
              className="input-field"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label">Descrição (opcional)</label>
            <textarea
              value={newLink.description}
              onChange={(e) => setNewLink({...newLink, description: e.target.value})}
              placeholder="Breve descrição do conteúdo..."
              className="input-field"
              maxLength={200}
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Adicionando...' : 'Adicionar Link'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="btn btn-secondary btn-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Links */}
      <div className="forum-content">
        {links.length === 0 ? (
          <div className="forum-empty">
            <LinkIcon className="empty-icon" />
            <p>Nenhum link compartilhado ainda.</p>
            <p>Seja o primeiro a compartilhar um link útil!</p>
          </div>
        ) : (
          <div className="links-list">
            {links.map((link) => (
              <div key={link.id} className="link-item">
                <div className="link-content">
                  <div className="link-header">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link-title"
                    >
                      {link.title}
                      <ArrowTopRightOnSquareIcon className="heroicon external-icon" />
                    </a>
                    {link.userId === currentUser.uid && (
                      <button
                        onClick={() => deleteLink(link.id, link.userId)}
                        className="delete-btn"
                        title="Excluir link"
                      >
                        <TrashIcon className="heroicon" />
                      </button>
                    )}
                  </div>
                  
                  {link.description && (
                    <p className="link-description">{link.description}</p>
                  )}
                  
                  <div className="link-meta">
                    <span className="link-domain">{getDomain(link.url)}</span>
                    <span className="link-separator">•</span>
                    <span className="link-author">Por {link.userName}</span>
                    <span className="link-separator">•</span>
                    <span className="link-time">{formatTime(link.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
