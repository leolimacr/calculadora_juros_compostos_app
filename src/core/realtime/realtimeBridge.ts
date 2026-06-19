import type { QueryKey } from '@tanstack/react-query';
import { queryClient } from '../query/queryClient';
import type { Query, DocumentSnapshot, QuerySnapshot, DocumentReference } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import type { DataSnapshot, Query as RTDBQuery } from 'firebase/database';
import { onValue } from 'firebase/database';

interface FirestoreBridgeOptions<T> {
  queryKey: QueryKey;
  type: 'firestore';
  query: Query | DocumentReference;
  mapSnapshot: (snapshot: QuerySnapshot | DocumentSnapshot) => T;
}

interface RTDBBridgeOptions<T> {
  queryKey: QueryKey;
  type: 'rtdb';
  query: RTDBQuery;
  mapSnapshot: (snapshot: DataSnapshot) => T;
}

export type RealtimeBridgeOptions<T> = FirestoreBridgeOptions<T> | RTDBBridgeOptions<T>;

export const createRealtimeBridge = <T>(options: RealtimeBridgeOptions<T>) => {
  return {
    subscribe: (onUpdate: (data: T) => void) => {
      let unsubscribe: () => void;

      if (options.type === 'firestore') {
        const { query, mapSnapshot, queryKey } = options;
        unsubscribe = onSnapshot(query as any, (snapshot: any) => {
          const data = mapSnapshot(snapshot);
          queryClient.setQueryData(queryKey, data);
          onUpdate(data);
        });
      } else {
        const { query, mapSnapshot, queryKey } = options;
        unsubscribe = onValue(query, (snapshot) => {
          const data = mapSnapshot(snapshot);
          queryClient.setQueryData(queryKey, data);
          onUpdate(data);
        });
      }

      return unsubscribe;
    },
  };
};

export const useRealtimeBridge = <T>(options: RealtimeBridgeOptions<T>) => {
  return createRealtimeBridge(options);
};
