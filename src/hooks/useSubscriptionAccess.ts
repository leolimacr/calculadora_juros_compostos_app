import { useEntitlement } from './useEntitlement';

/**
 * @deprecated Use `useEntitlement` diretamente.
 *
 * Este hook é um wrapper de compatibilidade sobre `useEntitlement` (billing/main).
 * Antes lia de `users/{uid}.subscription.planId` — agora delega para a fonte
 * canônica `users/{uid}/billing/main`.
 *
 * Migre para `useEntitlement()` para acesso direto a:
 *   effectiveTier, billingStatus, isFree, isPro, isPremium, displayLabel,
 *   hasFeature(key), getUsageLimit(key)
 */
export const useSubscriptionAccess = () => {
  const { effectiveTier, loading } = useEntitlement();

  return {
    isPro: effectiveTier !== 'free',
    isPremium: effectiveTier === 'premium',
    loadingSubscription: loading,
    role: effectiveTier,
  };
};
