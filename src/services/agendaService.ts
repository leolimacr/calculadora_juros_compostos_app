import type { DocumentData, CollectionReference } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  collection,
  addDoc,
  getDocs,

  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../firebase';

export interface AgendaCommitment {
  id?: string;
  date: Timestamp;
  title: string;
  time?: string;
  completed: boolean;
  alarmAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Input para criar um compromisso (date é Date, convertido para Timestamp pelo Firestore) */
export interface AgendaCommitmentInput {
  date: Date;
  title: string;
  time?: string;
  completed: boolean;
  alarmAt?: Date;
}

const getCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(firestore, `users/${userId}/agenda`);
};

/** Requer índice composto Firestore: date ASC, time ASC */
export const fetchMonthCommitments = async (
  userId: string,
  year: number,
  month: number
): Promise<AgendaCommitment[]> => {
  const startOfMonth = new Date(year, month, 1);
  const startOfNextMonth = new Date(year, month + 1, 1);

  const q = query(
    getCollection(userId),
    where('date', '>=', startOfMonth),
    where('date', '<', startOfNextMonth),
    orderBy('date', 'asc'),
    orderBy('time', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AgendaCommitment));
};

export const fetchUpcomingCommitments = async (
  userId: string,
  max = 10
): Promise<AgendaCommitment[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    getCollection(userId),
    where('date', '>=', today),
    orderBy('date', 'asc'),
    orderBy('time', 'asc'),
    limit(max)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AgendaCommitment));
};

export const addCommitment = async (
  userId: string,
  data: AgendaCommitmentInput
): Promise<string> => {
  const now = Timestamp.now();
  const docData: Record<string, unknown> = {
    date: Timestamp.fromDate(data.date),
    title: data.title,
    completed: data.completed,
    createdAt: now,
    updatedAt: now,
  };
  docData.time = data.time ?? null;
  if (data.alarmAt) docData.alarmAt = Timestamp.fromDate(data.alarmAt);
  const docRef = await addDoc(getCollection(userId), docData);
  return docRef.id;
};

export const updateCommitment = async (
  userId: string,
  commitmentId: string,
  data: Record<string, unknown>
): Promise<void> => {
  const ref = doc(firestore, `users/${userId}/agenda`, commitmentId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteCommitment = async (
  userId: string,
  commitmentId: string
): Promise<void> => {
  const ref = doc(firestore, `users/${userId}/agenda`, commitmentId);
  await deleteDoc(ref);
};

export const toggleCommitment = async (
  userId: string,
  commitmentId: string,
  completed: boolean
): Promise<void> => {
  const ref = doc(firestore, `users/${userId}/agenda`, commitmentId);
  await updateDoc(ref, { completed, updatedAt: serverTimestamp() });
};
