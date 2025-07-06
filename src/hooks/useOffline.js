import { useState, useEffect } from 'react';
import { offlineSync } from '../services/simplifiedOfflineSync';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Inicializar offline sync apenas uma vez
    const initializeOfflineSync = async () => {
      try {
        if (!isInitialized) {
          await offlineSync.init();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar offline sync:', error);
      }
    };

    // Atualizar contagem de itens pendentes periodicamente
    const updatePendingCount = async () => {
      try {
        if (isInitialized) {
          const count = await offlineSync.getPendingCount();
          setPendingCount(count);
        }
      } catch (error) {
        console.error('Erro ao obter contagem pendente:', error);
      }
    };

    initializeOfflineSync();
    const interval = setInterval(updatePendingCount, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isInitialized]);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingCount,
    offlineSync: isInitialized ? offlineSync : null
  };
}
