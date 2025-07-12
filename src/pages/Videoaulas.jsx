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
  SignalSlashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Videoaulas() {
  const { currentUser } = useAuth();
  const { isOnline, isOffline } = useOffline();
  
  // Estados principais
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [watchedVideos, setWatchedVideos] = useState({});
  const [currentVideo, setCurrentVideo] = useState(null);
  const [error, setError] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [useIframePlayer, setUseIframePlayer] = useState(false);
  const [_isFullscreen, setIsFullscreen] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    googleDriveUrl: '',
    categoria: '',
    duracao: '',
    tags: [],
    arquivos: []
  });
  const [currentTag, setCurrentTag] = useState('');

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

  // Efeitos
  useEffect(() => {
    async function loadData() {
      await loadVideos();
      await loadWatchedVideos();
    }
    loadData();
  }, [currentUser, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterVideos();
  }, [videos, filterCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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

  // Funções de carregamento
  async function loadVideos() {
    if (!isOnline) {
      setError('Conecte-se à internet para carregar videoaulas.');
      setLoading(false);
      return;
    }

    try {
      const videosRef = collection(db, 'videoaulas');
      const videosSnapshot = await getDocs(videosRef);
      
      const videosList = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setVideos(videosList);
      setError('');
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
      const watchedRef = collection(db, 'usuarios', currentUser.uid, 'videoaulas_assistidas');
      const watchedSnapshot = await getDocs(watchedRef);
      
      const watched = {};
      watchedSnapshot.docs.forEach(doc => {
        watched[doc.id] = doc.data();
      });

      setWatchedVideos(watched);
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  }

  function filterVideos() {
    if (!filterCategory) {
      setFilteredVideos(videos);
    } else {
      setFilteredVideos(videos.filter(video => video.categoria === filterCategory));
    }
  }

  // Funções do formulário
  function resetForm() {
    setFormData({
      titulo: '',
      descricao: '',
      googleDriveUrl: '',
      categoria: '',
      duracao: '',
      tags: [],
      arquivos: []
    });
    setCurrentTag('');
    setShowForm(false);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isOnline) {
      setError('Conecte-se à internet para adicionar videoaulas.');
      return;
    }

    try {
      await addDoc(collection(db, 'videoaulas'), {
        ...formData,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email
      });

      resetForm();
      loadVideos();
    } catch (error) {
      console.error('Erro ao adicionar videoaula:', error);
      setError('Erro ao adicionar videoaula. Tente novamente.');
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
      loadVideos();
    } catch (error) {
      console.error('Erro ao excluir videoaula:', error);
      setError('Erro ao excluir videoaula. Tente novamente.');
    }
  }

  // Funções de tags
  function addTag() {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  }

  function removeTag(tagToRemove) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }

  function handleTagKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  // Funções de arquivos de apoio
  function addArquivo() {
    setFormData(prev => ({
      ...prev,
      arquivos: [...prev.arquivos, { nome: '', url: '', tipo: '' }]
    }));
  }

  function updateArquivo(index, field, value) {
    setFormData(prev => {
      const newArquivos = [...prev.arquivos];
      newArquivos[index] = { ...newArquivos[index], [field]: value };
      return { ...prev, arquivos: newArquivos };
    });
  }

  function removeArquivo(index) {
    setFormData(prev => ({
      ...prev,
      arquivos: prev.arquivos.filter((_, i) => i !== index)
    }));
  }

  // Funções do player - URLs diretas que funcionam
  function extractVideoId(url) {
    const patterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/file\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function getDirectUrl(url) {
    const videoId = extractVideoId(url);
    if (!videoId) return null;
    // URL direta de download que funciona sem login
    return `https://drive.google.com/uc?export=download&id=${videoId}`;
  }

  function getEmbedUrl(url) {
    const videoId = extractVideoId(url);
    if (!videoId) return null;
    // URL de preview sem restrições
    return `https://drive.google.com/file/d/${videoId}/preview`;
  }

  async function openVideo(video) {
    setCurrentVideo(video);
    setVideoLoading(true);
    setUseIframePlayer(false);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'usuarios', currentUser.uid, 'videoaulas_assistidas', video.id), {
          assistidoEm: new Date(),
          titulo: video.titulo
        });
        setWatchedVideos(prev => ({ ...prev, [video.id]: true }));
      } catch (error) {
        console.error('Erro ao marcar vídeo como assistido:', error);
      }
    }
  }

  function closeVideo() {
    setCurrentVideo(null);
    setVideoLoading(false);
    setUseIframePlayer(false);
  }

  function getFileIcon(tipo) {
    const icons = {
      'documento': '📄',
      'slides': '📊',
      'planilha': '📈',
      'pdf': '📕',
      'arquivo': '📦',
      'código': '💻',
      'outro': '📎'
    };
    return icons[tipo] || icons.outro;
  }

  // Renderização condicional de loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="videoaulas-layout">
      <PageTitle title="DP-300 | Videoaulas" />
      
      {/* Header */}
      <header className="videoaulas-header">
        <div className="container">
          <div className="videoaulas-nav">
            <Link to="/dashboard" className="btn btn-secondary">
              <HomeIcon className="heroicon h-4 w-4 mr-2" />
              Dashboard
            </Link>
            
            <div className="header-info">
              <span className="video-counter">
                📹 {filteredVideos.length} videoaula{filteredVideos.length !== 1 ? 's' : ''}
                {filterCategory && ` em ${filterCategory}`}
              </span>
              
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
        {/* Controls */}
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
            {showForm ? 'Cancelar' : 'Nova Videoaula'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <ExclamationTriangleIcon className="heroicon h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="video-form-card">
            <div className="form-header">
              <h2>Nova Videoaula</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="video-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="form-input"
                    placeholder="Título da videoaula"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="">Selecionar categoria</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Duração</label>
                  <input
                    type="text"
                    value={formData.duracao}
                    onChange={(e) => setFormData(prev => ({ ...prev, duracao: e.target.value }))}
                    className="form-input"
                    placeholder="Ex: 15 min"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">URL do Google Drive *</label>
                  <input
                    type="url"
                    value={formData.googleDriveUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, googleDriveUrl: e.target.value }))}
                    className="form-input"
                    placeholder="https://drive.google.com/file/d/..."
                    required
                  />
                  <small className="form-hint">Cole a URL de compartilhamento do vídeo no Google Drive</small>
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="form-input"
                    rows="3"
                    placeholder="Descrição da videoaula"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    className="form-input"
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

                <div className="form-group form-group-full">
                  <label className="form-label">Arquivos de Apoio</label>
                  <button
                    type="button"
                    onClick={addArquivo}
                    className="btn btn-secondary btn-sm"
                  >
                    Adicionar Arquivo
                  </button>
                  <small className="form-hint">Adicione arquivos relevantes que acompanham a videoaula</small>
                </div>

                {formData.arquivos.length > 0 && (
                  <div className="form-group form-group-full">
                    <div className="arquivos-grid">
                      {formData.arquivos.map((arquivo, index) => (
                        <div key={index} className="arquivo-form-item">
                          <input
                            type="text"
                            value={arquivo.nome}
                            onChange={(e) => updateArquivo(index, 'nome', e.target.value)}
                            className="form-input"
                            placeholder="Nome do arquivo"
                            required
                          />
                          <input
                            type="url"
                            value={arquivo.url}
                            onChange={(e) => updateArquivo(index, 'url', e.target.value)}
                            className="form-input"
                            placeholder="URL do arquivo"
                            required
                          />
                          <select
                            value={arquivo.tipo}
                            onChange={(e) => updateArquivo(index, 'tipo', e.target.value)}
                            className="form-input"
                            required
                          >
                            <option value="">Tipo</option>
                            <option value="documento">Documento</option>
                            <option value="slides">Slides</option>
                            <option value="planilha">Planilha</option>
                            <option value="pdf">PDF</option>
                            <option value="arquivo">Arquivo</option>
                            <option value="código">Código</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeArquivo(index)}
                            className="btn btn-danger btn-sm"
                            title="Remover arquivo"
                          >
                            <TrashIcon className="heroicon h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Adicionar Videoaula
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
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
                    {video.duracao && (
                      <div className="video-overlay">
                        <span className="video-duration">{video.duracao}</span>
                      </div>
                    )}
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
                        <span key={index} className="video-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Modal */}
        {currentVideo && (
          <div className="video-modal" onClick={closeVideo}>
            <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="video-modal-header">
                <h2>{currentVideo.titulo}</h2>
                <button onClick={closeVideo} className="close-btn">
                  <XMarkIcon className="heroicon h-6 w-6" />
                </button>
              </div>

              <div className="video-modal-body">
                {/* Coluna Principal - Vídeo */}
                <div className="video-main-content">
                  <div className="video-player-container">
                    {videoLoading && (
                      <div className="video-loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Carregando vídeo...</p>
                      </div>
                    )}

                    {/* Player HTML5 primeiro, iframe como fallback */}
                    {!useIframePlayer ? (
                      <video
                        src={getDirectUrl(currentVideo.googleDriveUrl)}
                        className="video-element"
                        controls
                        preload="metadata"
                        onLoadStart={() => setVideoLoading(true)}
                        onCanPlay={() => setVideoLoading(false)}
                        onError={() => {
                          console.log('Video HTML5 falhou, tentando iframe...');
                          setUseIframePlayer(true);
                          setVideoLoading(false);
                        }}
                      >
                        Seu navegador não suporta o elemento de vídeo.
                      </video>
                    ) : (
                      <iframe
                        src={getEmbedUrl(currentVideo.googleDriveUrl)}
                        className="video-iframe-fallback"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        onLoad={() => setVideoLoading(false)}
                        title={currentVideo.titulo}
                      />
                    )}

                    <div className="video-controls">
                      <button
                        onClick={() => window.open(currentVideo.googleDriveUrl, '_blank')}
                        className="btn btn-sm"
                        title="Abrir no Google Drive"
                      >
                        📱 Abrir no Drive
                      </button>
                      <button
                        onClick={() => setUseIframePlayer(!useIframePlayer)}
                        className="btn btn-sm"
                        title="Alternar modo de reprodução"
                      >
                        🔄 {useIframePlayer ? 'Modo Embed' : 'Modo Alternativo'}
                      </button>
                    </div>

                    {/* Instruções de acesso */}
                    <div className="video-access-info">
                      <h4>� Como assistir os vídeos</h4>
                      <div className="access-steps">
                        <p><strong>📋 Passo a passo:</strong></p>
                        <ol>
                          <li><strong>Clique em "📱 Abrir no Drive"</strong> - Isso abrirá o vídeo no Google Drive</li>
                          <li><strong>Faça login na sua conta Google</strong> - É obrigatório para assistir</li>
                          <li><strong>Assista o vídeo</strong> - Agora você pode reproduzir normalmente</li>
                        </ol>
                      </div>
                      <div className="access-note">
                        <p>⚠️ <strong>Importante:</strong> O Google Drive agora exige login para reproduzir vídeos incorporados. Isso é uma política de segurança do Google implementada em 2024/2025.</p>
                        <p>✅ <strong>Solução:</strong> Sempre use o botão "Abrir no Drive" para garantir acesso completo ao vídeo.</p>
                      </div>
                    </div>
                  </div>

                  {currentVideo.descricao && (
                    <div className="video-modal-description">
                      <h3>Sobre esta aula</h3>
                      <p>{currentVideo.descricao}</p>
                    </div>
                  )}

                  {/* Tags da videoaula */}
                  {currentVideo.tags && currentVideo.tags.length > 0 && (
                    <div className="video-modal-tags">
                      <h4>Tags</h4>
                      <div className="tags-list">
                        {currentVideo.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar - Materiais de Apoio */}
                <div className="video-sidebar">
                  <div className="video-info-card">
                    <h3>Informações da Aula</h3>
                    <div className="video-details">
                      <div className="detail-item">
                        <TagIcon className="heroicon h-4 w-4" />
                        <span>Categoria: {currentVideo.categoria}</span>
                      </div>
                      {currentVideo.duracao && (
                        <div className="detail-item">
                          <ClockIcon className="heroicon h-4 w-4" />
                          <span>Duração: {currentVideo.duracao}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <CheckCircleIcon className="heroicon h-4 w-4" />
                        <span>{watchedVideos[currentVideo.id] ? 'Assistido' : 'Não assistido'}</span>
                      </div>
                    </div>
                  </div>

                  {currentVideo.arquivos && currentVideo.arquivos.length > 0 && (
                    <div className="materials-card">
                      <h3>
                        <BookOpenIcon className="heroicon h-5 w-5" />
                        Materiais de Apoio
                      </h3>
                      <div className="materials-list">
                        {currentVideo.arquivos.map((arquivo, index) => (
                          <a
                            key={index}
                            href={arquivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="material-item"
                          >
                            <div className="material-icon">
                              {getFileIcon(arquivo.tipo)}
                            </div>
                            <div className="material-info">
                              <span className="material-name">{arquivo.nome}</span>
                              <span className="material-type">{arquivo.tipo}</span>
                            </div>
                            <div className="material-action">
                              <span className="external-icon">↗</span>
                            </div>
                          </a>
                        ))}
                      </div>
                      <div className="materials-note">
                        <p>💡 Clique nos materiais para abrir em nova aba</p>
                      </div>
                    </div>
                  )}

                  {/* Dica de uso */}
                  <div className="tips-card">
                    <h4>💡 Dicas de Estudo</h4>
                    <ul>
                      <li>Assista o vídeo até o final</li>
                      <li>Baixe os materiais de apoio</li>
                      <li>Pratique os exercícios</li>
                      <li>Faça anotações importantes</li>
                    </ul>
                  </div>

                  {/* Aviso sobre login Google */}
                  <div className="google-login-warning">
                    <h4>🔐 Login Obrigatório</h4>
                    <div className="warning-content">
                      <p><strong>⚠️ Atenção:</strong></p>
                      <p>Para assistir aos vídeos, você deve estar <strong>logado na sua conta Google</strong> no navegador.</p>
                      <div className="warning-steps">
                        <p>📋 <strong>Como proceder:</strong></p>
                        <ol>
                          <li>Clique em "📱 Abrir no Drive"</li>
                          <li>Faça login no Google (se necessário)</li>
                          <li>Assista ao vídeo normalmente</li>
                        </ol>
                      </div>
                      <p className="warning-note">
                        💡 <strong>Dica:</strong> Mantenha-se sempre logado no Google para uma experiência fluida.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
