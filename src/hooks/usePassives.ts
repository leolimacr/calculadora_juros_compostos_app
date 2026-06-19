import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import type { PassiveAsset } from '../components/tools/wealth/PassiveWealthManager';

export const usePassives = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.wealth.passivesByUser(userId || 'anonymous');

  const { data: passives = [], isLoading: loading, error, isFetching } = useQuery<PassiveAsset[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<PassiveAsset[]>(key);
      return Promise.resolve(currentData ?? []);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  return { 
    passives, 
    loading, 
    isSyncing: isFetching && !loading,
    error: error?.message || null 
  };
};