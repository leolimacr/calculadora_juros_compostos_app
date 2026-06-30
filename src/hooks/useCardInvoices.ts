import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import { getInvoicesByCard } from '../services/invoiceService';
import type { CardInvoice } from '../types';
import { useFinanceContext } from '../contexts/FinanceContext';

export const useCardInvoices = (userId: string | undefined, cardId: string | undefined) => {
  const queryClient = useQueryClient();
  const { financeBridgeReady } = useFinanceContext();
  const key = queryKeys.invoices.byCard(userId || 'anonymous', cardId || 'none');

  const { data: invoices = [], isLoading, error } = useQuery<CardInvoice[], Error>({
    queryKey: key,
    queryFn: () => {
      if (!userId || !cardId) return Promise.resolve([]);
      return getInvoicesByCard(userId, cardId);
    },
    enabled: !!userId && !!cardId,
    staleTime: 30_000,
  });

  return {
    invoices,
    isLoading: isLoading && !financeBridgeReady,
    error,
  };
};

export const useInvoicesByUser = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.invoices.byUser(userId || 'anonymous');

  const { data: invoices = [], isLoading } = useQuery<CardInvoice[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<CardInvoice[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: Infinity,
  });

  return {
    invoices,
    isLoading,
  };
};
