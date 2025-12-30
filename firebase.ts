
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBYaPgjhO9Txd1IMCIr9qtirFxs7xgOk-U",
  authDomain: "financas-pro-invest.firebaseapp.com",
  databaseURL: "https://financas-pro-invest-default-rtdb.firebaseio.com",
  projectId: "financas-pro-invest",
  storageBucket: "financas-pro-invest.firebasestorage.app",
  messagingSenderId: "88572119588",
  appId: "1:88572119588:c16124fb608f834da6b1",
  measurementId: "G-MJR191X3VB"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Promessa que resolve quando o Auth estiver pronto
export const authReadyPromise = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Firebase Auth conectado:", user.uid);
      resolve(user);
      unsubscribe();
    } else {
      console.log("🔄 Tentando Login Anônimo no Firebase...");
      signInAnonymously(auth).catch((error) => {
        console.error("❌ Erro Auth Anônimo:", error);
        
        // ALERTA CRÍTICO DE CONFIGURAÇÃO
        if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
             alert("ERRO DE CONFIGURAÇÃO FIREBASE:\n\nA autenticação 'Anônima' não está ativada no Console do Firebase.\n\n1. Acesse console.firebase.google.com\n2. Vá em Build > Authentication > Sign-in method\n3. Ative 'Anonymous'");
        }
      });
    }
  });
});

export default app;
