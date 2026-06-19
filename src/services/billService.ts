import type {
  DocumentData,
  CollectionReference} from 'firebase/firestore';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { firestore } from '../firebase';
import type { RecurringBill } from '../types';

const getBillsCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(firestore, `users/${userId}/contas_fixas`);
};

/**
 * Adiciona uma nova conta fixa ou assinatura.
 */
export const addRecurringBill = async (userId: string, bill: Omit<RecurringBill, 'id' | 'userId'>): Promise<string> => {
  const docRef = await addDoc(getBillsCollection(userId), {
    ...bill,
    userId,
    isActive: true,
  });
  return docRef.id;
};

/**
 * Recupera todas as contas fixas e assinaturas do usuário.
 */
export const getRecurringBills = async (userId: string): Promise<RecurringBill[]> => {
  const querySnapshot = await getDocs(getBillsCollection(userId));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as RecurringBill[];
};

/**
 * Atualiza uma conta fixa ou assinatura.
 */
export const updateRecurringBill = async (userId: string, billId: string, data: Partial<RecurringBill>): Promise<void> => {
  const billRef = doc(firestore, `users/${userId}/contas_fixas`, billId);
  await updateDoc(billRef, data);
};

/**
 * Remove uma conta fixa ou assinatura.
 */
export const deleteRecurringBill = async (userId: string, billId: string): Promise<void> => {
  const billRef = doc(firestore, `users/${userId}/contas_fixas`, billId);
  await deleteDoc(billRef);
};
