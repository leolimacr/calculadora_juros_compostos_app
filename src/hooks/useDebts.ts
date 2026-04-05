import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';

export interface DebtItem {
  id?: string;
  nome: string;
  tipo: string;
  saldoDevedor: number;
  taxaMensal: number;
  parcelasRestantes: number;
  valorParcela?: number;
  createdAt?: any;
}

export const useDebts = (userId: string | undefined) => {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDebts([]);
      setLoading(false);
      return;
    }

    const debtsRef = collection(firestore, `users/${userId}/dividas`);
    const q = query(debtsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: DebtItem[] = [];
        snapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as DebtItem);
        });
        setDebts(loaded);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar dívidas:', err);
        setError('Erro ao carregar dívidas');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { debts, loading, error };
};
