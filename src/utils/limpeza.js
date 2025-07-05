// Script utilitário para limpar questões bugadas
// Execute este script no console do navegador após fazer login

import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function limparQuestoesBugadas(userId) {
  try {
    console.log('🔍 Iniciando limpeza de questões bugadas...');
    
    // Buscar todas as respostas na revisão
    const answersRef = collection(db, 'usuarios', userId, 'respostas');
    const answersSnapshot = await getDocs(answersRef);
    
    let deletedCount = 0;
    let checkedCount = 0;
    
    for (const answerDoc of answersSnapshot.docs) {
      const answerData = answerDoc.data();
      checkedCount++;
      
      console.log(`📋 Verificando questão ${checkedCount}:`, {
        id: answerDoc.id,
        correctAnswer: answerData.correctAnswer,
        alternatives: answerData.alternatives?.length || 0,
        questionText: answerData.questionText?.substring(0, 50) + '...'
      });
      
      // Verificar se a questão está bugada
      const isBuggedQuestion = (
        !answerData.correctAnswer || // Sem resposta correta
        !answerData.alternatives || // Sem alternativas
        answerData.alternatives.length === 0 || // Array de alternativas vazio
        !answerData.questionText || // Sem texto da questão
        answerData.questionText.trim() === '' // Texto vazio
      );
      
      if (isBuggedQuestion) {
        console.log(`🗑️ Removendo questão bugada: ${answerDoc.id}`);
        await deleteDoc(doc(db, 'usuarios', userId, 'respostas', answerDoc.id));
        deletedCount++;
      }
    }
    
    console.log(`✅ Limpeza concluída!`);
    console.log(`📊 Questões verificadas: ${checkedCount}`);
    console.log(`🗑️ Questões removidas: ${deletedCount}`);
    console.log(`✅ Questões mantidas: ${checkedCount - deletedCount}`);
    
    return {
      checked: checkedCount,
      deleted: deletedCount,
      kept: checkedCount - deletedCount
    };
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    throw error;
  }
}

export async function limparTentativasBugadas(userId) {
  try {
    console.log('🔍 Iniciando limpeza de tentativas bugadas...');
    
    // Buscar todas as tentativas
    const attemptsRef = collection(db, 'usuarios', userId, 'tentativas');
    const attemptsSnapshot = await getDocs(attemptsRef);
    
    let deletedCount = 0;
    let checkedCount = 0;
    
    for (const attemptDoc of attemptsSnapshot.docs) {
      const attemptData = attemptDoc.data();
      checkedCount++;
      
      // Verificar se a tentativa está bugada
      const isBuggedAttempt = (
        !attemptData.correctAnswer || // Sem resposta correta
        !attemptData.questionText || // Sem texto da questão
        attemptData.questionText.trim() === '' // Texto vazio
      );
      
      if (isBuggedAttempt) {
        console.log(`🗑️ Removendo tentativa bugada: ${attemptDoc.id}`);
        await deleteDoc(doc(db, 'usuarios', userId, 'tentativas', attemptDoc.id));
        deletedCount++;
      }
    }
    
    console.log(`✅ Limpeza de tentativas concluída!`);
    console.log(`📊 Tentativas verificadas: ${checkedCount}`);
    console.log(`🗑️ Tentativas removidas: ${deletedCount}`);
    
    return {
      checked: checkedCount,
      deleted: deletedCount
    };
    
  } catch (error) {
    console.error('❌ Erro na limpeza de tentativas:', error);
    throw error;
  }
}

export async function limpezaCompleta(userId) {
  console.log('🚀 Iniciando limpeza completa...');
  
  const resultQuestoesGlobais = await limparQuestoesGlobaisBugadas();
  const resultRespostas = await limparQuestoesBugadas(userId);
  const resultTentativas = await limparTentativasBugadas(userId);
  
  console.log('🎉 Limpeza completa finalizada!');
  console.log('📋 Resumo:', {
    questoesGlobais: resultQuestoesGlobais,
    respostas: resultRespostas,
    tentativas: resultTentativas
  });
  
  return {
    questoesGlobais: resultQuestoesGlobais,
    respostas: resultRespostas,
    tentativas: resultTentativas
  };
}

// Função para limpar questões bugadas da coleção global
export async function limparQuestoesGlobaisBugadas() {
  try {
    console.log('🔍 Iniciando limpeza de questões globais bugadas...');
    
    // Buscar todas as questões
    const questoesSnapshot = await getDocs(collection(db, 'questoes'));
    console.log(`📋 Encontradas ${questoesSnapshot.size} questões para verificar`);
    
    let questoesLimpas = 0;
    let tentativasLimpas = 0;
    
    for (const questaoDoc of questoesSnapshot.docs) {
      const questao = questaoDoc.data();
      let questaoProblematica = false;
      
      // Verificar se há problemas na questão
      if (!questao.alternativas || questao.alternativas.length === 0) {
        console.log(`❌ Questão ${questaoDoc.id}: sem alternativas`);
        questaoProblematica = true;
      }
      
      if (!questao.respostaCorreta || questao.respostaCorreta === '') {
        console.log(`❌ Questão ${questaoDoc.id}: sem resposta correta`);
        questaoProblematica = true;
      }
      
      if (questao.alternativas && questao.respostaCorreta) {
        const alternativaCorreta = questao.alternativas.find(alt => alt.id === questao.respostaCorreta);
        if (!alternativaCorreta) {
          console.log(`❌ Questão ${questaoDoc.id}: resposta correta não encontrada nas alternativas`);
          questaoProblematica = true;
        }
      }
      
      if (!questao.enunciado || questao.enunciado.trim() === '') {
        console.log(`❌ Questão ${questaoDoc.id}: sem enunciado`);
        questaoProblematica = true;
      }
      
      // Se a questão tem problemas, excluir ela e suas tentativas
      if (questaoProblematica) {
        console.log(`🗑️ Removendo questão problemática: ${questaoDoc.id}`);
        
        // Excluir tentativas relacionadas
        const tentativasQuery = query(
          collection(db, 'tentativas'),
          where('questaoId', '==', questaoDoc.id)
        );
        const tentativasSnapshot = await getDocs(tentativasQuery);
        
        for (const tentativaDoc of tentativasSnapshot.docs) {
          await deleteDoc(doc(db, 'tentativas', tentativaDoc.id));
          tentativasLimpas++;
        }
        
        // Excluir a questão
        await deleteDoc(doc(db, 'questoes', questaoDoc.id));
        questoesLimpas++;
      }
    }
    
    console.log('✅ Limpeza de questões globais concluída!');
    console.log(`📊 Questões removidas: ${questoesLimpas}`);
    console.log(`📊 Tentativas removidas: ${tentativasLimpas}`);
    
    return {
      questoesLimpas,
      tentativasLimpas
    };
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza de questões globais:', error);
    throw error;
  }
}

// Função para usar diretamente no console
window.limparDados = {
  questoesGlobais: limparQuestoesGlobaisBugadas,
  questoes: limparQuestoesBugadas,
  tentativas: limparTentativasBugadas,
  completa: limpezaCompleta
};
