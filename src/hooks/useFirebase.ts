import { useState, useEffect, useMemo } from 'react';
import { database, authReadyPromise, db } from '../firebase';
import { ref, onValue, push, update, serverTimestamp, query, limitToLast, remove } from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserMeta } from '../types';
import { AppUserDoc, isAppPremium } from '../types/user';

const DEFAULT_META: UserMeta = {
  plan: 'free',
  launchLimit: 30,
  launchCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const useFirebase = (userId: string | undefined | null) => {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  
  // Novas estruturas de Chat
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  const [userMeta, setUserMeta] = useState<UserMeta>(DEFAULT_META);
  const [firestoreUser, setFirestoreUser] = useState<AppUserDoc | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const isPremium = useMemo(() => isAppPremium(firestoreUser), [firestoreUser]);
  const isPro = useMemo(() => firestoreUser?.subscription?.planId?.includes('pro'), [firestoreUser]);
  
  const usagePercentage = useMemo(() => {
    if (!userMeta?.launchLimit) return 0;
    if (isPremium || isPro) return 0;
    return Math.min(100, (userMeta.launchCount / userMeta.launchLimit) * 100);
  }, [userMeta, isPremium, isPro]);

  const isLimitReached = useMemo(() => {
    if (!userMeta) return false;
    if (isPremium || isPro) return false;
    return userMeta.launchCount >= userMeta.launchLimit;
  }, [userMeta, isPremium, isPro]);

  // LÓGICA DE VALIDADE DAS CONVERSAS
  const sessionRetentionLimit = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (isPremium) return 0; // Eterno
    if (isPro) return now - (60 * day); // 60 dias
    return now - (5 * day); // Free: 5 dias
  }, [isPremium, isPro]);

  useEffect(() => {
    if (!userId || userId === 'guest') {
        setIsLoadingData(false);
        return;
    }

    const init = async () => {
      await authReadyPromise;

      // 1. Meta, Lançamentos, Goals (Iguais)
      onValue(ref(database, `users/${userId}/meta`), (s) => setUserMeta(s.val() || DEFAULT_META));
      onValue(query(ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos`), limitToLast(50)), (s) => {
        const data = s.val();
        const loaded = data ? Object.entries(data).map(([key, value]: [string, any]) => ({ ...value, id: key })) : [];
        setLancamentos(loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsLoadingData(false);
      });
      onValue(ref(database, `users/${userId}/gerenciadorFinanceiro/goals`), (s) => {
        const data = s.val();
        setGoals(data ? Object.entries(data).map(([key, value]: [string, any]) => ({ ...value, id: key })) : []);
      });

      // 2. SESSÕES DE CHAT (Nova Lógica)
      onValue(ref(database, `users/${userId}/chat_sessions`), (s) => {
        const data = s.val();
        if (data) {
            const list = Object.entries(data).map(([key, value]: [string, any]) => ({ ...value, id: key }));
            
            // Filtra sessões expiradas (Regra de Negócio)
            const validSessions = list.filter(session => {
                if (sessionRetentionLimit > 0 && session.createdAt < sessionRetentionLimit) {
                    // Apaga silenciosamente do banco se expirou
                    remove(ref(database, `users/${userId}/chat_sessions/${session.id}`));
                    return false;
                }
                return true;
            });
            
            // Ordena da mais recente para a mais antiga
            setChatSessions(validSessions.sort((a, b) => b.createdAt - a.createdAt));
            
            // Se não tem sessão selecionada mas tem lista, seleciona a última
            if (!currentSessionId && validSessions.length > 0) {
                setCurrentSessionId(validSessions[0].id);
            }
        } else {
            setChatSessions([]);
            setCurrentSessionId(null);
        }
      });

      // 3. Plano
      onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) setFirestoreUser(docSnap.data() as AppUserDoc);
      });
    };
    init();
  }, [userId, sessionRetentionLimit]);

  // Monitora mensagens da sessão atual
  useEffect(() => {
      if (!userId || !currentSessionId) {
          setCurrentMessages([]);
          return;
      }
      const messagesRef = ref(database, `users/${userId}/chat_sessions/${currentSessionId}/messages`);
      const unsub = onValue(messagesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const loaded = Object.values(data).sort((a: any, b: any) => a.timestamp - b.timestamp);
              setCurrentMessages(loaded);
          } else {
              setCurrentMessages([]);
          }
      });
      return () => unsub();
  }, [userId, currentSessionId]);

  // FUNÇÕES DE AÇÃO

  const createNewChatSession = async () => {
    if (!userId) return;
    const newRef = push(ref(database, `users/${userId}/chat_sessions`));
    const newSessionId = newRef.key;
    const title = `Conversa de ${new Date().toLocaleDateString('pt-BR')}`;
    
    await update(ref(database), {
        [`users/${userId}/chat_sessions/${newSessionId}`]: { 
            id: newSessionId, 
            createdAt: serverTimestamp(),
            title: title
        }
    });
    setCurrentSessionId(newSessionId);
    return newSessionId;
  };

  const saveChatMessage = async (role: 'user' | 'ai', text: string) => {
    if (!userId) return;
    
    // Se não tem sessão, cria uma agora
    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
        targetSessionId = await createNewChatSession();
    }

    if (targetSessionId) {
        const msgRef = push(ref(database, `users/${userId}/chat_sessions/${targetSessionId}/messages`));
        await update(ref(database), {
            [`users/${userId}/chat_sessions/${targetSessionId}/messages/${msgRef.key}`]: { 
                role, text, timestamp: serverTimestamp() 
            },
            // Atualiza o timestamp da sessão para ela ficar em 1º
            [`users/${userId}/chat_sessions/${targetSessionId}/createdAt`]: serverTimestamp()
        });
    }
  };

  const saveLancamento = async (l: any) => { if (!userId) return; const r = push(ref(database, `users/${userId}/gerenciadorFinanceiro/lancamentos`)); await update(ref(database), { [`users/${userId}/gerenciadorFinanceiro/lancamentos/${r.key}`]: { ...l, id: r.key, createdAt: serverTimestamp() }, [`users/${userId}/meta/launchCount`]: (userMeta.launchCount || 0) + 1 }); };
  const deleteLancamento = async (id: string) => { if (!userId) return; await update(ref(database), { [`users/${userId}/gerenciadorFinanceiro/lancamentos/${id}`]: null, [`users/${userId}/meta/launchCount`]: Math.max(0, (userMeta.launchCount || 1) - 1) }); };
  const addGoal = async (g: any) => { if (userId) { const r = push(ref(database, `users/${userId}/gerenciadorFinanceiro/goals`)); await update(ref(database), { [`users/${userId}/gerenciadorFinanceiro/goals/${r.key}`]: { ...g, id: r.key } }); }};
  const updateGoal = async (id: string, v: number) => { if (userId) await update(ref(database), { [`users/${userId}/gerenciadorFinanceiro/goals/${id}/currentAmount`]: v }); };
  const deleteGoal = async (id: string) => { if (userId) await update(ref(database), { [`users/${userId}/gerenciadorFinanceiro/goals/${id}`]: null }); };

  return { 
    lancamentos, goals, userMeta, isPremium, isPro, isLimitReached, usagePercentage, isLoadingData,
    chatSessions, currentSessionId, currentMessages, setCurrentSessionId, createNewChatSession, // EXPORTADOS
    saveLancamento, deleteLancamento, addGoal, updateGoal, deleteGoal, saveChatMessage
  };
};