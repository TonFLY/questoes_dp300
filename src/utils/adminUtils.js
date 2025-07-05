// Script para tornar um usuário admin
// Execute este código no console do navegador após fazer login como admin

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function tornarUserAdmin(userEmail) {
  try {
    // Note: Você precisará do UID do usuário, não apenas o email
    // Para um sistema real, você criaria uma cloud function para isso
    console.log(`Para tornar ${userEmail} admin, você precisa:`);
    console.log('1. Acessar o console do Firebase');
    console.log('2. Ir em Firestore Database');
    console.log('3. Encontrar o documento do usuário em "usuarios"');
    console.log('4. Editar o campo "admin" para true');
    console.log('');
    console.log('Ou execute o código abaixo com o UID correto:');
    console.log(`
    import { doc, updateDoc } from 'firebase/firestore';
    import { db } from './src/services/firebase.js';
    
    await updateDoc(doc(db, 'usuarios', 'UID_DO_USUARIO'), {
      admin: true
    });
    `);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para uso direto (com UID)
export async function setUserAdmin(uid, isAdmin = true) {
  try {
    await updateDoc(doc(db, 'usuarios', uid), {
      admin: isAdmin
    });
    console.log(`Usuário ${uid} ${isAdmin ? 'agora é admin' : 'não é mais admin'}`);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  }
}

// Para usar rapidamente - substitua pelo UID do seu usuário
// setUserAdmin('SEU_UID_AQUI', true);
