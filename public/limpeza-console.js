// Script de limpeza - execute no console do navegador
window.limparQuestoesBugadas = async function() {
  console.log('🧹 Iniciando limpeza de questões bugadas...');
  
  const { db } = await import('./services/firebase.js');
  const { collection, getDocs, doc, deleteDoc, query, where } = await import('firebase/firestore');
  
  let questoesLimpas = 0;
  let tentativasLimpas = 0;
  
  try {
    // Buscar todas as questões
    const questoesSnapshot = await getDocs(collection(db, 'questoes'));
    console.log(`📋 Encontradas ${questoesSnapshot.size} questões para verificar`);
    
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
    
    console.log('✅ Limpeza concluída!');
    console.log(`📊 Questões removidas: ${questoesLimpas}`);
    console.log(`📊 Tentativas removidas: ${tentativasLimpas}`);
    
    return {
      questoesLimpas,
      tentativasLimpas
    };
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
};

console.log('🛠️ Função limparQuestoesBugadas() carregada. Execute no console: limparQuestoesBugadas()');
