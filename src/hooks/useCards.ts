import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '../core/query/queryKeys';
import type { CreditCard } from '../types';
import { useFinanceContext } from '../contexts/FinanceContext';

export const useCards = (userId?: string) => {
  const queryClient = useQueryClient();
  const { financeBridgeReady } = useFinanceContext();
  const key = queryKeys.cards.byUser(userId || 'anonymous');
  const fallbackRef = useRef<CreditCard[]>([]);

  const { data: rawData, isLoading, error, isFetching } = useQuery<CreditCard[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<CreditCard[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: Infinity,
  });
  const cards = rawData ?? fallbackRef.current;

  const isSyncing = isFetching && !isLoading;

  return {
    cards,
    isLoading: isLoading && !financeBridgeReady,
    isSyncing,
    error,
  };
};
