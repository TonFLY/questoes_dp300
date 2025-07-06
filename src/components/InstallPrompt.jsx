import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Previne o prompt automático
      e.preventDefault();
      // Salva o evento para usar depois
      setDeferredPrompt(e);
      // Mostra nosso botão customizado
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA foi instalado');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt de instalação
    deferredPrompt.prompt();

    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalar o app');
    } else {
      console.log('Usuário rejeitou instalar o app');
    }

    // Limpa o prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Opcional: guardar no localStorage que o usuário dispensou
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Não mostra se já foi dispensado
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed === 'true') {
      setShowInstallPrompt(false);
    }
  }, []);

  if (!showInstallPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <h3>Instalar App DP-300</h3>
          <p>Instale nosso app para uma experiência melhor e acesso offline!</p>
        </div>
        <div className="install-prompt-actions">
          <button onClick={handleInstallClick} className="btn btn-primary btn-sm">
            Instalar
          </button>
          <button onClick={handleDismiss} className="btn btn-secondary btn-sm">
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
