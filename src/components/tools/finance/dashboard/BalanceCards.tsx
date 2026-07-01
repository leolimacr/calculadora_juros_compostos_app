import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DISPONIBILIDADE_REAL } from '../../../../theme/fpiVoiceGuide';

interface BalanceCardsProps {
  isPrivacyMode: boolean;
  commandMode: boolean;
  hasHistoryAccess: boolean;
  stats: {
    balance: number;
    income: number;
    expenses: number;
    accumulatedBalance: number;
    accumulatedIncome: number;
    accumulatedExpenses: number;
  };
  totalPendingBills: number;
  totalOutstandingCredit: number;
  projectedBalance: number;
  freeBalance: number;
  freedomDeficit?: number;
  protectionBuffer?: number;
  leewayDays?: number;
}

const BalanceCards: React.FC<BalanceCardsProps> = ({
  isPrivacyMode,
  commandMode,
  hasHistoryAccess,
  stats,
  totalPendingBills,
  totalOutstandingCredit,
  projectedBalance,
}) => {
  const [showComposition, setShowComposition] = useState(false);
  const showAllTime = hasHistoryAccess;

  const displayBalance = showAllTime ? stats.accumulatedBalance : stats.balance;
  const isNegative = displayBalance < 0;
  const afterCredit = displayBalance - totalOutstandingCredit;
  const afterCreditNegative = afterCredit < 0;
  const cashExpenses = showAllTime ? stats.accumulatedIncome - stats.accumulatedBalance : Math.max(0, stats.income - stats.balance);

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col w-full">
        <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">
          {DISPONIBILIDADE_REAL.saldoAtualLabel}
        </p>
        <h2 className={`text-2xl font-black tracking-tight ${isNegative ? 'text-status-danger' : 'text-text-primary'}`}>
          {isPrivacyMode ? '••••••' : fmt(displayBalance)}
        </h2>

        <p className="text-[10px] text-text-muted font-medium mt-0.5">
          {showAllTime ? DISPONIBILIDADE_REAL.saldoAtualHelp : 'Saldo do mês atual — resultado de todas as receitas e despesas deste mês.'}
        </p>

        {/* Outstanding credit deduction — imediatamente abaixo do Saldo atual */}
        {totalOutstandingCredit > 0 && (
          <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 p-4 space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-amber-800 font-bold leading-snug">{DISPONIBILIDADE_REAL.saldoAtualCreditCard}</span>
              <span className="font-black text-amber-700 shrink-0">−{isPrivacyMode ? '••••' : fmt(totalOutstandingCredit)}</span>
            </div>
            <div className="border-t border-amber-200 pt-2 flex justify-between text-[12px] font-black">
              <span className="text-amber-900">{DISPONIBILIDADE_REAL.saldoAtualAfterCredit}</span>
              <span className={afterCreditNegative ? 'text-status-danger' : 'text-amber-900'}>
                {isPrivacyMode ? '••••' : fmt(Math.max(0, afterCredit))}
              </span>
            </div>
          </div>
        )}

        {/* Expandable composition — accumulated (only for paid users) */}
        {showAllTime && (
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
        )}

        {showAllTime && showComposition && (
          <div className="mt-2 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Receitas totais</span>
              <span className="font-black text-brand-primary">{isPrivacyMode ? '••••' : fmt(stats.accumulatedIncome)}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">− Despesas (exceto cartão)</span>
              <span className="font-black text-red-600">−{isPrivacyMode ? '••••' : fmt(cashExpenses)}</span>
            </div>
            <div className="border-t border-slate-100 pt-1.5 flex justify-between text-[12px] font-black text-slate-900">
              <span>= Saldo atual</span>
              <span>{isPrivacyMode ? '••••' : fmt(displayBalance)}</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium mt-1">
              Compras no cartão só entram quando a fatura é paga.
            </p>
          </div>
        )}

        {/* Projected remainder after pending bills */}
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
