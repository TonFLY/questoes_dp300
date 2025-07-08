// Script para migrar questões existentes para o novo formato
window.migrarQuestoesParaNovoFormato = async function() {
  try {
    const { db } = await import('./src/services/firebase.js');
    const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore');
    
    console.log('🔄 Iniciando migração de questões...');
    
    const questoesSnapshot = await getDocs(collection(db, 'questoes'));
    let migradas = 0;
    let jaNoFormato = 0;
    
    for (const questaoDoc of questoesSnapshot.docs) {
      const questao = questaoDoc.data();
      
      // Se já tem respostasCorretas, pular
      if (questao.respostasCorretas && Array.isArray(questao.respostasCorretas)) {
        jaNoFormato++;
        continue;
      }
      
      // Se tem respostaCorreta no formato antigo, migrar
      if (questao.respostaCorreta) {
        const novoFormato = {
          respostasCorretas: [questao.respostaCorreta]
        };
        
        await updateDoc(doc(db, 'questoes', questaoDoc.id), novoFormato);
        migradas++;
        
        console.log(`✅ Questão migrada: ${questaoDoc.id} - ${questao.respostaCorreta} → [${questao.respostaCorreta}]`);
      }
    }
    
    console.log('🎉 Migração concluída!');
    console.log(`📊 Questões migradas: ${migradas}`);
    console.log(`📊 Questões já no novo formato: ${jaNoFormato}`);
    
    return { migradas, jaNoFormato };
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
};

console.log('🛠️ Execute: migrarQuestoesParaNovoFormato() para migrar questões existentes');
