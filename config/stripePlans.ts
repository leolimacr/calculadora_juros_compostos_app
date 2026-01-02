
export type SubscriptionPlanId =
  | "app_monthly"
  | "app_annual"
  | "site_monthly"
  | "site_annual"
  | "combo_annual";

export interface StripePlanConfig {
  planId: SubscriptionPlanId;
  stripePriceId: string;
  label: string;
  subLabel?: string;
  description: string;
  billingPeriod: "monthly" | "annual";
  amountBRL: number;
  features: string[];
  recommended?: boolean;
}

/**
 * Mapeamento central dos planos.
 * SUBSTITUA OS IDs 'price_...' PELOS SEUS IDS REAIS DO STRIPE DASHBOARD.
 */
export const STRIPE_PLANS: Record<SubscriptionPlanId, StripePlanConfig> = {
  app_monthly: {
    planId: "app_monthly",
    stripePriceId: "price_app_monthly_PLACEHOLDER", 
    label: "App Premium Mensal",
    description: "Controle total no seu bolso.",
    billingPeriod: "monthly",
    amountBRL: 9.90,
    features: ["Lançamentos ilimitados", "Sem anúncios", "Backup na nuvem"]
  },
  app_annual: {
    planId: "app_annual",
    stripePriceId: "price_app_annual_PLACEHOLDER",
    label: "App Premium Anual",
    subLabel: "2 meses grátis",
    description: "Economia inteligente para quem planeja longe.",
    billingPeriod: "annual",
    amountBRL: 99.00,
    features: ["Tudo do mensal", "Prioridade no suporte", "Selo Supporter"]
  },
  site_monthly: {
    planId: "site_monthly",
    stripePriceId: "price_site_monthly_PLACEHOLDER",
    label: "Web Pro Mensal",
    description: "Ferramentas avançadas de simulação.",
    billingPeriod: "monthly",
    amountBRL: 19.90,
    features: ["Simulador FIRE Pro", "Otimizador de Dívidas", "Relatórios Avançados"]
  },
  site_annual: {
    planId: "site_annual",
    stripePriceId: "price_site_annual_PLACEHOLDER",
    label: "Web Pro Anual",
    subLabel: "Economia de 37%",
    description: "Para quem leva a independência financeira a sério.",
    billingPeriod: "annual",
    amountBRL: 149.00,
    features: ["Todas ferramentas Web", "Acesso antecipado a betas", "Exportação de dados"]
  },
  combo_annual: {
    planId: "combo_annual",
    stripePriceId: "price_combo_annual_PLACEHOLDER",
    label: "Combo Completo",
    subLabel: "MELHOR CUSTO-BENEFÍCIO",
    description: "O ecossistema completo: App ilimitado + Web Pro.",
    billingPeriod: "annual",
    amountBRL: 199.00,
    recommended: true,
    features: ["App Premium Ilimitado", "Web Pro Completo", "Mentoria IA sem limites"]
  },
};

export const getPlanConfig = (planId: SubscriptionPlanId): StripePlanConfig => {
  const plan = STRIPE_PLANS[planId];
  if (!plan) {
    throw new Error(`Plano não encontrado na configuração: ${planId}`);
  }
  return plan;
};
