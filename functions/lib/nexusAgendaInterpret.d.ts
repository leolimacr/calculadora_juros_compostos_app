import { type AgendaEnvelope } from './nexus-core/agenda-intent-schema';
export interface InterpretRequestData {
    prompt: string;
    history?: Array<{
        role: string;
        text: string;
    }>;
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
    searchByTitle(uid: string, title: string, opts?: {
        maxResults?: number;
    }): Promise<StoredAgendaCommitment[]>;
}
export interface PendingWriter {
    write(uid: string, token: string, document: Record<string, unknown>): Promise<void>;
}
export interface AgendaRouter {
    routeRequest(messages: unknown[], systemPrompt?: string, options?: Record<string, unknown>): Promise<{
        content: string;
        success?: boolean;
        isContingency?: boolean;
    }>;
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
export interface AgendaAffectedItem {
    id: string;
    title: string;
    time?: string | null;
    endTime?: string | null;
    dateMs: number;
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
    matchCount?: number;
    affectedItems?: AgendaAffectedItem[];
    truncated?: boolean;
    summary: string;
}
export interface AgendaRefinement {
    question: string;
    suggestions: string[];
}
export type InterpretResponse = {
    success: true;
    outcome: 'proposal';
    status: 'awaiting_confirmation';
    confirmationToken: string;
    expiresAtMs: number;
    recap: AgendaRecap;
    warnings: AgendaWarning[];
} | {
    success: true;
    outcome: 'clarification';
    status: 'awaiting_clarification';
    clarification: {
        missing: string[];
        ambiguous: string[];
        questions: string[];
        refinement?: AgendaRefinement;
    };
} | {
    success: true;
    outcome: 'query_result';
    status: 'ok';
    commitments: Array<{
        id: string;
        title: string;
        time?: string | null;
        dateMs: number;
    }>;
} | {
    success: false;
    error: string;
};
export declare function requireAuth(request: {
    auth?: {
        uid?: string;
    } | null;
}): string;
export declare function orchestrateAgendaInterpret(uid: string, data: InterpretRequestData, dependencies: InterpretDependencies): Promise<InterpretResponse>;
export declare const nexusAgendaInterpret: import("firebase-functions/v2/https").CallableFunction<any, Promise<InterpretResponse>, unknown>;
