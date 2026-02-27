import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { PassiveAsset } from '../components/tools/wealth/PassiveWealthManager';

export const usePassives = (userId: string | undefined) => {
  const [passives, setPassives] = useState<PassiveAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPassives([]);
      setLoading(false);
      return;
    }

    const passivesRef = collection(firestore, `users/${userId}/passivos`);
    const q = query(passivesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedPassives: PassiveAsset[] = [];
        snapshot.forEach((doc) => {
          loadedPassives.push({ id: doc.id, ...doc.data() } as PassiveAsset);
        });
        setPassives(loadedPassives);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar passivos:', err);
        setError('Erro ao carregar passivos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { passives, loading, error };
};