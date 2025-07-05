// Script utilitário para migrar dados existentes para o novo sistema de tentativas
// Execute este script uma vez no console do navegador após fazer login

import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function migrarDadosParaTentativas(userId) {
  try {
    console.log('Iniciando migração de dados...');
    
    // Buscar todas as respostas existentes
    const answersRef = collection(db, 'usuarios', userId, 'respostas');
    const answersSnapshot = await getDocs(answersRef);
    
    let migratedCount = 0;
    
    for (const answerDoc of answersSnapshot.docs) {
      const answerData = answerDoc.data();
      
      // Calcular quantas tentativas baseado no errorCount
      const totalAttempts = answerData.errorCount || 1;
      
      // Criar tentativas baseadas no número de erros
      for (let i = 0; i < totalAttempts; i++) {
        const attemptData = {
          questionId: answerData.questionId,
          questionText: answerData.questionText,
          selectedAnswer: answerData.selectedAnswer,
          correctAnswer: answerData.correctAnswer,
          correct: i === totalAttempts - 1 ? answerData.correct : false, // Última tentativa = resultado atual
          answeredAt: answerData.answeredAt || new Date(),
          isMigrated: true
        };
        
        const attemptId = `${answerData.questionId}_migrated_${i}`;
        await setDoc(
          doc(db, 'usuarios', userId, 'tentativas', attemptId),
          attemptData
        );
        
        migratedCount++;
      }
    }
    
    console.log(`Migração concluída! ${migratedCount} tentativas criadas.`);
    return migratedCount;
    
  } catch (error) {
    console.error('Erro na migração:', error);
    throw error;
  }
}

// Para usar no console:
// import { migrarDadosParaTentativas } from './utils/migracao';
// migrarDadosParaTentativas('SEU_USER_ID_AQUI');
