import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import { UserMeta } from '../types';
import { createUserMetaRealtimeBridge } from '../services/user.realtime';

export const useUserMeta = (userId?: string) => {
  const queryClient = useQueryClient();
  const key = queryKeys.user.profile(userId || 'anonymous');

  useEffect(() => {
    if (!userId) return;
    const bridge = createUserMetaRealtimeBridge(userId);
    const unsubscribe = bridge.subscribe(() => {});
    return unsubscribe;
  }, [userId, key]);

  const { data = null, isLoading: loading, error, isFetching } = useQuery<UserMeta | null, Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<UserMeta | null>(key);
      return Promise.resolve(currentData ?? null);
    },
    enabled: !!userId,
    staleTime: Infinity,
  });

  return {
    userMeta: data,
    loading,
    isSyncing: isFetching && !loading,
    error: error?.message || null,
  };
};
