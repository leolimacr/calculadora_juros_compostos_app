"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nexusAgendaCommit = exports.MAX_COMMIT_OCCURRENCES = exports.MAX_COMMIT_BATCH_WRITES = void 0;
exports.requireCommitAuth = requireCommitAuth;
exports.executeAgendaCommit = executeAgendaCommit;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const node_crypto_1 = require("node:crypto");
const agenda_intent_schema_1 = require("./nexus-core/agenda-intent-schema");
const agenda_time_1 = require("./nexus-core/agenda-time");
exports.MAX_COMMIT_BATCH_WRITES = 400;
exports.MAX_COMMIT_OCCURRENCES = 800;
function requireCommitAuth(request) {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Login necessário para confirmar a Agenda.');
    return uid;
}
function timestampMs(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (value && typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    return undefined;
}
function minutes(value) {
    if (!value)
        return 0;
    const [hour, minute] = value.split(':').map(Number);
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}
function timestampForOccurrence(isoDate, time) {
    const range = (0, agenda_time_1.saoPauloDayRangeMillis)((0, agenda_time_1.isoToYmd)(isoDate));
    return firestore_1.Timestamp.fromMillis(range.startMs + minutes(time) * 60000);
}
function requestHash(uid, token, confirmed) {
    return (0, node_crypto_1.createHash)('sha1').update(`${uid}|${token}|${String(confirmed)}`).digest('hex');
}
function validatePendingEnvelope(pending) {
    const result = (0, agenda_intent_schema_1.parseAndValidateAgendaEnvelope)(JSON.stringify(pending.envelope));
    if (!result.ok)
        throw new Error(`Proposta inválida: ${result.errors.join('; ')}`);
    return result.data;
}
function buildCreateDocuments(uid, envelope, actionId, token, alarm) {
    if (envelope.intent !== 'create' || envelope.action !== 'create_commitment') {
        throw new Error('Somente propostas create_commitment podem ser executadas nesta fase.');
    }
    const title = envelope.entities.title;
    const date = envelope.entities.date?.resolved;
    if (!title || !date)
        throw new Error('A proposta não possui título e data resolvida.');
    const recurrence = envelope.entities.recurrence;
    const until = recurrence?.until?.resolved;
    const expansion = recurrence
        ? (0, agenda_time_1.expandRecurrence)({
            freq: recurrence.freq,
            startIso: date,
            untilIso: until,
        }, exports.MAX_COMMIT_OCCURRENCES)
        : { occurrences: [date], truncated: false };
    if (expansion.truncated || expansion.occurrences.length > exports.MAX_COMMIT_OCCURRENCES) {
        throw new Error(`A proposta excede o limite de ${exports.MAX_COMMIT_OCCURRENCES} ocorrências.`);
    }
    const seriesId = recurrence ? (0, agenda_time_1.generateSeriesId)(title, date) : undefined;
    const now = firestore_1.Timestamp.now();
    const documents = expansion.occurrences.map((occurrence) => {
        const id = (0, agenda_time_1.generateCommitmentId)(seriesId ?? null, occurrence, envelope.entities.startTime ?? '');
        const data = {
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
        if (seriesId)
            data.seriesId = seriesId;
        if (recurrence) {
            data.recurrence = {
                freq: recurrence.freq,
                ...(recurrence.byDay === undefined ? {} : { byDay: recurrence.byDay }),
                ...(until ? { until: timestampForOccurrence(until) } : {}),
            };
        }
        if (alarm)
            data.alarmAt = timestampForOccurrence(occurrence, envelope.entities.startTime);
        if (envelope.entities.location !== undefined)
            data.location = envelope.entities.location;
        if (envelope.entities.participants !== undefined)
            data.participants = envelope.entities.participants;
        if (envelope.entities.notes !== undefined)
            data.notes = envelope.entities.notes;
        return { id, data };
    });
    void uid;
    return { documents, seriesId, occurrenceCount: documents.length };
}
function parseDeleteTargets(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .filter((item) => Boolean(item) && typeof item.id === 'string' && item.id.length > 0)
        .map((item) => ({ id: item.id }));
}
function buildExecutionPlan(envelope, pendingTargets, actionId, token, alarm) {
    if (envelope.intent === 'create' && envelope.action === 'create_commitment') {
        const { documents, seriesId, occurrenceCount } = buildCreateDocuments('', envelope, actionId, token, alarm);
        return { kind: 'create', documents, seriesId, occurrenceCount };
    }
    if (envelope.intent === 'delete' && envelope.action === 'delete_commitment') {
        const targets = parseDeleteTargets(pendingTargets);
        if (targets.length === 0)
            throw new Error('A proposta de exclusão não possui alvos gravados.');
        return { kind: 'delete', targetIds: targets.map((target) => target.id), occurrenceCount: targets.length };
    }
    throw new Error('Somente propostas create_commitment ou delete_commitment podem ser executadas nesta fase.');
}
async function executeAgendaCommit(uid, request, dependencies, now = Date.now()) {
    if (!request.confirmed)
        throw new https_1.HttpsError('failed-precondition', 'A confirmação explícita é obrigatória.');
    if (!request.confirmationToken || typeof request.confirmationToken !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'confirmationToken é obrigatório.');
    }
    if (request.alarm !== undefined && typeof request.alarm !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'alarm deve ser booleano quando informado.');
    }
    const executionId = `exec_${(0, node_crypto_1.createHash)('sha1').update(`${uid}|${request.confirmationToken}|${now}`).digest('hex').slice(0, 20)}`;
    const claimed = await dependencies.claimPending(uid, request.confirmationToken, now, executionId);
    if (claimed.kind === 'idempotent')
        return claimed.result;
    if (claimed.kind === 'rejected')
        throw new https_1.HttpsError('failed-precondition', claimed.reason);
    const actionId = `act_${executionId.slice(5)}`;
    const pending = claimed.pending;
    const createdAtMs = timestampMs(pending.createdAtMs) ?? timestampMs(pending.createdAt) ?? now;
    const expiresAtMs = timestampMs(pending.expiresAtMs) ?? timestampMs(pending.expiresAt);
    if (pending.uid !== uid)
        throw new https_1.HttpsError('permission-denied', 'A proposta não pertence ao usuário autenticado.');
    if (pending.status !== 'processing')
        throw new https_1.HttpsError('failed-precondition', 'A proposta não está em processamento.');
    if (!expiresAtMs || expiresAtMs <= now)
        throw new https_1.HttpsError('deadline-exceeded', 'A proposta de agenda expirou.');
    if (pending.nonce !== request.confirmationToken || pending.confirmationToken !== request.confirmationToken) {
        throw new https_1.HttpsError('failed-precondition', 'O token da proposta é inválido.');
    }
    if (now < createdAtMs)
        throw new https_1.HttpsError('failed-precondition', 'A data da proposta é inválida.');
    let documents = [];
    let committedIds = [];
    let deletedIds = [];
    let seriesId;
    let intent = 'create';
    let targetRecords = [];
    try {
        const envelope = validatePendingEnvelope(pending);
        const plan = buildExecutionPlan(envelope, pending.targets, actionId, request.confirmationToken, request.alarm === true);
        intent = plan.kind;
        if (plan.kind === 'create') {
            documents = plan.documents;
            seriesId = plan.seriesId;
            const alreadyExisting = await dependencies.existingIds(uid, documents.map((document) => document.id));
            if (alreadyExisting.length > 0)
                throw new Error(`Compromissos já existentes: ${alreadyExisting.join(', ')}`);
            for (let index = 0; index < documents.length; index += exports.MAX_COMMIT_BATCH_WRITES) {
                const batchDocuments = documents.slice(index, index + exports.MAX_COMMIT_BATCH_WRITES);
                await dependencies.writeBatch(uid, batchDocuments);
                committedIds = committedIds.concat(batchDocuments.map((document) => document.id));
            }
        }
        else {
            const existing = await dependencies.existingIds(uid, plan.targetIds);
            if (existing.length === 0)
                throw new Error('Nenhum dos compromissos alvo ainda existe.');
            for (let index = 0; index < existing.length; index += exports.MAX_COMMIT_BATCH_WRITES) {
                const batch = existing.slice(index, index + exports.MAX_COMMIT_BATCH_WRITES);
                await dependencies.deleteBatch(uid, batch);
                deletedIds = deletedIds.concat(batch);
            }
            targetRecords = plan.targetIds.map((id) => ({ id }));
        }
        const completedAtMs = Date.now();
        const result = {
            success: true,
            actionId,
            status: 'committed',
            intent,
            idsCreated: committedIds,
            idsDeleted: deletedIds,
            seriesId,
            occurrenceCount: intent === 'create' ? documents.length : deletedIds.length,
        };
        await dependencies.writeAudit(uid, actionId, {
            actionId,
            uid,
            token: request.confirmationToken,
            status: 'committed',
            intent,
            idsCreated: result.idsCreated,
            idsDeleted: result.idsDeleted,
            seriesId,
            before: intent === 'delete' ? targetRecords : null,
            after: intent === 'create'
                ? documents
                    .filter((document) => committedIds.includes(document.id))
                    .map((document) => ({ id: document.id, ...document.data }))
                : null,
            requestHash: requestHash(uid, request.confirmationToken, request.confirmed),
            createdAtMs,
            completedAtMs,
        });
        await dependencies.finalizePending(uid, request.confirmationToken, { status: 'committed', executionId, result });
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Falha desconhecida na gravação.';
        const partial = intent === 'create' ? committedIds.length > 0 : deletedIds.length > 0;
        const status = partial ? 'partial' : 'failed';
        const completedAtMs = Date.now();
        await dependencies.writeAudit(uid, actionId, {
            actionId,
            uid,
            token: request.confirmationToken,
            status,
            intent,
            idsCreated: committedIds,
            idsDeleted: deletedIds,
            seriesId,
            before: intent === 'delete' ? targetRecords : null,
            after: intent === 'create'
                ? documents
                    .filter((document) => committedIds.includes(document.id))
                    .map((document) => ({ id: document.id, ...document.data }))
                : null,
            requestHash: requestHash(uid, request.confirmationToken, request.confirmed),
            createdAtMs,
            completedAtMs,
            error: message,
        });
        await dependencies.finalizePending(uid, request.confirmationToken, { status, executionId, error: message });
        throw new https_1.HttpsError('internal', status === 'partial'
            ? `A operação foi parcialmente concluída e precisa de reconciliação. (${message})`
            : `Não foi possível executar a proposta de agenda. (${message})`);
    }
}
function buildFirestoreDependencies(db) {
    const pendingPath = (uid, token) => `users/${uid}/agenda/_nexus/pending/${token}`;
    const agendaPath = (uid, id) => `users/${uid}/agenda/${id}`;
    const auditPath = (uid, actionId) => `users/${uid}/agenda/_nexus/audit/${actionId}`;
    return {
        async claimPending(uid, token, nowMs, executionId) {
            return db.runTransaction(async (transaction) => {
                const ref = db.doc(pendingPath(uid, token));
                const snapshot = await transaction.get(ref);
                if (!snapshot.exists)
                    return { kind: 'rejected', reason: 'Proposta inexistente.' };
                const pending = snapshot.data();
                if (pending.uid !== uid)
                    return { kind: 'rejected', reason: 'A proposta não pertence ao usuário autenticado.' };
                if (pending.status === 'committed' && pending.result)
                    return { kind: 'idempotent', result: pending.result };
                if (pending.status !== 'awaiting_confirmation')
                    return { kind: 'rejected', reason: 'A proposta já foi consumida ou não está disponível.' };
                const expiresAt = timestampMs(pending.expiresAtMs) ?? timestampMs(pending.expiresAt);
                if (!expiresAt || expiresAt <= nowMs)
                    return { kind: 'rejected', reason: 'A proposta de agenda expirou.' };
                transaction.update(ref, { status: 'processing', executionId, processingAt: firestore_1.Timestamp.fromMillis(nowMs) });
                return { kind: 'claimed', pending: { ...pending, status: 'processing', executionId } };
            });
        },
        async existingIds(uid, ids) {
            const existing = [];
            for (const id of ids) {
                if ((await db.doc(agendaPath(uid, id)).get()).exists)
                    existing.push(id);
            }
            return existing;
        },
        async writeBatch(uid, documents) {
            const batch = db.batch();
            for (const document of documents)
                batch.set(db.doc(agendaPath(uid, document.id)), document.data, { merge: false });
            await batch.commit();
        },
        async deleteBatch(uid, ids) {
            const batch = db.batch();
            for (const id of ids)
                batch.delete(db.doc(agendaPath(uid, id)));
            await batch.commit();
        },
        async finalizePending(uid, token, patch) {
            await db.doc(pendingPath(uid, token)).update({ ...patch, updatedAt: firestore_1.Timestamp.now() });
        },
        async writeAudit(uid, actionId, audit) {
            await db.doc(auditPath(uid, actionId)).set({
                ...audit,
                createdAt: firestore_1.Timestamp.fromMillis(audit.createdAtMs),
                completedAt: firestore_1.Timestamp.fromMillis(audit.completedAtMs),
            });
        },
    };
}
exports.nexusAgendaCommit = (0, https_1.onCall)({ memory: '1GiB', timeoutSeconds: 120, region: 'us-central1' }, async (request) => {
    const uid = requireCommitAuth(request);
    const data = request.data;
    if (!data || typeof data.confirmationToken !== 'string' || typeof data.confirmed !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'confirmationToken e confirmed são obrigatórios.');
    }
    return executeAgendaCommit(uid, {
        confirmationToken: data.confirmationToken,
        confirmed: data.confirmed,
        alarm: typeof data.alarm === 'boolean' ? data.alarm : undefined,
    }, buildFirestoreDependencies((0, firestore_1.getFirestore)()));
});
//# sourceMappingURL=nexusAgendaCommit.js.map