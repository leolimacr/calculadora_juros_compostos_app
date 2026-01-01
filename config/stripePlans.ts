
export type SubscriptionPlanId =
  | "app_monthly"
  | "app_annual"
  | "site_monthly"
  | "site_annual"
  | "combo_annual";

export interface StripePlanConfig {
  planId: SubscriptionPlanId;
  stripePriceId: string; // O ID do preço no Dashboard do Stripe (ex: price_12345)
  label: string;         // Rótulo amigável para exibir na UI
  description: string;   // Texto curto sobre o plano
  billingPeriod: "monthly" | "annual";
  amountBRL: number;     // Valor em reais para referência visual (9.90, 19.90, etc)
  features?: string[];   // Lista opcional de benefícios para renderizar nos cards
  recommended?: boolean; // Flag para destacar um plano na UI
}

/**
 * Mapeamento central dos planos.
 * 
 * IMPORTANTE: Após criar os produtos no Stripe Dashboard (Modo Teste),
 * substitua os valores 'price_PLACEHOLDER_...' pelos IDs reais gerados pelo Stripe (começam com 'price_').
 */
export const STRIPE_PLANS: Record<SubscriptionPlanId, StripePlanConfig> = {
  app_monthly: {
    planId: "app_monthly",
    stripePriceId: "price_app_monthly_PLACEHOLDER", // <--- SUBSTITUIR PELO ID REAL DO STRIPE
    label: "App Premium Mensal",
    description: "Gerenciador Financeiro ilimitado no app.",
    billingPeriod: "monthly",
    amountBRL: 9.90,
    features: ["Lançamentos ilimitados", "Backup na nuvem", "Sem anúncios"]
  },
  app_annual: {
    planId: "app_annual",
    stripePriceId: "price_app_annual_PLACEHOLDER", // <--- SUBSTITUIR PELO ID REAL DO STRIPE
    label: "App Premium Anual",
    description: "Economize com o plano anual do app.",
    billingPeriod: "annual",
    amountBRL: 99.00,
    features: ["Tudo do mensal", "2 meses grátis (aprox.)", "Prioridade no suporte"]
  },
  site_monthly: {
    planId: "site_monthly",
    stripePriceId: "price_site_monthly_PLACEHOLDER", // <--- SUBSTITUIR PELO ID REAL DO STRIPE
    label: "Site Premium Mensal",
    description: "Acesse simulador, FIRE e otimizador de dívidas.",
    billingPeriod: "monthly",
    amountBRL: 19.90,
    features: ["Todas calculadoras Pro", "Relatórios avançados", "Exportação de dados"]
  },
  site_annual: {
    planId: "site_annual",
    stripePriceId: "price_site_annual_PLACEHOLDER", // <--- SUBSTITUIR PELO ID REAL DO STRIPE
    label: "Site Premium Anual",
    description: "Plano anual das ferramentas avançadas do site.",
    billingPeriod: "annual",
    amountBRL: 149.00,
    features: ["Economia de 37%", "Acesso antecipado a novas ferramentas"]
  },
  combo_annual: {
    planId: "combo_annual",
    stripePriceId: "price_combo_annual_PLACEHOLDER", // <--- SUBSTITUIR PELO ID REAL DO STRIPE
    label: "Combo App + Site (Anual)",
    description: "Acesse tudo: app + ferramentas avançadas no site.",
    billingPeriod: "annual",
    amountBRL: 199.00,
    recommended: true,
    features: ["Gerenciador App Ilimitado", "Todas ferramentas do Site", "Melhor custo-benefício"]
  },
};

/**
 * Helper para obter a configuração de um plano específico de forma segura.
 */
export const getPlanConfig = (planId: SubscriptionPlanId): StripePlanConfig => {
  const plan = STRIPE_PLANS[planId];
  if (!plan) {
    throw new Error(`Plano não encontrado na configuração: ${planId}`);
  }
  return plan;
};
