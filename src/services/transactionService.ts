import { push, ref, set } from 'firebase/database';
import { db } from '../firebase';
import type { RecurringBill, Transaction } from '../types';
import { updateRecurringBill } from './billService';
import { getLocalDateString } from '../utils/dateHelpers';

/**
 * Adiciona uma nova transação ao Realtime Database.
 */
export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<string> => {
  const transactionRef = push(ref(db, `transactions/${userId}`));
  const now = Date.now();
  const dateClean = transaction.date.replace(/-/g, '');
  await set(transactionRef, {
    ...transaction,
    userId,
    createdAtMs: now,
    sortKey: `${dateClean}_${now}_${transactionRef.key}`,
  });
  return transactionRef.key!;
};

/**
 * Cria uma transação para o pagamento de uma conta recorrente e opcionalmente atualiza a bill.
 */
export const addPaidRecurringBillTransaction = async (userId: string, bill: RecurringBill): Promise<string> => {
  const newTransaction: Omit<Transaction, 'id'> = {
    userId,
    description: `Pagamento de ${bill.name}`,
    amount: bill.amount,
    type: 'expense',
    category: bill.category,
    date: getLocalDateString(),
    paymentMethod: 'money', // Assumindo pagamento em dinheiro
    isBillPayment: true,
    linkedRecurringBillId: bill.id, // Linkar à conta recorrente
  };

  const transactionId = await addTransaction(userId, newTransaction);

  // Opcional: Atualizar a RecurringBill para registrar a data do último pagamento
  // Isso será útil para evitar notificações duplicadas e para controle visual.
  await updateRecurringBill(userId, bill.id, { lastPaidDate: new Date().toISOString() });

  return transactionId;
};
