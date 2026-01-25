import { useState, useEffect, useMemo } from 'react';
import { db, firestore, auth } from '../firebase';
import { ref, onValue, push, update, serverTimestamp, query, limitToLast, remove } from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserMeta } from '../types';
import { AppUserDoc, isAppPremium } from '../types/user';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', type: 'expense' },
  { name: 'Moradia', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Lazer', type: 'expense' },
  { name: 'Saúde', type: 'expense' },
  { name: 'Educação', type: 'expense' },
  { name: 'Salário', type: 'income' },
  { name: 'Investimentos', type: 'income' },
  { name: 'Freelance', type: 'income' },
];

const DEFAULT_META: UserMeta = {
  plan: 'free', launchLimit: 30, launchCount: 0, createdAt: Date.now(), updatedAt: Date.now()
};

export const useFirebase = (userId: string | undefined | null) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [userMeta, setUserMeta] = useState<UserMeta>(DEFAULT_META);
  const [firestoreUser, setFirestoreUser] = useState<AppUserDoc | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => setAuthReady(true));
    return () => unsubscribe();
  }, []);

  const isPremium = useMemo(() => isAppPremium(firestoreUser), [firestoreUser]);
  const isPro = useMemo(() => firestoreUser?.subscription?.planId?.includes('pro'), [firestoreUser]);
  const usagePercentage = useMemo(() => (!userMeta?.launchLimit || isPremium || isPro) ? 0 : Math.min(100, (userMeta.launchCount / userMeta.launchLimit) * 100), [userMeta, isPremium, isPro]);
  const isLimitReached = useMemo(() => (!userMeta || isPremium || isPro) ? false : userMeta.launchCount >= userMeta.launchLimit, [userMeta, isPremium, isPro]);

  useEffect(() => {
    if (!authReady || !userId || userId === 'guest') {
      if (authReady) setIsLoadingData(false);
      return;
    }

    const metaRef = ref(db, `users/${userId}/meta`);
    onValue(metaRef, (snapshot) => setUserMeta(snapshot.val() || DEFAULT_META));

    const lancamentosRef = query(ref(db, `users/${userId}/gerenciadorFinanceiro/lancamentos`), limitToLast(100));
    onValue(lancamentosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data).map(([key, value]: [string, any]) => ({ ...value, id: key }));
        setLancamentos(arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else setLancamentos([]);
      setIsLoadingData(false);
    });

    // LISTENER DE CATEGORIAS COM AUTO-SEED
    const categoriesRef = ref(db, `users/${userId}/gerenciadorFinanceiro/categories`);
    onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data).map(([key, value]: [string, any]) => ({ ...value, id: key }));
        setCategories(arr);
      } else {
        // Se o banco estiver vazio, "planta" as categorias padrão no banco do usuário
        const updates: any = {};
        DEFAULT_CATEGORIES.forEach(cat => {
          const newKey = push(ref(db, `users/${userId}/gerenciadorFinanceiro/categories`)).key;
          updates[`users/${userId}/gerenciadorFinanceiro/categories/${newKey}`] = { ...cat, id: newKey };
        });
        update(ref(db), updates);
      }
    });

    if (firestore) {
      onSnapshot(doc(firestore, 'users', userId), (docSnap) => {
        if (docSnap.exists()) setFirestoreUser(docSnap.data() as AppUserDoc);
      });
    }
  }, [userId, authReady]);

  const saveLancamento = async (t: any) => {
    if (!userId) return;
    const newRef = push(ref(db, `users/${userId}/gerenciadorFinanceiro/lancamentos`));
    await update(ref(db), {
      [`users/${userId}/gerenciadorFinanceiro/lancamentos/${newRef.key}`]: { ...t, id: newRef.key, createdAt: serverTimestamp() },
      [`users/${userId}/meta/launchCount`]: (userMeta.launchCount || 0) + 1
    });
  };

  const deleteLancamento = async (id: string) => {
    if (!userId) return;
    await update(ref(db), {
      [`users/${userId}/gerenciadorFinanceiro/lancamentos/${id}`]: null,
      [`users/${userId}/meta/launchCount`]: Math.max(0, (userMeta.launchCount || 1) - 1)
    });
  };

  const saveCategory = async (cat: any) => {
    if (!userId) return;
    const id = cat.id || push(ref(db, `users/${userId}/gerenciadorFinanceiro/categories`)).key;
    await update(ref(db, `users/${userId}/gerenciadorFinanceiro/categories/${id}`), { ...cat, id, updatedAt: serverTimestamp() });
  };

  const deleteCategory = async (id: string) => {
    if (!userId) return;
    await remove(ref(db, `users/${userId}/gerenciadorFinanceiro/categories/${id}`));
  };

  return { lancamentos, categories, userMeta, isPremium, isPro, isLimitReached, usagePercentage, isLoadingData, saveLancamento, deleteLancamento, saveCategory, deleteCategory };
};