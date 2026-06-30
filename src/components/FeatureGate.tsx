import React from 'react';
import { useEntitlement } from '../hooks/useEntitlement';
import type { EntitlementKey } from '../config/featureAccessMatrix';

type FeatureGateProps = {
  featureKey: EntitlementKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureKey,
  fallback = null,
  children,
}) => {
  const { hasFeature } = useEntitlement();
  return hasFeature(featureKey) ? <>{children}</> : <>{fallback}</>;
};

export default FeatureGate;
