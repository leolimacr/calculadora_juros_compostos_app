
import firebase from 'firebase/app';
import 'firebase/firestore';

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
  startDate: firebase.firestore.Timestamp;
  expiryDate: firebase.firestore.Timestamp;
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
  createdAt: firebase.firestore.Timestamp;
}

// --- Helpers ---

export const isAppPremium = (userDoc: AppUserDoc | null): boolean => {
  if (!userDoc) return false;
  if (!userDoc.access.app_premium) return false;
  
  const now = new Date();
  const expiry = userDoc.subscription.expiryDate.toDate();
  return expiry > now;
};

export const isSitePremium = (userDoc: AppUserDoc | null): boolean => {
  if (!userDoc) return false;
  if (!userDoc.access.site_premium) return false;
  
  const now = new Date();
  const expiry = userDoc.subscription.expiryDate.toDate();
  return expiry > now;
};
