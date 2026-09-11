import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppMobileDrawer from '../AppMobileDrawer';

const navMocks = vi.hoisted(() => ({
  handleNavigate: vi.fn(),
}));

const entitlementMocks = vi.hoisted(() => ({
  tier: 'free' as string,
}));

vi.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({ handleNavigate: navMocks.handleNavigate }),
}));

vi.mock('../../hooks/useEntitlement', () => ({
  useEntitlement: () => ({ effectiveTier: entitlementMocks.tier }),
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  isAuthenticated: true,
  userMeta: null,
  userDisplayName: 'Teste',
  onLogout: vi.fn(),
  onOpenCourse: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  entitlementMocks.tier = 'free';
});

describe('AppMobileDrawer (Etapa 6 — E6-01)', () => {
  it('não renderiza nada quando fechado', () => {
    const { container } = render(<AppMobileDrawer {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza aberto com os atalhos principais', () => {
    render(<AppMobileDrawer {...baseProps} />);
    expect(screen.getByText('Menu Principal')).toBeInTheDocument();
    expect(screen.getByText('Controla')).toBeInTheDocument();
    expect(screen.getByText('Minhas Dívidas')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Explorar')).toBeInTheDocument();
  });

  it('navega para o Controla e fecha o drawer', () => {
    const onClose = vi.fn();
    render(<AppMobileDrawer {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Controla'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('manager');
  });

  it('gate visual: sem premium, Minhas Dívidas leva ao pricing', () => {
    render(<AppMobileDrawer {...baseProps} />);
    fireEvent.click(screen.getByText('Minhas Dívidas'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('pricing');
    expect(navMocks.handleNavigate).not.toHaveBeenCalledWith('minhas-dividas');
  });

  it('com premium, Minhas Dívidas navega direto', () => {
    entitlementMocks.tier = 'premium';
    render(<AppMobileDrawer {...baseProps} />);
    fireEvent.click(screen.getByText('Minhas Dívidas'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('minhas-dividas');
  });

  it('sem autenticação, atalhos levam ao login', () => {
    render(<AppMobileDrawer {...baseProps} isAuthenticated={false} />);
    fireEvent.click(screen.getByText('Controla'));
    expect(navMocks.handleNavigate).toHaveBeenCalledWith('login');
  });

  it('logout fecha o drawer e desloga', () => {
    const onClose = vi.fn();
    const onLogout = vi.fn();
    render(<AppMobileDrawer {...baseProps} onClose={onClose} onLogout={onLogout} />);
    fireEvent.click(screen.getByText('Sair da Conta'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
