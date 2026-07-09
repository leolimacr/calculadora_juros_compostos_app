import { useMemo, useState } from 'react';
import { useNexusEvents } from '../../hooks/useNexusEvents';
import { useDebts } from '../../services/debt/debt.hooks';
import { useGoals } from '../../hooks/useGoals';
import { useWealthData } from '../../hooks/useWealthData';
import { buildUserContext, getPrioritizedInsight, dismissPrioritizedInsight } from '../../services/nexusInsightEngine';
import { isCommandMode } from '../../services/personaCalibrationService';
import { useSovereignSnapshot } from '../../hooks/useSovereignSnapshot';
import { useEntitlement } from '../../../hooks/useEntitlement';
import type { Transaction } from '../../types';
import { getLocalDateString } from '../../../utils/dateHelpers';

export const useHomePanelData = (
  transactions: Transaction[],
  userMeta: any,
  hasPaidAccess: boolean
) => {
  const now = useMemo(() => new Date(), []);
  const safeTx = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);
  const userId = safeTx.length > 0 ? safeTx[0]?.userId : null;
  const { isPremium } = useEntitlement();

  const { event: serverEvent, dismiss } = useNexusEvents();
  const { data: debts = [] } = useDebts(userId || undefined);
  const { goals = [] } = useGoals(userId || undefined);
  const { assets = [], passives = [] } = useWealthData();
  const sovereign = useSovereignSnapshot(safeTx, userMeta);

  const [localDismissedId, setLocalDismissedId] = useState<string | null>(null);

  const nexusReserves = useMemo(() => goals.filter(g => g.type === 'nexus_reserve' && g.ativa), [goals]);

  const contextualEvent = useMemo(() => {
    const todayStr = getLocalDateString(now);
    const txToday = safeTx.filter((t) => t.date === todayStr).length;
    const validDates = safeTx
      .map((t) => new Date(t.date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    const daysSince = validDates[0]
      ? Math.floor((now.getTime() - validDates[0].getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const ctx = buildUserContext({
      hasFinancialProfile: !!userMeta?.financialProfile,
      financialProfile: userMeta?.financialProfile,
      hasPaidAccess: hasPaidAccess,
      isPremium,
      persona: userMeta?.persona,
      transactionsToday: txToday,
      daysSinceLastTransaction: daysSince,
      launchCount: safeTx.length,
      launchLimit: userMeta?.launchLimit || 30,
      monthBalance: sovereign.monthBalance,
      monthIncome: sovereign.income,
      monthExpenses: sovereign.expenses,
      marcoZero: userMeta?.financialProfile?.marcoZero,
      reserveCurrent: userMeta?.financialProfile?.emergencyReserveCurrent,
      reserveTarget: userMeta?.financialProfile?.emergencyReserveTarget,
      accumulatedBalance: sovereign.accumulatedBalance,
      freeBalance: sovereign.sovereignFreeBalance,
      sovereignFreeBalance: sovereign.sovereignFreeBalance,
      freedomDeficit: sovereign.freedomDeficit,
      obligationsDeduction: sovereign.obligationsDeduction,
      commandMode: isCommandMode(userMeta),
      transactions: safeTx,
      hasFirstInvestment: safeTx.some((t) => t.category?.toLowerCase().includes('investimento')),
      debts,
      assets,
      passives,
    });

    const localInsight = getPrioritizedInsight(ctx);
    const event = localInsight || serverEvent;
    if (event && event.id === localDismissedId) return null;
    return event;
  }, [serverEvent, safeTx, userMeta, hasPaidAccess, debts, assets, passives, sovereign, now, localDismissedId]);

  const handleDismiss = (id: string) => {
    const ctx = buildUserContext({
      hasFinancialProfile: !!userMeta?.financialProfile,
      launchCount: safeTx.length,
      accumulatedBalance: sovereign.accumulatedBalance,
      monthBalance: sovereign.monthBalance,
      monthIncome: sovereign.income,
      monthExpenses: sovereign.expenses,
      sovereignFreeBalance: sovereign.sovereignFreeBalance,
      freedomDeficit: sovereign.freedomDeficit,
      obligationsDeduction: sovereign.obligationsDeduction,
      commandMode: isCommandMode(userMeta),
      persona: userMeta?.persona,
      transactions: safeTx,
      marcoZero: userMeta?.financialProfile?.marcoZero,
      reserveCurrent: userMeta?.financialProfile?.emergencyReserveCurrent,
    });
    dismissPrioritizedInsight(id, ctx);
    setLocalDismissedId(id);
    dismiss(id);
  };

  return {
    userId,
    nexusReserves,
    contextualEvent,
    sovereign,
    handleDismiss,
    monthLabel: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  };
};
