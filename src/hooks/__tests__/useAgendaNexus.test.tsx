import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const callableMocks = vi.hoisted(() => ({
  interpret: vi.fn(),
  commit: vi.fn(),
}));

vi.mock('../../firebase', () => ({ functions: {} }));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === 'nexusAgendaInterpret') return callableMocks.interpret;
    if (name === 'nexusAgendaCommit') return callableMocks.commit;
    throw new Error(`Callable inesperado: ${name}`);
  }),
}));

import { useAgendaNexus, type AgendaNexusCommitResult } from '../useAgendaNexus';

const proposalResponse = {
  success: true,
  outcome: 'proposal',
  status: 'awaiting_confirmation',
  confirmationToken: 'token-1',
  expiresAtMs: Date.now() + 600000,
  recap: {
    intent: 'create',
    action: 'create_commitment',
    title: 'Reunião',
    firstDate: '2026-08-18',
    lastDate: '2026-08-18',
    occurrenceCount: 1,
    summary: 'Criar reunião.',
  },
  warnings: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAgendaNexus', () => {
  beforeEach(() => {
    vi.useRealTimers();
    callableMocks.interpret.mockReset();
    callableMocks.commit.mockReset();
  });

  it('inicia em idle sem proposta ou resultado', () => {
    const { result } = renderHook(() => useAgendaNexus());
    expect(result.current.stage).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.proposal).toBeNull();
    expect(result.current.commitResult).toBeNull();
    expect(result.current.canUndo).toBe(false);
  });

  it('interpreta uma proposta e vai para done sem commit automático', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    const { result } = renderHook(() => useAgendaNexus());

    await act(async () => {
      await result.current.interpret({ prompt: 'marque reunião' });
    });

    expect(result.current.stage).toBe('done');
    expect(result.current.proposal?.title).toBe('Reunião');
    expect(result.current.isLoading).toBe(false);
    expect(callableMocks.commit).not.toHaveBeenCalled();
  });

  it('transita para clarify com campos ausentes e ambiguidades', async () => {
    callableMocks.interpret.mockResolvedValue({
      data: {
        success: true,
        outcome: 'clarification',
        clarification: {
          missing: ['title'],
          ambiguous: ['data não identificada'],
          questions: ['Qual título?'],
        },
      },
    });
    const { result } = renderHook(() => useAgendaNexus());

    await act(async () => {
      await result.current.interpret({ prompt: 'marque algo' });
    });

    expect(result.current.stage).toBe('clarify');
    expect(result.current.missing).toEqual(['title']);
    expect(result.current.ambiguous).toEqual(['data não identificada']);
  });

  it('preserva assumptions retornadas pelo backend', async () => {
    callableMocks.interpret.mockResolvedValue({ data: { ...proposalResponse, assumptions: [{ field: 'timeZone', note: 'SP' }] } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    expect(result.current.assumptions).toEqual([{ field: 'timeZone', note: 'SP' }]);
  });

  it('trata erro estruturado da Function', async () => {
    callableMocks.interpret.mockResolvedValue({ data: { success: false, error: 'Data inválida.' } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    expect(result.current.stage).toBe('error');
    expect(result.current.error).toBe('Data inválida.');
  });

  it('trata erro de rede ou callable rejeitada', async () => {
    callableMocks.interpret.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    expect(result.current.stage).toBe('error');
    expect(result.current.error).toBe('network down');
  });

  it('bloqueia commit sem confirmationToken', async () => {
    const { result } = renderHook(() => useAgendaNexus());
    let returned: unknown;
    await act(async () => { returned = await result.current.commit(); });
    expect(returned).toBeNull();
    expect(result.current.stage).toBe('error');
    expect(result.current.error).toContain('proposta confirmável');
    expect(callableMocks.commit).not.toHaveBeenCalled();
  });

  it('envia ao commit somente confirmationToken e confirmed true', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    callableMocks.commit.mockResolvedValue({ data: { success: true, status: 'committed', actionId: 'act-1', idsCreated: ['c-1'] } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    await act(async () => { await result.current.commit(); });
    expect(callableMocks.commit).toHaveBeenCalledWith({ confirmationToken: 'token-1', confirmed: true });
  });

  it('envia alarm true ao commit quando o usuário ativa o alarme', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    callableMocks.commit.mockResolvedValue({ data: { success: true, status: 'committed', actionId: 'act-1', idsCreated: ['c-1'] } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    await act(async () => { await result.current.commit(undefined, { alarm: true }); });
    expect(callableMocks.commit).toHaveBeenCalledWith({ confirmationToken: 'token-1', confirmed: true, alarm: true });
  });

  it('omite alarm do commit quando a escolha é apenas anotar', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    callableMocks.commit.mockResolvedValue({ data: { success: true, status: 'committed', actionId: 'act-1', idsCreated: ['c-1'] } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    await act(async () => { await result.current.commit(undefined, { alarm: false }); });
    expect(callableMocks.commit).toHaveBeenCalledWith({ confirmationToken: 'token-1', confirmed: true });
  });

  it('vai para success e prepara undo sem executar nexusAgendaUndo', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    callableMocks.commit.mockResolvedValue({ data: { success: true, status: 'committed', actionId: 'act-1', idsCreated: ['c-1'] } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    await act(async () => { await result.current.commit(); });
    expect(result.current.stage).toBe('success');
    expect(result.current.commitResult?.actionId).toBe('act-1');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.undoContract).toEqual({ actionId: 'act-1', confirmationToken: 'token-1' });
    expect(callableMocks.commit).toHaveBeenCalledTimes(1);
  });

  it('vai para partial e não trata operação parcial como sucesso completo', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    callableMocks.commit.mockResolvedValue({ data: { success: false, status: 'partial', actionId: 'act-1', idsCreated: ['c-1'], message: 'Reconciliação necessária.' } });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    await act(async () => { await result.current.commit(); });
    expect(result.current.stage).toBe('partial');
    expect(result.current.commitResult?.idsCreated).toEqual(['c-1']);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.error).toBe('Reconciliação necessária.');
  });

  it('trata token expirado como erro', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    callableMocks.commit.mockRejectedValue({ code: 'deadline-exceeded', message: 'A proposta expirou.' });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    await act(async () => { await result.current.commit(); });
    expect(result.current.stage).toBe('error');
    expect(result.current.error).toBe('A proposta expirou.');
  });

  it('bloqueia dois commits simultâneos', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    const pending = deferred<{ data: AgendaNexusCommitResult }>();
    callableMocks.commit.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });

    let second: unknown;
    await act(async () => {
      void result.current.commit();
      second = await result.current.commit();
    });
    expect(second).toBeNull();
    expect(callableMocks.commit).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve({ data: { success: true, status: 'committed', actionId: 'a' } }); });
  });

  it('cancela interpretação e ignora resposta atrasada', async () => {
    const pending = deferred<{ data: typeof proposalResponse }>();
    callableMocks.interpret.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useAgendaNexus());
    let interpretation: unknown;
    await act(async () => {
      void (async () => { interpretation = await result.current.interpret({ prompt: 'reunião' }); })();
    });
    act(() => { result.current.cancel(); });
    await act(async () => { pending.resolve({ data: proposalResponse }); });
    expect(interpretation).toBeNull();
    expect(result.current.stage).toBe('cancelled');
    expect(result.current.proposal).toBeNull();
  });

  it('reseta completamente o estado', async () => {
    callableMocks.interpret.mockResolvedValue({ data: proposalResponse });
    const { result } = renderHook(() => useAgendaNexus());
    await act(async () => { await result.current.interpret({ prompt: 'reunião' }); });
    act(() => { result.current.reset(); });
    expect(result.current.stage).toBe('idle');
    expect(result.current.proposal).toBeNull();
    expect(result.current.commitResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.missing).toEqual([]);
    expect(result.current.ambiguous).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });

  it('limpa timers progressivos ao cancelar', async () => {
    vi.useFakeTimers();
    const pending = deferred<{ data: typeof proposalResponse }>();
    callableMocks.interpret.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useAgendaNexus());
    act(() => { void result.current.interpret({ prompt: 'reunião' }); });
    expect(vi.getTimerCount()).toBe(2);
    act(() => { result.current.cancel(); });
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => { pending.resolve({ data: proposalResponse }); });
  });

  it('interpreta proposta de exclusão e confirma sem oferecer desfazer', async () => {
    callableMocks.interpret.mockResolvedValue({
      data: {
        success: true,
        outcome: 'proposal',
        status: 'awaiting_confirmation',
        confirmationToken: 'token-del',
        expiresAtMs: Date.now() + 600000,
        recap: {
          intent: 'delete',
          action: 'delete_commitment',
          title: 'Reunião com o coordenador de campo',
          matchCount: 2,
          affectedItems: [
            { id: 'a1', title: 'Reunião com o coordenador de campo', dateMs: 0 },
            { id: 'a2', title: 'Reunião com o coordenador de campo', dateMs: 0 },
          ],
          summary: 'Entendi. Encontrei 2 compromissos com esse nome. Pretendo excluí-los permanentemente. Posso prosseguir?',
        },
        warnings: [],
      },
    });
    callableMocks.commit.mockResolvedValue({
      data: { success: true, status: 'committed', intent: 'delete', actionId: 'act-del', idsDeleted: ['a1', 'a2'], occurrenceCount: 2 },
    });
    const { result } = renderHook(() => useAgendaNexus());

    await act(async () => { await result.current.interpret({ prompt: 'excluir todos' }); });
    expect(result.current.stage).toBe('done');
    expect(result.current.proposal?.matchCount).toBe(2);
    expect(Array.isArray(result.current.proposal?.affectedItems)).toBe(true);

    await act(async () => { await result.current.commit(); });
    expect(callableMocks.commit).toHaveBeenCalledWith({ confirmationToken: 'token-del', confirmed: true });
    expect(result.current.stage).toBe('success');
    expect(result.current.commitResult?.idsDeleted).toEqual(['a1', 'a2']);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.undoContract).toBeNull();
  });
});
