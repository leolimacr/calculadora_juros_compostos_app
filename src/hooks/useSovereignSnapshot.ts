import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from './useCards';
import { useBills } from './useBills';
import { useDebts } from './useDebts';
import { useInvoicesByUser } from './useCardInvoices';
import type { Transaction, UserMeta } from '../types';
import { getCurrentInvoice, isBillPaid } from '../utils/invoiceUtils';
import type { SovereignSnapshot } from '../utils/calculations';
import { aggregateMonthFlow, aggregateAllTimeFlow, buildSovereignSnapshot, resolveObligationPressure } from '../utils/calculations';
import { isCommandMode } from '../services/personaCalibrationService';

export interface SovereignSnapshotResult extends SovereignSnapshot {
  totalPendingBills: number;
  virtualImpact: number;
  commandMode: boolean;
  cardInvoiceRemaining: number;
  cardFuturePressure: number;
  rotativoDebtBalance: number;
}

export function useSovereignSnapshot(
  transactions: Transaction[],
  userMeta?: UserMeta | null,
  localCommandMode = false,
  refDate?: Date,
  exclusions?: number
): SovereignSnapshotResult {
  const { user } = useAuth();
  const { cards: userCards } = useCards(user?.uid);
  const { bills: recurringBills } = useBills(user?.uid);
  const { debts: userDebts } = useDebts(user?.uid);
  const { invoices: storedInvoices } = useInvoicesByUser(user?.uid);

  return useMemo(() => {
    const now = refDate ?? new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const safeTx = Array.isArray(transactions) ? transactions : [];

    const totalCreditUsed = userCards.reduce((sum, c) => sum + (c.saldoUtilizadoTotal || 0), 0);
    const totalDebtBalance = userDebts.reduce((sum, d) => sum + (d.saldoDevedor || 0), 0);

    const cardInvoicePressure = userCards.map((card) => {
      const computedInvoice = getCurrentInvoice(card, safeTx);
      if (!computedInvoice) {
        return {
          remainingAmount: 0,
          periodTotal: 0,
          source: { computedTotal: 0, paidAmount: 0, storedRemaining: null as number | null, rotativoConverted: false },
        };
      }

      const storedInvoice = storedInvoices.find(
        si => si.cardId === card.id && si.periodEnd === computedInvoice.periodEnd
      );

      const paidToThisCard = safeTx
        .filter(t => t.isBillPayment && t.linkedCardId === card.id && t.date >= computedInvoice.periodStart && t.date <= computedInvoice.periodEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      const source = {
        computedTotal: computedInvoice.total,
        paidAmount: paidToThisCard,
        storedRemaining: storedInvoice?.remainingAmount ?? null,
        rotativoConverted: storedInvoice?.rotativoConverted ?? false,
      };

      return {
        // Regra única centralizada em resolveObligationPressure (sem duplicar a lógica aqui).
        remainingAmount: resolveObligationPressure([source], 0),
        periodTotal: storedInvoice?.rotativoConverted ? 0 : (storedInvoice?.total ?? computedInvoice.total),
        source,
      };
    });

    const cardInvoiceRemaining = cardInvoicePressure.reduce((sum, c) => sum + c.remainingAmount, 0);
    const rotativoDebtBalance = userDebts
      .filter(d => d.originType === 'rotativo_cartao')
      .reduce((sum, d) => sum + (d.saldoDevedor || 0), 0);
    /** Combined card invoice + rotativo debt pressure.
     *  Distinct from flow.virtualImpact (isVirtual expenses in aggregateMonthFlow).
     *  Passed as 'obligationPressure' to buildSovereignSnapshot. */
    const obligationPressure = resolveObligationPressure(
      cardInvoicePressure.map(c => c.source),
      rotativoDebtBalance
    );
    const cardFuturePressure = Math.max(0, totalCreditUsed - cardInvoiceRemaining - rotativoDebtBalance);

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
      obligationPressure,
      pendingBills: totalPendingBills,
      financialProfile: userMeta?.financialProfile,
      commandMode,
      income: flow.income,
      expenses: flow.expenses,
      monthlyAport: Math.max(0, flow.income - flow.expenses),
      exclusions,
    });

    return {
      ...snapshot,
      totalPendingBills,
      virtualImpact: obligationPressure,
      commandMode,
      totalCreditUsed,
      totalDebtBalance,
      cardInvoiceRemaining,
      cardFuturePressure,
      rotativoDebtBalance,
    };
  }, [transactions, userCards, recurringBills, userDebts, storedInvoices, userMeta, localCommandMode, refDate, exclusions]);
}
