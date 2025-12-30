
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

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

// Autenticação Silenciosa (Anônima)
// Isso garante que existe um objeto 'auth' na requisição ao banco de dados,
// resolvendo o erro PERMISSION_DENIED das regras de segurança padrão.
signInAnonymously(auth).catch((error) => {
  console.error("Erro na Autenticação Anônima do Firebase:", error);
});

export default app;
