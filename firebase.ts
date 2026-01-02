
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Modular Instances
export const auth = getAuth(app);
export const database = getDatabase(app);
export const firestore = getFirestore(app);
export const db = firestore; // Alias
export const functions = getFunctions(app, 'us-central1');

// Configuração de idioma
auth.languageCode = 'pt-BR';

// Promessa que resolve quando o Auth estiver pronto (Listener único)
export const authReadyPromise = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    resolve(user);
    unsubscribe();
  });
});

export default app;
