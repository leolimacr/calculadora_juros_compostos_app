import type { QuerySnapshot, DocumentSnapshot, DocumentData} from 'firebase/firestore';
import { collection, query, limit } from 'firebase/firestore';
import { firestore } from '../../firebase';
import type { DebtItem } from './debt.types';
import { mapDebtFromFirestore } from './debt.mapper';
import { createRealtimeBridge } from '../../core/realtime/realtimeBridge';
import { queryKeys } from '../../core/query/queryKeys';

export const createDebtRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<DebtItem[]>({
    queryKey: queryKeys.debts.byUser(userId),
    query: query(collection(firestore, `users/${userId}/dividas`), limit(100)),
    type: 'firestore',
    mapSnapshot: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
      if ('docs' in snapshot) {
        return snapshot.docs.map((doc) => mapDebtFromFirestore(doc.id, doc.data()));
      } else if (snapshot.exists()) {
        // This branch is not expected to be hit with the current query, but included for type safety.
        return [mapDebtFromFirestore(snapshot.id, snapshot.data() as DocumentData)];
      }
      return [];
    },
  });
};
