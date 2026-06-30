import type { DocumentData, CollectionReference } from 'firebase/firestore';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { CardInvoice, CreditCard, InvoiceStatus } from '../types';
import { getInvoiceBillingMonth } from '../utils/invoiceUtils';

const getInvoicesCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(firestore, `users/${userId}/faturas`);
};

export const buildInvoiceId = (cardId: string, periodEnd: string): string => {
  return `${cardId}_${periodEnd}`;
};

export const getInvoice = async (userId: string, invoiceId: string): Promise<CardInvoice | null> => {
  const ref = doc(firestore, `users/${userId}/faturas`, invoiceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CardInvoice;
};

export const getInvoicesByCard = async (userId: string, cardId: string): Promise<CardInvoice[]> => {
  const col = getInvoicesCollection(userId);
  const q = query(col, where('cardId', '==', cardId), orderBy('periodEnd', 'desc'), limit(24));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CardInvoice));
};

export const getCurrentStoredInvoice = async (userId: string, cardId: string, periodEnd: string): Promise<CardInvoice | null> => {
  const invoiceId = buildInvoiceId(cardId, periodEnd);
  return getInvoice(userId, invoiceId);
};

export const saveInvoice = async (userId: string, invoice: Omit<CardInvoice, 'id'>): Promise<void> => {
  const invoiceId = buildInvoiceId(invoice.cardId, invoice.periodEnd);
  const ref = doc(firestore, `users/${userId}/faturas`, invoiceId);
  await setDoc(ref, invoice, { merge: true });
};

export const deleteInvoice = async (userId: string, invoiceId: string): Promise<void> => {
  const ref = doc(firestore, `users/${userId}/faturas`, invoiceId);
  await deleteDoc(ref);
};

export interface InvoiceUpdateData {
  paidAmount: number;
  status: InvoiceStatus;
  remainingAmount: number;
  total: number;
  updatedAt: string;
}

export const updateInvoiceAfterPayment = async (
  userId: string,
  cardId: string,
  periodEnd: string,
  data: InvoiceUpdateData
): Promise<void> => {
  const invoiceId = buildInvoiceId(cardId, periodEnd);
  const ref = doc(firestore, `users/${userId}/faturas`, invoiceId);
  await setDoc(ref, {
    cardId,
    periodEnd,
    ...data,
  }, { merge: true });
};

function getPeriodDatesForPayment(card: CreditCard, paymentDate: string): { periodEnd: string; dueDate: string } | null {
  if (!card.closingDay || !card.dueDay) return null;
  const billing = getInvoiceBillingMonth(card, paymentDate);
  const y = billing.year;
  const m = billing.month;
  const periodEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(card.closingDay).padStart(2, '0')}`;
  return { periodEnd, dueDate: billing.dueDate };
}

export async function syncInvoiceAfterPayment(
  userId: string,
  cardId: string,
  paymentAmount: number,
  paymentDate: string,
  card: CreditCard
): Promise<void> {
  const period = getPeriodDatesForPayment(card, paymentDate);
  if (!period) return;

  const invoiceId = buildInvoiceId(cardId, period.periodEnd);
  const existing = await getInvoice(userId, invoiceId);

  if (existing?.rotativoConverted) return;

  const now = new Date().toISOString();
  if (existing) {
    const newPaidAmount = (existing.paidAmount || 0) + paymentAmount;
    const newRemaining = Math.max(0, existing.total - newPaidAmount);
    const newStatus: InvoiceStatus = newPaidAmount >= existing.total ? 'paid' : 'partial';
    await updateInvoiceAfterPayment(userId, cardId, period.periodEnd, {
      paidAmount: newPaidAmount,
      status: newStatus,
      remainingAmount: newRemaining,
      total: existing.total,
      updatedAt: now,
    });
  } else {
    await updateInvoiceAfterPayment(userId, cardId, period.periodEnd, {
      paidAmount: paymentAmount,
      status: 'partial',
      remainingAmount: 0,
      total: 0,
      updatedAt: now,
    });
  }
}
