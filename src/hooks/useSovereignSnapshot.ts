import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from './useCards';
import { useBills } from './useBills';
import { useDebts } from './useDebts';
import type { Transaction, UserMeta } from '../types';
import { getCurrentInvoice, isBillPaid } from '../utils/invoiceUtils';
import type { SovereignSnapshot } from '../utils/calculations';
import { aggregateMonthFlow, aggregateAllTimeFlow, buildSovereignSnapshot } from '../utils/calculations';
import { isCommandMode } from '../services/personaCalibrationService';

export interface SovereignSnapshotResult extends SovereignSnapshot {
  totalPendingBills: number;
  virtualImpact: number;
  commandMode: boolean;
}

export function useSovereignSnapshot(
  transactions: Transaction[],
  userMeta?: UserMeta | null,
  localCommandMode = false,
  refDate?: Date
): SovereignSnapshotResult {
  const { user } = useAuth();
  const { cards: userCards } = useCards(user?.uid);
  const { bills: recurringBills } = useBills(user?.uid);
  const { debts: userDebts } = useDebts(user?.uid);

  return useMemo(() => {
    const now = refDate ?? new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const safeTx = Array.isArray(transactions) ? transactions : [];

    const totalCreditUsed = userCards.reduce((sum, c) => sum + (c.saldoUtilizadoTotal || 0), 0);
    const totalDebtBalance = userDebts.reduce((sum, d) => sum + (d.saldoDevedor || 0), 0);

    const activeInvoices = userCards
      .map((card) => {
        const invoice = getCurrentInvoice(card, safeTx);
        if (!invoice) return null;

        const paidToThisCard = safeTx
          .filter(t => t.isBillPayment && t.linkedCardId === card.id && t.date >= invoice.periodStart && t.date <= invoice.periodEnd)
          .reduce((sum, t) => sum + t.amount, 0);

        const adjustedTotal = Math.max(0, invoice.total - paidToThisCard);

        return { ...invoice, total: adjustedTotal, cardId: card.id };
      })
      .filter((inv): inv is NonNullable<typeof inv> => inv !== null && inv.total > 0);

    const virtualImpact = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const pendingBillItems = recurringBills.filter(
      (bill) => bill.isActive && !isBillPaid(bill, safeTx)
    );
    const totalPendingBills = pendingBillItems.reduce((sum, bill) => sum + bill.amount, 0);

    const flow = aggregateMonthFlow(safeTx, year, month);
    const allTimeFlow = aggregateAllTimeFlow(safeTx);
    const commandMode = isCommandMode(userMeta) || localCommandMode;

    const snapshot = buildSovereignSnapshot({
      monthBalance: flow.realBalance,
      accumulatedBalance: allTimeFlow.realBalance,
      accumulatedIncome: allTimeFlow.income,
      accumulatedExpenses: allTimeFlow.expenses,
      virtualImpact,
      pendingBills: totalPendingBills,
      financialProfile: userMeta?.financialProfile,
      commandMode,
      income: flow.income,
      expenses: flow.expenses,
      monthlyAport: Math.max(0, flow.income - flow.expenses),
    });

    return {
      ...snapshot,
      totalPendingBills,
      virtualImpact,
      commandMode,
      totalCreditUsed,
      totalDebtBalance,
    };
  }, [transactions, userCards, recurringBills, userDebts, userMeta, localCommandMode, refDate]);
}
