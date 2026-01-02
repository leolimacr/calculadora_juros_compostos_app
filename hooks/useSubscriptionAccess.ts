
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUserDoc, isSitePremium, isAppPremium } from '../types/user';

export function useSubscriptionAccess() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    hasSitePremium: boolean;
    hasAppPremium: boolean;
    loadingSubscription: boolean;
    expiryDate?: Date;
  }>({
    hasSitePremium: false,
    hasAppPremium: false,
    loadingSubscription: true,
  });

  useEffect(() => {
    if (!user) {
      setData({
        hasSitePremium: false,
        hasAppPremium: false,
        loadingSubscription: false,
      });
      return;
    }

    // Escuta em tempo real o documento do usuário no Firestore
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as AppUserDoc;
        
        const siteAccess = isSitePremium(userData);
        const appAccess = isAppPremium(userData);
        const expiryDate = userData.subscription?.expiryDate?.toDate();

        setData({
          hasSitePremium: siteAccess,
          hasAppPremium: appAccess,
          loadingSubscription: false,
          expiryDate: expiryDate,
        });
      } else {
        // Usuário existe no Auth mas não tem doc no Firestore ainda (recém criado)
        setData({
          hasSitePremium: false,
          hasAppPremium: false,
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
