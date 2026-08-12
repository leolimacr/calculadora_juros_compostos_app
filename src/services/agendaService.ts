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

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly';

/**
 * Regra de recorrência de uma série de compromissos (espelho do que o Nexus
 * interpreta em linguagem natural). `until` é a última ocorrência da série.
 */
export interface AgendaRecurrence {
  freq: RecurrenceFreq;
  /** 1..7, seg=1 — obrigatório quando freq === 'weekly' */
  byDay?: number;
  until?: Timestamp;
}

export interface AgendaCommitment {
  id?: string;
  date: Timestamp;
  title: string;
  time?: string;
  /** Hora de término (ex.: '17h às 18h' → '18:00'). Opcional. */
  endTime?: string;
  completed: boolean;
  alarmAt?: Timestamp;
  /** Vínculo com a série original. Todos os membros de uma recorrência compartilham o mesmo id. */
  seriesId?: string;
  /** Regra de recorrência da qual este compromisso faz parte. */
  recurrence?: AgendaRecurrence;
  /** TRUE = exceção desmembrada da regra original (movida/editada individualmente). */
  detached?: boolean;
  detachedNote?: string;
  location?: string;
  participants?: string[];
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Input para criar um compromisso (date é Date, convertido para Timestamp pelo Firestore) */
export interface AgendaCommitmentInput {
  date: Date;
  title: string;
  time?: string;
  endTime?: string;
  completed: boolean;
  alarmAt?: Date;
  seriesId?: string;
  recurrence?: AgendaRecurrence;
  detached?: boolean;
  detachedNote?: string;
  location?: string;
  participants?: string[];
  notes?: string;
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
  docData.endTime = data.endTime ?? null;
  if (data.alarmAt) docData.alarmAt = Timestamp.fromDate(data.alarmAt);
  if (data.seriesId !== undefined) docData.seriesId = data.seriesId;
  if (data.recurrence !== undefined) docData.recurrence = data.recurrence;
  if (data.detached !== undefined) docData.detached = data.detached;
  if (data.detachedNote !== undefined) docData.detachedNote = data.detachedNote;
  if (data.location !== undefined) docData.location = data.location;
  if (data.participants !== undefined) docData.participants = data.participants;
  if (data.notes !== undefined) docData.notes = data.notes;
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
