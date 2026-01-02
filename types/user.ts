
import { Timestamp } from 'firebase/firestore';

export type SubscriptionPlan = 
  | "free" 
  | "app_monthly" 
  | "app_annual" 
  | "site_monthly" 
  | "site_annual" 
  | "combo_annual";

export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled";

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate?: Timestamp;
  expiryDate?: Timestamp;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UserAccess {
  app_premium: boolean;
  site_premium: boolean;
  emailVerified: boolean;
}

export interface AppUserDoc {
  uid: string;
  email: string;
  subscription: UserSubscription;
  access: UserAccess;
  createdAt?: Timestamp;
}

// --- Helpers ---

export const isAppPremium = (userDoc: AppUserDoc | null): boolean => {
  if (!userDoc) return false;
  if (userDoc.access?.app_premium) {
    if (!userDoc.subscription?.expiryDate) return true; // Acesso vitalício ou erro favorável
    const now = new Date();
    return userDoc.subscription.expiryDate.toDate() > now;
  }
  return false;
};

export const isSitePremium = (userDoc: AppUserDoc | null): boolean => {
  if (!userDoc) return false;
  if (userDoc.access?.site_premium) {
    if (!userDoc.subscription?.expiryDate) return true;
    const now = new Date();
    return userDoc.subscription.expiryDate.toDate() > now;
  }
  return false;
};
