import React, { memo } from 'react';
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
}) => {
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
          />

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
