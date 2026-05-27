import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useGoals } from './useGoals';
import { createAssetsRealtimeBridge, createPassivesRealtimeBridge } from '../services/wealth.realtime';
import { queryKeys } from '../core/query/queryKeys';
import { ActiveAsset } from '../components/tools/wealth/ActiveWealthManager';
import { PassiveAsset } from '../components/tools/wealth/PassiveWealthManager';

export const useWealthData = () => {
  const { user } = useAuth();
  const uid = user?.uid;

  const keyAssets = queryKeys.wealth.assetsByUser(uid || 'anonymous');
  const keyPassives = queryKeys.wealth.passivesByUser(uid || 'anonymous');

  useEffect(() => {
    if (!uid) return;
    const bridgeAssets = createAssetsRealtimeBridge(uid);
    const bridgePassives = createPassivesRealtimeBridge(uid);
    const unsubAssets = bridgeAssets.subscribe(() => {});
    const unsubPassives = bridgePassives.subscribe(() => {});
    return () => {
      unsubAssets();
      unsubPassives();
    };
  }, [uid]);

  const { data: assets = [], isLoading: assetsLoading } = useQuery<ActiveAsset[], Error>({
    queryKey: keyAssets,
    queryFn: () => Promise.resolve([]),
    enabled: !!uid,
  });

  const { data: passives = [], isLoading: passivesLoading } = useQuery<PassiveAsset[], Error>({
    queryKey: keyPassives,
    queryFn: () => Promise.resolve([]),
    enabled: !!uid,
  });

  const { goals, loading: goalsLoading } = useGoals(uid);

  const loading = assetsLoading || passivesLoading || goalsLoading;

  // Calcula totais
  const totalAssets = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  const totalPassives = passives.reduce((sum, pass) => sum + (pass.currentValue || 0), 0);
  const patrimonioLiquido = totalAssets - totalPassives;

  return {
    assets,
    passives,
    goals,
    totalAssets,
    totalPassives,
    patrimonioLiquido,
    loading,
  };
};