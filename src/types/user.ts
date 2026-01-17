export interface AppUserDoc {
  uid: string;
  email: string;
  subscription?: {
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    planId?: string; // Pode vir vazio
    currentPeriodEnd: any;
  };
}

// Função Blindada para verificar Premium
export const isAppPremium = (user: AppUserDoc | null): boolean => {
  // Se não tem usuário ou não tem objeto de assinatura, é Free
  if (!user || !user.subscription) return false;
  
  const sub = user.subscription;
  const isActive = sub.status === 'active' || sub.status === 'trialing';
  
  // AQUI ESTAVA O ERRO: Garantimos que planId é uma string antes de usar .includes
  const planId = sub.planId || ''; 

  const isPaidPlan = planId.includes('premium') || planId.includes('pro');
  
  return isActive && isPaidPlan;
};