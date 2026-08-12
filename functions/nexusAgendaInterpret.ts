import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { randomUUID } from 'node:crypto';
import { MultiModelRouter } from './nexus-core/MultiModelRouter';
import {
  parseAgendaEnvelope,
  parseAndValidateAgendaEnvelope,
  type AgendaEnvelope,
} from './nexus-core/agenda-intent-schema';
import {
  DEFAULT_RECURRENCE_HORIZON_DAYS,
  expandRecurrence,
  isoToYmd,
  nextWeekday,
  PRODUCT_TIMEZONE,
  resolveDateExpression,
  saoPauloDayRangeMillis,
  todayYmdInProductTimezone,
  ymdToIso,
  type YMD,
} from './nexus-core/agenda-time';
import {
  GROQ_API_KEY as GROQ_API_KEY_SECRET,
  OPENROUTER_API_KEY as OPENROUTER_API_KEY_SECRET,
} from './secrets';

const PENDING_TTL_MS = 10 * 60 * 1000;
const MAX_CONFLICT_DATES_TO_READ = 366;
const FRIENDLY_INVALID_MODEL = 'Não consegui estruturar esse comando de agenda. Tente descrevê-lo com uma data e horário mais claros.';

export interface InterpretRequestData {
  prompt: string;
  history?: Array<{ role: string; text: string }>;
}

export interface StoredAgendaCommitment {
  id: string;
  title: string;
  time?: string | null;
  endTime?: string | null;
  dateMs: number;
}

export interface AgendaReader {
  onDay(uid: string, isoDate: string): Promise<StoredAgendaCommitment[]>;
  upcoming(uid: string, max: number): Promise<StoredAgendaCommitment[]>;
}

export interface PendingWriter {
  write(uid: string, token: string, document: Record<string, unknown>): Promise<void>;
}

export interface AgendaRouter {
  routeRequest(
    messages: unknown[],
    systemPrompt?: string,
    options?: Record<string, unknown>,
  ): Promise<{ content: string; success?: boolean }>;
}

export interface InterpretDependencies {
  router: AgendaRouter;
  agenda: AgendaReader;
  pending: PendingWriter;
  now?: Date;
}

export interface AgendaWarning {
  type: 'conflict' | 'duplicate' | 'truncated';
  date?: string;
  message: string;
}

export interface AgendaRecap {
  intent: AgendaEnvelope['intent'];
  action: AgendaEnvelope['action'];
  title?: string;
  startTime?: string;
  endTime?: string;
  firstDate?: string;
  lastDate?: string;
  occurrenceCount: number;
  recurrence?: {
    freq: string;
    byDay?: number;
    until?: string;
  };
  summary: string;
}

export type InterpretResponse =
  | {
      success: true;
      outcome: 'proposal';
      status: 'awaiting_confirmation';
      confirmationToken: string;
      expiresAtMs: number;
      recap: AgendaRecap;
      warnings: AgendaWarning[];
    }
  | {
      success: true;
      outcome: 'clarification';
      status: 'awaiting_clarification';
      clarification: { missing: string[]; ambiguous: string[]; questions: string[] };
    }
  | {
      success: true;
      outcome: 'query_result';
      status: 'ok';
      commitments: Array<{ id: string; title: string; time?: string | null; dateMs: number }>;
    }
  | { success: false; error: string };

export function requireAuth(request: { auth?: { uid?: string } | null }): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login necessário para usar a Agenda.');
  return uid;
}

function buildSystemPrompt(now: Date): string {
  const today = todayYmdInProductTimezone(now);
  return `Você é o interpretador estruturado da Agenda do Finanças Pro Invest.
Data/hora do servidor em ${PRODUCT_TIMEZONE}: ${ymdToIso(today)}.

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

function buildMessages(prompt: string, history: Array<{ role: string; text: string }>): unknown[] {
  const previous = history.slice(-6).map((message) => ({
    role: message.role === 'assistant' || message.role === 'ai' ? 'assistant' : 'user',
    content: message.text,
  }));
  return [...previous, { role: 'user', content: prompt }];
}

async function callModel(
  router: AgendaRouter,
  messages: unknown[],
  systemPrompt: string,
): Promise<string> {
  const response = await router.routeRequest(messages, systemPrompt, {
    temperature: 0.1,
    maxTokens: 700,
    fallbackContext: { primaryIntent: 'agenda_interpret' },
  });
  return response.content ?? '';
}

function normalizeEnvelopeDates(envelope: AgendaEnvelope, today: YMD): AgendaEnvelope {
  const entities = { ...envelope.entities };
  if (entities.date) {
    const resolved = resolveDateExpression(entities.date.expression, today);
    entities.date = resolved
      ? { ...entities.date, resolved: resolved.iso, confidence: resolved.confidence }
      : { ...entities.date, confidence: 'low' };
  }
  if (entities.recurrence?.until) {
    const resolved = resolveDateExpression(entities.recurrence.until.expression, today);
    entities.recurrence = {
      ...entities.recurrence,
      until: resolved
        ? { ...entities.recurrence.until, resolved: resolved.iso, confidence: resolved.confidence }
        : { ...entities.recurrence.until, confidence: 'low' },
    };
  }
  return { ...envelope, entities };
}

function addDaysForHorizon(today: YMD): string {
  const next = nextWeekday(today, 1, { allowToday: true });
  const days = DEFAULT_RECURRENCE_HORIZON_DAYS - 7;
  const date = new Date(Date.UTC(next.y, next.m0, next.d) + days * 86400000);
  return ymdToIso({ y: date.getUTCFullYear(), m0: date.getUTCMonth(), d: date.getUTCDate() });
}

function formatDate(iso?: string): string {
  if (!iso) return 'data não definida';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function buildQuestions(missing: string[], ambiguous: string[]): string[] {
  return [
    ...missing.map((field) => `Informe ${field}.`),
    ...ambiguous.map((item) => `Esclareça: ${item}`),
  ];
}

function clarification(missing: string[], ambiguous: string[]): InterpretResponse {
  return {
    success: true,
    outcome: 'clarification',
    status: 'awaiting_clarification',
    clarification: { missing, ambiguous, questions: buildQuestions(missing, ambiguous) },
  };
}

function minutes(value?: string | null): number | null {
  if (!value) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function hasTimeOverlap(existing: StoredAgendaCommitment, start?: string, end?: string): boolean {
  const existingStart = minutes(existing.time);
  const proposedStart = minutes(start);
  if (existingStart === null || proposedStart === null) return false;
  const proposedEnd = minutes(end) ?? proposedStart + 60;
  const existingEnd = minutes(existing.endTime) ?? existingStart + 60;
  return existingStart < proposedEnd && proposedStart < existingEnd;
}

function normalizeTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function collectWarnings(
  uid: string,
  dates: string[],
  title: string,
  startTime: string | undefined,
  endTime: string | undefined,
  agenda: AgendaReader,
): Promise<AgendaWarning[]> {
  const warnings: AgendaWarning[] = [];
  const normalized = normalizeTitle(title);
  for (const date of dates.slice(0, MAX_CONFLICT_DATES_TO_READ)) {
    const existing = await agenda.onDay(uid, date);
    for (const commitment of existing) {
      const duplicate = normalizeTitle(commitment.title) === normalized && hasTimeOverlap(commitment, startTime, endTime);
      if (duplicate) {
        warnings.push({ type: 'duplicate', date, message: `Já existe "${commitment.title}" em ${formatDate(date)} nesse horário.` });
      } else if (hasTimeOverlap(commitment, startTime, endTime)) {
        warnings.push({ type: 'conflict', date, message: `Há conflito de horário com "${commitment.title}" em ${formatDate(date)}.` });
      }
    }
  }
  return warnings;
}

function buildSummary(
  title: string,
  count: number,
  firstDate: string,
  lastDate: string,
  startTime?: string,
  endTime?: string,
): string {
  const time = startTime ? ` às ${startTime}${endTime ? ` às ${endTime}` : ''}` : '';
  return `Criar "${title}" — ${count} compromisso${count === 1 ? '' : 's'}${time}, de ${formatDate(firstDate)} a ${formatDate(lastDate)}.`;
}

export async function orchestrateAgendaInterpret(
  uid: string,
  data: InterpretRequestData,
  dependencies: InterpretDependencies,
): Promise<InterpretResponse> {
  const now = dependencies.now ?? new Date();
  const today = todayYmdInProductTimezone(now);
  const systemPrompt = buildSystemPrompt(now);
  const messages = buildMessages(data.prompt, data.history ?? []);

  let raw: string;
  try {
    raw = await callModel(dependencies.router, messages, systemPrompt);
  } catch {
    return { success: false, error: 'O Nexus está temporariamente indisponível. Tente novamente em instantes.' };
  }

  let parsed = parseAgendaEnvelope(raw);
  if (!parsed.ok) {
    try {
      raw = await callModel(
        dependencies.router,
        [...messages, { role: 'user', content: 'A resposta anterior não era JSON válido. Responda somente com o envelope JSON estrito.' }],
        systemPrompt,
      );
    } catch {
      return { success: false, error: FRIENDLY_INVALID_MODEL };
    }
    parsed = parseAgendaEnvelope(raw);
    if (!parsed.ok) return { success: false, error: FRIENDLY_INVALID_MODEL };
  }

  const normalized = normalizeEnvelopeDates(parsed.data, today);
  const lowConfidence: string[] = [];
  if (normalized.entities.date?.confidence === 'low') lowConfidence.push('A data principal não pôde ser determinada com segurança.');
  if (normalized.entities.recurrence?.until?.confidence === 'low') lowConfidence.push('A data final da recorrência não pôde ser determinada com segurança.');
  if (lowConfidence.length > 0) return clarification([], lowConfidence);

  const validated = parseAndValidateAgendaEnvelope(JSON.stringify(normalized));
  if (!validated.ok) {
    return clarification(
      validated.errors.filter((error) => error.includes('obrigatório')).map((error) => error.replace(/^.*?\.(title|date).*$/, '$1')),
      validated.errors.filter((error) => !error.includes('obrigatório')),
    );
  }

  const envelope = validated.data;
  if (envelope.intent === 'clarify') return clarification(envelope.missing, envelope.ambiguous);

  if (envelope.intent === 'query') {
    const commitments = await dependencies.agenda.upcoming(uid, 10);
    return {
      success: true,
      outcome: 'query_result',
      status: 'ok',
      commitments: commitments.map(({ id, title, time, dateMs }) => ({ id, title, time, dateMs })),
    };
  }

  if (!envelope.entities.date) return clarification(['date'], []);
  const firstDate = envelope.entities.date.resolved;
  let lastDate = firstDate;
  let occurrenceCount = 1;
  const warnings: AgendaWarning[] = [];
  let recurrence: AgendaRecap['recurrence'];

  if (envelope.entities.recurrence) {
    const until = envelope.entities.recurrence.until?.resolved ?? addDaysForHorizon(today);
    const expanded = expandRecurrence({
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
  if (!title) return clarification(['title'], []);

  if (envelope.intent === 'edit' || envelope.intent === 'delete') {
    const candidates = await dependencies.agenda.onDay(uid, firstDate);
    const matching = candidates.filter((item) => normalizeTitle(item.title) === normalizeTitle(title));
    if (matching.length === 0) return clarification([], [`Não encontrei "${title}" em ${formatDate(firstDate)}.`]);
    if (matching.length > 1) return clarification([], [`Encontrei mais de um compromisso "${title}" em ${formatDate(firstDate)}.`]);
  } else {
    const dates = recurrence
      ? expandRecurrence({ freq: recurrence.freq as 'daily' | 'weekly' | 'monthly', startIso: firstDate, untilIso: recurrence.until }).occurrences
      : [firstDate];
    warnings.push(...await collectWarnings(uid, dates, title, envelope.entities.startTime, envelope.entities.endTime, dependencies.agenda));
  }

  const token = randomUUID();
  const createdAtMs = now.getTime();
  const expiresAtMs = createdAtMs + PENDING_TTL_MS;
  const recap: AgendaRecap = {
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

function buildFirestoreDependencies(db: ReturnType<typeof getFirestore>): Omit<InterpretDependencies, 'router' | 'now'> {
  const collectionPath = (uid: string) => `users/${uid}/agenda`;
  const mapDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot): StoredAgendaCommitment => {
    const data = doc.data() as Record<string, unknown>;
    const date = data.date as { toMillis?: () => number } | undefined;
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
        const range = saoPauloDayRangeMillis(isoToYmd(isoDate));
        const snapshot = await db.collection(collectionPath(uid))
          .where('date', '>=', Timestamp.fromMillis(range.startMs))
          .where('date', '<', Timestamp.fromMillis(range.endMs))
          .get();
        return snapshot.docs.map(mapDoc);
      },
      async upcoming(uid, max) {
        const snapshot = await db.collection(collectionPath(uid))
          .where('date', '>=', Timestamp.fromDate(new Date()))
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
          createdAt: Timestamp.fromMillis(Number(document.createdAtMs)),
          expiresAt: Timestamp.fromMillis(Number(document.expiresAtMs)),
        });
      },
    },
  };
}

export const nexusAgendaInterpret = onCall(
  {
    memory: '1GiB',
    timeoutSeconds: 60,
    region: 'us-central1',
    secrets: [GROQ_API_KEY_SECRET, OPENROUTER_API_KEY_SECRET],
  },
  async (request) => {
    const uid = requireAuth(request);
    const data = request.data as Partial<InterpretRequestData> | undefined;
    if (!data || typeof data.prompt !== 'string' || !data.prompt.trim()) {
      throw new HttpsError('invalid-argument', 'O comando de agenda é obrigatório.');
    }

    const router = MultiModelRouter.getInstance();
    router.updateApiKeys({
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    });

    return orchestrateAgendaInterpret(
      uid,
      { prompt: data.prompt, history: Array.isArray(data.history) ? data.history : [] },
      { router, ...buildFirestoreDependencies(getFirestore()) },
    );
  },
);
