
// src/hooks/useFirebase.ts
import { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/app';
import { database, authReadyPromise } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { UserMeta } from '../types';

const DEFAULT_META: UserMeta = {
  plan: 'free',
  launchLimit: 30, // Limite inicial para plano gratuito
  launchCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const useFirebase = (userId: string) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Propriedades Derivadas (Helpers)
  const isPremium = useMemo(() => userMeta?.plan === 'premium', [userMeta]);
  
  const usagePercentage = useMemo(() => {
    if (!userMeta) return 0;
    if (isPremium) return 0; // Premium não tem barra de limite visual
    return Math.min(100, (userMeta.launchCount / userMeta.launchLimit) * 100);
  }, [userMeta, isPremium]);

  const isLimitReached = useMemo(() => {
    if (!userMeta) return false;
    if (isPremium) return false;
    return userMeta.launchCount >= userMeta.launchLimit;
  }, [userMeta, isPremium]);

  useEffect(() => {
    let metaRef: firebase.database.Reference | null = null;
    let lancamentosRef: firebase.database.Reference | null = null;

    const init = async () => {
      // Aguarda o login anônimo completar antes de conectar ao banco
      await authReadyPromise;
      setIsReady(true);

      const userRootPath = `users/${userId}`;
      const metaPath = `${userRootPath}/meta`;
      const lancamentosPath = `${userRootPath}/gerenciadorFinanceiro/lancamentos`;
      
      console.log('🔥 Conectando ao Realtime Database para:', userId);
      
      // 1. Verificar e Criar Meta Dados se não existirem
      metaRef = database.ref(metaPath);
      metaRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
          console.log('🆕 Novo usuário detectado. Criando perfil Freemium...');
          database.ref(userRootPath).update({
            meta: {
              ...DEFAULT_META,
              createdAt: firebase.database.ServerValue.TIMESTAMP,
              updatedAt: firebase.database.ServerValue.TIMESTAMP
            }
          });
        }
      }).catch(err => console.error("Erro ao verificar meta:", err));

      // 2. Listener para Meta Dados
      metaRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserMeta(data);
        } else {
          setUserMeta(DEFAULT_META);
        }
      });

      // 3. Listener para Lançamentos
      lancamentosRef = database.ref(lancamentosPath);
      lancamentosRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const loadedLancamentos = data ? Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          _firebaseKey: key
        })) : [];
        setLancamentos(loadedLancamentos.reverse()); 
      }, (error: any) => {
        console.error("❌ Erro de Leitura Firebase:", error);
      });
    };

    if (userId && userId !== 'guest_placeholder') {
      init();
    } else {
      setLancamentos([]);
      setUserMeta(null);
    }

    return () => {
      if (metaRef) metaRef.off();
      if (lancamentosRef) lancamentosRef.off();
    };
  }, [userId]);

  const saveLancamento = async (lancamento: any) => {
    if (!isReady) {
      throw new Error("Conexão com o banco de dados ainda não estabelecida. Verifique sua internet.");
    }

    if (isLimitReached) {
        throw new Error("LIMIT_REACHED");
    }

    try {
      const newKey = uuidv4();
      const pushKey = database.ref(`users/${userId}/gerenciadorFinanceiro/lancamentos`).push().key;

      if (!pushKey) throw new Error("Falha ao gerar chave do Firebase");

      const updates: any = {};
      
      // 1. O Lançamento
      updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${pushKey}`] = { 
        ...lancamento, 
        id: newKey 
      };
      
      // 2. O Contador
      updates[`users/${userId}/meta/launchCount`] = firebase.database.ServerValue.increment(1);
      updates[`users/${userId}/meta/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

      await database.ref().update(updates);
      console.log('✅ Lançamento salvo e contador atualizado!');
      
    } catch (error: any) {
      console.error('❌ ERRO AO SALVAR:', error);
      if (error.message === 'LIMIT_REACHED') throw error;
      
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
        const updates: any = {};
        
        updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${lancamentoToDelete._firebaseKey}`] = null;
        updates[`users/${userId}/meta/launchCount`] = firebase.database.ServerValue.increment(-1);
        updates[`users/${userId}/meta/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;

        await database.ref().update(updates);
        console.log('🗑️ Lançamento removido e contador atualizado.');

      } catch (error) {
        console.error("Erro ao excluir:", error);
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
