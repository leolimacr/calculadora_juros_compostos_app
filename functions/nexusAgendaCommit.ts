import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import {
  parseAndValidateAgendaEnvelope,
  type AgendaEnvelope,
} from './nexus-core/agenda-intent-schema';
import {
  expandRecurrence,
  generateCommitmentId,
  generateSeriesId,
  isoToYmd,
  saoPauloDayRangeMillis,
  type RecurrenceFreq,
} from './nexus-core/agenda-time';

export const MAX_COMMIT_BATCH_WRITES = 400;
export const MAX_COMMIT_OCCURRENCES = 800;

interface PendingDocument {
  uid?: unknown;
  nonce?: unknown;
  confirmationToken?: unknown;
  status?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  createdAtMs?: unknown;
  expiresAtMs?: unknown;
  envelope?: unknown;
  recap?: unknown;
  warnings?: unknown;
  executionId?: unknown;
  result?: unknown;
}

interface CommitDocument {
  id: string;
  data: Record<string, unknown>;
}

interface CommitAudit {
  actionId: string;
  uid: string;
  token: string;
  status: 'committed' | 'failed' | 'partial';
  idsCreated: string[];
  seriesId?: string;
  before: null;
  after: Record<string, unknown>[];
  requestHash: string;
  createdAtMs: number;
  completedAtMs: number;
  error?: string;
}

export interface CommitResult {
  success: true;
  actionId: string;
  status: 'committed';
  idsCreated: string[];
  seriesId?: string;
  occurrenceCount: number;
}

export interface CommitDependencies {
  claimPending(uid: string, token: string, nowMs: number, executionId: string): Promise<
    | { kind: 'claimed'; pending: PendingDocument }
    | { kind: 'idempotent'; result: CommitResult }
    | { kind: 'rejected'; reason: string }
  >;
  existingIds(uid: string, ids: string[]): Promise<string[]>;
  writeBatch(uid: string, documents: CommitDocument[]): Promise<void>;
  finalizePending(uid: string, token: string, patch: Record<string, unknown>): Promise<void>;
  writeAudit(uid: string, actionId: string, audit: CommitAudit): Promise<void>;
}

export interface CommitRequest {
  confirmationToken: string;
  confirmed: boolean;
}

export function requireCommitAuth(request: { auth?: { uid?: string } | null }): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login necessário para confirmar a Agenda.');
  return uid;
}

function timestampMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

function minutes(value?: string): number {
  if (!value) return 0;
  const [hour, minute] = value.split(':').map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

function timestampForOccurrence(isoDate: string, time?: string): Timestamp {
  const range = saoPauloDayRangeMillis(isoToYmd(isoDate));
  return Timestamp.fromMillis(range.startMs + minutes(time) * 60000);
}

function requestHash(uid: string, token: string, confirmed: boolean): string {
  return createHash('sha1').update(`${uid}|${token}|${String(confirmed)}`).digest('hex');
}

function validatePendingEnvelope(pending: PendingDocument): AgendaEnvelope {
  const result = parseAndValidateAgendaEnvelope(JSON.stringify(pending.envelope));
  if (!result.ok) throw new Error(`Proposta inválida: ${result.errors.join('; ')}`);
  return result.data;
}

function buildCommitDocuments(
  uid: string,
  envelope: AgendaEnvelope,
  actionId: string,
  token: string,
): { documents: CommitDocument[]; seriesId?: string; occurrenceCount: number } {
  if (envelope.intent !== 'create' || envelope.action !== 'create_commitment') {
    throw new Error('Somente propostas create_commitment podem ser executadas nesta fase.');
  }

  const title = envelope.entities.title;
  const date = envelope.entities.date?.resolved;
  if (!title || !date) throw new Error('A proposta não possui título e data resolvida.');

  const recurrence = envelope.entities.recurrence;
  const until = recurrence?.until?.resolved;
  const expansion = recurrence
    ? expandRecurrence({
        freq: recurrence.freq as RecurrenceFreq,
        startIso: date,
        untilIso: until,
      }, MAX_COMMIT_OCCURRENCES)
    : { occurrences: [date], truncated: false };

  if (expansion.truncated || expansion.occurrences.length > MAX_COMMIT_OCCURRENCES) {
    throw new Error(`A proposta excede o limite de ${MAX_COMMIT_OCCURRENCES} ocorrências.`);
  }

  const seriesId = recurrence ? generateSeriesId(title, date) : undefined;
  const now = Timestamp.now();
  const documents = expansion.occurrences.map((occurrence) => {
    const id = generateCommitmentId(seriesId ?? null, occurrence, envelope.entities.startTime ?? '');
    const data: Record<string, unknown> = {
      date: timestampForOccurrence(occurrence, envelope.entities.startTime),
      title,
      time: envelope.entities.startTime ?? null,
      endTime: envelope.entities.endTime ?? null,
      completed: false,
      createdBy: 'nexus',
      createdByActionId: actionId,
      createdByToken: token,
      createdAt: now,
      updatedAt: now,
    };

    if (seriesId) data.seriesId = seriesId;
    if (recurrence) {
      data.recurrence = {
        freq: recurrence.freq,
        ...(recurrence.byDay === undefined ? {} : { byDay: recurrence.byDay }),
        ...(until ? { until: timestampForOccurrence(until) } : {}),
      };
    }
    if (envelope.entities.location !== undefined) data.location = envelope.entities.location;
    if (envelope.entities.participants !== undefined) data.participants = envelope.entities.participants;
    if (envelope.entities.notes !== undefined) data.notes = envelope.entities.notes;

    return { id, data };
  });

  void uid;
  return { documents, seriesId, occurrenceCount: documents.length };
}

export async function executeAgendaCommit(
  uid: string,
  request: CommitRequest,
  dependencies: CommitDependencies,
  now = Date.now(),
): Promise<CommitResult> {
  if (!request.confirmed) throw new HttpsError('failed-precondition', 'A confirmação explícita é obrigatória.');
  if (!request.confirmationToken || typeof request.confirmationToken !== 'string') {
    throw new HttpsError('invalid-argument', 'confirmationToken é obrigatório.');
  }

  const executionId = `exec_${createHash('sha1').update(`${uid}|${request.confirmationToken}|${now}`).digest('hex').slice(0, 20)}`;
  const claimed = await dependencies.claimPending(uid, request.confirmationToken, now, executionId);
  if (claimed.kind === 'idempotent') return claimed.result;
  if (claimed.kind === 'rejected') throw new HttpsError('failed-precondition', claimed.reason);

  const actionId = `act_${executionId.slice(5)}`;
  const pending = claimed.pending;
  const createdAtMs = timestampMs(pending.createdAtMs) ?? timestampMs(pending.createdAt) ?? now;
  const expiresAtMs = timestampMs(pending.expiresAtMs) ?? timestampMs(pending.expiresAt);
  if (pending.uid !== uid) throw new HttpsError('permission-denied', 'A proposta não pertence ao usuário autenticado.');
  if (pending.status !== 'processing') throw new HttpsError('failed-precondition', 'A proposta não está em processamento.');
  if (!expiresAtMs || expiresAtMs <= now) throw new HttpsError('deadline-exceeded', 'A proposta de agenda expirou.');
  if (pending.nonce !== request.confirmationToken || pending.confirmationToken !== request.confirmationToken) {
    throw new HttpsError('failed-precondition', 'O token da proposta é inválido.');
  }
  if (now < createdAtMs) throw new HttpsError('failed-precondition', 'A data da proposta é inválida.');

  let documents: CommitDocument[] = [];
  let committedIds: string[] = [];
  let seriesId: string | undefined;
  try {
    const envelope = validatePendingEnvelope(pending);
    const built = buildCommitDocuments(uid, envelope, actionId, request.confirmationToken);
    documents = built.documents;
    seriesId = built.seriesId;

    const alreadyExisting = await dependencies.existingIds(uid, documents.map((document) => document.id));
    if (alreadyExisting.length > 0) throw new Error(`Compromissos já existentes: ${alreadyExisting.join(', ')}`);

    for (let index = 0; index < documents.length; index += MAX_COMMIT_BATCH_WRITES) {
      const batchDocuments = documents.slice(index, index + MAX_COMMIT_BATCH_WRITES);
      await dependencies.writeBatch(uid, batchDocuments);
      committedIds = committedIds.concat(batchDocuments.map((document) => document.id));
    }

    const completedAtMs = Date.now();
    const result: CommitResult = {
      success: true,
      actionId,
      status: 'committed',
      idsCreated: committedIds,
      seriesId,
      occurrenceCount: documents.length,
    };
    await dependencies.writeAudit(uid, actionId, {
      actionId,
      uid,
      token: request.confirmationToken,
      status: 'committed',
      idsCreated: result.idsCreated,
      seriesId,
      before: null,
      after: documents
        .filter((document) => committedIds.includes(document.id))
        .map((document) => ({ id: document.id, ...document.data })),
      requestHash: requestHash(uid, request.confirmationToken, request.confirmed),
      createdAtMs,
      completedAtMs,
    });
    await dependencies.finalizePending(uid, request.confirmationToken, { status: 'committed', executionId, result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida na gravação.';
    const status = committedIds.length > 0 ? 'partial' : 'failed';
    const completedAtMs = Date.now();
    await dependencies.writeAudit(uid, actionId, {
      actionId,
      uid,
      token: request.confirmationToken,
      status,
      idsCreated: committedIds,
      seriesId,
      before: null,
      after: documents
        .filter((document) => committedIds.includes(document.id))
        .map((document) => ({ id: document.id, ...document.data })),
      requestHash: requestHash(uid, request.confirmationToken, request.confirmed),
      createdAtMs,
      completedAtMs,
      error: message,
    });
    await dependencies.finalizePending(uid, request.confirmationToken, { status, executionId, error: message });
    throw new HttpsError(
      'internal',
      status === 'partial'
        ? `A gravação foi parcialmente concluída e precisa de reconciliação. (${message})`
        : `Não foi possível gravar a proposta de agenda. (${message})`,
    );
  }
}

function buildFirestoreDependencies(db: ReturnType<typeof getFirestore>): CommitDependencies {
  const pendingPath = (uid: string, token: string) => `users/${uid}/agenda/_nexus/pending/${token}`;
  const agendaPath = (uid: string, id: string) => `users/${uid}/agenda/${id}`;
  const auditPath = (uid: string, actionId: string) => `users/${uid}/agenda/_nexus/audit/${actionId}`;

  return {
    async claimPending(uid, token, nowMs, executionId) {
      return db.runTransaction(async (transaction) => {
        const ref = db.doc(pendingPath(uid, token));
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) return { kind: 'rejected' as const, reason: 'Proposta inexistente.' };
        const pending = snapshot.data() as PendingDocument;
        if (pending.uid !== uid) return { kind: 'rejected' as const, reason: 'A proposta não pertence ao usuário autenticado.' };
        if (pending.status === 'committed' && pending.result) return { kind: 'idempotent' as const, result: pending.result as CommitResult };
        if (pending.status !== 'awaiting_confirmation') return { kind: 'rejected' as const, reason: 'A proposta já foi consumida ou não está disponível.' };
        const expiresAt = timestampMs(pending.expiresAtMs) ?? timestampMs(pending.expiresAt);
        if (!expiresAt || expiresAt <= nowMs) return { kind: 'rejected' as const, reason: 'A proposta de agenda expirou.' };
        transaction.update(ref, { status: 'processing', executionId, processingAt: Timestamp.fromMillis(nowMs) });
        return { kind: 'claimed' as const, pending: { ...pending, status: 'processing', executionId } };
      });
    },
    async existingIds(uid, ids) {
      const existing: string[] = [];
      for (const id of ids) {
        if ((await db.doc(agendaPath(uid, id)).get()).exists) existing.push(id);
      }
      return existing;
    },
    async writeBatch(uid, documents) {
      const batch = db.batch();
      for (const document of documents) batch.set(db.doc(agendaPath(uid, document.id)), document.data, { merge: false });
      await batch.commit();
    },
    async finalizePending(uid, token, patch) {
      await db.doc(pendingPath(uid, token)).update({ ...patch, updatedAt: Timestamp.now() });
    },
    async writeAudit(uid, actionId, audit) {
      await db.doc(auditPath(uid, actionId)).set({
        ...audit,
        createdAt: Timestamp.fromMillis(audit.createdAtMs),
        completedAt: Timestamp.fromMillis(audit.completedAtMs),
      });
    },
  };
}

export const nexusAgendaCommit = onCall(
  { memory: '1GiB', timeoutSeconds: 120, region: 'us-central1' },
  async (request) => {
    const uid = requireCommitAuth(request);
    const data = request.data as Partial<CommitRequest> | undefined;
    if (!data || typeof data.confirmationToken !== 'string' || typeof data.confirmed !== 'boolean') {
      throw new HttpsError('invalid-argument', 'confirmationToken e confirmed são obrigatórios.');
    }
    return executeAgendaCommit(
      uid,
      { confirmationToken: data.confirmationToken, confirmed: data.confirmed },
      buildFirestoreDependencies(getFirestore()),
    );
  },
);
