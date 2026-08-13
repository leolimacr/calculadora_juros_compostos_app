import { describe, expect, it, vi } from 'vitest';
import {
  executeAgendaCommit,
  MAX_COMMIT_BATCH_WRITES,
  MAX_COMMIT_OCCURRENCES,
  requireCommitAuth,
  type CommitDependencies,
  type CommitResult,
} from '../nexusAgendaCommit';
import { isoToYmd, saoPauloDayRangeMillis } from '../nexus-core/agenda-time';

const NOW = new Date('2026-08-12T15:00:00.000Z').getTime();

function pendingEnvelope(overrides: Record<string, unknown> = {}) {
  const overrideEntities = overrides.entities as Record<string, unknown> | undefined;
  const { entities: _ignoredEntities, ...topLevelOverrides } = overrides;
  return {
    intent: 'create',
    action: 'create_commitment',
    entities: {
      title: 'Reunião com o coordenador',
      date: { expression: 'próxima terça-feira', resolved: '2026-08-18', confidence: 'high' },
      startTime: '17:00',
      endTime: '18:00',
      location: 'Sala 3',
      participants: ['Ana'],
      notes: 'Levar relatório',
      ...(overrideEntities ?? {}),
    },
    missing: [],
    ambiguous: [],
    assumptions: [],
    ...topLevelOverrides,
  };
}

function pendingDocument(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'user-1',
    nonce: 'token-1',
    confirmationToken: 'token-1',
    status: 'awaiting_confirmation',
    createdAtMs: NOW - 1000,
    expiresAtMs: NOW + 600000,
    envelope: pendingEnvelope(),
    ...overrides,
  };
}

function deletePendingEnvelope() {
  return {
    intent: 'delete',
    action: 'delete_commitment',
    entities: { title: 'Reunião com o coordenador de campo' },
    missing: [],
    ambiguous: [],
    assumptions: [],
  };
}

function setup(options: {
  pending?: Record<string, unknown>;
  existingIds?: string[];
  failBatchAt?: number;
  claim?: CommitDependencies['claimPending'];
} = {}) {
  const batches: Array<Array<{ id: string; data: Record<string, unknown> }>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const finalized: Array<Record<string, unknown>> = [];
  const deleted: string[] = [];
  let batchCount = 0;
  let claimStatus: string = 'awaiting_confirmation';

  const maybeFail = () => {
    batchCount += 1;
    if (options.failBatchAt === batchCount) throw new Error(`batch-${batchCount}-failed`);
  };

  const defaultClaim = async (_uid: string, _token: string, _now: number, _executionId: string) => {
    if (claimStatus === 'committed') {
      return {
        kind: 'idempotent' as const,
        result: (pendingDocument() as unknown as { result: CommitResult }).result,
      };
    }
    if (claimStatus !== 'awaiting_confirmation') return { kind: 'rejected' as const, reason: 'Token já consumido.' };
    claimStatus = 'processing';
    return { kind: 'claimed' as const, pending: pendingDocument({ ...options.pending, status: 'processing' }) };
  };
  const dependencies: CommitDependencies = {
    claimPending: options.claim ?? vi.fn(defaultClaim),
    existingIds: vi.fn(async () => options.existingIds ?? []),
    writeBatch: vi.fn(async (_uid, documents) => {
      maybeFail();
      batches.push(documents);
    }),
    deleteBatch: vi.fn(async (_uid, ids) => {
      maybeFail();
      deleted.push(...ids);
    }),
    finalizePending: vi.fn(async (_uid, _token, patch) => {
      finalized.push(patch);
      if (patch.status === 'committed') claimStatus = 'committed';
    }),
    writeAudit: vi.fn(async (_uid, _actionId, audit) => {
      audits.push(audit as unknown as Record<string, unknown>);
    }),
  };
  return { dependencies, batches, audits, finalized, deleted };
}

describe('nexusAgendaCommit', () => {
  it('rejeita usuário não autenticado', () => {
    expect(() => requireCommitAuth({ auth: null })).toThrow('Login necessário');
    expect(() => requireCommitAuth({ auth: {} })).toThrow('Login necessário');
  });

  it('rejeita confirmed false antes de ler ou gravar a proposta', async () => {
    const test = setup();
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: false }, test.dependencies, NOW))
      .rejects.toThrow('confirmação explícita');
    expect(test.dependencies.claimPending).not.toHaveBeenCalled();
  });

  it('rejeita token inexistente', async () => {
    const test = setup({ claim: vi.fn(async () => ({ kind: 'rejected' as const, reason: 'Proposta inexistente.' })) });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'missing', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('inexistente');
  });

  it('rejeita token pertencente a outro usuário', async () => {
    const test = setup({ claim: vi.fn(async () => ({ kind: 'rejected' as const, reason: 'A proposta não pertence ao usuário autenticado.' })) });
    await expect(executeAgendaCommit('user-2', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('não pertence');
  });

  it('rejeita token expirado', async () => {
    const test = setup({ claim: vi.fn(async () => ({ kind: 'rejected' as const, reason: 'A proposta de agenda expirou.' })) });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('expirou');
  });

  it('cria compromisso único com completed false e preserva metadados', async () => {
    const test = setup();
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW);

    expect(result.success).toBe(true);
    expect(result.occurrenceCount).toBe(1);
    expect(test.batches).toHaveLength(1);
    expect(test.batches[0]).toHaveLength(1);
    expect(test.batches[0][0].data).toMatchObject({
      title: 'Reunião com o coordenador',
      time: '17:00',
      endTime: '18:00',
      completed: false,
      location: 'Sala 3',
      participants: ['Ana'],
      notes: 'Levar relatório',
    });
    expect(test.audits[0]).toMatchObject({ status: 'committed', before: null, idsCreated: expect.any(Array) });
  });

  it('cria série recorrente e preserva seriesId e recurrence', async () => {
    const test = setup({
      pending: {
        envelope: pendingEnvelope({
          entities: {
            recurrence: {
              freq: 'weekly',
              byDay: 2,
              until: { expression: 'última terça-feira de novembro de 2026', resolved: '2026-11-24', confidence: 'high' },
            },
          },
        }),
      },
    });
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW);

    expect(result.success).toBe(true);
    expect(result.occurrenceCount).toBe(15);
    expect(result.seriesId).toMatch(/^srv_/);
    expect(test.batches[0][0].data.seriesId).toBe(result.seriesId);
    expect(test.batches[0][0].data.recurrence).toMatchObject({ freq: 'weekly', byDay: 2 });
  });

  it('divide 401 a 800 ocorrências em dois batches de no máximo 400', async () => {
    const test = setup({
      pending: {
        envelope: pendingEnvelope({
          entities: {
            recurrence: {
              freq: 'daily',
              until: { expression: '2028-03-14', resolved: '2028-03-14', confidence: 'high' },
            },
          },
        }),
      },
    });
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW);

    expect(result.occurrenceCount).toBeGreaterThan(400);
    expect(result.occurrenceCount).toBeLessThanOrEqual(MAX_COMMIT_OCCURRENCES);
    expect(test.batches).toHaveLength(2);
    expect(test.batches[0]).toHaveLength(MAX_COMMIT_BATCH_WRITES);
    expect(test.batches[1].length).toBe(result.occurrenceCount - MAX_COMMIT_BATCH_WRITES);
  });

  it('rejeita uma série acima do limite de 800 ocorrências', async () => {
    const test = setup({
      pending: {
        envelope: pendingEnvelope({
          entities: {
            recurrence: {
              freq: 'daily',
              until: { expression: '2030-12-31', resolved: '2030-12-31', confidence: 'high' },
            },
          },
        }),
      },
    });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('limite');
    expect(test.batches).toHaveLength(0);
    expect(test.audits[0]).toMatchObject({ status: 'failed' });
  });

  it('usa IDs determinísticos e retorna o mesmo resultado em retry idempotente', async () => {
    const first = setup();
    const firstResult = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, first.dependencies, NOW);
    const second = setup({
      claim: vi.fn(async () => ({ kind: 'idempotent' as const, result: firstResult })),
    });
    const secondResult = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, second.dependencies, NOW + 1000);

    expect(secondResult.idsCreated).toEqual(firstResult.idsCreated);
    expect(second.batches).toHaveLength(0);
    expect(second.audits).toHaveLength(0);
  });

  it('impede duas confirmações concorrentes quando a segunda claim é rejeitada', async () => {
    let claimed = false;
    const claimPending = vi.fn(async () => {
      if (claimed) return { kind: 'rejected' as const, reason: 'Token já consumido.' };
      claimed = true;
      return { kind: 'claimed' as const, pending: pendingDocument({ status: 'processing' }) };
    });
    const first = setup({ claim: claimPending });
    const second = setup({ claim: claimPending });
    const firstPromise = executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, first.dependencies, NOW);
    const secondPromise = executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, second.dependencies, NOW);
    const outcomes = await Promise.allSettled([firstPromise, secondPromise]);

    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
  });

  it('registra partial e não retorna sucesso falso quando o segundo batch falha', async () => {
    const test = setup({
      failBatchAt: 2,
      pending: {
        envelope: pendingEnvelope({
          entities: {
            recurrence: {
              freq: 'daily',
              until: { expression: '2028-03-14', resolved: '2028-03-14', confidence: 'high' },
            },
          },
        }),
      },
    });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('parcialmente');
    expect(test.batches).toHaveLength(1);
    expect(test.audits[0]).toMatchObject({ status: 'partial', idsCreated: expect.arrayContaining([test.batches[0][0].id]) });
    expect(test.finalized[0]).toMatchObject({ status: 'partial' });
  });

  it('não executa edit nem delete sem alvo gravado', async () => {
    const edit = setup({ pending: { envelope: pendingEnvelope({ intent: 'edit', action: 'edit_commitment' }) } });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, edit.dependencies, NOW))
      .rejects.toThrow('Somente propostas');
    expect(edit.batches).toHaveLength(0);
    expect(edit.dependencies.deleteBatch).not.toHaveBeenCalled();
    expect(edit.audits[0]).toMatchObject({ status: 'failed' });

    const del = setup({ pending: { envelope: deletePendingEnvelope() } });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, del.dependencies, NOW))
      .rejects.toThrow('não possui alvos gravados');
    expect(del.dependencies.deleteBatch).not.toHaveBeenCalled();
    expect(del.audits[0]).toMatchObject({ status: 'failed' });
  });

  it('exclui em lote os alvos gravados na proposta de delete', async () => {
    const targets = [
      { id: 'a1', title: 'Reunião com o coordenador de campo', time: '18:00', dateMs: 0 },
      { id: 'a2', title: 'Reunião com o coordenador de campo', time: '09:00', dateMs: 0 },
    ];
    const test = setup({ pending: { envelope: deletePendingEnvelope(), targets }, existingIds: ['a1', 'a2'] });
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('delete');
    expect(result.idsDeleted).toEqual(['a1', 'a2']);
    expect(result.occurrenceCount).toBe(2);
    expect(test.dependencies.writeBatch).not.toHaveBeenCalled();
    expect(test.deleted).toEqual(['a1', 'a2']);
    expect(test.audits[0]).toMatchObject({
      status: 'committed',
      intent: 'delete',
      idsDeleted: ['a1', 'a2'],
      before: [{ id: 'a1' }, { id: 'a2' }],
      after: null,
    });
    expect(test.finalized[0]).toMatchObject({ status: 'committed' });
  });

  it('exclui apenas os alvos que ainda existem (ignora ausentes)', async () => {
    const targets = [
      { id: 'a1', title: 'Reunião', time: null, dateMs: 0 },
      { id: 'gone', title: 'Reunião', time: null, dateMs: 0 },
    ];
    const test = setup({ pending: { envelope: deletePendingEnvelope(), targets }, existingIds: ['a1'] });
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW);

    expect(result.success).toBe(true);
    expect(result.idsDeleted).toEqual(['a1']);
    expect(result.occurrenceCount).toBe(1);
    expect(test.deleted).toEqual(['a1']);
  });

  it('falha quando nenhum alvo da exclusão ainda existe', async () => {
    const test = setup({
      pending: { envelope: deletePendingEnvelope(), targets: [{ id: 'gone', title: 'Reunião', dateMs: 0 }] },
      existingIds: [],
    });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('Nenhum dos compromissos alvo ainda existe');
    expect(test.dependencies.deleteBatch).not.toHaveBeenCalled();
    expect(test.audits[0]).toMatchObject({ status: 'failed' });
  });

  it('registra partial quando um batch de exclusão falha', async () => {
    const ids = Array.from({ length: 401 }, (_, i) => `id-${i}`);
    const targets = ids.map((id) => ({ id, title: 'Reunião', dateMs: 0 }));
    const test = setup({ pending: { envelope: deletePendingEnvelope(), targets }, existingIds: ids, failBatchAt: 2 });
    await expect(executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW))
      .rejects.toThrow('parcialmente');
    expect(test.deleted).toHaveLength(400);
    expect(test.audits[0]).toMatchObject({ status: 'partial', idsDeleted: expect.arrayContaining(test.deleted) });
    expect(test.finalized[0]).toMatchObject({ status: 'partial' });
  });

  it('retorna o mesmo resultado em retry idempotente de delete', async () => {
    const targets = [{ id: 'a1', title: 'Reunião', dateMs: 0 }];
    const first = setup({ pending: { envelope: deletePendingEnvelope(), targets }, existingIds: ['a1'] });
    const firstResult = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, first.dependencies, NOW);
    const second = setup({ claim: vi.fn(async () => ({ kind: 'idempotent' as const, result: firstResult })) });
    const secondResult = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, second.dependencies, NOW + 1000);

    expect(secondResult.idsDeleted).toEqual(firstResult.idsDeleted);
    expect(second.dependencies.deleteBatch).not.toHaveBeenCalled();
    expect(second.audits).toHaveLength(0);
  });

  it('grava alarmAt em cada ocorrência quando alarm é true', async () => {
    const test = setup();
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true, alarm: true }, test.dependencies, NOW);

    expect(result.success).toBe(true);
    const expectedAlarmMs = saoPauloDayRangeMillis(isoToYmd('2026-08-18')).startMs + 17 * 60 * 60000;
    expect(test.batches).toHaveLength(1);
    for (const document of test.batches[0]) {
      expect(document.data.alarmAt).toBeDefined();
      expect((document.data.alarmAt as { toMillis(): number }).toMillis()).toBe(expectedAlarmMs);
    }
  });

  it('não grava alarmAt quando o usuário escolhe apenas anotar', async () => {
    const test = setup();
    const result = await executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true }, test.dependencies, NOW);

    expect(result.success).toBe(true);
    expect(test.batches[0][0].data).not.toHaveProperty('alarmAt');
  });

  it('rejeita alarm quando não é booleano', async () => {
    const test = setup();
    await expect(
      executeAgendaCommit('user-1', { confirmationToken: 'token-1', confirmed: true, alarm: 'yes' as unknown as boolean }, test.dependencies, NOW),
    ).rejects.toThrow('alarm deve ser booleano');
    expect(test.dependencies.claimPending).not.toHaveBeenCalled();
  });
});
