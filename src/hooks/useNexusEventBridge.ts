import { useEffect } from 'react';
import { eventBus } from '../core/orchestration/event-bus';
import { EVENT_TYPES } from '../core/orchestration/domainEvents';
import type {
  TransactionCreatedEvent,
  TransactionUpdatedEvent,
  TransactionDeletedEvent,
  CardUsageUpdatedEvent,
  CardInvoiceOverdueEvent,
  DebtCreatedEvent,
  DebtUpdatedEvent,
  DebtAmortizedEvent,
  DebtDeletedEvent,
} from '../core/orchestration/domainEvents';
import type { NexusInsight } from '../services/nexusInsightEngine';
import type { Archetype } from '../types';
import {
  evaluateTransactionCreated,
  evaluateTransactionUpdated,
  evaluateTransactionDeleted,
  evaluateCardUsageUpdated,
  evaluateCardInvoiceOverdue,
  evaluateDebtCreated,
  evaluateDebtUpdated,
  evaluateDebtAmortized,
  evaluateDebtDeleted,
} from '../services/nexusEventEvaluator';
import { prepareEventInsight } from '../services/prepareEventInsight';
import { setEventInsight } from '../services/eventInsightStore';
import { trackInsightShown } from '../services/nexusAnalyticsService';

function generateInsightId(eventType: string, correlationId: string): string {
  return `nexus-event-${eventType.replace(/\./g, '-')}-${correlationId}`;
}

export function useNexusEventBridge(userId?: string, archetype: Archetype = 'guardian'): void {
  useEffect(() => {
    if (!userId) return;

    const showInsight = (
      evaluate: () => NexusInsight | null,
      eventType: string,
      correlationId: string,
      templateVars: Record<string, number>,
    ) => {
      const raw = evaluate();
      if (!raw) return;

      const insightId = generateInsightId(eventType, correlationId);

      const withVoice = prepareEventInsight(
        { ...raw, id: insightId },
        templateVars,
        archetype,
      );

      const stored = setEventInsight(withVoice);
      if (stored) {
        trackInsightShown(withVoice.id, withVoice.priority, eventType, correlationId);
      }
    };

    const unsubs = [
      eventBus.subscribe<TransactionCreatedEvent['payload']>(
        EVENT_TYPES.transaction.created,
        (ev) => showInsight(
          () => evaluateTransactionCreated(ev.payload),
          ev.type,
          ev.correlationId,
          { value: ev.payload.transaction.amount || 0 },
        ),
      ),
      eventBus.subscribe<TransactionUpdatedEvent['payload']>(
        EVENT_TYPES.transaction.updated,
        (ev) => {
          const oldAmt = ev.payload.previousTransaction?.amount || 0;
          const newAmt = ev.payload.transaction.amount || 0;
          const diff = Math.abs(newAmt - oldAmt);
          showInsight(
            () => evaluateTransactionUpdated(ev.payload),
            ev.type,
            ev.correlationId,
            { diff },
          );
        },
      ),
      eventBus.subscribe<TransactionDeletedEvent['payload']>(
        EVENT_TYPES.transaction.deleted,
        (ev) => showInsight(
          () => evaluateTransactionDeleted(ev.payload),
          ev.type,
          ev.correlationId,
          { value: ev.payload.previousTransaction?.amount || 0 },
        ),
      ),
      eventBus.subscribe<CardUsageUpdatedEvent['payload']>(
        EVENT_TYPES.card.usageUpdated,
        (ev) => {
          const jump = Math.abs(ev.payload.newSaldoUtilizado - ev.payload.previousSaldoUtilizado);
          showInsight(
            () => evaluateCardUsageUpdated(ev.payload),
            ev.type,
            ev.correlationId,
            { jump },
          );
        },
      ),
      eventBus.subscribe<CardInvoiceOverdueEvent['payload']>(
        EVENT_TYPES.card.invoiceOverdue,
        (ev) => showInsight(
          () => evaluateCardInvoiceOverdue(ev.payload),
          ev.type,
          ev.correlationId,
          { remainingAmount: ev.payload.remainingAmount, cardName: ev.payload.cardName },
        ),
      ),
      eventBus.subscribe<DebtCreatedEvent['payload']>(
        EVENT_TYPES.debt.created,
        (ev) => showInsight(
          () => evaluateDebtCreated(ev.payload),
          ev.type,
          ev.correlationId,
          { value: ev.payload.debt.saldoDevedor || 0 },
        ),
      ),
      eventBus.subscribe<DebtUpdatedEvent['payload']>(
        EVENT_TYPES.debt.updated,
        (ev) => {
          const oldSaldo = ev.payload.previousDebt?.saldoDevedor || 0;
          const newSaldo = (ev.payload.changes.saldoDevedor as number) ?? oldSaldo;
          const diff = Math.abs(newSaldo - oldSaldo);
          showInsight(
            () => evaluateDebtUpdated(ev.payload),
            ev.type,
            ev.correlationId,
            { diff },
          );
        },
      ),
      eventBus.subscribe<DebtAmortizedEvent['payload']>(
        EVENT_TYPES.debt.amortized,
        (ev) => showInsight(
          () => evaluateDebtAmortized(ev.payload),
          ev.type,
          ev.correlationId,
          {
            amount: ev.payload.amount,
            newSaldo: ev.payload.newSaldo,
            previousSaldo: ev.payload.previousSaldo,
          },
        ),
      ),
      eventBus.subscribe<DebtDeletedEvent['payload']>(
        EVENT_TYPES.debt.deleted,
        (ev) => showInsight(
          () => evaluateDebtDeleted(ev.payload),
          ev.type,
          ev.correlationId,
          { value: ev.payload.previousDebt?.saldoDevedor || 0 },
        ),
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [userId, archetype]);
}
