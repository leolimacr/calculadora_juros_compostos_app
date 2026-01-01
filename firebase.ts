
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/firestore";
import "firebase/functions";

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

// Initialize Firebase (Compat / v8 style)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export instances
export const database = firebase.database();
export const firestore = firebase.firestore();
export const db = firestore; // Alias
export const functions = firebase.functions();
export const auth = firebase.auth();

// --- CONFIGURAÇÃO DE IDIOMA (PT-BR) ---
auth.languageCode = 'pt-BR';

// Promessa que resolve quando o Auth estiver pronto
export const authReadyPromise = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    resolve(user);
    unsubscribe();
  });
});

export default firebase;
