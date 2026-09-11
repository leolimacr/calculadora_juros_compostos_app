import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobilePublicHome from '../MobilePublicHome';

describe('MobilePublicHome (Etapa B2 — Onboarding Mobile Deslogado)', () => {
  it('renderiza título principal e os 4 pilares da liberdade soberana', () => {
    render(<MobilePublicHome onLogin={vi.fn()} onRegister={vi.fn()} />);

    expect(screen.getByText(/Saiba exatamente quanto/i)).toBeInTheDocument();
    expect(screen.getByText(/sobra de verdade/i)).toBeInTheDocument();
    expect(screen.getByText(/A Arquitetura da Liberdade/i)).toBeInTheDocument();

    // 4 Pilares visíveis
    expect(screen.getByText('Caixa')).toBeInTheDocument();
    expect(screen.getByText('Compromissos')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Evolução')).toBeInTheDocument();
  });

  it('permite alternar entre os pilares para explorar os conceitos', () => {
    render(<MobilePublicHome onLogin={vi.fn()} onRegister={vi.fn()} />);

    // Inicialmente no pilar 1 (Caixa & Rotina)
    expect(screen.getByText('Pilar 01 de 04')).toBeInTheDocument();
    expect(screen.getByText('Caixa & Rotina')).toBeInTheDocument();

    // Clica no pilar 2 (Compromissos)
    fireEvent.click(screen.getByText('Compromissos'));
    expect(screen.getByText('Pilar 02 de 04')).toBeInTheDocument();
    expect(screen.getByText('Contas fixas e faturas programadas')).toBeInTheDocument();

    // Clica no pilar 3 (Base de Proteção)
    fireEvent.click(screen.getByText('Base'));
    expect(screen.getByText('Pilar 03 de 04')).toBeInTheDocument();
    expect(screen.getByText('Base de Proteção')).toBeInTheDocument();

    // Clica no pilar 4 (Evolução)
    fireEvent.click(screen.getByText('Evolução'));
    expect(screen.getByText('Pilar 04 de 04')).toBeInTheDocument();
    expect(screen.getByText('Multiplicação e independência financeira')).toBeInTheDocument();
  });

  it('aciona os callbacks de Login e Criar Conta', () => {
    const onLogin = vi.fn();
    const onRegister = vi.fn();

    render(<MobilePublicHome onLogin={onLogin} onRegister={onRegister} />);

    fireEvent.click(screen.getByText('Criar Conta Gratuita'));
    expect(onRegister).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(/Já tenho conta • Entrar/i));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
