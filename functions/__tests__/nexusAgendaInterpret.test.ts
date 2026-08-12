import { describe, expect, it, vi } from 'vitest';
import {
  orchestrateAgendaInterpret,
  requireAuth,
  type AgendaReader,
  type InterpretDependencies,
  type StoredAgendaCommitment,
} from '../nexusAgendaInterpret';

const NOW = new Date('2026-08-12T15:00:00.000Z');

function envelope(overrides: Record<string, unknown> = {}): string {
  const overrideEntities = overrides.entities as Record<string, unknown> | undefined;
  const { entities: _ignoredEntities, ...topLevelOverrides } = overrides;
  return JSON.stringify({
    intent: 'create',
    action: 'create_commitment',
    entities: {
      title: 'Reunião com o coordenador',
      date: { expression: 'próxima terça-feira', resolved: '2026-08-18', confidence: 'high' },
      startTime: '17:00',
      endTime: '18:00',
      location: null,
      participants: null,
      ...(overrideEntities ?? {}),
    },
    missing: [],
    ambiguous: [],
    assumptions: [],
    ...topLevelOverrides,
  });
}

function setup(raw: string | string[], agendaItems: StoredAgendaCommitment[] = []) {
  const writes: Array<{ uid: string; token: string; document: Record<string, unknown> }> = [];
  const routeRequest = vi.fn().mockImplementation(async () => ({
    content: Array.isArray(raw) ? raw.shift() ?? '' : raw,
    success: true,
  }));
  const agenda: AgendaReader = {
    onDay: vi.fn(async () => agendaItems),
    upcoming: vi.fn(async () => agendaItems),
  };
  const dependencies: InterpretDependencies = {
    router: { routeRequest },
    agenda,
    pending: {
      write: vi.fn(async (uid, token, document) => {
        writes.push({ uid, token, document });
      }),
    },
    now: NOW,
  };
  return { dependencies, routeRequest, agenda, writes };
}

describe('nexusAgendaInterpret', () => {
  it('rejeita usuário não autenticado', () => {
    expect(() => requireAuth({ auth: null })).toThrow('Login necessário');
    expect(() => requireAuth({ auth: {} })).toThrow('Login necessário');
  });

  it('cria proposta de compromisso único sem alterar compromisso real', async () => {
    const test = setup(envelope());
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque a reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.status).toBe('awaiting_confirmation');
      expect(result.recap.occurrenceCount).toBe(1);
      expect(result.recap.firstDate).toBe('2026-08-18');
      expect(result.confirmationToken).toBeTruthy();
      expect(test.writes).toHaveLength(1);
      expect(test.writes[0].uid).toBe('user-1');
      expect(test.writes[0].document.status).toBe('awaiting_confirmation');
      expect(test.writes[0].document.confirmationToken).toBe(result.confirmationToken);
      expect(test.writes[0].document).not.toHaveProperty('commitmentId');
    }
    expect(test.agenda.onDay).toHaveBeenCalledWith('user-1', '2026-08-18');
  });

  it('cria proposta recorrente com 15 ocorrências', async () => {
    const raw = envelope({
      entities: {
        recurrence: {
          freq: 'weekly',
          byDay: 2,
          until: {
            expression: 'última terça-feira de novembro de 2026',
            resolved: '2026-11-24',
            confidence: 'high',
          },
        },
      },
    });
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'todas as terças até novembro' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.recap.occurrenceCount).toBe(15);
      expect(result.recap.firstDate).toBe('2026-08-18');
      expect(result.recap.lastDate).toBe('2026-11-24');
      expect(result.recap.recurrence?.until).toBe('2026-11-24');
    }
    expect(test.writes).toHaveLength(1);
  });

  it('substitui a data sugerida pelo LLM pela resolução do backend', async () => {
    const test = setup(envelope({
      entities: {
        date: { expression: 'próxima terça-feira', resolved: '2030-01-01', confidence: 'high' },
      },
    }));
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'próxima terça' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') expect(result.recap.firstDate).toBe('2026-08-18');
  });

  it('retorna esclarecimento quando faltam campos obrigatórios', async () => {
    const raw = envelope({ entities: { title: undefined } });
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque algo' }, test.dependencies);

    expect(result).toMatchObject({ success: true, outcome: 'clarification', status: 'awaiting_clarification' });
    expect(test.writes).toHaveLength(0);
  });

  it('retorna esclarecimento para data de baixa confiança', async () => {
    const raw = envelope({
      entities: { date: { expression: 'talvez no meio do mês', resolved: '2026-08-15', confidence: 'low' } },
    });
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'no meio do mês' }, test.dependencies);

    expect(result).toMatchObject({ success: true, outcome: 'clarification' });
    expect(test.writes).toHaveLength(0);
  });

  it('retorna esclarecimento para data ambígua não resolvível', async () => {
    const raw = envelope({
      entities: { date: { expression: 'quando der', resolved: '2026-08-18', confidence: 'high' } },
    });
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'quando der' }, test.dependencies);

    expect(result).toMatchObject({ success: true, outcome: 'clarification' });
    expect(test.writes).toHaveLength(0);
  });

  it('faz no máximo uma nova tentativa para JSON inválido da LLM', async () => {
    const test = setup(['não é json', '{ também não é json']);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result).toEqual({ success: false, error: expect.stringContaining('estruturar') });
    expect(test.routeRequest).toHaveBeenCalledTimes(2);
    expect(test.writes).toHaveLength(0);
  });

  it('retorna erro amigável quando a chamada ao roteador falha', async () => {
    const test = setup(envelope());
    test.routeRequest.mockRejectedValueOnce(new Error('timeout'));
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);
    expect(result).toEqual({ success: false, error: expect.stringContaining('indisponível') });
    expect(test.writes).toHaveLength(0);
  });

  it('detecta conflito de horário sem bloquear a criação da proposta', async () => {
    const test = setup(envelope(), [{ id: 'old-1', title: 'Outra reunião', time: '17:00', endTime: '18:00', dateMs: 0 }]);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.warnings).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'conflict', date: '2026-08-18' }),
      ]));
    }
    expect(test.writes).toHaveLength(1);
  });

  it('detecta compromisso duplicado', async () => {
    const test = setup(envelope(), [{ id: 'old-1', title: 'Reunião com o coordenador', time: '17:00', endTime: '18:00', dateMs: 0 }]);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.warnings).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'duplicate', date: '2026-08-18' }),
      ]));
    }
  });

  it('vincula token, uid, status e expiração de dez minutos ao pending', async () => {
    const test = setup(envelope());
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      const pending = test.writes[0];
      expect(pending.token).toBe(result.confirmationToken);
      expect(pending.document).toMatchObject({
        uid: 'user-1',
        nonce: result.confirmationToken,
        confirmationToken: result.confirmationToken,
        status: 'awaiting_confirmation',
        createdAtMs: NOW.getTime(),
        expiresAtMs: NOW.getTime() + 10 * 60 * 1000,
      });
    }
  });

  it('não oferece nenhuma dependência de escrita em compromissos reais', async () => {
    const test = setup(envelope());
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    expect(test.writes).toHaveLength(1);
    expect(test.writes[0].document).not.toHaveProperty('updatedCommitment');
    expect(test.writes[0].document).not.toHaveProperty('deletedCommitment');
  });
});
