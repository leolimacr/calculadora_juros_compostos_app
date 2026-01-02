
import { Timestamp } from 'firebase/firestore';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled" | "trialing";

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate?: Timestamp;
  expiryDate?: Timestamp;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndDate?: Timestamp;
}

export interface UserAccess {
  // Legacy flags compatibility (mapped from plan)
  app_premium: boolean;
  site_premium: boolean;
  emailVerified: boolean;
}

export interface AppUserDoc {
  uid: string;
  email: string;
  displayName?: string;
  plan: SubscriptionPlan; // Main source of truth
  subscription?: UserSubscription;
  access?: UserAccess; // Optional/Derived
  createdAt?: Timestamp;
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
  // Returns true if user has Pro or Premium plan (Unlimited Access)
  // Also checks legacy flags
  return hasProAccess(user.plan || 'free') || !!user.access?.app_premium || !!user.access?.site_premium;
};
