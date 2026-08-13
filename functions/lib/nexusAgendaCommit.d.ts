export declare const MAX_COMMIT_BATCH_WRITES = 400;
export declare const MAX_COMMIT_OCCURRENCES = 800;
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
    targets?: unknown;
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
    intent: 'create' | 'delete';
    idsCreated: string[];
    idsDeleted: string[];
    seriesId?: string;
    before: unknown;
    after: unknown;
    requestHash: string;
    createdAtMs: number;
    completedAtMs: number;
    error?: string;
}
export interface CommitResult {
    success: true;
    actionId: string;
    status: 'committed';
    intent: 'create' | 'delete';
    idsCreated: string[];
    idsDeleted: string[];
    seriesId?: string;
    occurrenceCount: number;
}
export interface CommitDependencies {
    claimPending(uid: string, token: string, nowMs: number, executionId: string): Promise<{
        kind: 'claimed';
        pending: PendingDocument;
    } | {
        kind: 'idempotent';
        result: CommitResult;
    } | {
        kind: 'rejected';
        reason: string;
    }>;
    existingIds(uid: string, ids: string[]): Promise<string[]>;
    writeBatch(uid: string, documents: CommitDocument[]): Promise<void>;
    deleteBatch(uid: string, ids: string[]): Promise<void>;
    finalizePending(uid: string, token: string, patch: Record<string, unknown>): Promise<void>;
    writeAudit(uid: string, actionId: string, audit: CommitAudit): Promise<void>;
}
export interface CommitRequest {
    confirmationToken: string;
    confirmed: boolean;
    alarm?: boolean;
}
export declare function requireCommitAuth(request: {
    auth?: {
        uid?: string;
    } | null;
}): string;
export declare function executeAgendaCommit(uid: string, request: CommitRequest, dependencies: CommitDependencies, now?: number): Promise<CommitResult>;
export declare const nexusAgendaCommit: import("firebase-functions/v2/https").CallableFunction<any, Promise<CommitResult>, unknown>;
export {};
