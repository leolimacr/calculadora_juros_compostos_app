import React, { memo, useMemo } from 'react';
import { ChevronUp } from 'lucide-react';
import TransactionHistory from '../TransactionHistory';

interface TransactionListProps {
  transactions: any[];
  visibleCount: number;
  setVisibleCount: (n: number) => void;
  showTransactions: boolean;
  setShowTransactions: (v: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (t: any) => void;
  isPrivacyMode: boolean;
  isStale: boolean;
  invoiceLookup?: Map<string, { transacoes: Array<{ id: string; description: string; amount: number; date: string }>; total: number }>;
  periodLabel?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  visibleCount,
  setVisibleCount,
  showTransactions,
  setShowTransactions,
  onDelete,
  onEdit,
  isPrivacyMode,
  isStale,
  invoiceLookup,
  periodLabel,
}) => {
  // Income computed from the SAME filtered list as expenses (not from external stats)
  const periodIncome = useMemo(
    () => transactions.reduce((sum, t) => t.type === 'income' ? sum + (Number(t.amount) || 0) : sum, 0),
    [transactions],
  );
  const expenseTransactions = useMemo(
    () => transactions.filter(t => t.type === 'expense' && !t.isBillPayment && !t.isVirtual),
    [transactions],
  );
  const expenseCount = expenseTransactions.length;
  const expenseSum = expenseTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Rounded to 2 decimal places to avoid float precision artifacts
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {showTransactions ? (
        <>
          <TransactionHistory
            transactions={transactions.slice(0, visibleCount)}
            onDelete={onDelete}
            onEdit={onEdit}
            isPrivacyMode={isPrivacyMode}
            isDisabled={isStale}
            invoiceLookup={invoiceLookup}
          />

          {periodIncome !== undefined && transactions.length > 0 && (
            <div className="flex flex-col gap-1 bg-surface-primary p-4 rounded-4xl border border-surface-elevated mt-4">
              <div className="flex items-start justify-between gap-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-status-success/80">
                    Entradas
                  </span>
                  <span className="text-sm font-black text-status-success tabular-nums">
                    R$ {fmt(periodIncome)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-action-dangerDark">
                      Saídas
                    </span>
                    <span className="text-base font-black text-action-dangerDark tabular-nums">
                      R$ {fmt(expenseSum)}
                    </span>
                  </div>
                  {expenseCount > 0 && (
                    <span className="text-[9px] font-bold text-text-muted/70 tabular-nums">
                      {expenseCount} lançamento{expenseCount !== 1 ? 's' : ''} de despesas
                    </span>
                  )}
                  <span className="text-[9px] font-medium text-text-muted/70 leading-relaxed text-right">
                    Todas as compras que você fez neste período, independentemente de terem sido à vista ou à prazo.
                  </span>
                  <span className="text-[9px] font-bold text-text-muted/50 text-right">
                    Faturas pagas não entram no total.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4">
            {transactions.length > visibleCount && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount(visibleCount + 5)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  + 5 Lançamentos
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(transactions.length)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Mostrar Todos
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowTransactions(false);
                setVisibleCount(10);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary"
            >
              Recolher lançamentos <ChevronUp size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="bg-surface-primary border border-surface-elevated rounded-4xl px-6 py-8 shadow-soft">
          <p className="text-text-muted text-xxs font-bold uppercase tracking-ultra-wide">
            Lançamentos ocultos
          </p>
          <p className="text-xxs text-text-secondary mt-2">
            Use o botão acima para mostrar novamente.
          </p>
        </div>
      )}
    </>
  );
};

export default memo(TransactionList);
