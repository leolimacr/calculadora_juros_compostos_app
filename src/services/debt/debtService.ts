import type {
  DocumentData,
  CollectionReference} from 'firebase/firestore';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { firestore } from '../../firebase';
import { queryClient } from '../../core/query/queryClient';
import { queryKeys } from '../../core/query/queryKeys';
import type { DebtItem } from './debt.types';
import { mapDebtFromFirestore, mapDebtToFirestore } from './debt.mapper';

const getDebtsCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(firestore, `users/${userId}/dividas`);
};

export const saveDebt = async (userId: string, debt: DebtItem): Promise<string> => {
  const docRef = await addDoc(getDebtsCollection(userId), mapDebtToFirestore(debt));
  queryClient.invalidateQueries({ queryKey: queryKeys.debts.byUser(userId) });
  return docRef.id;
};

export const updateDebt = async (userId: string, debtId: string, debt: Partial<DebtItem>): Promise<void> => {
  const debtRef = doc(getDebtsCollection(userId), debtId);
  await updateDoc(debtRef, debt);
  queryClient.invalidateQueries({ queryKey: queryKeys.debts.byUser(userId) });
};

export const deleteDebt = async (userId: string, debtId: string): Promise<void> => {
  const debtRef = doc(getDebtsCollection(userId), debtId);
  await deleteDoc(debtRef);
  queryClient.invalidateQueries({ queryKey: queryKeys.debts.byUser(userId) });
};

/**
 * Abate uma parcela de todas as dívidas ativas (Amortizaçío Automática Mensal)
 */
export const amortizeDebts = async (userId: string): Promise<void> => {
  const querySnapshot = await getDocs(getDebtsCollection(userId));
  const promises = querySnapshot.docs.map(async (d) => {
    const data = mapDebtFromFirestore(d.id, d.data());
    if (data.saldoDevedor > 0 && data.parcelasRestantes > 0) {
      const newSaldo = Math.max(0, data.saldoDevedor - data.valorParcela);
      const newParcelas = Math.max(0, data.parcelasRestantes - 1);
      await updateDebt(userId, d.id, { 
        saldoDevedor: newSaldo, 
        parcelasRestantes: newParcelas 
      });
    }
  });
  await Promise.all(promises);
};
