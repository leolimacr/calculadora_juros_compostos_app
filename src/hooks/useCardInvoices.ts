import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '../core/query/queryKeys';
import type { CardInvoice } from '../types';
import { useFinanceContext } from '../contexts/FinanceContext';

export const useCardInvoices = (userId: string | undefined, cardId: string | undefined) => {
  const queryClient = useQueryClient();
  const { financeBridgeReady } = useFinanceContext();
  const key = queryKeys.invoices.byCard(userId || 'anonymous', cardId || 'none');

  const fallbackRef = useRef<CardInvoice[]>([]);
  const { data: rawData, isLoading, error } = useQuery<CardInvoice[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<CardInvoice[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId && !!cardId,
    staleTime: 30_000,
  });
  const invoices = rawData ?? fallbackRef.current;

  return {
    invoices,
    isLoading: isLoading && !financeBridgeReady,
    error,
  };
};

export const useInvoicesByUser = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.invoices.byUser(userId || 'anonymous');
  const fallbackRef = useRef<CardInvoice[]>([]);

  const { data: rawData, isLoading } = useQuery<CardInvoice[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<CardInvoice[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: Infinity,
  });
  const invoices = rawData ?? fallbackRef.current;

  return {
    invoices,
    isLoading,
  };
};
