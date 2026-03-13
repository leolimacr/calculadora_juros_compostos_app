import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: any[];
  onDelete: (id: string) => void;
  onEdit: (t: any) => void;
  isPrivacyMode: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onDelete, onEdit, isPrivacyMode }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th className="p-5">Data</th>
              <th className="p-5">Descrição</th>
              <th className="p-5">Categoria</th>
              <th className="p-5 text-right">Valor</th>
              <th className="p-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold uppercase text-xs">Nenhum lançamento encontrado</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 text-xs text-slate-600 font-medium">
                    {new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-5 text-sm text-slate-900 font-bold">{t.description}</td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-700">
                      {t.category}
                    </span>
                  </td>
                  <td className={`p-5 text-right font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPrivacyMode ? '••••' : `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all" title="Editar"><Pencil size={16}/></button>
                      <button onClick={() => { if (window.confirm(`Deseja excluir "${t.description}"?`)) onDelete(t.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={16}/></button>
                    </div>
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