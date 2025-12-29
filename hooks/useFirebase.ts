// src/hooks/useFirebase.ts
import { useState, useEffect } from 'react';
import { ref, push, onValue, remove } from 'firebase/database';
import { database } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

export const useFirebase = (userId: string) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);

  useEffect(() => {
    const lancamentosRef = ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos`);
    onValue(lancamentosRef, (snapshot) => {
      const data = snapshot.val();
      const loadedLancamentos = data ? Object.entries(data).map(([key, value]: [string, any]) => ({
        ...value,
        _firebaseKey: key
      })) : [];
      // Reverter para mostrar mais recentes primeiro
      setLancamentos(loadedLancamentos.reverse()); 
    });
  }, [userId]);

  const saveLancamento = async (lancamento: any) => {
    console.log('🔥 TENTANDO SALVAR:', lancamento);
    try {
      const lancamentosRef = ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos`);
      // App uses 'date' field provided in lancamento object
      await push(lancamentosRef, { ...lancamento, id: uuidv4() });
      console.log('✅ SALVOU NO FIREBASE!');
    } catch (error) {
      console.error('❌ ERRO SAVE:', error);
      throw error;
    }
  };

  const deleteLancamento = async (id: string) => {
    // Find key by app ID
    const lancamentoToDelete = lancamentos.find(l => l.id === id);
    if (lancamentoToDelete && lancamentoToDelete._firebaseKey) {
      const lancamentoRef = ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos/${lancamentoToDelete._firebaseKey}`);
      await remove(lancamentoRef);
    }
  };

  return { lancamentos, saveLancamento, deleteLancamento };
};