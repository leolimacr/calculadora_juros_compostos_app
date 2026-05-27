import {
    collection,
    query,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    QuerySnapshot,
    DocumentData,
    CollectionReference,
  } from 'firebase/firestore';
  import { firestore } from '../../firebase';
  import { DebtItem } from './debt.types';
  import { mapDebtFromFirestore, mapDebtToFirestore } from './debt.mapper';
  
  const getDebtsCollection = (userId: string): CollectionReference<DocumentData> => {
    return collection(firestore, `users/${userId}/dividas`);
  };
  
export const saveDebt = async (userId: string, debt: DebtItem): Promise<string> => {
    const docRef = await addDoc(getDebtsCollection(userId), mapDebtToFirestore(debt));
    return docRef.id;
  };
  
  export const updateDebt = async (userId: string, debtId: string, debt: Partial<DebtItem>): Promise<void> => {
    const debtRef = doc(getDebtsCollection(userId), debtId);
    await updateDoc(debtRef, debt);
  };
  
  export const deleteDebt = async (userId: string, debtId: string): Promise<void> => {
    const debtRef = doc(getDebtsCollection(userId), debtId);
    await deleteDoc(debtRef);
  };
