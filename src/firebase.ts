import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

// 🔄 Função assíncrona para carregar a configuração correta
const loadFirebaseConfig = async () => {
  // 1. Ambiente NATIVO (Android): Lê do arquivo privado
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('📱 Modo NATIVO: Carregando configuração privada...');
      // Usa variavel para que o Vite nao resolva estaticamente no build web
      const privatePath = './firebase-config.private';
      const privateConfig = await import(/* @vite-ignore */ privatePath);
      const config = privateConfig.privateFirebaseConfig;
      
      if (!config.apiKey || config.apiKey.includes('SUA_API_KEY')) {
        console.error('❌ ERRO: API Key inválida no arquivo privado.');
        throw new Error('Configure src/firebase-config.private.ts com suas chaves reais.');
      }
      
      console.log('✅ Configuração privada carregada para Android.');
      return config;
      
    } catch (error) {
      console.error('❌ Falha ao carregar config privada:', error);
      throw new Error('Arquivo de configuração privada não encontrado ou inválido.');
    }
  }
  
  // 2. Ambiente WEB (Dev): Lê do .env.local
  console.log('🌐 Modo WEB: Usando variáveis de ambiente (.env.local).');
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
};

// Carrega e inicializa o Firebase
let app;
try {
  const firebaseConfig = await loadFirebaseConfig();
  console.log('🔥 Firebase Config carregada. Project ID:', firebaseConfig.projectId?.substring(0, 10) + '...');
  
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase inicializado com sucesso!');
  
} catch (error) {
  console.error('❌ FALHA CRÍTICA na inicialização do Firebase:', error);
  console.warn('⚠️  Usando fallback de desenvolvimento...');
  app = initializeApp({
    apiKey: "placeholder-for-dev-error",
    authDomain: "financas-pro-invest.firebaseapp.com",
    projectId: "financas-pro-invest"
  });
}

// ✅ EXPORTAÇÕES COMPATÍVEIS (mantém 'database' como alias)
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = getDatabase(app);
export const database = db; // ⬅️ ALIAS PARA COMPATIBILIDADE
export const functions = getFunctions(app);
export default app;