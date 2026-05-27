import React, { useMemo } from 'react';
import type { Transaction } from '../../types';
import { CheckCircle, Sun, Activity } from 'lucide-react';

interface DailyStatusProps {
  lancamentos: Transaction[];
}

const DailyStatus: React.FC<DailyStatusProps> = ({ lancamentos }) => {
  const today = useMemo(() => new Date().toDateString(), []);

  const todayTransactions = useMemo(() => {
    return lancamentos.filter(t => {
      const transactionDate = new Date(t.date).toDateString();
      return transactionDate === today;
    });
  }, [lancamentos, today]);

  const hasTransactionsToday = todayTransactions.length > 0;
  const transactionCount = todayTransactions.length;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white shadow-sm ${
            hasTransactionsToday ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'
          }`}>
            {hasTransactionsToday ? <CheckCircle size={18} /> : <Sun size={18} />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">
              {hasTransactionsToday
                ? `${transactionCount} lançamento${transactionCount > 1 ? 's' : ''} hoje`
                : 'Nenhum lançamento hoje'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
              {hasTransactionsToday ? 'Você já lançou hoje' : 'Mantenha o ritmo'}
            </span>
          </div>
        </div>
        {/* Optional: Add a subtle activity indicator if no transactions */}
        {!hasTransactionsToday && (
          <Activity size={18} className="text-amber-400 opacity-70" />
        )}
      </div>
    </div>
  );
};

export default DailyStatus;
