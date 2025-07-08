// Script para criar uma questão de teste com múltiplas respostas
window.criarQuestaoTeste = async function() {
  try {
    const { db } = await import('./src/services/firebase.js');
    const { collection, addDoc } = await import('firebase/firestore');
    
    const questaoTeste = {
      titulo: 'Teste Múltipla Escolha',
      enunciado: 'Quais das alternativas abaixo são corretas? (Selecione 2 ou mais)',
      alternativas: [
        'Primeira alternativa CORRETA',
        'Segunda alternativa ERRADA', 
        'Terceira alternativa CORRETA',
        'Quarta alternativa CORRETA'
      ],
      respostasCorretas: ['A', 'C', 'D'], // Múltiplas respostas corretas
      respostaCorreta: null, // Campo antigo deixado null
      categoria: 'Teste',
      nivel: 'medio',
      tags: ['teste', 'multipla-escolha'],
      comentario: 'Esta é uma questão de teste para múltiplas respostas corretas',
      criadoPor: 'sistema',
      criadoEm: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'questoes'), questaoTeste);
    console.log('✅ Questão de teste criada com ID:', docRef.id);
    console.log('📝 Dados da questão:', questaoTeste);
    
    // Agora vamos errar essa questão para que apareça na revisão
    window.criarRespostaErrada = async function() {
      const { auth } = await import('./src/services/firebase.js');
      const { doc, setDoc } = await import('firebase/firestore');
      
      if (!auth.currentUser) {
        console.log('❌ Você precisa estar logado');
        return;
      }
      
      const respostaErrada = {
        questionId: docRef.id,
        questionText: questaoTeste.enunciado,
        selectedAnswer: 'B', // Resposta errada
        correctAnswer: questaoTeste.respostasCorretas,
        correct: false,
        answeredAt: new Date(),
        alternatives: questaoTeste.alternativas,
        errorCount: 1
      };
      
      await setDoc(
        doc(db, 'usuarios', auth.currentUser.uid, 'respostas', docRef.id),
        respostaErrada
      );
      
      console.log('✅ Resposta errada criada para aparecer na revisão');
      console.log('🔄 Recarregue a página de revisão para ver a questão');
    };
    
    console.log('🎯 Agora execute: criarRespostaErrada() para criar uma resposta errada');
    
  } catch (error) {
    console.error('❌ Erro ao criar questão de teste:', error);
  }
};

console.log('🛠️ Execute: criarQuestaoTeste() para criar uma questão de teste');
