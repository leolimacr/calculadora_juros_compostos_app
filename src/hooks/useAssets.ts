import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { ActiveAsset } from '../components/tools/wealth/ActiveWealthManager';

export const useAssets = (userId: string | undefined) => {
  const [assets, setAssets] = useState<ActiveAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    const assetsRef = collection(firestore, `users/${userId}/ativos`);
    const q = query(assetsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedAssets: ActiveAsset[] = [];
        snapshot.forEach((doc) => {
          loadedAssets.push({ id: doc.id, ...doc.data() } as ActiveAsset);
        });
        setAssets(loadedAssets);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar ativos:', err);
        setError('Erro ao carregar ativos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { assets, loading, error };
};