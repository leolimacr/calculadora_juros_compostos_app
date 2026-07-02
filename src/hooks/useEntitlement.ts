import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { BillingDoc, BillingTier, BillingStatus } from '../types/billing';
import type { EntitlementKey } from '../config/featureAccessMatrix';
import {
  getEffectiveTier,
  hasFeature as checkFeatureFn,
  getUsageLimit as getUsageLimitFn,
  getDisplayLabel,
  resolveLegacyPlanId,
} from '../config/featureAccessMatrix';

export function useEntitlement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [effectiveTier, setEffectiveTier] = useState<BillingTier>('free');
  const [billingStatus, setBillingStatus] = useState<BillingStatus>(null);
  const [billing, setBilling] = useState<{ tier: BillingTier; status: BillingStatus } | null>(null);

  useEffect(() => {
    if (!user || !firestore) {
      setEffectiveTier('free');
      setBillingStatus(null);
      setBilling(null);
      setLoading(false);
      return;
    }

    const billingDocRef = doc(firestore, 'users', user.uid, 'billing', 'main');

    const unsubBilling = onSnapshot(
      billingDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BillingDoc;
          setBilling({ tier: data.tier, status: data.status });
          setEffectiveTier(getEffectiveTier(data.tier, data.status));
          setBillingStatus(data.status);
        } else {
          // Fallback: ler campos legados do documento do usuário
          // Ordem de prioridade: billing/main > userData.plan > userData.subscription.planId > 'free'
          const userDocRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const legacyPlan = userData?.plan as string | undefined;
            const subStatus = (userData?.subscription as Record<string, unknown> | undefined)?.status as string | undefined;
            const subActive = subStatus === 'active' || subStatus === 'trialing';

            let resolvedTier: BillingTier | null = null;

            // Fallback 1: userData.plan (deprecated, escrito por versões antigas)
            if (legacyPlan && legacyPlan !== 'free' && subActive) {
              resolvedTier = legacyPlan === 'premium' ? 'premium' : 'pro';
            }

            // Fallback 2: subscription.planId (escrito pelo webhook Stripe atual)
            if (!resolvedTier || resolvedTier === 'free') {
              const subPlanId = (userData?.subscription as Record<string, unknown> | undefined)?.planId as string | undefined;
              if (subPlanId && subPlanId !== 'free' && subActive) {
                const resolved = resolveLegacyPlanId(subPlanId);
                if (resolved && resolved.tier !== 'free') {
                  resolvedTier = resolved.tier;
                }
              }
            }

            if (resolvedTier && resolvedTier !== 'free') {
              setBilling({ tier: resolvedTier, status: subStatus as BillingStatus });
              setEffectiveTier(resolvedTier);
              setBillingStatus(subStatus as BillingStatus);
            } else {
              setEffectiveTier('free');
              setBillingStatus(null);
              setBilling(null);
            }
          } else {
            setEffectiveTier('free');
            setBillingStatus(null);
            setBilling(null);
          }
        }
        setLoading(false);
      },
      () => {
        setEffectiveTier('free');
        setBillingStatus(null);
        setBilling(null);
        setLoading(false);
      },
    );

    return () => {
      unsubBilling();
    };
  }, [user]);

  const hasFeature = useCallback(
    (key: EntitlementKey): boolean => {
      if (!billing) return false;
      return checkFeatureFn(billing.tier, billing.status, key);
    },
    [billing],
  );

  const getLimit = useCallback(
    (key: EntitlementKey): { limit: number; unit: 'day' } | null => {
      if (!billing) return null;
      return getUsageLimitFn(billing.tier, billing.status, key);
    },
    [billing],
  );

  const isFree = effectiveTier === 'free';
  const isPro = effectiveTier !== 'free';
  const isPremium = effectiveTier === 'premium';

  const displayLabel = useMemo(() => {
    const tier = billing?.tier ?? 'free';
    return getDisplayLabel(tier, billingStatus);
  }, [billing, billingStatus]);

  return {
    loading,
    effectiveTier,
    billingStatus,
    isFree,
    isPro,
    isPremium,
    displayLabel,
    hasFeature,
    getUsageLimit: getLimit,
  };
}
