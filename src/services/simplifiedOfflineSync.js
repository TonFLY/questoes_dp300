// Sistema de Sincronização Offline Simplificado
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

class SimplifiedOfflineSync {
  constructor() {
    this.dbName = 'DP300_Simple_DB';
    this.version = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.initialized = false;
    
    // Não inicializar automaticamente no constructor
    this.setupEventListeners();
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.db = await this.openDB();
      this.initialized = true;
      console.log('🔄 Sistema offline inicializado');
      
      if (this.isOnline) {
        this.syncPendingData();
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema offline:', error);
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
        if (!db.objectStoreNames.contains('cached_questions')) {
          const questionsStore = db.createObjectStore('cached_questions', { keyPath: 'id' });
          questionsStore.createIndex('cached_at', 'cached_at', { unique: false });
        }
        
        // Store para respostas pendentes
        if (!db.objectStoreNames.contains('pending_answers')) {
          const answersStore = db.createObjectStore('pending_answers', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          answersStore.createIndex('user_id', 'user_id', { unique: false });
          answersStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada');
      this.isOnline = true;
      this.showConnectionStatus('Online - Sincronizando...', 'success');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Modo offline');
      this.isOnline = false;
      this.showConnectionStatus('Offline - Dados salvos localmente', 'warning');
    });
  }

  showConnectionStatus(message, type = 'info') {
    // Remover notificação anterior se existir
    const existing = document.querySelector('.offline-status-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'offline-status-notification';
    notification.textContent = message;
    
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ===== CACHE DE QUESTÕES =====
  async cacheQuestions(questions) {
    try {
      const transaction = this.db.transaction(['cached_questions'], 'readwrite');
      const store = transaction.objectStore('cached_questions');
      
      for (const question of questions) {
        await store.put({
          ...question,
          cached_at: new Date().toISOString()
        });
      }
      
      console.log(`📚 ${questions.length} questões cacheadas`);
    } catch (error) {
      console.error('❌ Erro ao cachear questões:', error);
    }
  }

  async getCachedQuestions() {
    try {
      const transaction = this.db.transaction(['cached_questions'], 'readonly');
      const store = transaction.objectStore('cached_questions');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar questões do cache:', error);
      return [];
    }
  }

  // ===== RESPOSTAS OFFLINE =====
  async saveAnswerOffline(questionId, selectedAnswers, isCorrect, userId) {
    const answerData = {
      question_id: questionId,
      user_id: userId,
      selected_answers: selectedAnswers,
      is_correct: isCorrect,
      timestamp: new Date().toISOString(),
      synced: false
    };

    try {
      const transaction = this.db.transaction(['pending_answers'], 'readwrite');
      const store = transaction.objectStore('pending_answers');
      
      const request = store.add(answerData);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('💾 Resposta salva offline:', questionId);
          resolve(request.result);
          
          // Se online, tentar sincronizar
          if (this.isOnline) {
            this.syncPendingData();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ Erro ao salvar resposta offline:', error);
      throw error;
    }
  }

  async getPendingAnswers() {
    try {
      const transaction = this.db.transaction(['pending_answers'], 'readonly');
      const store = transaction.objectStore('pending_answers');
      
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar respostas pendentes:', error);
      return [];
    }
  }

  async syncPendingData() {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const pendingAnswers = await this.getPendingAnswers();
      
      if (pendingAnswers.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`🔄 Sincronizando ${pendingAnswers.length} respostas...`);
      
      for (const answer of pendingAnswers) {
        try {
          // Salvar no Firebase
          await this.syncSingleAnswer(answer);
          
          // Remover da lista de pendentes
          await this.removePendingAnswer(answer.id);
          
        } catch (error) {
          console.error('❌ Erro ao sincronizar resposta:', error);
        }
      }
      
      console.log('✅ Sincronização concluída');
      
    } catch (error) {
      console.error('❌ Erro durante sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncSingleAnswer(answerData) {
    try {
      // Salvar apenas resposta para revisão (não duplicar tentativas)
      await setDoc(
        doc(db, 'usuarios', answerData.user_id, 'respostas', answerData.question_id),
        {
          questionId: answerData.question_id,
          selectedAnswer: answerData.selected_answers,
          correct: answerData.is_correct,
          answeredAt: new Date(answerData.timestamp),
          answered: true
        }
      );
      
      console.log('✅ Resposta sincronizada:', answerData.question_id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao sincronizar resposta individual:', error);
      throw error;
    }
  }

  async removePendingAnswer(answerId) {
    try {
      const transaction = this.db.transaction(['pending_answers'], 'readwrite');
      const store = transaction.objectStore('pending_answers');
      await store.delete(answerId);
    } catch (error) {
      console.error('❌ Erro ao remover resposta pendente:', error);
    }
  }

  // ===== UTILITÁRIOS =====
  async getPendingCount() {
    const pending = await this.getPendingAnswers();
    return pending.length;
  }

  isOffline() {
    return !this.isOnline;
  }

  async clearOldCache(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const transaction = this.db.transaction(['cached_questions'], 'readwrite');
      const store = transaction.objectStore('cached_questions');
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
}

// Exportar instância singleton
export const offlineSync = new SimplifiedOfflineSync();
