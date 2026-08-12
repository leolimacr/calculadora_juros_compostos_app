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
import type { AgendaRecurrence } from '../agendaService';

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

  describe('addCommitment — novos campos da série (Fase 1)', () => {
    it('persiste seriesId, recurrence, detached e endTime quando informados', async () => {
      const date = new Date('2026-08-18T00:00:00');
      const until = mockTimestampFromDate(new Date('2026-11-24T00:00:00'));
      const result = await addCommitment(USER_ID, {
        date,
        title: 'Reunião com o coordenador',
        completed: false,
        endTime: '18:00',
        seriesId: 'srv-1',
        recurrence: {
          freq: 'weekly',
          byDay: 2,
          until,
        } as unknown as AgendaRecurrence,
        detached: false,
      });

      expect(result).toBe('new-id');
      const callArgs = mockAddDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
      const calledData = callArgs[1];
      expect(calledData.endTime).toBe('18:00');
      expect(calledData.seriesId).toBe('srv-1');
      expect(calledData.detached).toBe(false);
      expect(calledData.recurrence).toEqual({
        freq: 'weekly',
        byDay: 2,
        until,
      });
    });

    it('persiste location, participants, notes e detachedNote quando informados', async () => {
      const date = new Date('2026-08-18T00:00:00');
      await addCommitment(USER_ID, {
        date,
        title: 'Reunião',
        completed: false,
        location: 'Sala 3',
        participants: ['Carlos', 'Ana'],
        notes: 'Trazer relatório',
        detached: true,
        detachedNote: 'movido pelo Nexus a pedido do usuário',
      });

      const callArgs = mockAddDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
      const calledData = callArgs[1];
      expect(calledData.location).toBe('Sala 3');
      expect(calledData.participants).toEqual(['Carlos', 'Ana']);
      expect(calledData.notes).toBe('Trazer relatório');
      expect(calledData.detached).toBe(true);
      expect(calledData.detachedNote).toBe('movido pelo Nexus a pedido do usuário');
    });

    it('não grava os campos opcionais quando ausentes (retrocompatibilidade)', async () => {
      const date = new Date('2026-07-29T00:00:00');
      await addCommitment(USER_ID, {
        date,
        title: 'Somente título',
        completed: false,
      });

      const callArgs = mockAddDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
      const calledData = callArgs[1];
      expect(calledData).not.toHaveProperty('seriesId');
      expect(calledData).not.toHaveProperty('recurrence');
      expect(calledData).not.toHaveProperty('detached');
      expect(calledData).not.toHaveProperty('detachedNote');
      expect(calledData).not.toHaveProperty('location');
      expect(calledData).not.toHaveProperty('participants');
      expect(calledData).not.toHaveProperty('notes');
    });

    it('grava endTime como null quando não informado (mesmo comportamento de time)', async () => {
      const date = new Date('2026-07-29T00:00:00');
      await addCommitment(USER_ID, {
        date,
        title: 'Sem horário de fim',
        completed: false,
      });

      const callArgs = mockAddDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
      const calledData = callArgs[1];
      expect(calledData.endTime).toBeNull();
    });
  });
});
