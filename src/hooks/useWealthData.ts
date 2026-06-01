import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useGoals } from './useGoals';
import { useDebts } from '../services/debt/debt.hooks';
import { createAssetsRealtimeBridge, createPassivesRealtimeBridge } from '../services/wealth.realtime';
import { queryKeys } from '../core/query/queryKeys';
import { ActiveAsset } from '../components/tools/wealth/ActiveWealthManager';
import { PassiveAsset } from '../components/tools/wealth/PassiveWealthManager';

export const useWealthData = () => {
  const { user } = useAuth();
  const uid = user?.uid;

  const keyAssets = queryKeys.wealth.assetsByUser(uid || 'anonymous');
  const keyPassives = queryKeys.wealth.passivesByUser(uid || 'anonymous');

  const { data: assets = [], isLoading: assetsLoading, isFetching: assetsFetching } = useQuery<ActiveAsset[], Error>({
    queryKey: keyAssets,
    queryFn: () => Promise.resolve([]),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const { data: passives = [], isLoading: passivesLoading, isFetching: passivesFetching } = useQuery<PassiveAsset[], Error>({
    queryKey: keyPassives,
    queryFn: () => Promise.resolve([]),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const { goals, loading: goalsLoading } = useGoals(uid);
  const { data: debts = [], isLoading: debtsLoading, isSyncing: debtsSyncing } = useDebts(uid);

  const isSyncing = assetsFetching || passivesFetching || debtsSyncing;
  const loading = assetsLoading || passivesLoading || goalsLoading || debtsLoading;

  // Calcula totais com lógica contábil corrigida
  const totalInvestments = useMemo(() => assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0), [assets]);
  const totalProperty = useMemo(() => passives.reduce((sum, pass) => sum + (pass.currentValue || 0), 0), [passives]);
  const totalDebts = useMemo(() => debts.reduce((sum, debt) => sum + (debt.saldoDevedor || 0), 0), [debts]);

  // Patrimônio Líquido = (Investimentos + Bens Patrimoniais) - Dívidas
  const totalAssets = totalInvestments + totalProperty;
  const patrimonioLiquido = totalAssets - totalDebts;

  return {
    assets,
    passives,
    goals,
    debts,
    totalAssets,           // Soma de Investimentos + Bens
    totalInvestments,      // Apenas Financeiro
    totalProperty,         // Apenas Bens (ex-passives)
    totalDebts,            // Dívidas Reais
    patrimonioLiquido,
    loading,
    isSyncing,
  };
};