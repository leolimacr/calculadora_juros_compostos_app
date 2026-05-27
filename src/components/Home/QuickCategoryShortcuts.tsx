import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import type { Transaction } from '../../types';

interface QuickCategoryShortcutsProps {
  transactions: Transaction[];
  onQuickAdd: (category: string, type: 'income' | 'expense') => void;
}

function parseTransactionDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const QuickCategoryShortcuts: React.FC<QuickCategoryShortcutsProps> = ({ transactions, onQuickAdd }) => {
  const topCategories = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const expenseCounts: Record<string, number> = {};
    let countInPeriod = 0;

    const safeTx = Array.isArray(transactions) ? transactions : [];

    safeTx.forEach(tx => {
      if (tx.type !== 'expense' || !tx.category) return;
      
      const dt = parseTransactionDate(tx.date);
      if (dt && dt >= thirtyDaysAgo) {
        expenseCounts[tx.category] = (expenseCounts[tx.category] || 0) + 1;
        countInPeriod++;
      }
    });

    if (countInPeriod < 3) return null;

    return Object.entries(expenseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }, [transactions]);

  if (!topCategories || topCategories.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-amber-100 p-1.5 rounded-lg">
          <Zap size={14} className="text-amber-600 fill-amber-600" />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Lançar rápido</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {topCategories.map(category => (
          <button
            key={category}
            onClick={() => onQuickAdd(category, 'expense')}
            className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickCategoryShortcuts;
