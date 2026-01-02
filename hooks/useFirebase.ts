
import { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/app';
import { database, authReadyPromise, db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { UserMeta } from '../types';
import { AppUserDoc, isAppPremium } from '../types/user';

const DEFAULT_META: UserMeta = {
  plan: 'free',
  launchLimit: 30, // Limite para usuários free
  launchCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const useFirebase = (userId: string) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<AppUserDoc | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Propriedade Derivada: Verifica Premium Real (Firestore)
  const isPremium = useMemo(() => isAppPremium(firestoreUser), [firestoreUser]);
  
  // Limite visual e lógico
  const usagePercentage = useMemo(() => {
    if (!userMeta) return 0;
    if (isPremium) return 0; // Premium não tem barra de limite
    return Math.min(100, (userMeta.launchCount / userMeta.launchLimit) * 100);
  }, [userMeta, isPremium]);

  const isLimitReached = useMemo(() => {
    if (!userMeta) return false;
    if (isPremium) return false; // Premium ignora limite
    return userMeta.launchCount >= userMeta.launchLimit;
  }, [userMeta, isPremium]);

  useEffect(() => {
    let metaRef: firebase.database.Reference | null = null;
    let lancamentosRef: firebase.database.Reference | null = null;
    let unsubFirestore: (() => void) | null = null;

    const init = async () => {
      await authReadyPromise;
      setIsReady(true);

      // --- 1. Realtime DB (Dados de Lançamentos) ---
      const userRootPath = `users/${userId}`;
      const metaPath = `${userRootPath}/meta`;
      const lancamentosPath = `${userRootPath}/gerenciadorFinanceiro/lancamentos`;
      
      // Cria Meta Dados se não existirem
      metaRef = database.ref(metaPath);
      metaRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
          const rootRef = database.ref(userRootPath);
          rootRef.update({
            meta: {
              ...DEFAULT_META,
              createdAt: firebase.database.ServerValue.TIMESTAMP,
              updatedAt: firebase.database.ServerValue.TIMESTAMP
            }
          });
        }
      }).catch(err => console.error("Erro meta:", err));

      metaRef.on('value', (snapshot) => {
        const data = snapshot.val();
        setUserMeta(data ? data : DEFAULT_META);
      });

      lancamentosRef = database.ref(lancamentosPath);
      lancamentosRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const loadedLancamentos = data ? Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          _firebaseKey: key
        })) : [];
        setLancamentos(loadedLancamentos.reverse()); 
      });

      // --- 2. Firestore (Assinatura) ---
      // Apenas se não for usuário guest/placeholder
      if (userId && userId !== 'guest_placeholder') {
        const userDocRef = db.collection('users').doc(userId);
        unsubFirestore = userDocRef.onSnapshot((docSnap) => {
          if (docSnap.exists) {
            setFirestoreUser(docSnap.data() as AppUserDoc);
          }
        });
      }
    };

    if (userId && userId !== 'guest_placeholder') {
      init();
    } else {
      setLancamentos([]);
      setUserMeta(null);
      setFirestoreUser(null);
    }

    return () => {
      if (metaRef) metaRef.off();
      if (lancamentosRef) lancamentosRef.off();
      if (unsubFirestore) unsubFirestore();
    };
  }, [userId]);

  const saveLancamento = async (lancamento: any) => {
    if (!isReady) throw new Error("Conexão pendente.");

    // Bloqueio do Freemium
    if (isLimitReached) {
        throw new Error("LIMIT_REACHED");
    }

    try {
      const newKey = uuidv4();
      const listRef = database.ref(`users/${userId}/gerenciadorFinanceiro/lancamentos`);
      const newRef = listRef.push(); 
      const pushKey = newRef.key;

      if (!pushKey) throw new Error("Erro chave Firebase");

      const updates: any = {};
      updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${pushKey}`] = { ...lancamento, id: newKey };
      updates[`users/${userId}/meta/launchCount`] = firebase.database.ServerValue.increment(1);
      updates[`users/${userId}/meta/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

      await database.ref().update(updates);
      
    } catch (error: any) {
      console.error('Save Error:', error);
      if (error.message === 'LIMIT_REACHED') throw error;
      throw error;
    }
  };

  const deleteLancamento = async (id: string) => {
    if (!isReady) return;
    const item = lancamentos.find(l => l.id === id);
    if (item && item._firebaseKey) {
      try {
        const updates: any = {};
        updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${item._firebaseKey}`] = null;
        // Decrementa contador (opcional, alguns freemiums não devolvem o crédito, mas aqui devolvemos)
        updates[`users/${userId}/meta/launchCount`] = firebase.database.ServerValue.increment(-1);
        updates[`users/${userId}/meta/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;
        await database.ref().update(updates);
      } catch (error) {
        console.error("Delete error:", error);
        throw error;
      }
    }
  };

  return { 
    lancamentos, 
    userMeta, 
    saveLancamento, 
    deleteLancamento, 
    isPremium,
    isLimitReached,
    usagePercentage
  };
};
