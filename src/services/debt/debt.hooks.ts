import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../core/query/queryKeys';
import { saveDebt, updateDebt, deleteDebt } from './debtService';
import { DebtItem } from './debt.types';
import { createDebtRealtimeBridge } from './debt.realtime';
import { createMutationHook } from '../../core/query/patterns/createMutationHook';
import { invalidateDomain } from '../../core/query/patterns/invalidateDomain';

export const useDebts = (userId?: string) => {
  const key = queryKeys.debts.byUser(userId || 'anonymous');

  useEffect(() => {
    if (!userId) return;
    const bridge = createDebtRealtimeBridge(userId);
    const unsubscribe = bridge.subscribe(() => {});
    return unsubscribe;
  }, [userId, key]);

  return useQuery<DebtItem[], Error>({
    queryKey: key,
    queryFn: () => Promise.resolve([]),
    enabled: !!userId,
  });
};

export const useCreateDebt = (userId: string) => {
  return createMutationHook('debt', (debt: DebtItem) => saveDebt(userId, debt), {
    onSuccess: () => invalidateDomain(queryKeys.debts.byUser(userId)),
  })();
};

export const useUpdateDebt = (userId: string) => {
  return createMutationHook('debt', ({ id, data }: { id: string, data: Partial<DebtItem> }) => updateDebt(userId, id, data), {
    onSuccess: () => invalidateDomain(queryKeys.debts.byUser(userId)),
  })();
};

export const useDeleteDebt = (userId: string) => {
  return createMutationHook('debt', (id: string) => deleteDebt(userId, id), {
    onSuccess: () => invalidateDomain(queryKeys.debts.byUser(userId)),
  })();
};
