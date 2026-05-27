import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
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
            const isActive = sub?.active === true || sub?.status === 'active';
            const planName = (sub?.plan || '').toLowerCase();

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
    } catch {
      setRole('free');
      setLoading(false);
    }
  }, [user]);

  const isFree = role === 'free';
  const isPro = role === 'pro' || role === 'premium';
  const isPremium = role === 'premium';
  const hasPaidAccess = isPro;
  const planLabel = role === 'premium' ? 'Premium' : role === 'pro' ? 'Pro' : 'Free';

  return {
    isFree,
    isPro,
    isPremium,
    hasPaidAccess,
    loadingSubscription,
    role,
    planLabel
  };
};