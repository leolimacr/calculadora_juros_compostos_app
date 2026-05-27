import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ref, push, remove, update } from 'firebase/database';
import { db } from '../firebase';
import { queryKeys } from '../core/query/queryKeys';
import { Transaction } from '../types';
import { useTransactionsContext } from '../contexts/TransactionsContext';

export const useTransactions = (userId?: string) => {
  const queryClient = useQueryClient();
  const { bridgeReady } = useTransactionsContext();
  const key = queryKeys.transactions.byUser(userId || 'anonymous');

  const cachedRaw = typeof window !== 'undefined' 
    ? localStorage.getItem(`fpi_tx_${userId}`) 
    : null;
  const cachedData = cachedRaw 
    ? (() => { try { const p = JSON.parse(cachedRaw); return Date.now() - p.ts < 600_000 ? p.data : undefined; } catch { return undefined; } })()
    : undefined;

  const { data, isLoading: loading, error, isFetching } = useQuery<Transaction[], Error>({
    queryKey: key,
    queryFn: () => Promise.resolve([]),
    placeholderData: cachedData,
    enabled: !!userId,
  });

  const saveLancamento = async (transaction: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    
    if (transaction.id) {
        const transactionRef = ref(db, `transactions/${userId}/${transaction.id}`);
        const { id, ...dataToUpdate } = transaction;
        await update(transactionRef, dataToUpdate);
    } else {
        const transactionsRef = ref(db, `transactions/${userId}`);
        await push(transactionsRef, { ...transaction, userId });
    }
    queryClient.invalidateQueries({ queryKey: key });
  };

  const deleteLancamento = async (id: string) => {
    if (!userId) return;
    const transactionRef = ref(db, `transactions/${userId}/${id}`);
    await remove(transactionRef);
    queryClient.invalidateQueries({ queryKey: key });
  };

  return {
    transactions: data ?? cachedData ?? [],
    loading: loading && !cachedData && !bridgeReady,
    isFetching,
    error: error?.message || null,
    saveLancamento,
    deleteLancamento,
  };
};
