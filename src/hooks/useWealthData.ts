import { useAuth } from '../contexts/AuthContext';
import { useAssets } from './useAssets';
import { usePassives } from './usePassives';
import { useGoals } from './useGoals';

export const useWealthData = () => {
  const { user } = useAuth();
  const uid = user?.uid;

  const { assets, loading: assetsLoading } = useAssets(uid);
  const { passives, loading: passivesLoading } = usePassives(uid);
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