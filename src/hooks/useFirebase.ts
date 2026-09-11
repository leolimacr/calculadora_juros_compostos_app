import { useState, useEffect } from 'react';
import {
  ref,
  remove
} from 'firebase/database';
import {
  db, firestore, auth
} from '../firebase'; // Adicionado 'auth' aqui
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // Novas importações
import type { FinancialProfile } from '../types';
import { useUserMeta } from './useUserMeta';
import { useCategories } from './useCategories';
import { useTransactions } from './useTransactions';

export const useFirebase = (userId?: string) => {
  const [loading, setLoading] = useState(true);

  // Usa hooks dedicados migrados
  const { userMeta, loading: metaLoading } = useUserMeta(userId);
  const userMetaLoaded = !metaLoading;
  const { categories, loading: categoriesLoading, saveCategory, deleteCategory } = useCategories(userId);
  const { 
    transactions: lancamentos, 
    loading: transLoading, 
    isSyncing: transSyncing,
    saveLancamento, 
    deleteLancamento,
    fetchHistory,
    fetchMonth 
  } = useTransactions(userId);

  useEffect(() => {
    setLoading(metaLoading || categoriesLoading || transLoading);
  }, [metaLoading, categoriesLoading, transLoading]);

  // Funções de escrita mantidas para compatibilidade (delegam para os hooks novos)
  const saveFinancialProfile = async (profile: FinancialProfile) => {
    if (!userId) return;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const userDocRef = doc(firestore, 'users', userId);
      await setDoc(userDocRef, { financialProfile: profile }, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar perfil financeiro:", error);
      throw error;
    }
  };

  const wipeUserData = async () => {
    if (!userId) return;
    const { doc, deleteDoc } = await import('firebase/firestore');
    try {
      await remove(ref(db, `transactions/${userId}`));
      await deleteDoc(doc(firestore, 'users', userId));
      await deleteDoc(doc(firestore, 'categories', userId));
    } catch (error) {
      throw error;
    }
  };

  const isLimitReached = false;
  const usagePercentage = 0;

  const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
  const register = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);

  return {
    lancamentos,
    categories,
    userMeta,
    userMetaLoaded,
    loading,
    isSyncing: transSyncing,
    saveLancamento,
    deleteLancamento,
    fetchHistory,
    fetchMonth,
    saveCategory,
    deleteCategory,
    saveFinancialProfile,
    wipeUserData, 
    isLimitReached,
    usagePercentage,
    login,
    register
  };
};
