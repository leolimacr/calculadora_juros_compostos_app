import { describe, expect, it, vi } from 'vitest';
import {
  orchestrateAgendaInterpret,
  requireAuth,
  type AgendaReader,
  type InterpretDependencies,
  type StoredAgendaCommitment,
} from '../nexusAgendaInterpret';
import { isoToYmd, saoPauloDayRangeMillis } from '../nexus-core/agenda-time';

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

function deleteEnvelope(overrides: Record<string, unknown> = {}): string {
  const overrideEntities = overrides.entities as Record<string, unknown> | undefined;
  const { entities: _ignoredEntities, ...topLevelOverrides } = overrides;
  return JSON.stringify({
    intent: 'delete',
    action: 'delete_commitment',
    entities: {
      title: 'Reunião com o coordenador de campo',
      ...(overrideEntities ?? {}),
    },
    missing: [],
    ambiguous: [],
    assumptions: [],
    ...topLevelOverrides,
  });
}

function setup(raw: string | string[], agendaItems: StoredAgendaCommitment[] = [], searchItems: StoredAgendaCommitment[] = []) {
  const writes: Array<{ uid: string; token: string; document: Record<string, unknown> }> = [];
  const routeRequest = vi.fn().mockImplementation(async () => ({
    content: Array.isArray(raw) ? raw.shift() ?? '' : raw,
    success: true,
  }));
  const agenda: AgendaReader = {
    onDay: vi.fn(async () => agendaItems),
    upcoming: vi.fn(async () => agendaItems),
    searchByTitle: vi.fn(async () => searchItems),
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

  it('interpreta "toda terça até o fim de setembro" e gera as 7 ocorrências sem commit', async () => {
    const raw = envelope({
      entities: {
        title: 'Reunião com o coordenador de campo',
        date: { expression: 'toda terça-feira', resolved: '2026-08-18', confidence: 'high' },
        startTime: '18:00',
        endTime: '19:00',
        recurrence: {
          freq: 'weekly',
          byDay: 2,
          until: { expression: 'até o fim de setembro', resolved: '2026-09-30', confidence: 'high' },
        },
        participants: ['coordenador de campo'],
      },
    });
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret(
      'user-1',
      { prompt: 'Agende uma reunião com o coordenador de campo para toda terça feira 18h até o fim de setembro.' },
      test.dependencies,
    );

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.status).toBe('awaiting_confirmation');
      expect(result.recap.title).toBe('Reunião com o coordenador de campo');
      expect(result.recap.startTime).toBe('18:00');
      expect(result.recap.occurrenceCount).toBe(7);
      expect(result.recap.firstDate).toBe('2026-08-18');
      expect(result.recap.lastDate).toBe('2026-09-29');
      expect(result.recap.recurrence).toMatchObject({ freq: 'weekly', byDay: 2, until: '2026-09-29' });
      expect(result.recap.summary).toContain('7 compromissos');
    }
    expect(test.writes).toHaveLength(1);
    expect(test.writes[0].document.status).toBe('awaiting_confirmation');
  });

  it('recalcula a data final do mês pelo backend mesmo se o LLM errar resolved', async () => {
    const raw = envelope({
      entities: {
        recurrence: {
          freq: 'weekly',
          byDay: 2,
          until: { expression: 'até o fim de setembro', resolved: '2030-01-01', confidence: 'high' },
        },
      },
    });
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'todas as terças até o fim de setembro' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.recap.occurrenceCount).toBe(7);
      expect(result.recap.lastDate).toBe('2026-09-29');
    }
  });

  it('extrai JSON cercado por markdown', async () => {
    const raw = `\`\`\`json\n${envelope()}\n\`\`\``;
    const test = setup(raw);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque a reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') expect(result.recap.firstDate).toBe('2026-08-18');
    expect(test.routeRequest).toHaveBeenCalledTimes(1);
  });

  it('passa os erros de schema ao modelo na nova tentativa', async () => {
    const test = setup(['não é json', envelope()]);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result.success).toBe(true);
    expect(test.routeRequest).toHaveBeenCalledTimes(2);
    const retryMessages = test.routeRequest.mock.calls[1][0] as Array<{ role: string; content: string }>;
    expect(retryMessages[retryMessages.length - 1].content).toContain('Envelope não é um JSON válido.');
  });

  it('retorna indisponível quando o roteador entra em modo contingência', async () => {
    const test = setup(envelope());
    test.routeRequest.mockImplementation(async () => ({ content: 'Investidor, tente novamente.', success: true, isContingency: true }));
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'marque reunião' }, test.dependencies);

    expect(result).toEqual({ success: false, error: expect.stringContaining('indisponível') });
    expect(test.writes).toHaveLength(0);
  });

  it('cria proposta de exclusão em massa por título sem exigir data', async () => {
    const searchItems: StoredAgendaCommitment[] = [
      { id: 'a1', title: 'Reunião com o coordenador de campo', time: '18:00', dateMs: 0 },
      { id: 'a2', title: 'Reunião com o coordenador de campo', time: '09:00', dateMs: 0 },
    ];
    const test = setup(deleteEnvelope(), [], searchItems);
    const result = await orchestrateAgendaInterpret(
      'user-1',
      { prompt: 'Preciso excluir todos os compromissos com o nome "Reunião com o coordenador de campo"' },
      test.dependencies,
    );

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.status).toBe('awaiting_confirmation');
      expect(result.recap.intent).toBe('delete');
      expect(result.recap.matchCount).toBe(2);
      expect(result.recap.affectedItems).toHaveLength(2);
      expect(result.recap.affectedItems?.[0]).toMatchObject({ id: 'a1', title: 'Reunião com o coordenador de campo', time: '18:00', endTime: null });
      expect(result.recap.summary).toContain('Encontrei 2 compromissos');
      expect(result.recap.summary).toContain('excluí-los permanentemente');
    }
    expect(test.agenda.searchByTitle).toHaveBeenCalledWith('user-1', 'Reunião com o coordenador de campo', { maxResults: 5000 });
    expect(test.agenda.onDay).not.toHaveBeenCalled();
    expect(test.writes).toHaveLength(1);
    expect(test.writes[0].document.status).toBe('awaiting_confirmation');
    expect(test.writes[0].document.targets).toHaveLength(2);
    expect(test.writes[0].document.targets[0].id).toBe('a1');
  });

  it('retorna esclarecimento quando a exclusão por título não encontra itens', async () => {
    const test = setup(deleteEnvelope());
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'excluir compromissos inexistentes' }, test.dependencies);

    expect(result).toMatchObject({ success: true, outcome: 'clarification', status: 'awaiting_clarification' });
    expect(test.writes).toHaveLength(0);
  });

  it('restringe a exclusão ao dia quando título e data estão presentes', async () => {
    const range = saoPauloDayRangeMillis(isoToYmd('2026-08-18'));
    const searchItems: StoredAgendaCommitment[] = [
      { id: 'a1', title: 'Reunião', time: '10:00', dateMs: range.startMs + 60 * 60000 },
      { id: 'a2', title: 'Reunião', time: '10:00', dateMs: range.startMs + 3 * 86400000 },
    ];
    const raw = deleteEnvelope({
      entities: { title: 'Reunião', date: { expression: 'próxima terça-feira', resolved: '2026-08-18', confidence: 'high' } },
    });
    const test = setup(raw, [], searchItems);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'excluir a reunião de terça' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.recap.matchCount).toBe(1);
      expect(result.recap.affectedItems?.[0].id).toBe('a1');
    }
  });

  it('prioriza entities.filter de título para a exclusão em massa', async () => {
    const searchItems: StoredAgendaCommitment[] = [{ id: 'f1', title: 'Check-in semanal', time: null, dateMs: 0 }];
    const raw = deleteEnvelope({ entities: { filter: { field: 'title', value: 'Check-in semanal' } } });
    const test = setup(raw, [], searchItems);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'apagar todos os check-ins semanais' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') {
      expect(result.recap.title).toBe('Check-in semanal');
      expect(result.recap.matchCount).toBe(1);
    }
    expect(test.agenda.searchByTitle).toHaveBeenCalledWith('user-1', 'Check-in semanal', { maxResults: 5000 });
  });

  it('exclui por data usando onDay quando não há título', async () => {
    const raw = deleteEnvelope({
      entities: { title: undefined, date: { expression: 'próxima terça-feira', resolved: '2026-08-18', confidence: 'high' } },
    });
    const test = setup(raw, [{ id: 'd1', title: 'Qualquer', time: '12:00', dateMs: 0 }]);
    const result = await orchestrateAgendaInterpret('user-1', { prompt: 'excluir tudo da terça' }, test.dependencies);

    expect(result.success).toBe(true);
    if (result.success && result.outcome === 'proposal') expect(result.recap.matchCount).toBe(1);
    expect(test.agenda.onDay).toHaveBeenCalledWith('user-1', '2026-08-18');
    expect(test.agenda.searchByTitle).not.toHaveBeenCalled();
  });
});
