import { useQuery } from '@tanstack/react-query';
import { getDocs, collection } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { queryKeys } from '../../core/query/queryKeys';
import { saveDebt, updateDebt, deleteDebt } from './debtService';
import type { DebtItem } from './debt.types';
import { createMutationHook } from '../../core/query/patterns/createMutationHook';
import { useDebtContext } from '../../contexts/DebtContext';
import { mapDebtFromFirestore } from './debt.mapper';

export const useDebts = (userId?: string) => {
  const { debtBridgeReady } = useDebtContext();
  const key = queryKeys.debts.byUser(userId || 'anonymous');

  const cachedRaw = typeof window !== 'undefined' 
    ? (() => {
        const newKey = `financas-pro-invest_debts_${userId}`;
        const legacyKey = `fpi_debts_${userId}`;
        const fromNew = localStorage.getItem(newKey);
        if (fromNew) return fromNew;
        const fromLegacy = localStorage.getItem(legacyKey);
        if (fromLegacy) {
          try { localStorage.setItem(newKey, fromLegacy); localStorage.removeItem(legacyKey); } catch {}
          return fromLegacy;
        }
        return null;
      })()
    : null;
    
  const cachedData = cachedRaw 
    ? (() => { 
        try { 
          const p = JSON.parse(cachedRaw); 
          // Cache válido por 24 horas para dívidas (mudam menos que transações)
          return Date.now() - p.ts < 86_400_000 ? p.data : undefined; 
        } catch { return undefined; } 
      })()
    : undefined;

  const { data, isLoading, error, isFetching } = useQuery<DebtItem[], Error>({
    queryKey: key,
    queryFn: async () => {
      if (!userId) return [];
      const snapshot = await getDocs(collection(firestore, 'users', userId, 'dividas'));
      const debts = snapshot.docs.map(doc => mapDebtFromFirestore(doc.id, doc.data()));
      try {
        localStorage.setItem(`financas-pro-invest_debts_${userId}`, JSON.stringify({ data: debts, ts: Date.now() }));
      } catch {}
      return debts;
    },
    placeholderData: cachedData,
    enabled: !!userId,
    staleTime: Infinity,
  });

  const isSyncing = isFetching && !isLoading;

  return {
    data: data ?? cachedData ?? [],
    isLoading: isLoading && !cachedData && !debtBridgeReady,
    isSyncing,
    isFetching,
    error,
  };
};

export const useCreateDebt = (userId: string) => {
  return createMutationHook('debt', (debt: DebtItem) => saveDebt(userId, debt))();
};

export const useUpdateDebt = (userId: string) => {
  return createMutationHook('debt', ({ id, data }: { id: string, data: Partial<DebtItem> }) => updateDebt(userId, id, data))();
};

export const useDeleteDebt = (userId: string) => {
  return createMutationHook('debt', (id: string) => deleteDebt(userId, id))();
};
