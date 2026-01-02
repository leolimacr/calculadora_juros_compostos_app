
import firebase from 'firebase/compat/app';
import { UserStats } from './gamification';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid" | "paused";

export interface UserToolsAccess {
  gerenciador: boolean;
  jurosCompostos: boolean;
  calculadoraFire: boolean;
  otimizadorDividas: boolean;
  aluguelVsFinanciamento: boolean;
  calculadoraRoi: boolean;
  simuladorDividendos: boolean;
  simuladorResiliencia: boolean;
  iaAdvisor: boolean;
  exportacao: boolean;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  startDate?: firebase.firestore.Timestamp;
  currentPeriodStart?: firebase.firestore.Timestamp;
  currentPeriodEnd?: firebase.firestore.Timestamp;
  trialEndDate?: firebase.firestore.Timestamp;
  cancelAtPeriodEnd?: boolean;
  expiryDate?: firebase.firestore.Timestamp;
}

export interface UserAccess {
  app_premium: boolean;
  site_premium: boolean;
  emailVerified: boolean;
}

export interface AppUserDoc {
  uid: string;
  email: string;
  displayName?: string;
  
  // Monetização
  plan: SubscriptionPlan;
  subscription?: UserSubscription;
  toolsAccess?: UserToolsAccess;
  
  // Gamificação
  gamification?: UserStats;

  // Metadata
  access?: UserAccess; 
  createdAt?: firebase.firestore.Timestamp;
  updatedAt?: firebase.firestore.Timestamp;
}

// --- Helpers ---

export const getUserPlan = (userDoc: AppUserDoc | null): SubscriptionPlan => {
  return userDoc?.plan || 'free';
};

export const hasProAccess = (plan: SubscriptionPlan): boolean => {
  return plan === 'pro' || plan === 'premium';
};

export const hasPremiumAccess = (plan: SubscriptionPlan): boolean => {
  return plan === 'premium';
};

export const isAppPremium = (user: AppUserDoc | null): boolean => {
  if (!user) return false;
  return hasProAccess(user.plan || 'free') || !!user.access?.app_premium || !!user.access?.site_premium;
};
