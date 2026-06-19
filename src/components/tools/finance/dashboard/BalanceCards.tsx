import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DISPONIBILIDADE_REAL } from '../../../../theme/fpiVoiceGuide';

interface BalanceCardsProps {
  isPrivacyMode: boolean;
  commandMode: boolean;
  stats: {
    balance: number;
    income: number;
    expenses: number;
  };
  totalPendingBills: number;
  projectedBalance: number;
  freeBalance: number;
  freedomDeficit?: number;
  protectionBuffer?: number;
  leewayDays?: number;
}

const BalanceCards: React.FC<BalanceCardsProps> = ({
  isPrivacyMode,
  commandMode,
  stats,
  totalPendingBills,
  projectedBalance,
}) => {
  const [showComposition, setShowComposition] = useState(false);

  const heroValue = stats.balance;
  const isNegative = heroValue < 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col w-full">
        <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">
          {DISPONIBILIDADE_REAL.saldoMesLabel}
        </p>
        <h2 className={`text-2xl font-black tracking-tight ${isNegative ? 'text-status-danger' : 'text-text-primary'}`}>
          {isPrivacyMode ? '••••••' : fmt(heroValue)}
        </h2>

        <p className="text-[10px] text-text-muted font-medium mt-0.5">
          {DISPONIBILIDADE_REAL.saldoMesHelp}
        </p>

        {/* Expandable composition */}
        <button
          type="button"
          onClick={() => setShowComposition(!showComposition)}
          className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-text-secondary transition-colors mt-1 py-1 min-h-[36px]"
          aria-expanded={showComposition}
        >
          <span>{showComposition ? 'Recolher' : 'Ver composição'}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${showComposition ? 'rotate-180' : ''}`}
          />
        </button>

        {showComposition && (
          <div className="mt-2 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Receitas do mês</span>
              <span className="font-black text-brand-primary">{isPrivacyMode ? '••••' : fmt(stats.income)}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">− Despesas do mês</span>
              <span className="font-black text-red-600">−{isPrivacyMode ? '••••' : fmt(stats.expenses)}</span>
            </div>
            <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[12px] font-black text-slate-900">
              <span>= Saldo do mês</span>
              <span>{isPrivacyMode ? '••••' : fmt(heroValue)}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium mt-1">
              Compras no cartão só entram quando a fatura é paga.
            </p>
          </div>
        )}

        {!commandMode && totalPendingBills > 0 && !isPrivacyMode && (
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight mt-2">
            O que sobra após as contas:{' '}
            <span className={projectedBalance >= 0 ? 'text-brand-primary' : 'text-status-danger'}>
              {fmt(projectedBalance)}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">Entradas</p>
          <p className="text-lg font-black text-brand-primary">
            {isPrivacyMode ? '••••' : fmt(stats.income)}
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">Saídas</p>
          <p className="text-lg font-black text-red-600">
            {isPrivacyMode ? '••••' : fmt(stats.expenses)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCards;
