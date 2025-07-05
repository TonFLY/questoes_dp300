// Script específico para limpar questão bugada da revisão
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export async function limparQuestaoRevisaoBugada(userId) {
  try {
    console.log('🔍 Procurando questão bugada na revisão...');
    
    // Buscar todas as respostas na revisão
    const answersRef = collection(db, 'usuarios', userId, 'respostas');
    const answersSnapshot = await getDocs(answersRef);
    
    let foundBuggedQuestion = false;
    
    for (const answerDoc of answersSnapshot.docs) {
      const answerData = answerDoc.data();
      
      console.log(`📋 Verificando:`, {
        id: answerDoc.id,
        correctAnswer: answerData.correctAnswer,
        alternatives: answerData.alternatives?.length || 0,
        questionText: answerData.questionText?.substring(0, 50) + '...'
      });
      
      // Verificar se é a questão bugada (sem resposta correta definida)
      if (!answerData.correctAnswer || 
          !answerData.alternatives || 
          answerData.alternatives.length === 0 ||
          (answerData.alternatives && answerData.correctAnswer && 
           !answerData.alternatives.find(alt => alt.id === answerData.correctAnswer))) {
        
        console.log(`🗑️ ENCONTROU questão bugada! Removendo: ${answerDoc.id}`);
        await deleteDoc(doc(db, 'usuarios', userId, 'respostas', answerDoc.id));
        foundBuggedQuestion = true;
        break; // Remove apenas a primeira questão bugada encontrada
      }
    }
    
    if (foundBuggedQuestion) {
      console.log('✅ Questão bugada removida da revisão!');
      return { success: true, message: 'Questão bugada removida' };
    } else {
      console.log('🤔 Nenhuma questão bugada encontrada na revisão');
      return { success: false, message: 'Nenhuma questão bugada encontrada' };
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar questão da revisão:', error);
    throw error;
  }
}

// Função para listar questões da revisão (para debug)
export async function listarQuestoesRevisao(userId) {
  try {
    console.log('📋 Listando questões da revisão...');
    
    const answersRef = collection(db, 'usuarios', userId, 'respostas');
    const answersSnapshot = await getDocs(answersRef);
    
    console.log(`Total de questões na revisão: ${answersSnapshot.size}`);
    
    answersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Resposta correta: ${data.correctAnswer || 'INDEFINIDA ❌'}`);
      console.log(`   Alternativas: ${data.alternatives?.length || 0}`);
      console.log(`   Questão: ${data.questionText?.substring(0, 80)}...`);
      console.log(`   Status: ${data.isCorrect ? '✅ Correta' : '❌ Errada'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar questões:', error);
  }
}

// Função para obter o User ID atual
export function obterUserIdAtual() {
  // Tentar várias formas de obter o user ID
  try {
    // 1. Verificar se há um usuário logado no Firebase Auth
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      console.log('🆔 User ID encontrado:', userId);
      return userId;
    }
    
    // 2. Verificar localStorage (se o app salva algo lá)
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.uid) {
        console.log('🆔 User ID do localStorage:', user.uid);
        return user.uid;
      }
    }
    
    // 3. Verificar sessionStorage
    const sessionData = sessionStorage.getItem('user');
    if (sessionData) {
      const user = JSON.parse(sessionData);
      if (user.uid) {
        console.log('🆔 User ID do sessionStorage:', user.uid);
        return user.uid;
      }
    }
    
    console.log('❌ User ID não encontrado. Faça login primeiro.');
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao obter User ID:', error);
    return null;
  }
}

// Função simplificada para limpar sem precisar do User ID
export async function limparQuestaoRevisaoSimples() {
  const userId = obterUserIdAtual();
  if (!userId) {
    console.log('❌ Precisa estar logado para limpar a revisão');
    return;
  }
  
  return await limparQuestaoRevisaoBugada(userId);
}

// Função simplificada para listar sem precisar do User ID
export async function listarQuestoesRevisaoSimples() {
  const userId = obterUserIdAtual();
  if (!userId) {
    console.log('❌ Precisa estar logado para listar a revisão');
    return;
  }
  
  return await listarQuestoesRevisao(userId);
}

// Exportar para o console
window.revisaoUtils = {
  limpar: limparQuestaoRevisaoBugada,
  listar: listarQuestoesRevisao,
  limparSimples: limparQuestaoRevisaoSimples,
  listarSimples: listarQuestoesRevisaoSimples,
  obterUserId: obterUserIdAtual
};

console.log('🛠️ Utilitários de revisão carregados!');
console.log('📝 Use: revisaoUtils.listarSimples() para ver as questões');
console.log('🗑️ Use: revisaoUtils.limparSimples() para limpar a questão bugada');
console.log('🆔 Use: revisaoUtils.obterUserId() para ver seu User ID');
