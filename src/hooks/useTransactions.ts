import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ref, push, remove, update, set, query as rtdbQuery, orderByChild, limitToLast, get, endBefore } from 'firebase/database';
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
    queryFn: () => {
      const currentData = queryClient.getQueryData<Transaction[]>(key);
      return Promise.resolve(currentData ?? cachedData ?? []);
    },
    placeholderData: cachedData,
    enabled: !!userId,
    staleTime: Infinity,
  });

  // NOVO: Busca histórico antigo (paginação robusta via sortKey)
  const fetchHistory = async (lastSortKey: string | null, limitCount = 50): Promise<Transaction[]> => {
    if (!userId) return [];
    try {
      const transactionsRef = ref(db, `transactions/${userId}`);
      
      let q;
      if (lastSortKey) {
        // endBefore evita baixar o último item novamente
        q = rtdbQuery(
          transactionsRef, 
          orderByChild('sortKey'), 
          endBefore(lastSortKey), 
          limitToLast(limitCount)
        );
      } else {
        q = rtdbQuery(transactionsRef, orderByChild('sortKey'), limitToLast(limitCount));
      }
      
      const snapshot = await get(q);
      if (!snapshot.exists()) return [];
      
      const results: Transaction[] = [];
      snapshot.forEach((child) => {
        const val = child.val();
        const id = child.key as string;
        const dateClean = val.date.replace(/-/g, '');
        
        // Fallback robusto: YYYYMMDD_0000000000000_ID
        const sortKey = val.sortKey || `${dateClean}_0000000000000_${id}`;
        
        results.push({ 
          id, 
          ...val, 
          sortKey 
        } as Transaction);
      });
      
      // RTDB retorna ASC, invertemos para DESC no UI
      return results.sort((a, b) => b.sortKey!.localeCompare(a.sortKey!));
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      return [];
    }
  };

  const saveLancamento = async (transaction: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    
    const now = Date.now();
    const dateClean = transaction.date.replace(/-/g, '');

    if (transaction.id) {
        const transactionRef = ref(db, `transactions/${userId}/${transaction.id}`);
        const { id, ...dataToUpdate } = transaction;
        await update(transactionRef, dataToUpdate);
        queryClient.invalidateQueries({ queryKey: key });
        return;
    }

    const transactionsRef = ref(db, `transactions/${userId}`);

    if (transaction.paymentMethod === 'credit' && transaction.installments && transaction.installments > 1) {
      const installmentId = `inst_${now}_${Math.random().toString(36).substr(2, 5)}`;
      const totalAmount = transaction.amount;
      const installmentAmount = totalAmount / transaction.installments;
      const baseDate = new Date(transaction.date.replace(/-/g, '/'));

      const promises = [];
      for (let i = 1; i <= transaction.installments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));
        
        if (installmentDate.getDate() !== baseDate.getDate() && i > 1) {
            const lastDayOfIntendedMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 0);
            installmentDate.setDate(lastDayOfIntendedMonth.getDate());
            installmentDate.setMonth(lastDayOfIntendedMonth.getMonth());
            installmentDate.setFullYear(lastDayOfIntendedMonth.getFullYear());
        }

        const newRef = push(transactionsRef);
        const instDateStr = installmentDate.toISOString().split('T')[0];
        const instDateClean = instDateStr.replace(/-/g, '');
        
        const data = {
          ...transaction,
          userId,
          amount: installmentAmount,
          currentInstallment: i,
          installmentId,
          date: instDateStr,
          description: `${transaction.description} (${i}/${transaction.installments})`,
          createdAtMs: now + i,
          sortKey: `${instDateClean}_${now + i}_${newRef.key}`
        };
        promises.push(set(newRef, data));
      }
      await Promise.all(promises);
    } else {
      const newRef = push(transactionsRef);
      const data = { 
        ...transaction, 
        userId,
        createdAtMs: now,
        sortKey: `${dateClean}_${now}_${newRef.key}`
      };
      await set(newRef, data);
    }
    queryClient.invalidateQueries({ queryKey: key });
  };

  const deleteLancamento = async (id: string) => {
    if (!userId) return;
    const transactionRef = ref(db, `transactions/${userId}/${id}`);
    await remove(transactionRef);
  };

  const isSyncing = isFetching && !loading;

  return {
    transactions: data ?? cachedData ?? [],
    loading: loading && !cachedData && !bridgeReady,
    isSyncing,
    isFetching,
    error: error?.message || null,
    saveLancamento,
    deleteLancamento,
    fetchHistory,
  };
};
