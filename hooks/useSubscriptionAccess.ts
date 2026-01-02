
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
    status?: string;
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

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as AppUserDoc;
        let plan = userData.plan || 'free';
        const sub = userData.subscription;
        
        // Verifica validade da assinatura
        let isValid = true;
        let expiryDate: Date | undefined;
        let status = sub?.status;

        if (sub?.expiryDate) {
          expiryDate = sub.expiryDate.toDate();
          // Considera válido se status for active ou trialing, ou se data futura
          if (expiryDate < new Date() && status !== 'active' && status !== 'trialing') {
            isValid = false;
          }
        }

        // Se expirou ou cancelou/falhou, fallback para free
        const activePlan = isValid ? plan : 'free';

        setData({
          plan: activePlan,
          isPro: hasProAccess(activePlan),
          isPremium: hasPremiumAccess(activePlan),
          loadingSubscription: false,
          expiryDate: expiryDate,
          status: status
        });
      } else {
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
