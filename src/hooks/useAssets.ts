import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import { ActiveAsset } from '../components/tools/wealth/ActiveWealthManager';

export const useAssets = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.wealth.assetsByUser(userId || 'anonymous');

  const { data: assets = [], isLoading: loading, error, isFetching } = useQuery<ActiveAsset[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<ActiveAsset[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  return { 
    assets, 
    loading, 
    isSyncing: isFetching && !loading,
    error: error?.message || null 
  };
};