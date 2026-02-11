import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore';

console.log("✅ useSubscriptionAccess.ts carregado - Versão Final Corrigida");

export const useSubscriptionAccess = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<'free' | 'pro' | 'premium'>('free');
  const [loadingSubscription, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('free');
      setLoading(false);
      return;
    }

    if (!firestore) {
      setRole('free');
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', user.uid);

      const unsub = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const sub = data?.subscription;
            
            // ✅ CORREÇÃO: Pegando 'plan' (correto) em vez de 'planId' (errado)
            // ✅ CORREÇÃO: Usando o campo 'active' (booleano) que você criou
            const isActive = sub?.active === true || sub?.status === 'active';
            const planName = (sub?.plan || '').toLowerCase();

            console.log("🔍 Verificação de Assinatura:", { isActive, planName });

            if (isActive) {
              if (planName.includes('premium')) {
                setRole('premium');
              } else if (planName.includes('pro')) {
                setRole('pro');
              } else {
                setRole('free');
              }
            } else {
              setRole('free');
            }
          } else {
            setRole('free');
          }
          setLoading(false);
        },
        (err) => {
          console.error('❌ Erro ao ler assinatura:', err);
          setRole('free');
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (error) {
      setRole('free');
      setLoading(false);
    }
  }, [user]);

  const isPro = role === 'pro' || role === 'premium';
  const isPremium = role === 'premium';
  
  return {
    isPro,
    isPremium,
    loadingSubscription,
    role
  };
};