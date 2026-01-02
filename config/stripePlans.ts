
export type SubscriptionPlanId = "pro_monthly" | "premium_monthly";

export interface StripePlanConfig {
  id: SubscriptionPlanId;
  tier: 'pro' | 'premium';
  stripePriceId: string; // ID do preço no Stripe Dashboard
  label: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

// Planos exibidos na UI
export const PLANS = {
  FREE: {
    label: "Free",
    price: 0,
    features: [
      "Gerenciador Financeiro",
      "Juros Compostos",
      "Calculadora FIRE",
      "Limite de 5 lançamentos/mês",
      "Sem exportação de dados"
    ]
  },
  PRO: {
    id: "pro_monthly" as SubscriptionPlanId,
    tier: 'pro',
    stripePriceId: "price_pro_monthly_PLACEHOLDER", // Substituir pelo ID real do Stripe
    label: "Pro",
    price: 29.90,
    period: "/mês",
    description: "Para quem quer organizar e planejar.",
    recommended: true,
    features: [
      "Todas as 8 Ferramentas",
      "Lançamentos Ilimitados",
      "Exportação CSV/PDF",
      "Relatórios Mensais",
      "Backup na Nuvem"
    ]
  },
  PREMIUM: {
    id: "premium_monthly" as SubscriptionPlanId,
    tier: 'premium',
    stripePriceId: "price_premium_monthly_PLACEHOLDER", // Substituir pelo ID real do Stripe
    label: "Premium",
    price: 79.90,
    period: "/mês",
    description: "Inteligência Artificial e suporte total.",
    features: [
      "Tudo do plano PRO",
      "IA Advisor Ilimitado",
      "Relatórios Semanais por E-mail",
      "Prioridade no Suporte",
      "Integração Google Sheets (Em breve)"
    ]
  }
};
