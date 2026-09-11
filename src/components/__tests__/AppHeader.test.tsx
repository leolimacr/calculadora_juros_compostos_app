import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';
import AppHeader from '../AppHeader';

const navMocks = vi.hoisted(() => ({
  handleNavigate: vi.fn(),
  currentTool: 'central',
}));

const routerMocks = vi.hoisted(() => ({
  pathname: '/app/central',
  navigate: vi.fn(),
}));

vi.mock('../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    currentTool: navMocks.currentTool,
    handleNavigate: navMocks.handleNavigate,
  }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: routerMocks.pathname }),
  useNavigate: () => routerMocks.navigate,
}));

vi.mock('../../hooks/useEntitlement', () => ({
  useEntitlement: () => ({ effectiveTier: 'free' }),
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));

const baseProps = {
  isAuthenticated: true,
  userMeta: null,
  userDisplayName: 'Teste',
  isPrivacyMode: false,
  onTogglePrivacy: vi.fn(),
  onLogout: vi.fn(),
  onOpenMobileMenu: vi.fn(),
  isNotificationsOpen: false,
  onOpenNotifications: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  routerMocks.pathname = '/app/central';
  navMocks.currentTool = 'central';
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
});

describe('AppHeader (Etapa 6 — E6-05 agenda é rota principal)', () => {
  it('exibe a marca (sem Voltar) em /app/agenda', () => {
    routerMocks.pathname = '/app/agenda';
    navMocks.currentTool = 'agenda';
    render(<AppHeader {...baseProps} />);
    expect(screen.queryByText('Voltar')).not.toBeInTheDocument();
    expect(screen.getByText('Finanças Pro')).toBeInTheDocument();
  });

  it('exibe Voltar fora das rotas principais', () => {
    routerMocks.pathname = '/app/minhas-dividas';
    navMocks.currentTool = 'minhas-dividas';
    render(<AppHeader {...baseProps} />);
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });
});

describe('AppHeader (Etapa 6 — E6-09 drawer acessível no native)', () => {
  it('botão Menu abre o drawer na web', () => {
    const onOpenMobileMenu = vi.fn();
    render(<AppHeader {...baseProps} onOpenMobileMenu={onOpenMobileMenu} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(onOpenMobileMenu).toHaveBeenCalledTimes(1);
  });

  it('botão Menu também existe em ambiente nativo', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const onOpenMobileMenu = vi.fn();
    render(<AppHeader {...baseProps} onOpenMobileMenu={onOpenMobileMenu} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(onOpenMobileMenu).toHaveBeenCalledTimes(1);
  });
});
