import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPrioritizedInsight, getCentralInsights, UserContext, buildUserContext, getOperationalInsight, NexusInsight } from '../nexusInsightEngine';

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
    const ctx = buildUserContext({
      hasFinancialProfile: false,
      launchCount: 1, // Não é primeira sessão para não bater no novo insight
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight).not.toBeNull();
    expect(insight?.id).toBe('local-central-start');
  });

  it('deve retornar pelo menos um insight estratégico para um usuário Premium na Central', () => {
    const ctx = buildUserContext({
      hasFinancialProfile: true,
      hasPaidAccess: true,
      isPremium: true,
      transactionsToday: 1,
      launchCount: 50,
      monthBalance: 12000,
      hasFirstInvestment: true,
      hasDebts: false,
      hasRealEstate: true,
      reserveGoalMet: true,
    });

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
      'local-today-reminder',
      'boas_vindas_primeira_sessao'
    ];
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(JSON.stringify(seenIds)),
      setItem: vi.fn(),
    });

    const ctx = buildUserContext({
      hasFinancialProfile: false,
      launchCount: 0,
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight).toBeNull();
  });

  it('deve gerar o insight "fatima_reserva" quando houver fatura fechando em breve', () => {
    const ctx = buildUserContext({
      hasFinancialProfile: true,
      hasPaidAccess: true,
      isPremium: true,
      launchCount: 10,
      upcomingCreditCardBill: {
        daysToClose: 3,
        estimatedValue: 1500.50,
      },
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight?.id).toBe('fatima_reserva');
    expect(insight?.action?.type).toBe('reserve');
    // Verifica a interpolação básica
    expect(insight?.message.body).toContain('3 dias');
    expect(insight?.message.body).toContain('1.500,50');
  });

  it('deve gerar o insight "boas_vindas_primeira_sessao" quando for a primeira sessão', () => {
    const ctx = buildUserContext({
      launchCount: 0,
      hasFinancialProfile: true, // Para não bater no central-start
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight?.id).toBe('boas_vindas_primeira_sessao');
    expect(insight?.action?.type).toBe('adjust');
  });

  it('não deve gerar o insight de boas-vindas quando não for a primeira sessão', () => {
    const ctx = buildUserContext({
      launchCount: 10,
      hasFinancialProfile: true,
    });

    const insight = getPrioritizedInsight(ctx);
    expect(insight?.id).not.toBe('boas_vindas_primeira_sessao');
  });

  describe('Nexus Inline Insights', () => {
    it('deve retornar insight de consistência quando o usuário atingir 5 transações no dia', () => {
      const ctx = buildUserContext({
        transactionsToday: 5,
      });

      const insight = getOperationalInsight(ctx);
      expect(insight?.id).toBe('op-consistency-5');
      expect(insight?.priority).toBe('inline');
    });

    it('deve retornar aviso de orçamento quando o saldo do mês estiver negativo', () => {
      const ctx = buildUserContext({
        monthBalance: -100,
        transactionsToday: 1, // Para não bater no de consistência se ele vier primeiro
      });

      const insight = getOperationalInsight(ctx);
      expect(insight?.id).toBe('op-budget-warning');
      expect(insight?.message.body).toContain('saldo ficou negativo');
    });

    it('deve retornar insight de evolução quando o saldo estiver positivo e launchCount > 10', () => {
      const ctx = buildUserContext({
        monthBalance: 500,
        launchCount: 15,
        transactionsToday: 1,
      });

      const insight = getOperationalInsight(ctx);
      expect(insight?.id).toBe('op-growth-positive');
    });

    it('deve retornar null quando nenhuma condição operacional for atendida', () => {
      const ctx = buildUserContext({
        transactionsToday: 1,
        monthBalance: 0,
        launchCount: 5,
      });

      const insight = getOperationalInsight(ctx);
      expect(insight).toBeNull();
    });
  });

  describe('Central Streak Milestones', () => {
    it('deve disparar o insight "central-streak-milestone" no marco de 7 dias', () => {
      const ctx = buildUserContext({
        streak: 7,
      });

      const insights = getCentralInsights(ctx);
      const ids = insights.map(i => i.id);
      expect(ids).toContain('central-streak-milestone');
      
      const milestone = insights.find(i => i.id === 'central-streak-milestone');
      expect(milestone?.message.body).toContain('7 dias');
    });

    it('deve disparar o insight "central-streak-milestone" no marco de 30 dias', () => {
      const ctx = buildUserContext({
        streak: 30,
      });

      const insights = getCentralInsights(ctx);
      const ids = insights.map(i => i.id);
      expect(ids).toContain('central-streak-milestone');
      expect(insights.find(i => i.id === 'central-streak-milestone')?.message.body).toContain('30 dias');
    });

    it('não deve disparar o insight "central-streak-milestone" fora dos marcos', () => {
      const ctx = buildUserContext({
        streak: 5,
      });

      const insights = getCentralInsights(ctx);
      const ids = insights.map(i => i.id);
      expect(ids).not.toContain('central-streak-milestone');
    });
  });
});
