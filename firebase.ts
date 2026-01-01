
import firebase from "firebase/app";
import "firebase/database";
import "firebase/firestore";
import "firebase/functions";
import "firebase/auth";

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

// Initialize only once
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const database = app.database();
export const firestore = app.firestore();
export const functions = app.functions('us-central1');
export const auth = app.auth();

// --- CONFIGURAÇÃO DE IDIOMA (PT-BR) ---
auth.languageCode = 'pt-BR';

// Promessa que resolve quando o Auth estiver pronto
export const authReadyPromise = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      resolve(user);
    } else {
      resolve(null);
    }
    // unsubscribe(); // Keep listening? No, authReadyPromise is one-off
  });
});

export default firebase;
