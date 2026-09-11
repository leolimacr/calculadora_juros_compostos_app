import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileBottomNav from '../MobileBottomNav';

const navMocks = vi.hoisted(() => ({
  handleNavigate: vi.fn(),
  currentTool: 'central',
}));

vi.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    handleNavigate: navMocks.handleNavigate,
    currentTool: navMocks.currentTool,
  }),
}));

describe('MobileBottomNav (Etapa B3 — Barra de Navegação Inferior)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navMocks.currentTool = 'central';
  });

  it('renderiza os 5 itens de navegação e o botão central de Lançar', () => {
    render(<MobileBottomNav onOpenMore={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.getByText('Central')).toBeInTheDocument();
    expect(screen.getByText('Controla')).toBeInTheDocument();
    expect(screen.getByText('Lançar')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Mais')).toBeInTheDocument();
  });

  it('navega para Central, Controla, Agenda e Explorar ao clicar', () => {
    render(<MobileBottomNav onOpenMore={vi.fn()} onAdd={vi.fn()} />);

    fireEvent.click(screen.getByText('Central'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('central');

    fireEvent.click(screen.getByText('Controla'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('manager');

    fireEvent.click(screen.getByText('Agenda'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('agenda');

    fireEvent.click(screen.getByText('Explorar'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('explorar');
  });

  it('aciona onAdd ao clicar em Lançar', () => {
    const onAdd = vi.fn();
    render(<MobileBottomNav onOpenMore={vi.fn()} onAdd={onAdd} />);

    fireEvent.click(screen.getByText('Lançar'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('aciona onOpenMore ao clicar em Mais', () => {
    const onOpenMore = vi.fn();
    render(<MobileBottomNav onOpenMore={onOpenMore} onAdd={vi.fn()} />);

    fireEvent.click(screen.getByText('Mais'));
    expect(onOpenMore).toHaveBeenCalledTimes(1);
  });
});
