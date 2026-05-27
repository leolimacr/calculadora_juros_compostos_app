import { doc, DocumentSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { firestore } from '../firebase';
import { UserMeta } from '../types';
import { createRealtimeBridge } from '../core/realtime';
import { queryKeys } from '../core/query/queryKeys';

export const createUserMetaRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<UserMeta | null>({
    queryKey: queryKeys.user.profile(userId),
    query: doc(firestore, 'users', userId),
    type: 'firestore',
    mapSnapshot: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
      if ('docs' in snapshot) {
        return snapshot.docs.length > 0 ? (snapshot.docs[0].data() as UserMeta) : null;
      } else if (snapshot.exists()) {
        return snapshot.data() as UserMeta;
      }
      return null;
    },
  });
};
