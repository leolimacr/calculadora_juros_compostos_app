import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNexus = vi.hoisted(() => ({
  interpret: vi.fn(),
  commit: vi.fn(),
  undo: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
  isLoading: false,
  stage: 'idle',
  progressMessage: null,
  proposal: null,
  missing: [],
  ambiguous: [],
  assumptions: [],
  commitResult: null,
  error: null,
  canUndo: false,
  undoContract: null,
}));

vi.mock('../../../hooks/useAgendaNexus', () => ({
  useAgendaNexus: () => mockNexus,
}));

import AgendaNexusAssistant from '../AgendaNexusAssistant';

const proposal = {
  intent: 'create',
  action: 'create_commitment',
  title: 'Reunião com o coordenador',
  firstDate: '2026-08-18',
  lastDate: '2026-11-24',
  startTime: '17:00',
  endTime: '18:00',
  occurrenceCount: 15,
  recurrence: { freq: 'weekly' },
  location: 'Sala 3',
  participants: ['Ana'],
  notes: 'Levar relatório',
  summary: 'Criar reunião recorrente.',
};

function configure(overrides: Record<string, unknown> = {}) {
  Object.assign(mockNexus, {
    interpret: vi.fn(),
    commit: vi.fn(),
    undo: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    isLoading: false,
    stage: 'idle',
    progressMessage: null,
    proposal: null,
    missing: [],
    ambiguous: [],
    assumptions: [],
    commitResult: null,
    error: null,
    canUndo: false,
    undoContract: null,
    ...overrides,
  });
}

describe('AgendaNexusAssistant', () => {
  beforeEach(() => {
    cleanup();
    configure();
  });

  it('renderiza campo de comando e botão enviar com labels acessíveis', () => {
    render(<AgendaNexusAssistant />);
    expect(screen.getByRole('heading', { name: 'Nexus na Agenda' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Comando para o Nexus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('envia comando ao pressionar o botão', () => {
    configure({ interpret: vi.fn() });
    render(<AgendaNexusAssistant />);
    const input = screen.getByRole('textbox', { name: 'Comando para o Nexus' });
    fireEvent.change(input, { target: { value: 'marque uma reunião' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));
    expect(mockNexus.interpret).toHaveBeenCalledWith({ prompt: 'marque uma reunião' });
  });

  it('exibe progresso e desabilita envio durante interpretação', () => {
    configure({ isLoading: true, stage: 'resolving_dates', progressMessage: 'Estruturando datas e recorrência…' });
    render(<AgendaNexusAssistant />);
    expect(screen.getByRole('status')).toHaveTextContent('Estruturando datas e recorrência');
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled();
  });

  it('exibe proposta estruturada e metadados', () => {
    configure({ stage: 'done', proposal });
    render(<AgendaNexusAssistant />);
    expect(screen.getByRole('heading', { name: 'Revise antes de confirmar' })).toBeInTheDocument();
    expect(screen.getByText('Reunião com o coordenador')).toBeInTheDocument();
    expect(screen.getByText('18/08/2026')).toBeInTheDocument();
    expect(screen.getByText('24/11/2026')).toBeInTheDocument();
    expect(screen.getByText('17:00 às 18:00')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Sala 3')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Levar relatório')).toBeInTheDocument();
  });

  it('exibe campos ausentes, ambiguidades, assumptions e alertas', () => {
    configure({
      stage: 'clarify',
      proposal: { ...proposal, summary: undefined },
      missing: ['local'],
      ambiguous: ['Qual terça-feira?'],
      assumptions: [{ note: 'Fuso de São Paulo' }],
    });
    render(<AgendaNexusAssistant />);
    expect(screen.getByText(/local/)).toBeInTheDocument();
    expect(screen.getByText(/Qual terça-feira/)).toBeInTheDocument();

    cleanup();
    configure({
      stage: 'done',
      proposal: { ...proposal, warnings: [{ type: 'conflict', message: 'Há conflito de horário.' }] },
      assumptions: [{ note: 'Fuso de São Paulo' }],
    });
    render(<AgendaNexusAssistant />);
    expect(screen.getByText(/Fuso de São Paulo/)).toBeInTheDocument();
    expect(screen.getByText(/Há conflito de horário/)).toBeInTheDocument();
  });

  it('confirma somente proposta válida e usa callback do hook', () => {
    configure({ stage: 'done', proposal });
    render(<AgendaNexusAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /confirmar criação/i }));
    expect(mockNexus.commit).toHaveBeenCalledTimes(1);
  });

  it('não mostra confirmar durante committing e previne confirmação duplicada', () => {
    configure({ stage: 'committing', isLoading: true, proposal });
    render(<AgendaNexusAssistant />);
    expect(screen.queryByRole('button', { name: /confirmar criação/i })).not.toBeInTheDocument();

    configure({ stage: 'done', proposal });
    render(<AgendaNexusAssistant />);
    const confirm = screen.getByRole('button', { name: /confirmar criação/i });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(mockNexus.commit).toHaveBeenCalledTimes(1);
  });

  it('cancela e solicita correção sem confirmar', () => {
    configure({ stage: 'done', proposal });
    render(<AgendaNexusAssistant />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockNexus.cancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Corrigir' }));
    expect(mockNexus.cancel).toHaveBeenCalledTimes(2);
  });

  it('fecha pelo controle do painel e notifica o container', () => {
    const onClose = vi.fn();
    configure({ stage: 'done', proposal });
    render(<AgendaNexusAssistant onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar Nexus na Agenda' }));
    expect(mockNexus.reset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exibe success e permite desfazer somente quando canUndo', () => {
    configure({ stage: 'success', proposal, canUndo: true });
    render(<AgendaNexusAssistant />);
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(mockNexus.undo).toHaveBeenCalledTimes(1);

    cleanup();
    configure({ stage: 'success', proposal, canUndo: false });
    render(<AgendaNexusAssistant />);
    expect(screen.queryByRole('button', { name: 'Desfazer' })).not.toBeInTheDocument();
  });

  it('notifica o container após success e undo', () => {
    const onCommitted = vi.fn();
    const onUndone = vi.fn();
    configure({ stage: 'done', proposal, canUndo: false });
    const { rerender } = render(<AgendaNexusAssistant onCommitted={onCommitted} onUndone={onUndone} />);
    configure({ stage: 'success', proposal, canUndo: true });
    rerender(<AgendaNexusAssistant onCommitted={onCommitted} onUndone={onUndone} />);
    expect(onCommitted).toHaveBeenCalledTimes(1);
    configure({ stage: 'undone', proposal, canUndo: false });
    rerender(<AgendaNexusAssistant onCommitted={onCommitted} onUndone={onUndone} />);
    expect(onUndone).toHaveBeenCalledTimes(1);
  });

  it('diferencia partial e error', () => {
    configure({ stage: 'partial', error: 'Reconciliação necessária.' });
    render(<AgendaNexusAssistant />);
    expect(screen.getByRole('alert')).toHaveTextContent('Operação parcialmente concluída');
    expect(screen.getByRole('alert')).toHaveTextContent('Reconciliação necessária');

    cleanup();
    configure({ stage: 'error', error: 'Falha de rede.' });
    render(<AgendaNexusAssistant />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede');
  });

  it('não oferece ações de editar ou excluir', () => {
    configure({ stage: 'done', proposal });
    render(<AgendaNexusAssistant />);
    expect(screen.queryByRole('button', { name: /editar|excluir/i })).not.toBeInTheDocument();
  });

  it('não oferece confirmação para propostas que não sejam create', () => {
    configure({
      stage: 'done',
      proposal: { ...proposal, intent: 'edit', action: 'edit_commitment' },
    });
    render(<AgendaNexusAssistant />);
    expect(screen.queryByRole('button', { name: /confirmar criação/i })).not.toBeInTheDocument();
  });

  it('permite navegação por teclado no formulário', () => {
    render(<AgendaNexusAssistant />);
    const input = screen.getByRole('textbox', { name: 'Comando para o Nexus' });
    input.focus();
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(input);
  });
});
