
import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onDelete }) => {
  const [filter, setFilter] = useState<'tudo' | 'receitas' | 'despesas'>('tudo');

  const filtered = transactions.filter(t => {
    if (filter === 'receitas') return t.type === 'income';
    if (filter === 'despesas') return t.type === 'expense';
    return true;
  });

  const formatCategory = (cat: string) => {
    return cat;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Histórico Detalhado</h3>
        <div className="bg-slate-50 p-1 rounded-lg flex gap-1">
          {(['tudo', 'receitas', 'despesas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${filter === f ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
              <th className="px-6 py-4 w-20 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Nenhum lançamento encontrado.</td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-medium text-slate-400">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-[11px] font-bold text-slate-600 rounded-full">
                      {formatCategory(t.category)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {t.type === 'income' ? '+ ' : '- '}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Chama a função de exclusão passada pelo pai (App.tsx)
                        onDelete(t.id);
                      }}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all active:scale-90 shadow-sm border border-slate-100 bg-white"
                      title="Excluir Permanentemente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
