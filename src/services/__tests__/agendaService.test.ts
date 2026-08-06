import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAddDoc = vi.hoisted(() => vi.fn(() => ({ id: 'new-id' })));
const mockGetDocs = vi.hoisted(() => vi.fn());
const mockUpdateDoc = vi.hoisted(() => vi.fn());
const mockDeleteDoc = vi.hoisted(() => vi.fn());
const mockDoc = vi.hoisted(() => vi.fn((...args: any[]) => ({ path: args.slice(1).join('/') })));
const mockCollection = vi.hoisted(() => vi.fn(() => ({})));
const mockQuery = vi.hoisted(() => vi.fn(() => ({})));
const mockWhere = vi.hoisted(() => vi.fn(() => 'where'));
const mockOrderBy = vi.hoisted(() => vi.fn(() => 'orderBy'));
const mockLimit = vi.hoisted(() => vi.fn(() => 'limit'));
const mockServerTimestamp = vi.hoisted(() => vi.fn(() => 'server-ts'));
const mockTimestampNow = vi.hoisted(() => vi.fn(() => 'ts-now'));
const mockTimestampFromDate = vi.hoisted(() => vi.fn((d: Date) => `ts-${d.toISOString()}`));

vi.mock('../../firebase', () => ({
  firestore: {},
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: mockTimestampNow,
    fromDate: mockTimestampFromDate,
  },
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
  collection: mockCollection,
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  serverTimestamp: mockServerTimestamp,
}));

import {
  addCommitment,
  updateCommitment,
  deleteCommitment,
  toggleCommitment,
} from '../agendaService';

const USER_ID = 'user-1';

describe('agendaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCommitment', () => {
    it('cria documento com data, título e completed=false', async () => {
      const date = new Date('2026-07-29T00:00:00');
      const result = await addCommitment(USER_ID, {
        date,
        title: 'Reunião',
        completed: false,
      });

      expect(result).toBe('new-id');
      expect(mockAddDoc).toHaveBeenCalledTimes(1);

      const callArgs = mockAddDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
      const calledData = callArgs[1];
      expect(calledData.title).toBe('Reunião');
      expect(calledData.completed).toBe(false);
      expect(calledData.createdAt).toBe('ts-now');
      expect(calledData.updatedAt).toBe('ts-now');
    });

    it('inclui alarmAt quando informado', async () => {
      const date = new Date('2026-07-29T00:00:00');
      const alarm = new Date('2026-07-29T08:00:00');
      await addCommitment(USER_ID, {
        date,
        title: 'Alarme teste',
        completed: false,
        alarmAt: alarm,
      });

      const callArgs = mockAddDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
      const calledData = callArgs[1];
      expect(calledData.alarmAt).toBe(`ts-${alarm.toISOString()}`);
    });
  });

  describe('updateCommitment', () => {
    it('atualiza campo e adiciona serverTimestamp', async () => {
      await updateCommitment(USER_ID, 'c-1', { title: 'Editado' });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: `users/${USER_ID}/agenda/c-1` },
        { title: 'Editado', updatedAt: 'server-ts' }
      );
    });
  });

  describe('deleteCommitment', () => {
    it('remove o documento', async () => {
      await deleteCommitment(USER_ID, 'c-1');

      expect(mockDeleteDoc).toHaveBeenCalledWith(
        { path: `users/${USER_ID}/agenda/c-1` }
      );
    });
  });

  describe('toggleCommitment', () => {
    it('alterna completed e adiciona serverTimestamp', async () => {
      await toggleCommitment(USER_ID, 'c-1', true);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: `users/${USER_ID}/agenda/c-1` },
        { completed: true, updatedAt: 'server-ts' }
      );
    });
  });
});
