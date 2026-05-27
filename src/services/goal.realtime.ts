import { collection, query, QuerySnapshot, DocumentSnapshot, DocumentData, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Goal } from './goalService';
import { createRealtimeBridge } from '../core/realtime';
import { queryKeys } from '../core/query/queryKeys';

export const createGoalRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<Goal[]>({
    queryKey: queryKeys.goals.byUser(userId),
    query: query(collection(firestore, `users/${userId}/metas`), orderBy('createdAt', 'desc')),
    type: 'firestore',
    mapSnapshot: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
      if ('docs' in snapshot) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Goal));
      } else if (snapshot.exists()) {
        // This branch is not expected to be hit with the current query, but included for type safety.
        return [{ id: snapshot.id, ...snapshot.data() } as Goal];
      }
      return [];
    },
  });
};
