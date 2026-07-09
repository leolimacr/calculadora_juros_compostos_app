import type { QuerySnapshot, DocumentSnapshot, DocumentData} from 'firebase/firestore';
import { collection, query, where, limit } from 'firebase/firestore';
import { firestore } from '../firebase';
import { createRealtimeBridge } from '../core/realtime';
import { queryKeys } from '../core/query/queryKeys';

export interface PresenceEvent {
  eventId: string;
  eventType: string;
  urgency: 'low' | 'medium' | 'high';
  message: { title: string; body: string; ctaLabel: string };
  deepLink: string;
}

export const createPresenceEventsRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<PresenceEvent[]>({
    queryKey: queryKeys.presence.byUser(userId),
    query: query(collection(firestore, 'users', userId, 'presenceEvents'), where('status', '==', 'pending'), limit(20)),
    type: 'firestore',
    mapSnapshot: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
      if ('docs' in snapshot) {
        return snapshot.docs.map((doc) => ({ eventId: doc.id, ...doc.data() } as PresenceEvent));
      } else if (snapshot.exists()) {
        // This branch is not expected to be hit with the current query, but included for type safety.
        return [{ eventId: snapshot.id, ...snapshot.data() } as PresenceEvent];
      }
      return [];
    },
  });
};
