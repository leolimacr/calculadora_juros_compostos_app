import { useEffect, useRef } from 'react';
import { eventBus } from '../core/orchestration/event-bus';
import { EVENT_TYPES, createDomainEvent } from '../core/orchestration/domainEvents';
import type { CardUsageUpdatedEvent, TransactionCreatedEvent, TransactionDeletedEvent } from '../core/orchestration/domainEvents';
import { queryKeys } from '../core/query/queryKeys';
import { syncCardInvoices } from '../services/invoiceGeneratorService';
import { checkOverdueInvoices } from '../services/rotativoService';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from './useCards';
import { useInvoicesByUser } from './useCardInvoices';
import { useQueryClient } from '@tanstack/react-query';

const publishedOverdue = new Set<string>();

export function useInvoiceSync(transactions: any[]) {
  const { user } = useAuth();
  const { cards } = useCards(user?.uid);
  const { invoices: storedInvoices } = useInvoicesByUser(user?.uid);
  const queryClient = useQueryClient();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<number>(0);

  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const invoicesRef = useRef(storedInvoices);
  invoicesRef.current = storedInvoices;

  useEffect(() => {
    if (!user?.uid) return;

    const debouncedSync = () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 2000) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(debouncedSync, 2000);
        return;
      }

      lastSyncRef.current = now;
      const cards = cardsRef.current;
      const safeTx = Array.isArray(transactionsRef.current) ? transactionsRef.current : [];
      for (const card of cards) {
        syncCardInvoices(user.uid, card, safeTx).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byUser(user.uid) });
    };

    const publishOverdueEvents = () => {
      const cards = cardsRef.current;
      const invoices = invoicesRef.current;
      const overdueInvoices = checkOverdueInvoices(cards, invoices);
      for (const info of overdueInvoices) {
        const dedupKey = `${info.cardId}|${info.periodEnd}`;
        if (publishedOverdue.has(dedupKey)) continue;
        publishedOverdue.add(dedupKey);

        eventBus.publish(createDomainEvent(
          'card',
          EVENT_TYPES.card.invoiceOverdue,
          info,
          'useInvoiceSync',
          `overdue-${info.cardId}-${info.periodEnd}`,
        ));
      }
    };

    publishOverdueEvents();

    // Initial reconciliation: sync invoices on mount to correct legacy
    // billPayments that were previously misassigned by date-window matching.
    const initialCards = cardsRef.current;
    const initialTx = transactionsRef.current;
    if (initialCards.length > 0 && Array.isArray(initialTx)) {
      for (const card of initialCards) {
        syncCardInvoices(user.uid, card, initialTx).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byUser(user.uid) });
    }

    const unsubCardUsage = eventBus.subscribe<CardUsageUpdatedEvent['payload']>(
      EVENT_TYPES.card.usageUpdated,
      () => debouncedSync(),
    );

    const unsubTxCreated = eventBus.subscribe<TransactionCreatedEvent['payload']>(
      EVENT_TYPES.transaction.created,
      () => debouncedSync(),
    );

    const unsubTxDeleted = eventBus.subscribe<TransactionDeletedEvent['payload']>(
      EVENT_TYPES.transaction.deleted,
      () => debouncedSync(),
    );

    return () => {
      unsubCardUsage();
      unsubTxCreated();
      unsubTxDeleted();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [user?.uid]);
}
