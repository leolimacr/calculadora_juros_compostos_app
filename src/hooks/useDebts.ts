import { useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import type { DebtItem } from '../services/debt/debt.types';

export const useDebts = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.debts.byUser(userId || 'anonymous');

  const { data: rawDebts = [], isLoading, error, isFetching } = useQuery<DebtItem[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<DebtItem[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const prevDebtsRef = useRef<DebtItem[]>([]);
  const debts = useMemo(() => {
    const next = rawDebts || [];
    const prev = prevDebtsRef.current;
    if (next.length !== prev.length || !next.every((d, i) => d.id === prev[i]?.id && d.saldoDevedor === prev[i]?.saldoDevedor)) {
      prevDebtsRef.current = next;
      return next;
    }
    return prev;
  }, [rawDebts]);

  const isSyncing = isFetching && !isLoading;

  return { 
    data: debts, // Alias para compatibilidade
    debts, 
    isLoading, 
    isSyncing,
    error: error?.message || null 
  };
};
