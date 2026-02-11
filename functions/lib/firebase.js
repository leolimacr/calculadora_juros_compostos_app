"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authReadyPromise = exports.functions = exports.database = exports.db = exports.auth = exports.dbModular = exports.firestore = void 0;
const app_1 = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/database");
require("firebase/compat/functions");
const app_2 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const database_1 = require("firebase/database");
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
// 1. Inicialização MODULAR (Obrigatória para useFirebase.ts e o erro da tela quebrada)
const appModular = (0, app_2.getApps)().length === 0 ? (0, app_2.initializeApp)(firebaseConfig) : (0, app_2.getApp)();
exports.firestore = (0, firestore_1.getFirestore)(appModular); // Firestore Moderno
exports.dbModular = (0, database_1.getDatabase)(appModular); // Realtime Moderno
// 2. Inicialização COMPAT (Obrigatória para o sistema de Login atual)
const appCompat = !app_1.default.apps.length ? app_1.default.initializeApp(firebaseConfig) : app_1.default.app();
exports.auth = appCompat.auth();
exports.db = appCompat.database(); // Realtime Legado (Mantido para compatibilidade)
exports.database = exports.db;
exports.functions = appCompat.functions('southamerica-east1');
exports.authReadyPromise = new Promise((resolve) => {
    const unsubscribe = exports.auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
    });
});
exports.default = appCompat;
//# sourceMappingURL=firebase.js.map