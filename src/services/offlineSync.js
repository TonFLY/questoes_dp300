// Serviço de Sincronização Offline
class OfflineSync {
  constructor() {
    this.dbName = 'DP300_Offline_DB';
    this.version = 1;
    this.db = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    this.init();
    this.setupEventListeners();
  }

  async init() {
    try {
      // Inicializar IndexedDB
      this.db = await this.openDB();
      
      // Carregar queue do armazenamento
      await this.loadSyncQueue();
      
      // Se estiver online, processar queue
      if (this.isOnline) {
        this.processSyncQueue();
      }
      
      console.log('🔄 Offline Sync inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Offline Sync:', error);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store para questões em cache
        if (!db.objectStoreNames.contains('questions')) {
          const questionsStore = db.createObjectStore('questions', { keyPath: 'id' });
          questionsStore.createIndex('cached_at', 'cached_at', { unique: false });
        }
        
        // Store para respostas do usuário (offline)
        if (!db.objectStoreNames.contains('user_answers')) {
          const answersStore = db.createObjectStore('user_answers', { keyPath: 'id' });
          answersStore.createIndex('question_id', 'question_id', { unique: false });
          answersStore.createIndex('synced', 'synced', { unique: false });
        }
        
        // Store para queue de sincronização
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }
        
        // Store para estatísticas offline
        if (!db.objectStoreNames.contains('user_stats')) {
          db.createObjectStore('user_stats', { keyPath: 'userId' });
        }
      };
    });
  }

  setupEventListeners() {
    // Detectar mudanças de conectividade
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada - processando sincronização');
      this.isOnline = true;
      this.processSyncQueue();
      this.showConnectionStatus('Conectado - Sincronizando dados...');
    });

    window.addEventListener('offline', () => {
      console.log('📱 Modo offline ativado');
      this.isOnline = false;
      this.showConnectionStatus('Offline - Dados salvos localmente');
    });
  }

  showConnectionStatus(message) {
    // Criar notificação visual do status
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.isOnline ? '#10b981' : '#f59e0b'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove após 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ===== QUESTÕES ===== 
  async cacheQuestions(questions) {
    try {
      const transaction = this.db.transaction(['questions'], 'readwrite');
      const store = transaction.objectStore('questions');
      
      for (const question of questions) {
        await store.put({
          ...question,
          cached_at: new Date().toISOString()
        });
      }
      
      console.log(`📚 ${questions.length} questões cacheadas offline`);
    } catch (error) {
      console.error('❌ Erro ao cachear questões:', error);
    }
  }

  async getCachedQuestions() {
    try {
      const transaction = this.db.transaction(['questions'], 'readonly');
      const store = transaction.objectStore('questions');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar questões do cache:', error);
      return [];
    }
  }

  // ===== RESPOSTAS DO USUÁRIO =====
  async saveUserAnswer(questionId, selectedAnswers, isCorrect, userId) {
    const answer = {
      id: `${userId}_${questionId}_${Date.now()}`,
      question_id: questionId,
      user_id: userId,
      selected_answers: selectedAnswers,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
      synced: false
    };

    try {
      // Salvar offline
      const transaction = this.db.transaction(['user_answers'], 'readwrite');
      const store = transaction.objectStore('user_answers');
      await store.put(answer);
      
      // Adicionar à queue de sincronização
      await this.addToSyncQueue('user_answer', answer);
      
      console.log('💾 Resposta salva offline:', questionId);
      
      // Se online, tentar sincronizar imediatamente
      if (this.isOnline) {
        this.processSyncQueue();
      }
      
      return answer;
    } catch (error) {
      console.error('❌ Erro ao salvar resposta offline:', error);
      throw error;
    }
  }

  // ===== QUEUE DE SINCRONIZAÇÃO =====
  async addToSyncQueue(type, data) {
    try {
      const queueItem = {
        type,
        data,
        timestamp: new Date().toISOString(),
        retries: 0
      };
      
      const transaction = this.db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      await store.add(queueItem);
      
      this.syncQueue.push(queueItem);
    } catch (error) {
      console.error('❌ Erro ao adicionar à queue:', error);
    }
  }

  async loadSyncQueue() {
    try {
      const transaction = this.db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          this.syncQueue = request.result;
          console.log(`📋 ${this.syncQueue.length} itens na queue de sincronização`);
          resolve();
        };
        request.onerror = () => resolve();
      });
    } catch (error) {
      console.error('❌ Erro ao carregar queue:', error);
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log(`🔄 Processando ${this.syncQueue.length} itens da queue`);
    
    const itemsToRemove = [];
    
    for (const item of this.syncQueue) {
      try {
        let success = false;
        
        switch (item.type) {
          case 'user_answer':
            success = await this.syncUserAnswer(item.data);
            break;
          case 'user_stats':
            success = await this.syncUserStats(item.data);
            break;
          default:
            console.warn('⚠️ Tipo desconhecido na queue:', item.type);
        }
        
        if (success) {
          itemsToRemove.push(item);
        } else {
          item.retries = (item.retries || 0) + 1;
          if (item.retries >= 3) {
            console.error('❌ Item falhou 3 vezes, removendo:', item);
            itemsToRemove.push(item);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar item da queue:', error);
        item.retries = (item.retries || 0) + 1;
      }
    }
    
    // Remover itens processados com sucesso
    await this.removeFromSyncQueue(itemsToRemove);
  }

  async syncUserAnswer(answerData) {
    try {
      // Verificar se o Firebase está disponível globalmente
      if (typeof window !== 'undefined' && window.firebase) {
        const { db } = window.firebase;
        const { doc, setDoc } = window.firebaseFirestore;
        
        // Salvar no Firestore
        await setDoc(doc(db, 'respostas_usuarios', answerData.id), {
          questionId: answerData.question_id,
          userId: answerData.user_id,
          selectedAnswers: answerData.selected_answers,
          isCorrect: answerData.is_correct,
          answeredAt: new Date(answerData.answered_at)
        });
      } else {
        // Se Firebase não estiver disponível, usar fetch diretamente
        console.log('📝 Salvando via API REST do Firebase...');
        
        // Para simplicidade, vamos apenas marcar como sincronizado
        // e deixar a sincronização real para quando o Firebase estiver disponível
        console.log('⏳ Aguardando Firebase estar disponível para sincronização');
        
        // Retornar false para tentar novamente depois
        return false;
      }
      
      // Marcar como sincronizado no cache local
      await this.markAnswerAsSynced(answerData.id);
      
      console.log('✅ Resposta sincronizada:', answerData.question_id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao sincronizar resposta:', error);
      return false;
    }
  }

  async markAnswerAsSynced(answerId) {
    try {
      const transaction = this.db.transaction(['user_answers'], 'readwrite');
      const store = transaction.objectStore('user_answers');
      const request = store.get(answerId);
      
      request.onsuccess = () => {
        const answer = request.result;
        if (answer) {
          answer.synced = true;
          store.put(answer);
        }
      };
    } catch (error) {
      console.error('❌ Erro ao marcar resposta como sincronizada:', error);
    }
  }

  async removeFromSyncQueue(itemsToRemove) {
    try {
      const transaction = this.db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      for (const item of itemsToRemove) {
        if (item.id) {
          await store.delete(item.id);
        }
        
        // Remover do array local
        const index = this.syncQueue.findIndex(queueItem => queueItem.id === item.id);
        if (index > -1) {
          this.syncQueue.splice(index, 1);
        }
      }
      
      console.log(`🗑️ ${itemsToRemove.length} itens removidos da queue`);
    } catch (error) {
      console.error('❌ Erro ao remover itens da queue:', error);
    }
  }

  // ===== ESTATÍSTICAS OFFLINE =====
  async updateOfflineStats(userId, stats) {
    try {
      const transaction = this.db.transaction(['user_stats'], 'readwrite');
      const store = transaction.objectStore('user_stats');
      
      const statsData = {
        userId,
        ...stats,
        updated_at: new Date().toISOString()
      };
      
      await store.put(statsData);
      
      // Adicionar à queue para sincronizar
      await this.addToSyncQueue('user_stats', statsData);
      
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas offline:', error);
    }
  }

  async getOfflineStats(userId) {
    try {
      const transaction = this.db.transaction(['user_stats'], 'readonly');
      const store = transaction.objectStore('user_stats');
      const request = store.get(userId);
      
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas offline:', error);
      return null;
    }
  }

  // ===== UTILITÁRIOS =====
  async clearOldCache(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const transaction = this.db.transaction(['questions'], 'readwrite');
      const store = transaction.objectStore('questions');
      const index = store.index('cached_at');
      
      const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      console.log(`🧹 Cache antigo limpo (${daysOld} dias)`);
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  isOffline() {
    return !this.isOnline;
  }

  getQueueLength() {
    return this.syncQueue.length;
  }
}

// Exportar instância singleton
export const offlineSync = new OfflineSync();
