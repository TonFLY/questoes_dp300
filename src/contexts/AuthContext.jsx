import { useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { AuthContext } from './AuthContextType';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Registrar com email e senha
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Criar perfil do usuário no Firestore
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: displayName,
      createdAt: new Date(),
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0
    });
    
    return userCredential;
  }

  // Login com email e senha
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Login com Google
  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Verificar se é o primeiro login e criar perfil
    const userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'usuarios', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName,
        createdAt: new Date(),
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0
      });
    }
    
    return result;
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Buscar perfil do usuário
  async function fetchUserProfile(uid) {
    const userDoc = await getDoc(doc(db, 'usuarios', uid));
    if (userDoc.exists()) {
      setUserProfile(userDoc.data());
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
