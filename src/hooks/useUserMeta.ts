import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import { UserMeta } from '../types';
import { createUserMetaRealtimeBridge } from '../services/user.realtime';

export const useUserMeta = (userId?: string) => {
  const key = queryKeys.user.profile(userId || 'anonymous');

  useEffect(() => {
    if (!userId) return;
    const bridge = createUserMetaRealtimeBridge(userId);
    const unsubscribe = bridge.subscribe(() => {});
    return unsubscribe;
  }, [userId, key]);

  return useQuery<UserMeta | null, Error>({
    queryKey: key,
    queryFn: () => Promise.resolve(null),
    enabled: !!userId,
  });
};
