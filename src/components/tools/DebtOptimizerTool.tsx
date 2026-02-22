import React from 'react';
import { ToolGate, PlaceholderTool } from './ToolComponents';

export const DebtOptimizerTool = ({ onNavigate, isAuthenticated }: any) => {
  if (!isAuthenticated) {
    return <ToolGate title="Otimizador de Dívidas" description="Crie um plano de batalha matemático para sair do vermelho o mais rápido possível." onNavigate={onNavigate} />;
  }
  return <PlaceholderTool title="Otimizador de Dívidas" icon="💳" onBack={onNavigate} description="Saia do vermelho rápido." badge="Em Breve" />;
};