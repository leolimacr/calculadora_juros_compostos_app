
// src/hooks/useFirebase.ts
import { useState, useEffect } from 'react';
import { ref, push, onValue, remove } from 'firebase/database';
import { database, authReadyPromise } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

export const useFirebase = (userId: string) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      // Aguarda o login anônimo completar antes de conectar ao banco
      await authReadyPromise;
      setIsReady(true);

      const dbPath = `users/${userId}/gerenciadorFinanceiro/lancamentos`;
      console.log('🔥 Conectando ao Realtime Database em:', dbPath);
      
      const lancamentosRef = ref(database, dbPath);
      
      unsubscribe = onValue(lancamentosRef, (snapshot) => {
        const data = snapshot.val();
        const loadedLancamentos = data ? Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          _firebaseKey: key
        })) : [];
        setLancamentos(loadedLancamentos.reverse()); 
      }, (error) => {
        console.error("❌ Erro de Leitura Firebase:", error);
      });
    };

    if (userId && userId !== 'guest_placeholder') {
      init();
    } else {
      setLancamentos([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const saveLancamento = async (lancamento: any) => {
    if (!isReady) {
      console.warn("⚠️ Firebase ainda não está pronto. Aguarde...");
      return;
    }

    try {
      const lancamentosRef = ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos`);
      await push(lancamentosRef, { ...lancamento, id: uuidv4() });
      console.log('✅ Lançamento salvo com sucesso!');
    } catch (error: any) {
      console.error('❌ ERRO AO SALVAR:', error);
      if (error.code === 'PERMISSION_DENIED') {
        alert("Erro de Permissão: Verifique se o 'Anonymous Auth' está ativado no Firebase Console.");
      }
      throw error;
    }
  };

  const deleteLancamento = async (id: string) => {
    if (!isReady) return;
    
    const lancamentoToDelete = lancamentos.find(l => l.id === id);
    if (lancamentoToDelete && lancamentoToDelete._firebaseKey) {
      try {
        const lancamentoRef = ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos/${lancamentoToDelete._firebaseKey}`);
        await remove(lancamentoRef);
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  return { lancamentos, saveLancamento, deleteLancamento };
};
