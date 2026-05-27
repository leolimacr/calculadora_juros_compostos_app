import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onNavigate: (tool: string) => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  isPrivacyMode,
  onNavigate,
}) => {
  const recent = [...transactions]
    .filter((t) => t?.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Últimos Lançamentos</h2>
        <button
          onClick={() => onNavigate('manager')}
          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-0.5"
        >
          Ver tudo <ChevronRight size={12} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-500 font-medium">Nenhum lançamento recente.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {recent.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{t.description || 'Sem descrição'}</p>
                <p className="text-[10px] text-slate-500 uppercase font-medium tracking-tight mt-0.5">
                  {t.date ? new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'} ·{' '}
                  {t.category || 'Outros'}
                </p>
              </div>
              <span className={`text-xs font-black shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPrivacyMode
                  ? '••••'
                  : `${t.type === 'income' ? '+' : '−'} ${new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(t.amount) || 0)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentTransactions;
