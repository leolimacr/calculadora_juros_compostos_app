import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import { DebtItem } from '../services/debt/debt.types';

export const useDebts = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.debts.byUser(userId || 'anonymous');

  const { data: debts = [], isLoading, error, isFetching } = useQuery<DebtItem[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<DebtItem[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const isSyncing = isFetching && !isLoading;

  return { 
    data: debts, // Alias para compatibilidade
    debts, 
    isLoading, 
    isSyncing,
    error: error?.message || null 
  };
};
