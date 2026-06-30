import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { BillingDoc, BillingTier, BillingStatus } from '../types/billing';
import type { EntitlementKey } from '../config/featureAccessMatrix';
import {
  getEffectiveTier,
  hasFeature as checkFeatureFn,
  getUsageLimit as getUsageLimitFn,
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
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BillingDoc;
          setBilling({ tier: data.tier, status: data.status });
          setEffectiveTier(getEffectiveTier(data.tier, data.status));
          setBillingStatus(data.status);
        } else {
          setEffectiveTier('free');
          setBillingStatus(null);
          setBilling(null);
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

  return {
    loading,
    effectiveTier,
    billingStatus,
    hasFeature,
    getUsageLimit: getLimit,
  };
}
