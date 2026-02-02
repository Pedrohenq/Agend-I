import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase - AgendAí
const firebaseConfig = {
  apiKey: "AIzaSyACpEVRHhrBkXhTQhmsWflK0p6PN5BB0a4",
  authDomain: "agendai-485bc.firebaseapp.com",
  projectId: "agendai-485bc",
  storageBucket: "agendai-485bc.firebasestorage.app",
  messagingSenderId: "120666862601",
  appId: "1:120666862601:web:c91689c1919d1dd810b4d8",
  measurementId: "G-HX1LH2FFZ2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
