import { collection, query, QuerySnapshot, DocumentSnapshot, DocumentData, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase';
import { ActiveAsset } from '../components/tools/wealth/ActiveWealthManager';
import { PassiveAsset } from '../components/tools/wealth/PassiveWealthManager';
import { createRealtimeBridge } from '../core/realtime';
import { queryKeys } from '../core/query/queryKeys';

export const createAssetsRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<ActiveAsset[]>({
    queryKey: queryKeys.wealth.assetsByUser(userId),
    query: query(collection(firestore, `users/${userId}/ativos`), orderBy('currentValue', 'desc')),
    type: 'firestore',
    mapSnapshot: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
      if ('docs' in snapshot) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ActiveAsset));
      } else if (snapshot.exists()) {
        return [{ id: snapshot.id, ...snapshot.data() } as ActiveAsset];
      }
      return [];
    },
  });
};

export const createPassivesRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<PassiveAsset[]>({
    queryKey: queryKeys.wealth.passivesByUser(userId),
    query: query(collection(firestore, `users/${userId}/passivos`), orderBy('currentValue', 'desc')),
    type: 'firestore',
    mapSnapshot: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
      if ('docs' in snapshot) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PassiveAsset));
      } else if (snapshot.exists()) {
        return [{ id: snapshot.id, ...snapshot.data() } as PassiveAsset];
      }
      return [];
    },
  });
};
