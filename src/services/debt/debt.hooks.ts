import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../core/query/queryKeys';
import { saveDebt, updateDebt, deleteDebt } from './debtService';
import type { DebtItem } from './debt.types';
import { createMutationHook } from '../../core/query/patterns/createMutationHook';
import { invalidateDomain } from '../../core/query/patterns/invalidateDomain';
import { useDebtContext } from '../../contexts/DebtContext';

export const useDebts = (userId?: string) => {
  const queryClient = useQueryClient();
  const { debtBridgeReady } = useDebtContext();
  const key = queryKeys.debts.byUser(userId || 'anonymous');

  const cachedRaw = typeof window !== 'undefined' 
    ? localStorage.getItem(`fpi_debts_${userId}`) 
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
    queryFn: () => {
      const currentData = queryClient.getQueryData<DebtItem[]>(key);
      return Promise.resolve(currentData ?? cachedData ?? []);
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
