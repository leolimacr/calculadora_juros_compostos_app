import { useCallback, useEffect, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export type AgendaNexusStage =
  | 'idle'
  | 'interpreting'
  | 'resolving_dates'
  | 'done'
  | 'clarify'
  | 'error'
  | 'cancelled'
  | 'committing'
  | 'success'
  | 'undoing'
  | 'undone'
  | 'partial';

export interface AgendaNexusHistoryMessage {
  role: 'user' | 'ai' | 'assistant';
  text: string;
}

export interface AgendaNexusInterpretInput {
  prompt: string;
  history?: AgendaNexusHistoryMessage[];
}

export interface AgendaNexusAffectedItem {
  id?: string;
  title?: string;
  time?: string | null;
  endTime?: string | null;
  dateMs?: number;
}

export interface AgendaNexusProposal {
  intent?: string;
  action?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  firstDate?: string;
  lastDate?: string;
  occurrenceCount?: number;
  recurrence?: Record<string, unknown> | null;
  summary?: string;
  /** Quantidade de itens que uma operação em massa (exclusão) vai afetar. */
  matchCount?: number;
  /** Esboço dos itens afetados — renderizado antes da aprovação. */
  affectedItems?: AgendaNexusAffectedItem[];
  /** TRUE quando a operação em massa foi truncada no teto de itens. */
  truncated?: boolean;
  [key: string]: unknown;
}

export interface AgendaNexusRefinement {
  question: string;
  suggestions: string[];
}

export interface AgendaNexusInterpretResponse {
  success: boolean;
  outcome?: 'proposal' | 'clarification' | 'query_result';
  status?: string;
  confirmationToken?: string;
  expiresAtMs?: number;
  recap?: AgendaNexusProposal;
  proposal?: AgendaNexusProposal;
  warnings?: Array<Record<string, unknown>>;
  clarification?: {
    missing?: string[];
    ambiguous?: string[];
    questions?: string[];
    refinement?: AgendaNexusRefinement;
  };
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface AgendaNexusCommitResult {
  success: boolean;
  status?: 'committed' | 'partial' | 'failed' | 'idempotent' | string;
  intent?: 'create' | 'delete' | string;
  actionId?: string;
  idsCreated?: string[];
  idsDeleted?: string[];
  seriesId?: string;
  occurrenceCount?: number;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export interface AgendaNexusUndoContract {
  actionId: string;
  confirmationToken: string;
}

export interface UseAgendaNexusResult {
  interpret(input: AgendaNexusInterpretInput): Promise<AgendaNexusInterpretResponse | null>;
  commit(confirmationToken?: string, options?: { alarm?: boolean }): Promise<AgendaNexusCommitResult | null>;
  undo(): Promise<AgendaNexusCommitResult | null>;
  cancel(): void;
  reset(): void;
  isLoading: boolean;
  stage: AgendaNexusStage;
  progressMessage: string | null;
  proposal: AgendaNexusProposal | null;
  missing: string[];
  ambiguous: string[];
  assumptions: Array<Record<string, unknown>>;
  refinement: AgendaNexusRefinement | null;
  /** Thread visual do diálogo de refinamento (espelho do histórico enviado ao backend). */
  dialogue: AgendaNexusHistoryMessage[];
  commitResult: AgendaNexusCommitResult | null;
  error: string | null;
  canUndo: boolean;
  undoContract: AgendaNexusUndoContract | null;
}

const INTERPRET_PROGRESS_MESSAGES = [
  { delay: 2000, message: 'Estruturando datas e recorrência…' },
  { delay: 7000, message: 'Quase lá — verificando sua agenda…' },
] as const;

const INITIAL_PROGRESS_MESSAGE = 'Nexus lendo sua solicitação…';
const UNDO_TTL_MS = 60_000;

function getCallableErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; code?: unknown; details?: unknown };
    if (typeof candidate.details === 'object' && candidate.details !== null) {
      const details = candidate.details as { message?: unknown; error?: unknown };
      if (typeof details.message === 'string') return details.message;
      if (typeof details.error === 'string') return details.error;
    }
    if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
    if (candidate.code === 'unauthenticated') return 'Faça login para usar o Nexus na Agenda.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Não foi possível concluir a operação da Agenda. Tente novamente.';
}

function getResponseError(data: AgendaNexusInterpretResponse | AgendaNexusCommitResult): string | null {
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  return null;
}

function isPartialResponse(data: AgendaNexusCommitResult): boolean {
  return data.status === 'partial' || data.status === 'failed' || data.success === false && data.status === 'partial';
}

function extractProposal(data: AgendaNexusInterpretResponse): AgendaNexusProposal | null {
  if (data.recap && typeof data.recap === 'object') return data.recap;
  if (data.proposal && typeof data.proposal === 'object') return data.proposal;
  return null;
}

export function useAgendaNexus(): UseAgendaNexusResult {
  const [stage, setStage] = useState<AgendaNexusStage>('idle');
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [proposal, setProposal] = useState<AgendaNexusProposal | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [ambiguous, setAmbiguous] = useState<string[]>([]);
  const [assumptions, setAssumptions] = useState<Array<Record<string, unknown>>>([]);
  const [commitResult, setCommitResult] = useState<AgendaNexusCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [undoContract, setUndoContract] = useState<AgendaNexusUndoContract | null>(null);
  const [refinement, setRefinement] = useState<AgendaNexusRefinement | null>(null);
  const [dialogue, setDialogue] = useState<AgendaNexusHistoryMessage[]>([]);

  const requestGenerationRef = useRef(0);
  const activeOperationRef = useRef<'interpret' | 'commit' | null>(null);
  const timersRef = useRef<number[]>([]);
  const undoTimerRef = useRef<number | null>(null);
  const pendingConfirmationTokenRef = useRef<string | null>(null);
  const proposalIntentRef = useRef<string | null>(null);
  const dialogueHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const invalidateOperation = useCallback(() => {
    requestGenerationRef.current += 1;
    activeOperationRef.current = null;
    clearTimers();
  }, [clearTimers]);

  const reset = useCallback(() => {
    invalidateOperation();
    pendingConfirmationTokenRef.current = null;
    proposalIntentRef.current = null;
    dialogueHistoryRef.current = [];
    setDialogue([]);
    setStage('idle');
    setProgressMessage(null);
    setProposal(null);
    setMissing([]);
    setAmbiguous([]);
    setAssumptions([]);
    setRefinement(null);
    setCommitResult(null);
    setError(null);
    setCanUndo(false);
    setUndoContract(null);
  }, [invalidateOperation]);

  const cancel = useCallback(() => {
    invalidateOperation();
    pendingConfirmationTokenRef.current = null;
    proposalIntentRef.current = null;
    dialogueHistoryRef.current = [];
    setDialogue([]);
    setStage('cancelled');
    setProgressMessage(null);
    setRefinement(null);
    setError(null);
  }, [invalidateOperation]);

  const interpret = useCallback(async (input: AgendaNexusInterpretInput) => {
    if (activeOperationRef.current !== null) return null;
    if (!input.prompt.trim()) {
      setStage('error');
      setError('Digite uma solicitação para interpretar.');
      return null;
    }

    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    activeOperationRef.current = 'interpret';
    clearTimers();
    setStage('interpreting');
    setProgressMessage(INITIAL_PROGRESS_MESSAGE);
    setProposal(null);
    setMissing([]);
    setAmbiguous([]);
    setAssumptions([]);
    setRefinement(null);
    setCommitResult(null);
    setError(null);
    setCanUndo(false);
    setUndoContract(null);

    INTERPRET_PROGRESS_MESSAGES.forEach(({ delay, message }) => {
      const timer = window.setTimeout(() => {
        if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'interpret') return;
        setStage('resolving_dates');
        setProgressMessage(message);
      }, delay);
      timersRef.current.push(timer);
    });

    try {
      const callable = httpsCallable(functions, 'nexusAgendaInterpret');
      const result = await callable({ prompt: input.prompt, history: [...dialogueHistoryRef.current] });
      if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'interpret') return null;

      const data = result.data as AgendaNexusInterpretResponse;
      const responseError = getResponseError(data);
      if (!data.success || responseError) {
        setStage('error');
        setError(responseError ?? 'O Nexus não conseguiu interpretar a solicitação.');
        return data;
      }

      const rawProposal = extractProposal(data);
      const nextProposal = rawProposal
        ? { ...rawProposal, warnings: data.warnings ?? rawProposal.warnings, assumptions: data.assumptions ?? rawProposal.assumptions }
        : null;
      proposalIntentRef.current = typeof nextProposal?.intent === 'string' ? nextProposal.intent : null;
      const nextMissing = data.clarification?.missing ?? [];
      const nextAmbiguous = data.clarification?.ambiguous ?? [];
      const nextAssumptions = Array.isArray(data.assumptions)
        ? data.assumptions
        : Array.isArray(nextProposal?.assumptions) ? nextProposal.assumptions as Array<Record<string, unknown>> : [];
      const nextRefinement = data.clarification?.refinement ?? null;
      setProposal(nextProposal);
      setMissing(nextMissing);
      setAmbiguous(nextAmbiguous);
      setAssumptions(nextAssumptions);
      setRefinement(nextRefinement);

      const isClarifying = data.outcome === 'clarification' || nextMissing.length > 0 || nextAmbiguous.length > 0;
      if (isClarifying) {
        const question = nextRefinement?.question ?? nextAmbiguous[0] ?? data.clarification?.questions?.[0] ?? null;
        dialogueHistoryRef.current = [
          ...dialogueHistoryRef.current,
          { role: 'user', text: input.prompt },
          ...(question ? [{ role: 'assistant' as const, text: question }] : []),
        ];
        setDialogue(nextRefinement?.question ? [...dialogueHistoryRef.current] : []);
      } else {
        dialogueHistoryRef.current = [];
        setDialogue([]);
      }

      if (isClarifying) {
        setStage('clarify');
      } else {
        pendingConfirmationTokenRef.current = data.confirmationToken ?? null;
        setStage('done');
      }
      return data;
    } catch (callError) {
      if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'interpret') return null;
      setStage('error');
      setError(getCallableErrorMessage(callError));
      return null;
    } finally {
      if (requestGenerationRef.current === generation) {
        activeOperationRef.current = null;
        clearTimers();
        setProgressMessage(null);
      }
    }
  }, [clearTimers]);

  const commit = useCallback(async (confirmationToken?: string, options?: { alarm?: boolean }) => {
    if (activeOperationRef.current !== null) return null;
    const token = confirmationToken ?? pendingConfirmationTokenRef.current;
    if (!token) {
      setStage('error');
      setError('Nenhuma proposta confirmável está disponível.');
      return null;
    }

    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    activeOperationRef.current = 'commit';
    setStage('committing');
    setError(null);
    setCommitResult(null);

    try {
      const callable = httpsCallable(functions, 'nexusAgendaCommit');
      const result = await callable({
        confirmationToken: token,
        confirmed: true,
        ...(options?.alarm ? { alarm: true } : {}),
      });
      if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'commit') return null;

      const data = result.data as AgendaNexusCommitResult;
      setCommitResult(data);
      const responseError = getResponseError(data);
      if (isPartialResponse(data)) {
        setStage('partial');
        setError(responseError ?? 'A operação foi parcialmente concluída e precisa de reconciliação.');
        setCanUndo(false);
      } else if (!data.success || responseError) {
        setStage('error');
        setError(responseError ?? 'Não foi possível confirmar a operação da Agenda.');
        setCanUndo(false);
      } else {
        const isCreate = proposalIntentRef.current === 'create';
        setStage('success');
        setCanUndo(isCreate);
        if (isCreate) {
          setUndoContract(data.actionId ? { actionId: data.actionId, confirmationToken: token } : null);
          undoTimerRef.current = window.setTimeout(() => {
            undoTimerRef.current = null;
            setCanUndo(false);
            setUndoContract(null);
          }, UNDO_TTL_MS);
        } else {
          setUndoContract(null);
        }
        pendingConfirmationTokenRef.current = null;
      }
      return data;
    } catch (callError) {
      if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'commit') return null;
      const message = getCallableErrorMessage(callError);
      const partial = /partial|parcial|reconcilia/i.test(message);
      setStage(partial ? 'partial' : 'error');
      setError(message);
      setCanUndo(false);
      return null;
    } finally {
      if (requestGenerationRef.current === generation) activeOperationRef.current = null;
    }
  }, []);

  const undo = useCallback(async () => {
    if (activeOperationRef.current !== null || !undoContract?.actionId || !canUndo) return null;
    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    activeOperationRef.current = 'commit';
    setStage('undoing');
    setError(null);
    try {
      const callable = httpsCallable(functions, 'nexusAgendaUndo');
      const result = await callable({ actionId: undoContract.actionId });
      if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'commit') return null;
      const data = result.data as AgendaNexusCommitResult;
      setCommitResult(data);
      const responseError = getResponseError(data);
      if (!data.success || responseError || data.status === 'partial' || data.status === 'failed') {
        setStage(data.status === 'partial' ? 'partial' : 'error');
        setError(responseError ?? 'Não foi possível desfazer a criação.');
      } else {
        setStage('undone');
        setCanUndo(false);
        setUndoContract(null);
      }
      return data;
    } catch (callError) {
      if (requestGenerationRef.current !== generation || activeOperationRef.current !== 'commit') return null;
      setStage('error');
      setError(getCallableErrorMessage(callError));
      return null;
    } finally {
      if (requestGenerationRef.current === generation) activeOperationRef.current = null;
    }
  }, [canUndo, undoContract]);

  useEffect(() => () => {
    invalidateOperation();
  }, [invalidateOperation]);

  return {
    interpret,
    commit,
    cancel,
    reset,
    isLoading: stage === 'interpreting' || stage === 'resolving_dates' || stage === 'committing' || stage === 'undoing',
    stage,
    progressMessage,
    proposal,
    missing,
    ambiguous,
    assumptions,
    refinement,
    dialogue,
    commitResult,
    undo,
    error,
    canUndo,
    undoContract,
  };
}
