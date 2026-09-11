import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const callableMock = vi.fn();

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => callableMock),
}));

vi.mock('../../firebase', () => ({ functions: {} }));

import { useAiAgent } from '../useAiAgent';

describe('useAiAgent - erros amigáveis (N3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia resource-exhausted para mensagem de cota', async () => {
    callableMock.mockRejectedValue(new Error('resource-exhausted: quota diária atingida'));
    const { result } = renderHook(() => useAiAgent());

    let response: unknown;
    await act(async () => {
      response = await result.current.sendToNexus('oi', {}, 'Lia', [], true);
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe('Limite de mensagens do plano atingido.');
    expect(result.current.isLoading).toBe(false);
  });

  it('mensagem genérica para outros erros', async () => {
    callableMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAiAgent());

    await act(async () => {
      await result.current.sendToNexus('oi', {}, 'Lia', [], true);
    });

    expect(result.current.error).toBe('O Nexus está processando muitos dados. Tente novamente.');
  });

  it('retorna answer/actions em sucesso', async () => {
    callableMock.mockResolvedValue({
      data: { success: true, answer: 'ok', context: { actions: [], metadata: { hasEmergencyReserve: false, userPlan: 'free' } } },
    });
    const { result } = renderHook(() => useAiAgent());
    const box: { current: { answer: string } | null } = { current: null };
    await act(async () => {
      box.current = await result.current.sendToNexus('oi', {}, 'Lia', [], true);
    });

    expect(box.current?.answer).toBe('ok');
    expect(result.current.error).toBeNull();
  });
});
