// Script para executar limpeza de questões bugadas
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do diretório pai
dotenv.config({ path: '../.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function limparQuestoesBugadas() {
  console.log('🧹 Iniciando limpeza de questões bugadas...');
  
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
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparQuestoesBugadas()
  .then(() => {
    console.log('🎉 Script de limpeza finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
