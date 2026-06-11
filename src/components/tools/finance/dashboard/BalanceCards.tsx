import React from 'react';

interface BalanceCardsProps {
  isPrivacyMode: boolean;
  stats: {
    balance: number;
    income: number;
    expenses: number;
  };
  totalPendingBills: number;
  projectedBalance: number;
}

const BalanceCards: React.FC<BalanceCardsProps> = ({
  isPrivacyMode,
  stats,
  totalPendingBills,
  projectedBalance,
}) => {
  return (
    <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col">
        <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">
          Saldo Disponível
        </p>
        <h2 className={`text-2xl font-black tracking-tight ${stats.balance >= 0 ? 'text-text-primary' : 'text-status-danger'}`}>
          {isPrivacyMode ? '••••••' : `R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        </h2>
        {totalPendingBills > 0 && !isPrivacyMode && (
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight mt-1">
            Projeção: <span className={projectedBalance >= 0 ? 'text-brand-primary' : 'text-status-danger'}>
              R$ {projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span> com pendentes
          </p>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">
            Entradas
          </p>
          <p className="text-lg font-black text-brand-primary">
            {isPrivacyMode ? '••••' : `R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">
            Saídas
          </p>
          <p className="text-lg font-black text-red-600">
            {isPrivacyMode ? '••••' : `R$ ${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCards;
