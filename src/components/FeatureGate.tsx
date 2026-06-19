import React from 'react';
import type { Plan } from '../utils/plan';
import { hasPlanAccess } from '../utils/plan';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

type FeatureGateProps = {
  /** Current user plan */
  currentPlan?: Plan; // optional, defaults to hook value
  /** Minimum required plan to render children */
  requiredPlan: Plan;
  /** Optional fallback to render when access is denied */
  fallback?: React.ReactNode;
  /** Content to render when access is granted */
  children: React.ReactNode;
};

/**
 * Centralized component to guard UI features based on subscription plan.
 * If `currentPlan` is not provided, it falls back to the hook `useSubscriptionAccess`.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  currentPlan,
  requiredPlan,
  fallback = null,
  children,
}) => {
  const { currentPlan: hookPlan } = useSubscriptionAccess();
  const plan = currentPlan ?? hookPlan;
  return hasPlanAccess(plan, requiredPlan) ? <>{children}</> : <>{fallback}</>;
};

export default FeatureGate;
