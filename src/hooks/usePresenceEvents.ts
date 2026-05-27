import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/query/queryKeys';
import { createPresenceEventsRealtimeBridge, PresenceEvent } from '../services/presence.realtime';

export const usePresenceEvents = (userId?: string) => {
  const key = queryKeys.presence.byUser(userId || 'anonymous');

  useEffect(() => {
    if (!userId) return;
    const bridge = createPresenceEventsRealtimeBridge(userId);
    const unsubscribe = bridge.subscribe(() => {});
    return unsubscribe;
  }, [userId, key]);

  return useQuery<PresenceEvent[], Error>({
    queryKey: key,
    queryFn: () => Promise.resolve([]),
    enabled: !!userId,
  });
};
