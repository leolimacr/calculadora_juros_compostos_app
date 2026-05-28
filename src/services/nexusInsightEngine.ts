import { extractUpcomingBill } from './nexusContextUtils';
import { DebtItem } from './debt/debt.types';

// Tipos
export interface NexusInsightAction {
  label: string;
  type: 'reserve' | 'adjust' | 'remind' | 'simulate' | 'review';
  requiresPlan?: 'pro' | 'premium';
  payload?: {
    value: number;
    title: string;
    targetDate: string;
  };
}

export type InsightPriority = 'alta' | 'media' | 'baixa' | 'inline';

export interface NexusInsight {
  id: string;
  message: {
    title: string;
    body: string;
    ctaLabel: string;
  };
  deepLink: string;
  priority: InsightPriority;
  action?: NexusInsightAction;
}

export interface UserContext {
  hasFinancialProfile: boolean;
  hasPaidAccess: boolean;
  isPremium: boolean;
  transactionsToday: number;
  daysSinceLastTransaction: number;
  launchCount: number;
  launchLimit: number;
  monthBalance: number; // positivo = azul, negativo = vermelho
  hasFirstInvestment: boolean;
  streak: number;
  // Dados estratégicos para Central
  hasDebts?: boolean;
  hasRealEstate?: boolean;
  hasVehicles?: boolean;
  totalAssetsValue?: number;
  reserveGoalMet?: boolean;
  debtJustPaidOff?: boolean;
  isFirstSession?: boolean;
  upcomingCreditCardBill?: {
    daysToClose: number;
    estimatedValue: number;
  };
}

// Catálogo de insights baseado no repertório aprovado
const INSIGHT_CATALOG: Array<{
  id: string;
  condition: (ctx: UserContext) => boolean;
  insight: NexusInsight;
}> = [
  // Home — Jornada de Entrada
  {
    id: 'local-central-start',
    condition: (ctx) => !ctx.hasFinancialProfile,
    insight: {
      id: 'local-central-start',
      message: {
        title: 'Inicie sua Jornada',
        body: 'Comece seu plano de evolução — organize suas dívidas na Central para ter clareza total do seu caminho.',
        ctaLabel: 'Ir para Central',
      },
      deepLink: 'central',
      priority: 'alta',
    },
  },
  // Home — Boas-vindas inteligente (Onboarding)
  {
    id: 'boas_vindas_primeira_sessao',
    condition: (ctx) => ctx.isFirstSession === true,
    insight: {
      id: 'boas_vindas_primeira_sessao',
      message: {
        title: 'Bem-vindo ao FPI',
        body: 'Que tal lançar sua primeira receita para começarmos a te entender melhor?',
        ctaLabel: 'Saiba mais',
      },
      deepLink: 'transaction-form',
      priority: 'media',
      action: { label: 'Lançar agora', type: 'adjust' }
    },
  },
  // Home — Jornada de Expansão (Premium)
  {
    id: 'local-central-premium-upsell',
    condition: (ctx) => ctx.hasFinancialProfile && !ctx.hasPaidAccess,
    insight: {
      id: 'local-central-premium-upsell',
      message: {
        title: 'Sua base está pronta',
        body: 'Você já domina sua rotina. Agora, amplie sua visão com o Premium e conecte investimentos ao seu patrimônio.',
        ctaLabel: 'Evoluir meu plano',
      },
      deepLink: 'pricing',
      priority: 'media',
    },
  },
  // Home — Retomada de Ritmo (Inatividade > 7 dias)
  {
    id: 'local-inactive-7days',
    condition: (ctx) => ctx.daysSinceLastTransaction >= 7,
    insight: {
      id: 'local-inactive-7days',
      message: {
        title: 'Retome o Ritmo',
        body: 'Faz tempo que não te vemos. Seus dados atualizados hoje geram decisões melhores amanhã.',
        ctaLabel: 'Lançar agora',
      },
      deepLink: 'transaction-form',
      priority: 'media',
    },
  },
  // Home — Marco de Investimento
  {
    id: 'local-first-investment',
    condition: (ctx) => ctx.hasFirstInvestment,
    insight: {
      id: 'local-first-investment',
      message: {
        title: 'Marco de Investimento',
        body: 'Parabéns pelo primeiro passo! O Nexus pode te ajudar a acompanhar a evolução deste ativo.',
        ctaLabel: 'Ver Investimentos',
      },
      deepLink: 'investimentos',
      priority: 'media',
    },
  },
  // Home — Eficiência sem atrito (sem acesso pago)
  {
    id: 'local-efficiency-upsell',
    condition: (ctx) => !ctx.hasPaidAccess && !ctx.isPremium,
    insight: {
      id: 'local-efficiency-upsell',
      message: {
        title: 'Eficiência sem atrito',
        body: 'Descubra como o plano Pro remove os limites de lançamentos e acelera sua organização.',
        ctaLabel: 'Conhecer Pro',
      },
      deepLink: 'pricing',
      priority: 'baixa',
    },
  },
  // Home — Profundidade (Premium com tudo ativo)
  {
    id: 'local-central-evolution',
    condition: (ctx) => ctx.hasFinancialProfile && ctx.isPremium && ctx.transactionsToday > 0,
    insight: {
      id: 'local-central-evolution',
      message: {
        title: 'Ecossistema Ativo',
        body: 'Seu ecossistema está completo. Veja sua evolução estratégica e novos insights do Nexus na Central.',
        ctaLabel: 'Ver Panorama 360º',
      },
      deepLink: 'central',
      priority: 'baixa',
    },
  },
  // Home — Foco na Eficiência (sem lançamentos hoje)
  {
    id: 'local-today-reminder',
    condition: (ctx) => ctx.transactionsToday === 0 && ctx.daysSinceLastTransaction < 7,
    insight: {
      id: 'local-today-reminder',
      message: {
        title: 'Foco na Eficiência',
        body: 'Mantenha seus dados atualizados hoje para que o Nexus possa gerar insights reais sobre seu patrimônio.',
        ctaLabel: 'Lançar agora',
      },
      deepLink: 'transaction-form',
      priority: 'media',
    },
  },
  // Home — Boas-vindas inteligente (Onboarding)
  {
    id: 'boas_vindas_primeira_sessao',
    condition: (ctx) => ctx.isFirstSession === true,
    insight: {
      id: 'boas_vindas_primeira_sessao',
      message: {
        title: 'Bem-vindo ao FPI',
        body: 'Que tal lançar sua primeira receita para começarmos a te entender melhor?',
        ctaLabel: 'Saiba mais',
      },
      deepLink: 'transaction-form',
      priority: 'media',
      action: { label: 'Lançar agora', type: 'adjust' }
    },
  },
  // Home — Reserva de Fatura (Ação Acionável)
  {
    id: 'fatima_reserva',
    condition: (ctx) => {
      const bill = extractUpcomingBill(ctx);
      return !!bill && bill.daysToClose <= 5;
    },
    insight: {
      id: 'fatima_reserva',
      message: {
        title: 'Reserva de Fatura',
        body: 'Sua fatura fecha em {days} dias. O valor estimado é de {value}. Deseja reservar esse valor agora?',
        ctaLabel: 'Ver Detalhes',
      },
      deepLink: 'manager',
      priority: 'alta',
      action: {
        label: 'Reservar valor',
        type: 'reserve',
        requiresPlan: 'pro',
      },
    },
  },

  // CENTRAL — Análises Estratégicas
  {
    id: 'central-debt-interest',
    condition: (ctx) => ctx.hasFinancialProfile && !!ctx.hasDebts,
    insight: {
      id: 'central-debt-interest',
      message: {
        title: 'Estratégia de Alívio',
        body: 'Detectamos juros de dívida ativos. O Nexus pode simular um plano de quitação acelerada para você.',
        ctaLabel: 'Montar Plano',
      },
      deepLink: 'minhas-dividas',
      priority: 'alta',
    },
  },
  {
    id: 'central-wealth-diversification',
    condition: (ctx) => ctx.isPremium && !!ctx.hasRealEstate,
    insight: {
      id: 'central-wealth-diversification',
      message: {
        title: 'Equilíbrio de Bens',
        body: 'Sua concentração em imóveis é alta. Veja como pequenos aportes em liquidez aumentam sua segurança.',
        ctaLabel: 'Analisar Alocação',
      },
      deepLink: 'passivos',
      priority: 'media',
    },
  },
  {
    id: 'central-reserve-met',
    condition: (ctx) => ctx.hasFinancialProfile && !!ctx.reserveGoalMet,
    insight: {
      id: 'central-reserve-met',
      message: {
        title: 'Objetivo Alcançado',
        body: 'Sua Reserva de Emergência atingiu 100%. Hora de focar no próximo módulo de crescimento.',
        ctaLabel: 'Definir Nova Meta',
      },
      deepLink: 'central',
      priority: 'alta',
    },
  },
  {
    id: 'central-debt-paid',
    condition: (ctx) => ctx.hasFinancialProfile && !!ctx.debtJustPaidOff,
    insight: {
      id: 'central-debt-paid',
      message: {
        title: 'Vitória Financeira',
        body: 'Mais um passo rumo à liberdade! Esse valor mensal agora pode trabalhar para o seu futuro.',
        ctaLabel: 'Iniciar Investimento',
      },
      deepLink: 'investimentos',
      priority: 'alta',
    },
  },
  {
    id: 'central-streak-milestone',
    condition: (ctx) => [7, 14, 21, 30].includes(ctx.streak),
    insight: {
      id: 'central-streak-milestone',
      message: {
        title: 'Marco de Consistência',
        body: 'Parabéns! Você atingiu {streak} dias de consistência. Sua clareza financeira está em um novo nível.',
        ctaLabel: 'Ver Evolução',
      },
      deepLink: 'central',
      priority: 'media',
    },
  },
  {
    id: 'central-monthly-consolidated',
    condition: (ctx) => ctx.isPremium && ctx.transactionsToday > 0,
    insight: {
      id: 'central-monthly-consolidated',
      message: {
        title: 'Seu Panorama 360º',
        body: 'O resumo do seu mês está pronto. Veja como sua rotina impactou seu patrimônio líquido real.',
        ctaLabel: 'Ver Resumo',
      },
      deepLink: 'central',
      priority: 'media',
    },
  },
  {
    id: 'central-global-vision-inactive',
    condition: (ctx) => ctx.hasFinancialProfile && !ctx.isPremium,
    insight: {
      id: 'central-global-vision-inactive',
      message: {
        title: 'Conecte os Pontos',
        body: 'O valor real do ecossistema surge quando você une a rotina do Controla à estratégia da Central.',
        ctaLabel: 'Ativar Visão Global',
      },
      deepLink: 'central',
      priority: 'media',
    },
  },
];

const SEEN_INSIGHTS_KEY = 'nexus-seen-insights';
const CENTRAL_SEEN_KEY = 'nexus-central-seen';
const MAX_SEEN_HISTORY = 5;

export function buildUserContext(params: Partial<UserContext> & { debts?: DebtItem[] }): UserContext {
  const { debts, ...base } = params;
  const ctx: UserContext = {
    hasFinancialProfile: false,
    hasPaidAccess: false,
    isPremium: false,
    transactionsToday: 0,
    daysSinceLastTransaction: 999,
    launchCount: 0,
    launchLimit: 30,
    monthBalance: 0,
    hasFirstInvestment: false,
    streak: 0,
    ...base
  };

  // Enriquecimento automático
  ctx.upcomingCreditCardBill = extractUpcomingBill(ctx, debts);
  
  const onboardingCompleted = typeof window !== 'undefined' && localStorage.getItem('fpi_onboarding_op_completed');
  ctx.isFirstSession = ctx.launchCount === 0 && !onboardingCompleted;

  return ctx;
}

function getSeenInsights(key = SEEN_INSIGHTS_KEY): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markInsightAsSeen(id: string, key = SEEN_INSIGHTS_KEY): void {
  const seen = getSeenInsights(key);
  const updated = [id, ...seen.filter(s => s !== id)].slice(0, MAX_SEEN_HISTORY);
  localStorage.setItem(key, JSON.stringify(updated));
}

function interpolateMessage(template: string, vars: Record<string, string | number>): string {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  return result;
}

function prepareInsight(insight: NexusInsight, ctx: UserContext): NexusInsight {
  const bill = extractUpcomingBill(ctx);
  const vars: Record<string, string | number> = {};
  
  if (bill) {
    vars.days = bill.daysToClose;
    vars.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.estimatedValue);
  }

  vars.streak = ctx.streak;

  const prepared = {
    ...insight,
    message: {
      ...insight.message,
      body: interpolateMessage(insight.message.body, vars),
    },
  };

  if (bill && prepared.action?.type === 'reserve') {
    prepared.action.payload = {
      value: bill.estimatedValue,
      title: `Fatura (${bill.daysToClose} dias)`,
      targetDate: new Date(Date.now() + bill.daysToClose * 86400000).toISOString().split('T')[0],
    };
  }

  return prepared;
}

export function getPrioritizedInsight(ctx: UserContext): NexusInsight | null {
  const seen = getSeenInsights(SEEN_INSIGHTS_KEY);

  // Filtra insights cuja condição é verdadeira e QUE NÃO FORAM VISTOS
  const candidates = INSIGHT_CATALOG
    .filter(item => !item.id.startsWith('central-'))
    .filter(item => item.condition(ctx))
    .filter(item => !seen.includes(item.id));

  if (candidates.length === 0) return null;

  // Ordena por prioridade (alta > media > baixa)
  const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

  candidates.sort((a, b) => {
    return priorityOrder[a.insight.priority] - priorityOrder[b.insight.priority];
  });

  const chosen = candidates[0].insight;
  markInsightAsSeen(chosen.id, SEEN_INSIGHTS_KEY);
  return prepareInsight(chosen, ctx);
}

export function getCentralInsights(ctx: UserContext): NexusInsight[] {
  const seen = getSeenInsights(CENTRAL_SEEN_KEY);

  // Filtra apenas insights da Central e QUE NÃO FORAM VISTOS
  const candidates = INSIGHT_CATALOG
    .filter(item => item.id.startsWith('central-'))
    .filter(item => item.condition(ctx))
    .filter(item => !seen.includes(item.id));

  if (candidates.length === 0) return [];

  const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

  candidates.sort((a, b) => {
    return priorityOrder[a.insight.priority] - priorityOrder[b.insight.priority];
  });

  const chosen = candidates.slice(0, 3).map(c => prepareInsight(c.insight, ctx));
  
  // Marca como visto apenas o mais prioritário para rotatividade
  if (candidates.length > 0) {
    markInsightAsSeen(candidates[0].id, CENTRAL_SEEN_KEY);
  }

  return chosen;
}

// Catálogo de insights operacionais (Nexus Inline)
export interface NexusAdvisoryContext {
  currentMonthBalance: number;
  categorySpending: Record<string, number>;
  isPremium: boolean;
}

const OPERATIONAL_CATALOG: Array<{
  id: string;
  condition: (ctx: UserContext) => boolean;
  insight: NexusInsight;
}> = [
  {
    id: 'op-consistency-5',
    condition: (ctx) => ctx.transactionsToday === 5,
    insight: {
      id: 'op-consistency-5',
      message: {
        title: 'Ritmo Excelente',
        body: 'Esta é sua 5ª transação hoje. Seu controle está em dia!',
        ctaLabel: 'Continuar',
      },
      deepLink: 'manager',
      priority: 'inline',
    },
  },
  {
    id: 'op-budget-warning',
    condition: (ctx) => ctx.monthBalance < 0,
    insight: {
      id: 'op-budget-warning',
      message: {
        title: 'Atenção ao Saldo',
        body: 'Seu saldo ficou negativo este mês. Isso acontece. Que tal revisarmos seus gastos juntos?',
        ctaLabel: 'Ver Detalhes',
      },
      deepLink: 'manager',
      priority: 'inline',
    },
  },
  {
    id: 'op-growth-positive',
    condition: (ctx) => ctx.monthBalance > 0 && ctx.launchCount > 10,
    insight: {
      id: 'op-growth-positive',
      message: {
        title: 'Evolução Positiva',
        body: 'Sua receita deste mês já superou a do mês passado. Ótimo progresso!',
        ctaLabel: 'Ver Evolução',
      },
      deepLink: 'manager',
      priority: 'inline',
    },
  },
];

/**
 * Retorna um insight operacional para exibição inline.
 * Diferente dos insights da Home, estes não são marcados como "vistos" permanentemente,
 * pois são baseados no estado imediato da sessão.
 */
export function getOperationalInsight(ctx: UserContext): NexusInsight | null {
  const candidate = OPERATIONAL_CATALOG.find(item => item.condition(ctx));
  return candidate ? prepareInsight(candidate.insight, ctx) : null;
}
