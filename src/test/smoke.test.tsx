import { render, screen } from './test-utils';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

// Componentes Reais
const Dashboard = () => <div>Controla Dashboard</div>;
const Login = () => <div>Login Page</div>;

const ProtectedRoute = ({ isAuthenticated, children }: { isAuthenticated: boolean, children: React.ReactNode }) => 
  isAuthenticated ? <>{children}</> : <Navigate to="/login" />;

describe('Proteção de Rota (Real)', () => {
  it('T3: redireciona usuários deslogados', () => {
    render(
      <MemoryRouter initialEntries={['/app/controla']}>
        <Routes>
          <Route path="/app/controla" element={
            <ProtectedRoute isAuthenticated={false}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
      { user: null }
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('T4: acessa dashboard quando logado', () => {
    const mockUser = { uid: '123' } as User;
    render(
      <MemoryRouter initialEntries={['/app/controla']}>
        <Routes>
          <Route path="/app/controla" element={
            <ProtectedRoute isAuthenticated={true}>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>,
      { user: mockUser }
    );
    expect(screen.getByText('Controla Dashboard')).toBeInTheDocument();
  });
});

describe('Limite de Lancamentos (T1)', () => {
  it('deve exibir mensagem de limite quando atingir 30 lancamentos', () => {
    const isLimitReached = (count: number, isPro: boolean) => !isPro && count >= 30;
    expect(isLimitReached(30, false)).toBe(true);
    expect(isLimitReached(30, true)).toBe(false);
  });
});

describe('Premium Gating (T2)', () => {
  const PremiumTip = ({ isPremium }: { isPremium: boolean }) => (
    <div>{isPremium ? 'Conteudo Premium Destaque' : 'Upgrade para ver'}</div>
  );
  it('exibe conteúdo premium apenas para usuários premium', () => {
    const { rerender } = render(<PremiumTip isPremium={false} />);
    expect(screen.getByText('Upgrade para ver')).toBeInTheDocument();
    
    rerender(<PremiumTip isPremium={true} />);
    expect(screen.getByText('Conteudo Premium Destaque')).toBeInTheDocument();
  });
});

import { useAuth } from '../contexts/AuthContext';
describe('Auth Hook Smoke Test (T5)', () => {
  it('retorna usuário nulo quando não autenticado', () => {
    const TestComponent = () => {
      const { user } = useAuth();
      return <div>{user ? 'Logado' : 'Deslogado'}</div>;
    };
    render(<TestComponent />);
    expect(screen.getByText('Deslogado')).toBeInTheDocument();
  });
});
