import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPrioritizedInsight,
  getCentralInsights,
  buildUserContext,
  getOperationalInsight,
  isMarginStable,
  hasFinancialTension,
  dismissPrioritizedInsight,
} from '../nexusInsightEngine';

describe('NexusInsightEngine v2', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    });
  });

  it('retorna insight de fatura quando fechamento está próximo', () => {
    const ctx = buildUserContext({
      hasFinancialProfile: true,
      launchCount: 10,
      upcomingCreditCardBill: { daysToClose: 3, estimatedValue: 1500.5 },
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight?.id).toBe('fatima_reserva');
    expect(insight?.message.body).toContain('3 dias');
  });

  it('Dom do Tempo: margem estável suprime insights médios', () => {
    const ctx = buildUserContext({
      hasFinancialProfile: true,
      launchCount: 20,
      monthBalance: 8000,
      monthIncome: 10000,
      monthExpenses: 5000,
      sovereignFreeBalance: 4000,
      marcoZero: 2000,
      reserveCurrent: 1000,
    });

    expect(isMarginStable(ctx)).toBe(true);
    expect(hasFinancialTension(ctx)).toBe(false);

    const insight = getPrioritizedInsight(ctx);
    if (insight) {
      expect(insight.priority).toBe('alta');
    }
  });

  it('detecta déficit de liberdade na Home', () => {
    const ctx = buildUserContext({
      hasFinancialProfile: true,
      launchCount: 15,
      sovereignFreeBalance: -500,
      freedomDeficit: 500,
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight?.id).toBe('home-sovereign-deficit');
  });

  it('reexibe insight quando fingerprint muda', () => {
    const base = buildUserContext({
      hasFinancialProfile: true,
      launchCount: 15,
      sovereignFreeBalance: -200,
      freedomDeficit: 200,
    });

    getPrioritizedInsight(base);
    dismissPrioritizedInsight('home-sovereign-deficit', base);

    const worsened = buildUserContext({
      ...base,
      sovereignFreeBalance: -800,
      freedomDeficit: 800,
    });

    const again = getPrioritizedInsight(worsened);
    expect(again?.id).toBe('home-sovereign-deficit');
  });

  it('insight operacional usa margem soberana negativa', () => {
    const ctx = buildUserContext({
      sovereignFreeBalance: -100,
      monthBalance: -100,
      transactionsToday: 1,
    });

    const insight = getOperationalInsight(ctx);
    expect(insight?.id).toBe('op-budget-warning');
    expect(insight?.message.body).toContain('folga');
  });

  it('Central retorna insights de dívida quando aplicável', () => {
    const ctx = buildUserContext({
      hasFinancialProfile: true,
      hasDebts: true,
      launchCount: 10,
    });

    const insights = getCentralInsights(ctx);
    expect(insights.some((i) => i.id === 'central-debt-interest')).toBe(true);
  });
});
