import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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

    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // BLINDAGEM AQUI TAMBÉM
        const sub = data?.subscription;
        const status = sub?.status || 'inactive';
        const planId = sub?.planId || ''; // Garante que nunca é undefined

        if (status === 'active' || status === 'trialing') {
            if (planId.includes('premium')) setRole('premium');
            else if (planId.includes('pro')) setRole('pro');
            else setRole('free');
        } else {
            setRole('free');
        }
      } else {
        setRole('free');
      }
      setLoading(false);
    }, (err) => {
      console.error('Erro assinatura:', err);
      // Em caso de erro, assume Free para não travar o app
      setRole('free');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return {
    isPro: role === 'pro' || role === 'premium',
    isPremium: role === 'premium',
    loadingSubscription,
    role
  };
};