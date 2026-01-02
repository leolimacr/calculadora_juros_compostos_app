
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/firestore";
import "firebase/compat/functions";

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

// Initialize Firebase (Check for existing apps to avoid errors in hot-reload)
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Export Namespace Instances
export const auth = app.auth();
export const database = app.database();
export const firestore = app.firestore();
export const db = firestore; // Alias
export const functions = app.functions('us-central1');

// Configuração de idioma
auth.languageCode = 'pt-BR';

// Promessa que resolve quando o Auth estiver pronto (Listener único)
export const authReadyPromise = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    resolve(user);
    unsubscribe();
  });
});

export default app;
