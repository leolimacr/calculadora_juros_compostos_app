
export type SubscriptionPlanId = "free" | "pro_monthly" | "premium_monthly";

export interface StripePlanConfig {
  id: SubscriptionPlanId;
  tier: 'free' | 'pro' | 'premium';
  stripePriceId?: string; // Optional for free plan
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
      "Gerenciador Financeiro",
      "Juros Compostos",
      "Calculadora FIRE",
      "Limite de 5 lançamentos/mês",
      "Sem exportação de dados"
    ]
  },
  PRO: {
    id: "pro_monthly",
    tier: "pro",
    stripePriceId: "price_pro_trial_PLACEHOLDER", // ID do Stripe (price_pro_trial)
    label: "Pro",
    price: 29.90,
    period: "/mês",
    description: "Para quem quer organizar e planejar.",
    recommended: true,
    trialDays: 7,
    features: [
      "Todas as 8 Ferramentas",
      "Lançamentos Ilimitados",
      "Exportação CSV/PDF",
      "Relatórios Mensais",
      "Backup na Nuvem"
    ]
  },
  PREMIUM: {
    id: "premium_monthly",
    tier: "premium",
    stripePriceId: "price_premium_trial_PLACEHOLDER", // ID do Stripe (price_premium_trial)
    label: "Premium",
    price: 79.90,
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
  }
};
