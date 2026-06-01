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
    queryFn: () => {
      const currentData = queryClient.getQueryData<Transaction[]>(key);
      return Promise.resolve(currentData ?? cachedData ?? []);
    },
    placeholderData: cachedData,
    enabled: !!userId,
    staleTime: Infinity,
  });

  const saveLancamento = async (transaction: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    
    // Edição de lançamento existente (não suporta alterar parcelamento de algo já criado por enquanto)
    if (transaction.id) {
        const transactionRef = ref(db, `transactions/${userId}/${transaction.id}`);
        const { id, ...dataToUpdate } = transaction;
        await update(transactionRef, dataToUpdate);
        queryClient.invalidateQueries({ queryKey: key });
        return;
    }

    const transactionsRef = ref(db, `transactions/${userId}`);

    // Lógica de Parcelamento
    if (transaction.paymentMethod === 'credit' && transaction.installments && transaction.installments > 1) {
      const installmentId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const totalAmount = transaction.amount;
      const installmentAmount = totalAmount / transaction.installments;
      const baseDate = new Date(transaction.date.replace(/-/g, '/'));

      const promises = [];
      for (let i = 1; i <= transaction.installments; i++) {
        const installmentDate = new Date(baseDate);
        // Adiciona meses um a um
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));
        
        // Ajuste para evitar que 31/jan vire 03/mar (setMonth em data > 28)
        // Se após setMonth o dia for diferente do dia base (ex: base 31, resultante 3 ou 2 ou 1), 
        // significa que estourou o mês. Ajustamos para o último dia do mês anterior ao estouro.
        if (installmentDate.getDate() !== baseDate.getDate() && i > 1) {
            // Volta para o último dia do mês pretendido
            const lastDayOfIntendedMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 0);
            installmentDate.setDate(lastDayOfIntendedMonth.getDate());
            installmentDate.setMonth(lastDayOfIntendedMonth.getMonth());
            installmentDate.setFullYear(lastDayOfIntendedMonth.getFullYear());
        }

        const data = {
          ...transaction,
          userId,
          amount: installmentAmount,
          currentInstallment: i,
          installmentId,
          date: installmentDate.toISOString().split('T')[0],
          description: `${transaction.description} (${i}/${transaction.installments})`
        };
        promises.push(push(transactionsRef, data));
      }
      await Promise.all(promises);
    } else {
      // Lançamento normal (ou crédito à vista)
      await push(transactionsRef, { ...transaction, userId });
    }
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
  };
};
