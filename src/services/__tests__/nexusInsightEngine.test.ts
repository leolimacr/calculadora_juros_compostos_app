import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPrioritizedInsight, getCentralInsights, UserContext } from '../nexusInsightEngine';

describe('NexusInsightEngine', () => {
  beforeEach(() => {
    // Limpa o localStorage antes de cada teste
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('deve retornar o insight "local-central-start" para um usuário novo sem perfil financeiro', () => {
    const ctx: UserContext = {
      hasFinancialProfile: false,
      hasPaidAccess: false,
      isPremium: false,
      transactionsToday: 0,
      daysSinceLastTransaction: 0,
      launchCount: 0,
      launchLimit: 30,
      monthBalance: 0,
      hasFirstInvestment: false,
    };

    const insight = getPrioritizedInsight(ctx);
    expect(insight).not.toBeNull();
    expect(insight?.id).toBe('local-central-start');
  });

  it('deve retornar pelo menos um insight estratégico para um usuário Premium na Central', () => {
    const ctx: UserContext = {
      hasFinancialProfile: true,
      hasPaidAccess: true,
      isPremium: true,
      transactionsToday: 1,
      daysSinceLastTransaction: 0,
      launchCount: 50,
      launchLimit: 999,
      monthBalance: 12000,
      hasFirstInvestment: true,
      hasDebts: false,
      hasRealEstate: true,
      reserveGoalMet: true,
    };

    const insights = getCentralInsights(ctx);
    expect(insights.length).toBeGreaterThan(0);
    // Deve conter pelo menos um dos insights estratégicos mapeados
    const ids = insights.map(i => i.id);
    expect(ids).toContain('central-wealth-diversification');
  });

  it('deve retornar null se todos os insights aplicáveis já tiverem sido vistos', () => {
    // Mock do localStorage para simular que todos os IDs foram vistos
    const seenIds = [
      'local-central-start',
      'local-central-premium-upsell',
      'local-inactive-7days',
      'local-first-investment',
      'local-efficiency-upsell',
      'local-central-evolution',
      'local-today-reminder'
    ];
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(JSON.stringify(seenIds)),
      setItem: vi.fn(),
    });

    const ctx: UserContext = {
      hasFinancialProfile: false,
      hasPaidAccess: false,
      isPremium: false,
      transactionsToday: 0,
      daysSinceLastTransaction: 0,
      launchCount: 0,
      launchLimit: 30,
      monthBalance: 0,
      hasFirstInvestment: false,
    };

    const insight = getPrioritizedInsight(ctx);
    expect(insight).toBeNull();
  });
});
