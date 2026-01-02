
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUserDoc, hasProAccess, hasPremiumAccess, SubscriptionPlan } from '../types/user';

export function useSubscriptionAccess() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    plan: SubscriptionPlan;
    isPro: boolean;
    isPremium: boolean;
    loadingSubscription: boolean;
    expiryDate?: Date;
  }>({
    plan: 'free',
    isPro: false,
    isPremium: false,
    loadingSubscription: true,
  });

  useEffect(() => {
    if (!user) {
      setData({
        plan: 'free',
        isPro: false,
        isPremium: false,
        loadingSubscription: false,
      });
      return;
    }

    // Escuta em tempo real o documento do usuário no Firestore
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as AppUserDoc;
        const plan = userData.plan || 'free';
        
        // Verifica validade (se existir data de expiração)
        let isValid = true;
        let expiryDate: Date | undefined;
        
        if (userData.subscription?.expiryDate) {
          expiryDate = userData.subscription.expiryDate.toDate();
          if (expiryDate < new Date()) {
            isValid = false;
          }
        }

        // Se expirou, fallback para free
        const activePlan = isValid ? plan : 'free';

        setData({
          plan: activePlan,
          isPro: hasProAccess(activePlan),
          isPremium: hasPremiumAccess(activePlan),
          loadingSubscription: false,
          expiryDate: expiryDate,
        });
      } else {
        // Usuário novo sem doc ainda
        setData({
          plan: 'free',
          isPro: false,
          isPremium: false,
          loadingSubscription: false,
        });
      }
    }, (error) => {
      console.error("Erro ao verificar assinatura:", error);
      setData(prev => ({ ...prev, loadingSubscription: false }));
    });

    return () => unsubscribe();
  }, [user]);

  return data;
}
