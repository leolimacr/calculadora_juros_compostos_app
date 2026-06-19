import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OnboardingOverlay from '../OnboardingOverlay';

describe('OnboardingOverlay', () => {
  const defaultProps = {
    step: 0,
    onNext: vi.fn(),
    onSkip: vi.fn(),
    onFinish: vi.fn(),
    onLaunch: vi.fn(),
  };

  it('não renderiza nada quando step === 0', () => {
    const { container } = render(<OnboardingOverlay {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza passo 1 com título e botão Lançar agora', () => {
    render(<OnboardingOverlay {...defaultProps} step={1} />);
    expect(screen.getByText('Seu ponto de partida')).toBeDefined();
    expect(screen.getByText('Lançar agora')).toBeDefined();
  });

  it('renderiza passo 2 com título e botão Entendi', () => {
    render(<OnboardingOverlay {...defaultProps} step={2} />);
    expect(screen.getByText('Primeiro movimento registrado')).toBeDefined();
    expect(screen.getByText('Entendi')).toBeDefined();
  });

  it('renderiza passo 3 com título e botão Concluir', () => {
    render(<OnboardingOverlay {...defaultProps} step={3} />);
    expect(screen.getByText('Sua evolução na Central')).toBeDefined();
    expect(screen.getByText('Concluir')).toBeDefined();
  });

  it('botão Pular chama onSkip', () => {
    const onSkip = vi.fn();
    render(<OnboardingOverlay {...defaultProps} step={1} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('Pular introdução'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('botão de ação chama a função correta no passo 1', () => {
    const onLaunch = vi.fn();
    render(<OnboardingOverlay {...defaultProps} step={1} onLaunch={onLaunch} />);
    fireEvent.click(screen.getByText('Lançar agora'));
    expect(onLaunch).toHaveBeenCalled();
  });

  it('botão de ação chama a função correta no passo 2', () => {
    const onNext = vi.fn();
    render(<OnboardingOverlay {...defaultProps} step={2} onNext={onNext} />);
    fireEvent.click(screen.getByText('Entendi'));
    expect(onNext).toHaveBeenCalled();
  });

  it('botão de ação chama a função correta no passo 3', () => {
    const onFinish = vi.fn();
    render(<OnboardingOverlay {...defaultProps} step={3} onFinish={onFinish} />);
    fireEvent.click(screen.getByText('Concluir'));
    expect(onFinish).toHaveBeenCalled();
  });
});
