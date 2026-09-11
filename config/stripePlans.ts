
export type SubscriptionPlanId = "free" | "pro_monthly" | "premium_monthly" | "premium_annual";

export interface StripePlanConfig {
  id: SubscriptionPlanId;
  tier: 'free' | 'pro' | 'premium';
  /** @deprecated Usar stripePriceIdTest/stripePriceIdProd */
  stripePriceId?: string;
  stripePriceIdTest?: string;
  stripePriceIdProd?: string;
  label: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
  trialDays?: number;
}

export const PLANS: Record<string, StripePlanConfig> = {
  FREE: {
    id: "free",
    tier: "free",
    label: "Grátis",
    price: 0,
    period: "/mês",
    description: "Para começar a organizar a casa.",
    features: [
      "Lançamentos ilimitados no Controla",
      "Mês atual e meses futuros",
      "Base de Proteção — veja sua camada de segurança",
      "Central — visão da sua evolução financeira",
      "Ferramentas de simulação financeira"
    ]
  },
  PRO: {
    id: "pro_monthly",
    tier: "pro",
    stripePriceId: "price_pro_trial_PLACEHOLDER",
    stripePriceIdTest: "price_pro_test",
    stripePriceIdProd: "price_pro_prod",
    label: "Pro",
    price: 9.90,
    period: "/mês",
    description: "Para quem quer organizar e planejar.",
    recommended: true,
    trialDays: 7,
    features: [
      "Todas as 7 Ferramentas",
      "Nexus com histórico estendido",
      "Exportação CSV/PDF",
      "Relatórios Mensais",
      "Backup na Nuvem"
    ]
  },
  PREMIUM: {
    id: "premium_monthly",
    tier: "premium",
    stripePriceId: "price_premium_trial_PLACEHOLDER",
    stripePriceIdTest: "price_premium_test",
    stripePriceIdProd: "price_premium_prod",
    label: "Premium",
    price: 19.90,
    period: "/mês",
    description: "Inteligência Artificial e suporte total.",
    trialDays: 7,
    features: [
      "Tudo do plano PRO",
      "IA Advisor Ilimitado",
      "Relatórios Semanais por E-mail",
      "Prioridade no Suporte",
      "Integração Google Sheets"
    ]
  },
  PREMIUM_ANNUAL: {
    id: "premium_annual",
    tier: "premium",
    stripePriceIdTest: "price_premium_annual_test",
    stripePriceIdProd: "price_premium_annual_prod",
    label: "Premium Anual",
    price: 199.00,
    period: "/ano",
    description: "Premium com desconto anual — 2 meses grátis.",
    recommended: true,
    features: [
      "Tudo do plano PRO",
      "IA Advisor Ilimitado",
      "Relatórios Semanais por E-mail",
      "Prioridade no Suporte",
      "Integração Google Sheets",
      "Histórico completo e ilimitado"
    ]
  }
};
