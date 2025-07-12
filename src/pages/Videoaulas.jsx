import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOffline } from '../hooks/useOffline';
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PageTitle } from '../components/PageTitle';
import { Link } from 'react-router-dom';
import { 
  PlayIcon, 
  PlusIcon,
  TrashIcon,
  HomeIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

export default function Videoaulas() {
  const { currentUser } = useAuth();
  const { isOnline, isOffline } = useOffline();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    googleDriveUrl: '',
    categoria: '',
    duracao: '',
    tags: []
  });
  const [filterCategory, setFilterCategory] = useState('');
  const [watchedVideos, setWatchedVideos] = useState({});
  const [currentVideo, setCurrentVideo] = useState(null);
  const [error, setError] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [useIframePlayer, setUseIframePlayer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Categorias predefinidas para DP-300
  const categorias = [
    'Fundamentos',
    'Implementação',
    'Segurança',
    'Monitoramento',
    'Backup e Recuperação',
    'Alta Disponibilidade',
    'Performance',
    'Migração'
  ];

  // Detectar mudanças no fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      
      // Limpar loading quando entrar em fullscreen
      if (document.fullscreenElement) {
        setVideoLoading(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    loadVideos();
    loadWatchedVideos();
  }, [currentUser, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterVideos();
  }, [videos, filterCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadVideos() {
    if (!isOnline) {
      setError('Conecte-se à internet para carregar videoaulas.');
      setLoading(false);
      return;
    }

    try {
      const videosRef = collection(db, 'videoaulas');
      const videosSnapshot = await getDocs(videosRef);
      
      const videosData = [];
      videosSnapshot.forEach(doc => {
        videosData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar por data de criação
      videosData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      setVideos(videosData);
    } catch (error) {
      console.error('Erro ao carregar videoaulas:', error);
      setError('Erro ao carregar videoaulas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function loadWatchedVideos() {
    if (!currentUser || !isOnline) return;

    try {
      const watchedRef = collection(db, 'usuarios', currentUser.uid, 'videosAssistidos');
      const watchedSnapshot = await getDocs(watchedRef);
      
      const watchedData = {};
      watchedSnapshot.forEach(doc => {
        watchedData[doc.id] = doc.data();
      });

      setWatchedVideos(watchedData);
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  }

  function filterVideos() {
    let filtered = videos;

    if (filterCategory) {
      filtered = filtered.filter(video => video.categoria === filterCategory);
    }

    setFilteredVideos(filtered);
  }

  // Extrair ID do Google Drive da URL
  function extractGoogleDriveId(url) {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  // Gerar URL de embed do Google Drive com parâmetros otimizados
  function getEmbedUrl(googleDriveUrl) {
    const fileId = extractGoogleDriveId(googleDriveUrl);
    if (!fileId) return null;

    // URL otimizada para streaming progressivo
    return `https://drive.google.com/file/d/${fileId}/preview?usp=sharing&rm=minimal&embedded=true`;
  }

  // Gerar URL de streaming direto (alternativa mais rápida)
  function getStreamUrl(googleDriveUrl, format = 'mp4') {
    const fileId = extractGoogleDriveId(googleDriveUrl);
    if (!fileId) return null;

    // URLs otimizadas para diferentes formatos e qualidades
    const urls = {
      'mp4': `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
      'webm': `https://drive.google.com/uc?export=download&id=${fileId}&format=webm`,
      'hq': `https://drive.google.com/uc?export=download&id=${fileId}&quality=hd720`,
      'lq': `https://drive.google.com/uc?export=download&id=${fileId}&quality=medium`
    };

    return urls[format] || urls['mp4'];
  }

  // Gerar URL de thumbnail do vídeo
  function getThumbnailUrl(googleDriveUrl) {
    const fileId = extractGoogleDriveId(googleDriveUrl);
    if (!fileId) return null;

    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h300`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!isOnline) {
      setError('Conecte-se à internet para adicionar videoaulas.');
      return;
    }

    try {
      setLoading(true);

      // Validar URL do Google Drive
      const embedUrl = getEmbedUrl(formData.googleDriveUrl);
      if (!embedUrl) {
        setError('URL do Google Drive inválida. Use uma URL de compartilhamento válida.');
        return;
      }

      const videoData = {
        ...formData,
        embedUrl,
        tags: formData.tags.filter(tag => tag.trim()),
        createdAt: new Date(),
        createdBy: currentUser.uid
      };

      await addDoc(collection(db, 'videoaulas'), videoData);
      
      setFormData({
        titulo: '',
        descricao: '',
        googleDriveUrl: '',
        categoria: '',
        duracao: '',
        tags: []
      });
      setShowForm(false);
      setError('');
      
      await loadVideos();
    } catch (error) {
      console.error('Erro ao adicionar videoaula:', error);
      setError('Erro ao adicionar videoaula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteVideo(videoId) {
    if (!isOnline) {
      setError('Conecte-se à internet para excluir videoaulas.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta videoaula?')) return;

    try {
      await deleteDoc(doc(db, 'videoaulas', videoId));
      await loadVideos();
    } catch (error) {
      console.error('Erro ao excluir videoaula:', error);
      setError('Erro ao excluir videoaula.');
    }
  }

  async function markAsWatched(videoId) {
    if (!currentUser || !isOnline) return;

    try {
      const watchedData = {
        watchedAt: new Date(),
        videoId: videoId
      };

      await setDoc(doc(db, 'usuarios', currentUser.uid, 'videosAssistidos', videoId), watchedData);
      setWatchedVideos(prev => ({
        ...prev,
        [videoId]: watchedData
      }));
    } catch (error) {
      console.error('Erro ao marcar vídeo como assistido:', error);
    }
  }

  function openVideo(video) {
    setCurrentVideo(video);
    setVideoLoading(true);
    setUseIframePlayer(false);
    // Marcar como assistido automaticamente ao abrir
    markAsWatched(video.id);
  }

  function closeVideo() {
    setCurrentVideo(null);
    setVideoLoading(false);
    setUseIframePlayer(false);
  }

  // Handler para erro do vídeo - trocar para iframe
  function handleVideoError() {
    console.log('Erro no player de vídeo, mudando para iframe...');
    setUseIframePlayer(true);
    setVideoLoading(false);
  }

  // Handler para quando o vídeo está pronto para reproduzir
  function handleVideoCanPlay() {
    console.log('Vídeo pronto para reproduzir');
    setVideoLoading(false);
  }

  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !formData.tags.includes(value)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, value]
        }));
        e.target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando videoaulas...</p>
      </div>
    );
  }

  return (
    <div className="videoaulas-layout">
      <PageTitle title="Videoaulas DP-300" />
      
      <header className="videoaulas-header">
        <div className="container">
          <div className="videoaulas-nav">
            <Link to="/dashboard" className="btn btn-secondary">
              <HomeIcon className="heroicon h-4 w-4 mr-2" />
              Dashboard
            </Link>
            
            <div className="header-info">
              <span className="video-counter">
                {filteredVideos.length} videoaula{filteredVideos.length !== 1 ? 's' : ''}
                {filterCategory && ` em ${filterCategory}`}
              </span>
              
              {/* Indicador de status offline/online */}
              <div className={`offline-indicator ${isOffline ? 'offline' : 'online'}`}>
                {isOffline ? (
                  <>
                    <SignalSlashIcon className="heroicon h-4 w-4" />
                    <span className="text-xs">Offline</span>
                  </>
                ) : (
                  <>
                    <WifiIcon className="heroicon h-4 w-4" />
                    <span className="text-xs">Online</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="videoaulas-container">
        {/* Filtros e Ações */}
        <div className="videoaulas-controls">
          <div className="filters">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn btn-primary"
            disabled={!isOnline}
          >
            <PlusIcon className="heroicon h-4 w-4 mr-2" />
            Adicionar Videoaula
          </button>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="error-message">
            <ExclamationTriangleIcon className="heroicon h-5 w-5" />
            {error}
          </div>
        )}

        {/* Formulário de Adição */}
        {showForm && (
          <div className="video-form-card">
            <div className="form-header">
              <h3>Nova Videoaula</h3>
            </div>
            <form onSubmit={handleSubmit} className="video-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="label">Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="input-field"
                    required
                    placeholder="Título da videoaula"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Selecionar categoria</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Duração</label>
                  <input
                    type="text"
                    value={formData.duracao}
                    onChange={(e) => setFormData(prev => ({ ...prev, duracao: e.target.value }))}
                    className="input-field"
                    placeholder="Ex: 15 min"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="label">URL do Google Drive *</label>
                  <input
                    type="url"
                    value={formData.googleDriveUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, googleDriveUrl: e.target.value }))}
                    className="input-field"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <small className="form-hint">
                    Cole a URL de compartilhamento do vídeo no Google Drive
                  </small>
                </div>

                <div className="form-group full-width">
                  <label className="label">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="input-field"
                    rows="3"
                    placeholder="Descrição da videoaula"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="label">Tags</label>
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    className="input-field"
                    placeholder="Digite uma tag e pressione Enter"
                  />
                  {formData.tags.length > 0 && (
                    <div className="tags-list">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                          <button 
                            type="button" 
                            onClick={() => removeTag(tag)}
                            className="tag-remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Adicionar Videoaula
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Videoaulas */}
        {filteredVideos.length === 0 ? (
          <div className="empty-state">
            <VideoCameraIcon className="heroicon h-16 w-16 mb-4 text-gray-400" />
            <h3>Nenhuma videoaula encontrada</h3>
            <p>
              {filterCategory 
                ? `Nenhuma videoaula na categoria "${filterCategory}"`
                : 'Adicione sua primeira videoaula usando o botão acima'
              }
            </p>
          </div>
        ) : (
          <div className="videos-grid">
            {filteredVideos.map(video => (
              <div key={video.id} className="video-card">
                <div className="video-thumbnail" onClick={() => openVideo(video)}>
                  <div className="video-preview">
                    <PlayIcon className="heroicon h-12 w-12 text-white" />
                    <div className="video-overlay">
                      {video.duracao && (
                        <span className="video-duration">{video.duracao}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="video-info">
                  <div className="video-header">
                    <h3 className="video-title">{video.titulo}</h3>
                    <div className="video-actions">
                      {watchedVideos[video.id] && (
                        <CheckCircleIcon className="heroicon h-5 w-5 text-green-600" title="Assistido" />
                      )}
                      <button 
                        onClick={() => deleteVideo(video.id)}
                        className="delete-btn"
                        disabled={!isOnline}
                      >
                        <TrashIcon className="heroicon h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {video.descricao && (
                    <p className="video-description">{video.descricao}</p>
                  )}

                  <div className="video-meta">
                    <span className="video-category">
                      <TagIcon className="heroicon h-4 w-4" />
                      {video.categoria}
                    </span>
                    {video.duracao && (
                      <span className="video-duration-meta">
                        <ClockIcon className="heroicon h-4 w-4" />
                        {video.duracao}
                      </span>
                    )}
                  </div>

                  {video.tags && video.tags.length > 0 && (
                    <div className="video-tags">
                      {video.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal do Player de Vídeo */}
      {currentVideo && (
        <div className="video-modal" onClick={closeVideo}>
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{currentVideo.titulo}</h3>
              <button onClick={closeVideo} className="close-btn">×</button>
            </div>
            
            <div className="video-player">
              {getEmbedUrl(currentVideo.googleDriveUrl) ? (
                <div className="video-player-container">
                  {/* Loading indicator */}
                  {videoLoading && (
                    <div className="video-loading-overlay">
                      <div className="loading-spinner"></div>
                      <p>Carregando vídeo...</p>
                    </div>
                  )}
                  
                  {/* Player principal (HTML5 Video ou iframe baseado no estado) */}
                  {!useIframePlayer ? (
                    <video
                      controls
                      controlsList="nodownload"
                      preload="metadata"
                      poster={getThumbnailUrl(currentVideo.googleDriveUrl)}
                      className="video-element"
                      onLoadStart={() => setVideoLoading(true)}
                      onCanPlay={handleVideoCanPlay}
                      onError={handleVideoError}
                      onFullscreenChange={() => {
                        // Limpar qualquer overlay quando entrar/sair do fullscreen
                        if (document.fullscreenElement) {
                          setVideoLoading(false);
                        }
                      }}
                      style={{ 
                        display: videoLoading ? 'none' : 'block',
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        background: '#000'
                      }}
                    >
                      <source src={getStreamUrl(currentVideo.googleDriveUrl)} type="video/mp4" />
                      <source src={getStreamUrl(currentVideo.googleDriveUrl, 'webm')} type="video/webm" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  ) : (
                    <iframe
                      src={getEmbedUrl(currentVideo.googleDriveUrl)}
                      width="100%"
                      height="400"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      webkitAllowFullScreen
                      mozAllowFullScreen
                      title={currentVideo.titulo}
                      className="video-iframe-fallback"
                      loading="lazy"
                      onLoad={() => setVideoLoading(false)}
                      style={{ 
                        display: 'block',
                        border: 'none',
                        background: '#000'
                      }}
                    />
                  )}
                  
                  {/* Botão para forçar iframe - só mostra quando não está em fullscreen */}
                  {!isFullscreen && (
                    <div className="video-controls">
                      <button 
                        onClick={() => setUseIframePlayer(!useIframePlayer)}
                        className="btn btn-sm btn-secondary"
                        title={useIframePlayer ? "Usar player HTML5" : "Usar player do Google Drive"}
                      >
                        {useIframePlayer ? "🎬 Player Nativo" : "🔄 Player Google"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="video-error">
                  <ExclamationTriangleIcon className="heroicon h-12 w-12 text-red-500" />
                  <p>Erro ao carregar vídeo. Verifique a URL do Google Drive.</p>
                  <button 
                    onClick={() => window.open(currentVideo.googleDriveUrl, '_blank')}
                    className="btn btn-secondary btn-sm"
                  >
                    Abrir no Google Drive
                  </button>
                </div>
              )}
            </div>

            {currentVideo.descricao && (
              <div className="video-modal-description">
                <h4>Descrição</h4>
                <p>{currentVideo.descricao}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
