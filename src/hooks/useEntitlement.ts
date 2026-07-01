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
          // O sistema antigo escrevia plan (top-level) e subscription.status
          // (handleCheckoutCompleted em functions/lib/index.js)
          const userDocRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const legacyPlan = userData?.plan as string | undefined;
            const subStatus = (userData?.subscription as Record<string, unknown> | undefined)?.status as string | undefined;
            const subActive = subStatus === 'active' || subStatus === 'trialing';

            if (legacyPlan && legacyPlan !== 'free' && subActive) {
              const legacyTier = legacyPlan === 'premium' ? 'premium' : 'pro';
              setBilling({ tier: legacyTier, status: subStatus as BillingStatus });
              setEffectiveTier(legacyTier);
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
