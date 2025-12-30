
// src/hooks/useFirebase.ts
import { useState, useEffect } from 'react';
import { ref, onValue, update, get, serverTimestamp, increment, child, push } from 'firebase/database';
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

  useEffect(() => {
    let unsubscribeLancamentos: (() => void) | undefined;
    let unsubscribeMeta: (() => void) | undefined;

    const init = async () => {
      // Aguarda o login anônimo completar antes de conectar ao banco
      await authReadyPromise;
      setIsReady(true);

      const userRootPath = `users/${userId}`;
      const metaPath = `${userRootPath}/meta`;
      const lancamentosPath = `${userRootPath}/gerenciadorFinanceiro/lancamentos`;
      
      console.log('🔥 Conectando ao Realtime Database para:', userId);
      
      // 1. Verificar e Criar Meta Dados se não existirem (Onboarding do Banco de Dados)
      const metaRef = ref(database, metaPath);
      get(metaRef).then((snapshot) => {
        if (!snapshot.exists()) {
          console.log('🆕 Novo usuário detectado. Criando perfil Freemium...');
          update(ref(database, userRootPath), {
            meta: {
              ...DEFAULT_META,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          });
        }
      }).catch(err => console.error("Erro ao verificar meta:", err));

      // 2. Listener para Meta Dados (Plano, Limites, Contagem)
      unsubscribeMeta = onValue(metaRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserMeta(data);
        } else {
          // Fallback visual enquanto não cria no banco
          setUserMeta(DEFAULT_META);
        }
      });

      // 3. Listener para Lançamentos
      const lancamentosRef = ref(database, lancamentosPath);
      unsubscribeLancamentos = onValue(lancamentosRef, (snapshot) => {
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
      setUserMeta(null);
    }

    return () => {
      if (unsubscribeLancamentos) unsubscribeLancamentos();
      if (unsubscribeMeta) unsubscribeMeta();
    };
  }, [userId]);

  const saveLancamento = async (lancamento: any) => {
    if (!isReady) {
      throw new Error("Conexão com o banco de dados ainda não estabelecida. Verifique sua internet.");
    }

    // Validação de Limite Freemium
    if (userMeta && userMeta.plan === 'free') {
        if (userMeta.launchCount >= userMeta.launchLimit) {
            throw new Error(`LIMIT_REACHED: Você atingiu o limite de ${userMeta.launchLimit} lançamentos do plano Grátis.`);
        }
    }

    try {
      const newKey = uuidv4(); // ID local para referência
      const listRef = ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos`);
      const pushKey = push(listRef).key; // ID do Firebase

      if (!pushKey) throw new Error("Falha ao gerar chave do Firebase");

      // Atualização Atômica: Salva o lançamento E incrementa o contador ao mesmo tempo
      const updates: any = {};
      
      // 1. O Lançamento
      updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${pushKey}`] = { 
        ...lancamento, 
        id: newKey // Mantemos o ID local por compatibilidade, mas a chave real é pushKey
      };
      
      // 2. O Contador (Incremento Atômico no Servidor)
      updates[`users/${userId}/meta/launchCount`] = increment(1);
      updates[`users/${userId}/meta/updatedAt`] = serverTimestamp();

      await update(ref(database), updates);
      console.log('✅ Lançamento salvo e contador atualizado!');
      
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
        // Atualização Atômica: Remove o lançamento E decrementa o contador
        const updates: any = {};
        
        // 1. Remove Lançamento (null deleta)
        updates[`users/${userId}/gerenciadorFinanceiro/lancamentos/${lancamentoToDelete._firebaseKey}`] = null;
        
        // 2. Decrementa Contador
        updates[`users/${userId}/meta/launchCount`] = increment(-1);
        updates[`users/${userId}/meta/updatedAt`] = serverTimestamp();

        await update(ref(database), updates);
        console.log('🗑️ Lançamento removido e contador atualizado.');

      } catch (error) {
        console.error("Erro ao excluir:", error);
        throw error;
      }
    }
  };

  return { lancamentos, userMeta, saveLancamento, deleteLancamento };
};
