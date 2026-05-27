// Tipos
export interface NexusInsight {
  id: string;
  message: {
    title: string;
    body: string;
    ctaLabel: string;
  };
  deepLink: string;
  priority: 'alta' | 'media' | 'baixa';
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
  // Dados estratégicos para Central
  hasDebts?: boolean;
  hasRealEstate?: boolean;
  reserveGoalMet?: boolean;
  debtJustPaidOff?: boolean;
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
  return chosen;
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

  const chosen = candidates.slice(0, 3).map(c => c.insight);
  
  // Marca como visto apenas o mais prioritário para rotatividade
  if (chosen.length > 0) {
    markInsightAsSeen(chosen[0].id, CENTRAL_SEEN_KEY);
  }

  return chosen;
}
