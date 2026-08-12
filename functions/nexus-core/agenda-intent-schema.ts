/**
 * AGENDA INTENT SCHEMA - Contrato estrito do envelope JSON que o Nexus produz
 * ao interpretar a intenção do usuário sobre a Agenda.
 *
 * O LLM só PROPÕE o envelope; este módulo garante que ele seja estruturalmente
 * válido antes de qualquer gravação. Regras de negócio por intenção ficam em
 * validateAgendaEnvelope; a evocação do LLM acontece apenas em Fase 3.
 */

import { z } from 'zod';

// ─────────────────────────── Enums e constantes ───────────────────────────

export const AGENDA_INTENTS = ['create', 'edit', 'delete', 'query', 'clarify'] as const;
export type AgendaIntent = (typeof AGENDA_INTENTS)[number];

export const AGENDA_ACTIONS = [
  'create_commitment',
  'edit_commitment',
  'delete_commitment',
  'query_commitments',
  'query_clarification',
] as const;
export type AgendaAction = (typeof AGENDA_ACTIONS)[number];

export const RECURRENCE_FREQS = ['daily', 'weekly', 'monthly'] as const;
export type RecurrenceFreq = (typeof RECURRENCE_FREQS)[number];

export const CONFIDENCE_VALUES = ['high', 'low'] as const;
export type ConfidenceValue = (typeof CONFIDENCE_VALUES)[number];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** Intenções que exigem escrita efetiva no Firestore (contraparte de "query"). */
export const WRITE_INTENTS: ReadonlySet<AgendaIntent> = new Set(['create', 'edit', 'delete']);

// ───────────────────────────── Schemas aninhados ──────────────────────────

export const dateResolutionSchema = z.object({
  /** Expressão original do usuário ("próxima terça-feira"). */
  expression: z.string().min(1),
  /** Data resolvida no fuso America/Sao_Paulo, no formato YYYY-MM-DD. */
  resolved: z.string().regex(ISO_DATE_REGEX, 'resolved deve ser uma data ISO no formato YYYY-MM-DD'),
  confidence: z.enum(CONFIDENCE_VALUES),
});
export type DateResolution = z.infer<typeof dateResolutionSchema>;

export const recurrenceSchema = z.object({
  freq: z.enum(RECURRENCE_FREQS),
  /** 1..7, seg=1. Obrigatório quando freq === 'weekly' (validado em validateAgendaEnvelope). */
  byDay: z.number().int().min(1).max(7).optional(),
  until: dateResolutionSchema.optional(),
});
export type RecurrenceSpec = z.infer<typeof recurrenceSchema>;

export const entitiesSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    date: dateResolutionSchema.optional(),
    /** Horário de início, formato HH:mm. */
    startTime: z
      .string()
      .regex(ISO_TIME_REGEX, 'startTime deve estar no formato HH:mm')
      .optional(),
    /** Horário de término (duração), formato HH:mm. */
    endTime: z
      .string()
      .regex(ISO_TIME_REGEX, 'endTime deve estar no formato HH:mm')
      .optional(),
    recurrence: recurrenceSchema.optional(),
    location: z
      .string()
      .max(200)
      .nullable()
      .optional(),
    participants: z
      .array(z.string().min(1).max(80))
      .max(20)
      .nullable()
      .optional(),
    notes: z.string().max(2000).nullable().optional(),
    timeZone: z.string().max(60).optional(),
  })
  .strict();
export type AgendaEntities = z.infer<typeof entitiesSchema>;

export const assumptionSchema = z
  .object({
    field: z.string().min(1),
    note: z.string().min(1),
  })
  .strict();
export type AgendaAssumption = z.infer<typeof assumptionSchema>;

export const agendaEnvelopeSchema = z
  .object({
    intent: z.enum(AGENDA_INTENTS),
    action: z.enum(AGENDA_ACTIONS),
    entities: entitiesSchema,
    missing: z.array(z.string().min(1)).max(20).default([]),
    ambiguous: z.array(z.string().min(1)).max(20).default([]),
    assumptions: z.array(assumptionSchema).max(20).default([]),
  })
  .strict();
export type AgendaEnvelope = z.infer<typeof agendaEnvelopeSchema>;

// ─────────────────────────── Bom pareamento intenção/ação ─────────────────

const INTENT_ACTION_MAP: Record<AgendaIntent, AgendaAction> = {
  create: 'create_commitment',
  edit: 'edit_commitment',
  delete: 'delete_commitment',
  query: 'query_commitments',
  clarify: 'query_clarification',
};

export function actionMatchesIntent(intent: AgendaIntent, action: AgendaAction): boolean {
  return INTENT_ACTION_MAP[intent] === action;
}

// ─────────────────────────── Parsing com mensagens amigáveis ──────────────

export type AgendaEnvelopeParseResult =
  | { ok: true; data: AgendaEnvelope }
  | { ok: false; errors: string[] };

/**
 * Faz JSON.parse + validação estrutural estrita. Campos extras desconhecidos
 * são rejeitados (.strict()) para impedir que o LLM invente campos.
 */
export function parseAgendaEnvelope(raw: unknown): AgendaEnvelopeParseResult {
  if (typeof raw !== 'string') {
    return { ok: false, errors: ['Envelope deve ser uma string JSON.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ['Envelope não é um JSON válido.'] };
  }

  const result = agendaEnvelopeSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
  };
}

// ─────────────────────── Regras de negócio por intenção ───────────────────

export interface EnvelopeValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validações de negócio que o schema estrutural não cobre — campos
 * obrigatórios por intenção, confiança de data e coerência da recorrência.
 */
export function validateAgendaEnvelope(env: AgendaEnvelope): EnvelopeValidation {
  const errors: string[] = [];

  if (!actionMatchesIntent(env.intent, env.action)) {
    errors.push(`A ação "${env.action}" não corresponde à intenção "${env.intent}".`);
  }

  if (env.intent === 'create' || env.intent === 'edit') {
    if (!env.entities.title) {
      errors.push('entities.title é obrigatório para create/edit.');
    }
    if (!env.entities.date) {
      errors.push('entities.date é obrigatório para create/edit.');
    } else if (env.entities.date.confidence === 'low') {
      errors.push('entities.date tem confiança baixa — solicite confirmação da data antes de gravar.');
    }
    if (env.entities.location !== undefined && env.entities.location === '') {
      errors.push('entities.location não pode ser uma string vazia; use null para ausência.');
    }
  }

  if (env.intent === 'delete') {
    if (!env.entities.date && !env.entities.title) {
      errors.push('delete exige ao menos entities.title ou entities.date para identificar o compromisso.');
    }
    if (env.entities.date && env.entities.date.confidence === 'low') {
      errors.push('entities.date tem confiança baixa — solicite confirmação da data antes de excluir.');
    }
  }

  if (env.entities.recurrence && env.entities.recurrence.freq === 'weekly' && env.entities.recurrence.byDay === undefined) {
    errors.push('entities.recurrence.byDay é obrigatório para recorrência weekly.');
  }

  if (env.entities.endTime && env.entities.startTime && env.entities.endTime <= env.entities.startTime) {
    errors.push('entities.endTime deve ser posterior a entities.startTime.');
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────── Helpers combinados ───────────────────────────

export type AgendaParseOutcome = { ok: true; data: AgendaEnvelope } | { ok: false; errors: string[] };

/**
 * Ponto único de entrada para as Cloud Functions: parse estrutural + regras de
 * negócio. Retorna o envelope pronto ou a lista de erros para o frontend.
 */
export function parseAndValidateAgendaEnvelope(raw: unknown): AgendaParseOutcome {
  const parsed = parseAgendaEnvelope(raw);
  if (!parsed.ok) return parsed;

  const validation = validateAgendaEnvelope(parsed.data);
  if (!validation.valid) return { ok: false, errors: validation.errors };

  return { ok: true, data: parsed.data };
}
