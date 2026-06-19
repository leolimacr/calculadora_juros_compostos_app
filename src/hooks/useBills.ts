import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import type { RecurringBill } from '../types';
import { useFinanceContext } from '../contexts/FinanceContext';

export const useBills = (userId?: string) => {
  const queryClient = useQueryClient();
  const { financeBridgeReady } = useFinanceContext();
  const key = queryKeys.bills.byUser(userId || 'anonymous');

  const { data: bills = [], isLoading, error, isFetching } = useQuery<RecurringBill[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<RecurringBill[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: Infinity,
  });

  const isSyncing = isFetching && !isLoading;

  return {
    bills,
    isLoading: isLoading && !financeBridgeReady,
    isSyncing,
    error,
  };
};
