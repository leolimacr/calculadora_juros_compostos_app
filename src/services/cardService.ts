import type {
    DocumentData,
    CollectionReference} from 'firebase/firestore';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
  } from 'firebase/firestore';
  import { firestore } from '../firebase';
  import type { CreditCard } from '../types';
  
  const getCardsCollection = (userId: string): CollectionReference<DocumentData> => {
    return collection(firestore, `users/${userId}/cartoes`);
  };
  
  /**
   * Adiciona um novo cartão nominal para o usuário.
   */
  export const addCard = async (userId: string, name: string, closingDay: number, dueDay: number, limit?: number, taxaJuros?: number): Promise<string> => {
    const docRef = await addDoc(getCardsCollection(userId), { 
      name, 
      isActive: true,
      closingDay,
      dueDay,
      limit: limit || 0,
      ...(taxaJuros !== undefined && { taxaJuros }),
    });
    return docRef.id;
  };
  
  /**
   * Recupera a lista de cartões cadastrados pelo usuário.
   */
  export const getCards = async (userId: string): Promise<CreditCard[]> => {
    const querySnapshot = await getDocs(getCardsCollection(userId));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CreditCard[];
  };

  /**
   * Atualiza as informações de um cartão.
   */
  export const updateCard = async (userId: string, cardId: string, data: Partial<CreditCard>): Promise<void> => {
    const cardRef = doc(firestore, `users/${userId}/cartoes`, cardId);
    await updateDoc(cardRef, data);
  };

  /**
   * Remove um cartão.
   */
  export const deleteCard = async (userId: string, cardId: string): Promise<void> => {
    const cardRef = doc(firestore, `users/${userId}/cartoes`, cardId);
    await deleteDoc(cardRef);
  };
