"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nexusAgendaInterpret = void 0;
exports.requireAuth = requireAuth;
exports.orchestrateAgendaInterpret = orchestrateAgendaInterpret;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const node_crypto_1 = require("node:crypto");
const jsonrepair_1 = require("jsonrepair");
const MultiModelRouter_1 = require("./nexus-core/MultiModelRouter");
const agenda_intent_schema_1 = require("./nexus-core/agenda-intent-schema");
const agenda_time_1 = require("./nexus-core/agenda-time");
const secrets_1 = require("./secrets");
const PENDING_TTL_MS = 10 * 60 * 1000;
const MAX_CONFLICT_DATES_TO_READ = 366;
const MAX_DELETE_SCAN = 5000;
const MAX_DELETE_TARGETS = 500;
const FRIENDLY_INVALID_MODEL = 'Não consegui estruturar esse comando de agenda. Tente descrevê-lo com uma data e horário mais claros.';
function requireAuth(request) {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Login necessário para usar a Agenda.');
    return uid;
}
function buildSystemPrompt(now) {
    const today = (0, agenda_time_1.todayYmdInProductTimezone)(now);
    return `Você é o Nexus Agenda, assistente de agendamentos do Finanças Pro Invest.
Sua especialidade é cuidar da agenda do usuário: você cria compromissos, edita horários, remove eventos e organiza anotações com data e hora.

Você conversa de forma natural, simpática e objetiva. Quando o usuário fala sobre compromissos, datas ou horários, você entende o que ele quer e ajuda a transformar isso em um agendamento claro.

Se o usuário trouxer um assunto que não esteja relacionado à agenda do Finanças Pro Invest, você pode explicar com gentileza que seu papel é cuidar dos agendamentos e se oferecer para ajudar com compromissos. Não é necessário responder a outros temas; basta redirecionar com educação.

Antes de executar qualquer alteração, você sempre confirma com o usuário. Você mostra, com suas palavras, o que entendeu: o nome do compromisso, a data, a hora e, quando houver recorrência, como ela funcionará. Você também pergunta se o usuário deseja ativar o alarme da agenda ou apenas deixar o compromisso anotado. Só depois da confirmação natural do usuário você realiza a alteração.

Se faltar alguma informação, pergunte de forma natural. Por exemplo:
- "Qual será o nome ou assunto do compromisso?"
- "Para qual dia e horário devo anotar?"
- "Você quer que eu ative o alarme ou apenas deixe anotado?"

Quando entender um pedido completo, responda de maneira confirmatória e amigável.

Data/hora do servidor em ${agenda_time_1.PRODUCT_TIMEZONE}: ${(0, agenda_time_1.ymdToIso)(today)}.

A sua saída é SEMPRE o envelope JSON estrito abaixo — o produto converte esse envelope em uma conversa amigável de confirmação, seguindo o fluxo acima. Não escreva texto fora do JSON, não use markdown e não use crases.

Responda SOMENTE com JSON válido, sem markdown e sem texto adicional, usando exatamente este contrato:
{
  "intent": "create|edit|delete|query|clarify",
  "action": "create_commitment|edit_commitment|delete_commitment|query_commitments|query_clarification",
  "entities": {
    "title": "string ou omitido",
    "filter": {"field":"title|date","value":"texto"} ou omitido (usado para exclusão em massa),
    "date": {"expression":"texto original","resolved":"YYYY-MM-DD","confidence":"high|low"},
    "startTime":"HH:mm", "endTime":"HH:mm",
    "recurrence": {"freq":"daily|weekly|monthly","byDay":1,"until":{"expression":"texto","resolved":"YYYY-MM-DD","confidence":"high|low"}},
    "location":"string ou null", "participants":["string"] ou null, "notes":"string ou null", "timeZone":"string"
  },
  "missing": ["campo"], "ambiguous": ["explicação"],
  "assumptions": [{"field":"campo","note":"explicação"}]
}

Orientações de extração:
- Recorrência semanal: frases como "toda terça-feira", "toda terça", "todas as terças", "toda semana" → recurrence freq "weekly" com byDay (1=segunda até 7=domingo) e mantenha a expressão do dia da semana em entities.date.expression (ex.: "toda terça-feira"). O horário vai em entities.startTime.
- Data final da recorrência: expressões de fim de período como "até o fim de setembro", "fim de setembro", "até dezembro" → recurrence.until.expression preservando o texto original; o backend resolve a data final.
- Participantes: "reunião com <pessoa>" → entities.participants com o nome extraído.
- Duração: "das 17h às 18h" → startTime "17:00" e endTime "18:00"; "18h" ou "às 18h" → startTime "18:00".
- Exclusão em massa por título: frases como "excluir todos os compromissos com o nome X", "apagar todas as reuniões X", "remover os compromissos que se chamam X" → intent "delete" com entities.filter {"field":"title","value":X} (ou entities.title). NÃO exija data nem coloque "date" em missing — a ausência de data NÃO bloqueia a exclusão por título.
- Exclusão por data: "excluir os compromissos de amanhã", "apagar tudo de hoje" → intent "delete" com entities.filter {"field":"date","value":"amanhã"} (expressão natural) ou entities.date.
- missing e ambiguous devem ser escritos como perguntas naturais e educadas (são exibidas ao usuário). Para assuntos fora da agenda, use intent "clarify" e coloque em ambiguous um redirecionamento educado.
- A preferência de alarme/anotação é perguntada pelo produto na confirmação — não a inclua no envelope.
- Preserve as expressões de data no campo expression. O backend recalculará resolved; nunca invente informações ausentes. Para baixa certeza, use confidence low e preencha ambiguous.`;
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
        maxTokens: 1000,
        fallbackContext: { primaryIntent: 'agenda_interpret' },
    });
    if (response.isContingency)
        throw new Error('Modelo temporariamente indisponível');
    return response.content ?? '';
}
function extractJsonEnvelope(raw) {
    const trimmed = raw.trim();
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
    if (fenced)
        return fenced[1].trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start)
        return trimmed.slice(start, end + 1);
    return trimmed;
}
function tryParseEnvelope(raw) {
    const cleaned = extractJsonEnvelope(raw);
    const direct = (0, agenda_intent_schema_1.parseAgendaEnvelope)(cleaned);
    if (direct.ok)
        return direct;
    try {
        const repaired = (0, jsonrepair_1.jsonrepair)(cleaned);
        if (repaired !== cleaned) {
            const result = (0, agenda_intent_schema_1.parseAgendaEnvelope)(repaired);
            if (result.ok)
                return result;
        }
    }
    catch {
    }
    return direct;
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
    const occurrences = count === 1 ? '1 compromisso' : `${count} compromissos`;
    const range = count === 1 ? formatDate(firstDate) : `de ${formatDate(firstDate)} a ${formatDate(lastDate)}`;
    return `Entendi! Vou agendar "${title}" — ${occurrences}${time}, ${range}. Você prefere ativar o alarme ou apenas anotar? Confirma assim?`;
}
function buildDeleteSummary(count, title) {
    const items = count === 1 ? '1 compromisso' : `${count} compromissos`;
    const reference = title ? ` com o nome "${title}"` : '';
    return `Entendi. Encontrei ${items}${reference}. Pretendo excluí-los permanentemente. Posso prosseguir?`;
}
async function resolveDeleteTargets(uid, envelope, agenda, today) {
    const filter = envelope.entities.filter;
    const title = filter?.field === 'title' ? filter.value : envelope.entities.title;
    let date = filter?.field === 'date' ? filter.value : envelope.entities.date?.resolved;
    if (filter?.field === 'date' && date) {
        const resolved = (0, agenda_time_1.resolveDateExpression)(date, today);
        if (!resolved)
            return null;
        date = resolved.iso;
    }
    let candidates;
    if (title) {
        candidates = await agenda.searchByTitle(uid, title, { maxResults: MAX_DELETE_SCAN });
        if (date) {
            const range = (0, agenda_time_1.saoPauloDayRangeMillis)((0, agenda_time_1.isoToYmd)(date));
            candidates = candidates.filter((item) => item.dateMs >= range.startMs && item.dateMs < range.endMs);
        }
    }
    else if (date) {
        candidates = await agenda.onDay(uid, date);
    }
    else {
        candidates = [];
    }
    const targets = candidates.slice(0, MAX_DELETE_TARGETS).map((item) => ({
        id: item.id,
        title: item.title,
        time: item.time ?? null,
        endTime: item.endTime ?? null,
        dateMs: item.dateMs,
    }));
    return { targets, truncated: candidates.length > MAX_DELETE_TARGETS };
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
    let parsed = tryParseEnvelope(raw);
    if (!parsed.ok) {
        const detail = parsed.errors.slice(0, 4).join('; ');
        try {
            raw = await callModel(dependencies.router, [
                ...messages,
                {
                    role: 'user',
                    content: `Sua resposta anterior não passou na validação do contrato JSON. Erros: ${detail}. Responda SOMENTE com o envelope JSON estrito, sem markdown e sem texto adicional.`,
                },
            ], systemPrompt);
        }
        catch {
            return { success: false, error: FRIENDLY_INVALID_MODEL };
        }
        parsed = tryParseEnvelope(raw);
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
    if (envelope.intent === 'delete') {
        const resolved = await resolveDeleteTargets(uid, envelope, dependencies.agenda, today);
        if (!resolved) {
            return clarification([], ['Não consegui determinar a data do filtro de exclusão. Descreva-a de forma clara.']);
        }
        const filterReference = envelope.entities.filter?.field === 'title'
            ? `"${envelope.entities.filter.value}"`
            : envelope.entities.title
                ? `"${envelope.entities.title}"`
                : 'o critério informado';
        if (resolved.targets.length === 0) {
            return clarification([], [`Não encontrei nenhum compromisso que atenda a ${filterReference}.`]);
        }
        const deleteTitle = envelope.entities.filter?.field === 'title'
            ? envelope.entities.filter.value
            : (envelope.entities.title ?? undefined);
        const warnings = [];
        if (resolved.truncated) {
            warnings.push({ type: 'truncated', message: `Encontrei mais compromissos do que o limite suportado. A exclusão será aplicada aos ${resolved.targets.length} mais recentes.` });
        }
        const recap = {
            intent: 'delete',
            action: envelope.action,
            title: deleteTitle,
            occurrenceCount: resolved.targets.length,
            matchCount: resolved.targets.length,
            affectedItems: resolved.targets,
            truncated: resolved.truncated,
            summary: buildDeleteSummary(resolved.targets.length, deleteTitle),
        };
        const token = (0, node_crypto_1.randomUUID)();
        const createdAtMs = now.getTime();
        const expiresAtMs = createdAtMs + PENDING_TTL_MS;
        await dependencies.pending.write(uid, token, {
            uid,
            nonce: token,
            confirmationToken: token,
            status: 'awaiting_confirmation',
            createdAtMs,
            expiresAtMs,
            intent: 'delete',
            action: envelope.action,
            prompt: data.prompt,
            envelope,
            recap,
            warnings,
            targets: resolved.targets,
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
    if (envelope.intent === 'edit') {
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
            async searchByTitle(uid, title, opts) {
                const maxResults = opts?.maxResults ?? MAX_DELETE_SCAN;
                const snapshot = await db.collection(collectionPath(uid))
                    .orderBy('date', 'desc')
                    .limit(maxResults)
                    .get();
                const normalized = normalizeTitle(title);
                return snapshot.docs
                    .map(mapDoc)
                    .filter((item) => normalizeTitle(item.title) === normalized)
                    .slice(0, MAX_DELETE_TARGETS);
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