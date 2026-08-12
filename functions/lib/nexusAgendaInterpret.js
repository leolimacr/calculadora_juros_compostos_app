"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nexusAgendaInterpret = void 0;
exports.requireAuth = requireAuth;
exports.orchestrateAgendaInterpret = orchestrateAgendaInterpret;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const node_crypto_1 = require("node:crypto");
const MultiModelRouter_1 = require("./nexus-core/MultiModelRouter");
const agenda_intent_schema_1 = require("./nexus-core/agenda-intent-schema");
const agenda_time_1 = require("./nexus-core/agenda-time");
const secrets_1 = require("./secrets");
const PENDING_TTL_MS = 10 * 60 * 1000;
const MAX_CONFLICT_DATES_TO_READ = 366;
const FRIENDLY_INVALID_MODEL = 'Não consegui estruturar esse comando de agenda. Tente descrevê-lo com uma data e horário mais claros.';
function requireAuth(request) {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Login necessário para usar a Agenda.');
    return uid;
}
function buildSystemPrompt(now) {
    const today = (0, agenda_time_1.todayYmdInProductTimezone)(now);
    return `Você é o interpretador estruturado da Agenda do Finanças Pro Invest.
Data/hora do servidor em ${agenda_time_1.PRODUCT_TIMEZONE}: ${(0, agenda_time_1.ymdToIso)(today)}.

Responda SOMENTE com JSON válido, sem markdown e sem texto adicional, usando exatamente este contrato:
{
  "intent": "create|edit|delete|query|clarify",
  "action": "create_commitment|edit_commitment|delete_commitment|query_commitments|query_clarification",
  "entities": {
    "title": "string ou omitido",
    "date": {"expression":"texto original","resolved":"YYYY-MM-DD","confidence":"high|low"},
    "startTime":"HH:mm", "endTime":"HH:mm",
    "recurrence": {"freq":"daily|weekly|monthly","byDay":1,"until":{"expression":"texto","resolved":"YYYY-MM-DD","confidence":"high|low"}},
    "location":"string ou null", "participants":["string"] ou null, "notes":"string ou null", "timeZone":"string"
  },
  "missing": ["campo"], "ambiguous": ["explicação"],
  "assumptions": [{"field":"campo","note":"explicação"}]
}

Extraia a intenção e preserve as expressões de data no campo expression. O backend recalculará resolved; nunca invente informações ausentes. Para baixa certeza, use confidence low e preencha ambiguous. Para weekly, byDay usa 1=segunda até 7=domingo.`;
}
function buildMessages(prompt, history) {
    const previous = history.slice(-6).map((message) => ({
        role: message.role === 'assistant' || message.role === 'ai' ? 'assistant' : 'user',
        content: message.text,
    }));
    return [...previous, { role: 'user', content: prompt }];
}
async function callModel(router, messages, systemPrompt) {
    const response = await router.routeRequest(messages, systemPrompt, {
        temperature: 0.1,
        maxTokens: 700,
        fallbackContext: { primaryIntent: 'agenda_interpret' },
    });
    return response.content ?? '';
}
function normalizeEnvelopeDates(envelope, today) {
    const entities = { ...envelope.entities };
    if (entities.date) {
        const resolved = (0, agenda_time_1.resolveDateExpression)(entities.date.expression, today);
        entities.date = resolved
            ? { ...entities.date, resolved: resolved.iso, confidence: resolved.confidence }
            : { ...entities.date, confidence: 'low' };
    }
    if (entities.recurrence?.until) {
        const resolved = (0, agenda_time_1.resolveDateExpression)(entities.recurrence.until.expression, today);
        entities.recurrence = {
            ...entities.recurrence,
            until: resolved
                ? { ...entities.recurrence.until, resolved: resolved.iso, confidence: resolved.confidence }
                : { ...entities.recurrence.until, confidence: 'low' },
        };
    }
    return { ...envelope, entities };
}
function addDaysForHorizon(today) {
    const next = (0, agenda_time_1.nextWeekday)(today, 1, { allowToday: true });
    const days = agenda_time_1.DEFAULT_RECURRENCE_HORIZON_DAYS - 7;
    const date = new Date(Date.UTC(next.y, next.m0, next.d) + days * 86400000);
    return (0, agenda_time_1.ymdToIso)({ y: date.getUTCFullYear(), m0: date.getUTCMonth(), d: date.getUTCDate() });
}
function formatDate(iso) {
    if (!iso)
        return 'data não definida';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
}
function buildQuestions(missing, ambiguous) {
    return [
        ...missing.map((field) => `Informe ${field}.`),
        ...ambiguous.map((item) => `Esclareça: ${item}`),
    ];
}
function clarification(missing, ambiguous) {
    return {
        success: true,
        outcome: 'clarification',
        status: 'awaiting_clarification',
        clarification: { missing, ambiguous, questions: buildQuestions(missing, ambiguous) },
    };
}
function minutes(value) {
    if (!value)
        return null;
    const [hour, minute] = value.split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute))
        return null;
    return hour * 60 + minute;
}
function hasTimeOverlap(existing, start, end) {
    const existingStart = minutes(existing.time);
    const proposedStart = minutes(start);
    if (existingStart === null || proposedStart === null)
        return false;
    const proposedEnd = minutes(end) ?? proposedStart + 60;
    const existingEnd = minutes(existing.endTime) ?? existingStart + 60;
    return existingStart < proposedEnd && proposedStart < existingEnd;
}
function normalizeTitle(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}
async function collectWarnings(uid, dates, title, startTime, endTime, agenda) {
    const warnings = [];
    const normalized = normalizeTitle(title);
    for (const date of dates.slice(0, MAX_CONFLICT_DATES_TO_READ)) {
        const existing = await agenda.onDay(uid, date);
        for (const commitment of existing) {
            const duplicate = normalizeTitle(commitment.title) === normalized && hasTimeOverlap(commitment, startTime, endTime);
            if (duplicate) {
                warnings.push({ type: 'duplicate', date, message: `Já existe "${commitment.title}" em ${formatDate(date)} nesse horário.` });
            }
            else if (hasTimeOverlap(commitment, startTime, endTime)) {
                warnings.push({ type: 'conflict', date, message: `Há conflito de horário com "${commitment.title}" em ${formatDate(date)}.` });
            }
        }
    }
    return warnings;
}
function buildSummary(title, count, firstDate, lastDate, startTime, endTime) {
    const time = startTime ? ` às ${startTime}${endTime ? ` às ${endTime}` : ''}` : '';
    return `Criar "${title}" — ${count} compromisso${count === 1 ? '' : 's'}${time}, de ${formatDate(firstDate)} a ${formatDate(lastDate)}.`;
}
async function orchestrateAgendaInterpret(uid, data, dependencies) {
    const now = dependencies.now ?? new Date();
    const today = (0, agenda_time_1.todayYmdInProductTimezone)(now);
    const systemPrompt = buildSystemPrompt(now);
    const messages = buildMessages(data.prompt, data.history ?? []);
    let raw;
    try {
        raw = await callModel(dependencies.router, messages, systemPrompt);
    }
    catch {
        return { success: false, error: 'O Nexus está temporariamente indisponível. Tente novamente em instantes.' };
    }
    let parsed = (0, agenda_intent_schema_1.parseAgendaEnvelope)(raw);
    if (!parsed.ok) {
        try {
            raw = await callModel(dependencies.router, [...messages, { role: 'user', content: 'A resposta anterior não era JSON válido. Responda somente com o envelope JSON estrito.' }], systemPrompt);
        }
        catch {
            return { success: false, error: FRIENDLY_INVALID_MODEL };
        }
        parsed = (0, agenda_intent_schema_1.parseAgendaEnvelope)(raw);
        if (!parsed.ok)
            return { success: false, error: FRIENDLY_INVALID_MODEL };
    }
    const normalized = normalizeEnvelopeDates(parsed.data, today);
    const lowConfidence = [];
    if (normalized.entities.date?.confidence === 'low')
        lowConfidence.push('A data principal não pôde ser determinada com segurança.');
    if (normalized.entities.recurrence?.until?.confidence === 'low')
        lowConfidence.push('A data final da recorrência não pôde ser determinada com segurança.');
    if (lowConfidence.length > 0)
        return clarification([], lowConfidence);
    const validated = (0, agenda_intent_schema_1.parseAndValidateAgendaEnvelope)(JSON.stringify(normalized));
    if (!validated.ok) {
        return clarification(validated.errors.filter((error) => error.includes('obrigatório')).map((error) => error.replace(/^.*?\.(title|date).*$/, '$1')), validated.errors.filter((error) => !error.includes('obrigatório')));
    }
    const envelope = validated.data;
    if (envelope.intent === 'clarify')
        return clarification(envelope.missing, envelope.ambiguous);
    if (envelope.intent === 'query') {
        const commitments = await dependencies.agenda.upcoming(uid, 10);
        return {
            success: true,
            outcome: 'query_result',
            status: 'ok',
            commitments: commitments.map(({ id, title, time, dateMs }) => ({ id, title, time, dateMs })),
        };
    }
    if (!envelope.entities.date)
        return clarification(['date'], []);
    const firstDate = envelope.entities.date.resolved;
    let lastDate = firstDate;
    let occurrenceCount = 1;
    const warnings = [];
    let recurrence;
    if (envelope.entities.recurrence) {
        const until = envelope.entities.recurrence.until?.resolved ?? addDaysForHorizon(today);
        const expanded = (0, agenda_time_1.expandRecurrence)({
            freq: envelope.entities.recurrence.freq,
            startIso: firstDate,
            untilIso: until,
        });
        occurrenceCount = expanded.occurrences.length;
        lastDate = expanded.last ?? firstDate;
        recurrence = {
            freq: envelope.entities.recurrence.freq,
            byDay: envelope.entities.recurrence.byDay,
            until: lastDate,
        };
        if (expanded.truncated) {
            warnings.push({ type: 'truncated', message: `A recorrência foi limitada a ${expanded.occurrences.length} ocorrências.` });
        }
    }
    const title = envelope.entities.title ?? '';
    if (!title)
        return clarification(['title'], []);
    if (envelope.intent === 'edit' || envelope.intent === 'delete') {
        const candidates = await dependencies.agenda.onDay(uid, firstDate);
        const matching = candidates.filter((item) => normalizeTitle(item.title) === normalizeTitle(title));
        if (matching.length === 0)
            return clarification([], [`Não encontrei "${title}" em ${formatDate(firstDate)}.`]);
        if (matching.length > 1)
            return clarification([], [`Encontrei mais de um compromisso "${title}" em ${formatDate(firstDate)}.`]);
    }
    else {
        const dates = recurrence
            ? (0, agenda_time_1.expandRecurrence)({ freq: recurrence.freq, startIso: firstDate, untilIso: recurrence.until }).occurrences
            : [firstDate];
        warnings.push(...await collectWarnings(uid, dates, title, envelope.entities.startTime, envelope.entities.endTime, dependencies.agenda));
    }
    const token = (0, node_crypto_1.randomUUID)();
    const createdAtMs = now.getTime();
    const expiresAtMs = createdAtMs + PENDING_TTL_MS;
    const recap = {
        intent: envelope.intent,
        action: envelope.action,
        title,
        startTime: envelope.entities.startTime,
        endTime: envelope.entities.endTime,
        firstDate,
        lastDate,
        occurrenceCount,
        recurrence,
        summary: buildSummary(title, occurrenceCount, firstDate, lastDate, envelope.entities.startTime, envelope.entities.endTime),
    };
    await dependencies.pending.write(uid, token, {
        uid,
        nonce: token,
        confirmationToken: token,
        status: 'awaiting_confirmation',
        createdAtMs,
        expiresAtMs,
        intent: envelope.intent,
        action: envelope.action,
        prompt: data.prompt,
        envelope,
        recap,
        warnings,
    });
    return {
        success: true,
        outcome: 'proposal',
        status: 'awaiting_confirmation',
        confirmationToken: token,
        expiresAtMs,
        recap,
        warnings,
    };
}
function buildFirestoreDependencies(db) {
    const collectionPath = (uid) => `users/${uid}/agenda`;
    const mapDoc = (doc) => {
        const data = doc.data();
        const date = data.date;
        return {
            id: doc.id,
            title: String(data.title ?? ''),
            time: typeof data.time === 'string' ? data.time : null,
            endTime: typeof data.endTime === 'string' ? data.endTime : null,
            dateMs: date?.toMillis?.() ?? 0,
        };
    };
    return {
        agenda: {
            async onDay(uid, isoDate) {
                const range = (0, agenda_time_1.saoPauloDayRangeMillis)((0, agenda_time_1.isoToYmd)(isoDate));
                const snapshot = await db.collection(collectionPath(uid))
                    .where('date', '>=', firestore_1.Timestamp.fromMillis(range.startMs))
                    .where('date', '<', firestore_1.Timestamp.fromMillis(range.endMs))
                    .get();
                return snapshot.docs.map(mapDoc);
            },
            async upcoming(uid, max) {
                const snapshot = await db.collection(collectionPath(uid))
                    .where('date', '>=', firestore_1.Timestamp.fromDate(new Date()))
                    .orderBy('date', 'asc')
                    .limit(max)
                    .get();
                return snapshot.docs.map(mapDoc);
            },
        },
        pending: {
            async write(uid, token, document) {
                await db.collection(`${collectionPath(uid)}/_nexus/pending`).doc(token).set({
                    ...document,
                    createdAt: firestore_1.Timestamp.fromMillis(Number(document.createdAtMs)),
                    expiresAt: firestore_1.Timestamp.fromMillis(Number(document.expiresAtMs)),
                });
            },
        },
    };
}
exports.nexusAgendaInterpret = (0, https_1.onCall)({
    memory: '1GiB',
    timeoutSeconds: 60,
    region: 'us-central1',
    secrets: [secrets_1.GROQ_API_KEY, secrets_1.OPENROUTER_API_KEY],
}, async (request) => {
    const uid = requireAuth(request);
    const data = request.data;
    if (!data || typeof data.prompt !== 'string' || !data.prompt.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'O comando de agenda é obrigatório.');
    }
    const router = MultiModelRouter_1.MultiModelRouter.getInstance();
    router.updateApiKeys({
        groq: process.env.GROQ_API_KEY,
        openrouter: process.env.OPENROUTER_API_KEY,
    });
    return orchestrateAgendaInterpret(uid, { prompt: data.prompt, history: Array.isArray(data.history) ? data.history : [] }, { router, ...buildFirestoreDependencies((0, firestore_1.getFirestore)()) });
});
//# sourceMappingURL=nexusAgendaInterpret.js.map