
import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, maskCurrency } from '../utils/calculations';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  isPrivacyMode?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onDelete, isPrivacyMode = false }) => {
  const [filter, setFilter] = useState<'tudo' | 'receitas' | 'despesas'>('tudo');

  const filtered = transactions.filter(t => {
    if (filter === 'receitas') return t.type === 'income';
    if (filter === 'despesas') return t.type === 'expense';
    return true;
  });

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-white">Extrato de Lançamentos</h3>
        <div className="bg-slate-900 p-1 rounded-lg flex gap-1 border border-slate-700">
          {(['tudo', 'receitas', 'despesas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${filter === f ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descrição</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoria</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor</th>
              <th className="px-6 py-4 w-20 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">Nenhum lançamento encontrado neste período.</td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/30 transition-colors group relative">
                  <td className="px-6 py-4 text-xs font-medium text-slate-400">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-200">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700 border border-slate-600 text-[11px] font-bold text-slate-300 rounded-full">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {t.type === 'income' ? '+ ' : '- '}{maskCurrency(t.amount, isPrivacyMode)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t.id);
                      }}
                      className="relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-white hover:bg-red-500/80 transition-all shadow-sm border border-slate-600 bg-slate-700"
                      title="Excluir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
