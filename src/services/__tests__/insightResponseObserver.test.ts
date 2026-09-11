import { describe, it, expect, beforeEach, vi } from 'vitest';
import { traceInsightShown, traceNavigation, collectFollowUp, getEffectivePriorityDelta, getDomainSuppressionMultiplier, getToneMarker } from '../insightResponseObserver';
import type { NexusInsight, UserContext } from '../nexusInsightEngine';

describe('insightResponseObserver', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    });
  });

  const makeInsight = (overrides: Partial<NexusInsight>): NexusInsight => ({
    id: 'budget-burn-rate',
    message: { title: 'Teste', body: 'Corpo do insight', ctaLabel: 'Agir' },
    deepLink: 'manager',
    priority: 'alta',
    ...overrides,
  });

  const makeCtx = (overrides: Partial<UserContext> = {}): UserContext => ({
    hasFinancialProfile: false,
    hasPaidAccess: false,
    isPremium: false,
    transactionsToday: 0,
    daysSinceLastTransaction: 0,
    launchCount: 10,
    launchLimit: 30,
    monthBalance: 0,
    hasFirstInvestment: false,
    streak: 0,
    ...overrides,
  });

  it('não gera follow-up sem trace anterior', () => {
    const ctx = makeCtx({ sovereignFreeBalance: 1000 });
    expect(collectFollowUp(ctx)).toBeNull();
  });

  it('gera follow-up de orçamento quando houve navegação e métrica melhorou', () => {
    const insight = makeInsight({ id: 'budget-burn-rate', deepLink: 'manager' });
    const ctxShown = makeCtx({
      budgetProgress: {
        totalBudget: 5000, totalSpent: 4000, totalPercentage: 80,
        daysElapsed: 10, daysInMonth: 30,
        categories: [],
      },
    });
    traceInsightShown(insight, ctxShown);
    traceNavigation('budget-burn-rate');

    const ctxNow = makeCtx({
      budgetProgress: {
        totalBudget: 5000, totalSpent: 3000, totalPercentage: 60,
        daysElapsed: 15, daysInMonth: 30,
        categories: [],
      },
    });
    const result = collectFollowUp(ctxNow);
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('orcamento');
    expect(result!.text).toContain('orçamento');
    expect(result!.text).toContain('acessou');
    expect(result!.text).toContain('consumo reduziu');
  });

  it('gera follow-up de proteção quando buffer aumentou', () => {
    const insight = makeInsight({ id: 'home-sovereign-deficit', deepLink: 'manager' });
    const ctxShown = makeCtx({ marcoZero: 1000, reserveCurrent: 500, sovereignFreeBalance: -200 });
    traceInsightShown(insight, ctxShown);
    traceNavigation('home-sovereign-deficit');

    const ctxNow = makeCtx({ marcoZero: 2000, reserveCurrent: 500, sovereignFreeBalance: 300 });
    const result = collectFollowUp(ctxNow);
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('protecao');
    expect(result!.text).toContain('proteção');
    expect(result!.text).toContain('aumentou');
  });

  it('não gera follow-up se métrica não mudou e não houve navegação', () => {
    const insight = makeInsight({ id: 'fatima_reserva', deepLink: 'manager' });
    const ctxShown = makeCtx({ upcomingCreditCardBill: { daysToClose: 3, estimatedValue: 1500 } });
    traceInsightShown(insight, ctxShown);

    const ctxNow = makeCtx({ upcomingCreditCardBill: { daysToClose: 2, estimatedValue: 1500 } });
    expect(collectFollowUp(ctxNow)).toBeNull();
  });

  it('não gera follow-up para insight fora dos domínios mapeados', () => {
    const insight = makeInsight({ id: 'home-bonus-inflow', deepLink: 'ia' });
    const ctx = makeCtx({ recentLargeIncome: 3000 });
    traceInsightShown(insight, ctx);
    traceNavigation('home-bonus-inflow');
    expect(collectFollowUp(ctx)).toBeNull();
  });

  it('gera follow-up mesmo sem navegação se métrica mudou significativamente', () => {
    const insight = makeInsight({ id: 'budget-burn-rate', deepLink: 'manager' });
    const ctxShown = makeCtx({
      budgetProgress: {
        totalBudget: 5000, totalSpent: 4000, totalPercentage: 80,
        daysElapsed: 10, daysInMonth: 30,
        categories: [],
      },
    });
    traceInsightShown(insight, ctxShown);

    const ctxNow = makeCtx({
      budgetProgress: {
        totalBudget: 5000, totalSpent: 2000, totalPercentage: 40,
        daysElapsed: 20, daysInMonth: 30,
        categories: [],
      },
    });
    const result = collectFollowUp(ctxNow);
    expect(result).not.toBeNull();
    expect(result!.text).toContain('não acessou');
    expect(result!.text).toContain('consumo reduziu');
  });

  it('rastreia insight de evento de cartão por prefixo nexus-event-card-', () => {
    const insight = makeInsight({ id: 'nexus-event-card-pressure', deepLink: 'cartoes' });
    const ctxShown = makeCtx({ upcomingCreditCardBill: { daysToClose: 3, estimatedValue: 2000 } });
    traceInsightShown(insight, ctxShown);
    traceNavigation('nexus-event-card-pressure');

    const ctxNow = makeCtx({ upcomingCreditCardBill: { daysToClose: 1, estimatedValue: 1000 } });
    const result = collectFollowUp(ctxNow);
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('cartao');
    expect(result!.text).toContain('fatura');
    expect(result!.text).toContain('acessou');
    expect(result!.text).toContain('reduziu');
  });

  it('não rastreia evento de dívida por prefixo (fora dos 3 domínios)', () => {
    const insight = makeInsight({ id: 'nexus-event-debt-created', deepLink: 'minhas-dividas' });
    const ctx = makeCtx({ marcoZero: 1000, reserveCurrent: 500 });
    traceInsightShown(insight, ctx);
    traceNavigation('nexus-event-debt-created');
    expect(collectFollowUp(ctx)).toBeNull();
  });

  describe('comportamento por domínio', () => {
    it('retorna delta 0 sem histórico', () => {
      expect(getEffectivePriorityDelta('orcamento')).toBe(0);
      expect(getEffectivePriorityDelta('protecao')).toBe(0);
      expect(getEffectivePriorityDelta('cartao')).toBe(0);
    });

    it('retorna boost (-1) para domínio responsivo (2+ shows, ratio >= 0.5)', () => {
      const insight = makeInsight({ id: 'budget-burn-rate' });
      const ctx = makeCtx({
        budgetProgress: { totalBudget: 5000, totalSpent: 4000, totalPercentage: 80, daysElapsed: 10, daysInMonth: 30, categories: [] },
      });
      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      traceNavigation('budget-burn-rate');
      expect(getEffectivePriorityDelta('orcamento')).toBe(-1);
    });

    it('retorna demote (+1) para domínio ignorado (3+ shows, 0 respostas)', () => {
      const insight = makeInsight({ id: 'budget-burn-rate' });
      const ctx = makeCtx({
        budgetProgress: { totalBudget: 5000, totalSpent: 4000, totalPercentage: 80, daysElapsed: 10, daysInMonth: 30, categories: [] },
      });
      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      expect(getEffectivePriorityDelta('orcamento')).toBe(1);
    });

    it('retorna suppression multiplier 2 para ignorado, 0.5 para responsivo', () => {
      expect(getDomainSuppressionMultiplier('orcamento')).toBe(1);

      const insight = makeInsight({ id: 'budget-burn-rate' });
      const ctx = makeCtx({
        budgetProgress: { totalBudget: 5000, totalSpent: 4000, totalPercentage: 80, daysElapsed: 10, daysInMonth: 30, categories: [] },
      });

      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      expect(getDomainSuppressionMultiplier('orcamento')).toBe(2);

      // Responsivo: cenário separado com ratio >= 0.5
      const insight2 = makeInsight({ id: 'home-sovereign-deficit' });
      const ctx2 = makeCtx({ marcoZero: 1000, reserveCurrent: 500, sovereignFreeBalance: -200 });
      traceInsightShown(insight2, ctx2);
      traceInsightShown(insight2, ctx2);
      traceNavigation('home-sovereign-deficit');
      expect(getDomainSuppressionMultiplier('protecao')).toBe(0.5);
    });

    it('tone marker aparece apenas para domínio persistentemente ignorado', () => {
      expect(getToneMarker('orcamento')).toBe('');

      const insight = makeInsight({ id: 'budget-burn-rate' });
      const ctx = makeCtx({
        budgetProgress: { totalBudget: 5000, totalSpent: 4000, totalPercentage: 80, daysElapsed: 10, daysInMonth: 30, categories: [] },
      });

      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      traceInsightShown(insight, ctx);
      expect(getToneMarker('orcamento')).toBe('Observação: ');
    });
  });

  it('limpa o trace após coletar follow-up', () => {
    const insight = makeInsight({ id: 'budget-burn-rate', deepLink: 'manager' });
    const ctxShown = makeCtx({
      budgetProgress: {
        totalBudget: 5000, totalSpent: 4000, totalPercentage: 80,
        daysElapsed: 10, daysInMonth: 30,
        categories: [],
      },
    });
    traceInsightShown(insight, ctxShown);
    traceNavigation('budget-burn-rate');

    const ctxNow = makeCtx({
      budgetProgress: {
        totalBudget: 5000, totalSpent: 3000, totalPercentage: 60,
        daysElapsed: 15, daysInMonth: 30,
        categories: [],
      },
    });
    collectFollowUp(ctxNow);
    expect(collectFollowUp(ctxNow)).toBeNull();
  });
});
