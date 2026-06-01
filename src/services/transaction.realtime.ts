import { ref, query as rtdbQuery, limitToLast, DataSnapshot } from 'firebase/database';
import { db } from '../firebase';
import { Transaction } from '../types';
import { createRealtimeBridge } from '../core/realtime/realtimeBridge';
import { queryKeys } from '../core/query/queryKeys';

export const createTransactionsRealtimeBridge = (userId: string) => {
  return createRealtimeBridge<Transaction[]>({
    queryKey: queryKeys.transactions.byUser(userId),
    query: rtdbQuery(ref(db, `transactions/${userId}`), limitToLast(100)),
    type: 'rtdb',
    mapSnapshot: (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const transactions: Transaction[] = [];
      if (data) {
        Object.entries(data).forEach(([id, value]: [string, any]) => {
          transactions.push({ id, ...value });
        });
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return transactions;
    },
  });
};
