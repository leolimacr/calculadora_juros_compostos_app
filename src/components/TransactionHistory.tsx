import React from 'react';
import { Trash2, TrendingUp, TrendingDown, Calendar, Tag } from 'lucide-react';

const TransactionHistory: React.FC<any> = ({ transactions = [], onDelete, isPrivacyMode }) => {
  const safeList = Array.isArray(transactions) ? transactions : [];

  // MANTIDA LÓGICA ORIGINAL DE DATA COM CORREÇÃO DE FUSO
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '--/--';
      const date = new Date(dateString);
      // Ajuste de fuso para exibir data correta
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      return isNaN(date.getTime()) ? '--/--' : adjustedDate.toLocaleDateString('pt-BR');
    } catch { return '--/--'; }
  };

  const formatAmount = (val: any) => {
    const num = Number(val) || 0;
    try { return num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); } catch { return num.toFixed(2); }
  };

  // MANTIDA LÓGICA DE CONFIRMAÇÃO DE EXCLUSÃO
  const handleDelete = (id: string) => {
    const confirm = window.confirm("Tem certeza que deseja excluir este lançamento?");
    if (confirm) {
        onDelete(id);
    }
  };

  if (safeList.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-800 border-dashed">
         <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="text-slate-600" size={24} />
         </div>
         <p className="text-slate-500 font-bold text-sm">Nenhum lançamento encontrado.</p>
         <p className="text-slate-600 text-xs mt-1">Clique em "Novo Lançamento" para começar.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      
      {/* TÍTULO E CABEÇALHO (Visível apenas no Desktop para organizar colunas) */}
      <div className="flex items-center justify-between mb-2">
         <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider border-l-4 border-emerald-500 pl-3">
            Últimos Lançamentos
         </h3>
         
         {/* Cabeçalho da Tabela (Só Desktop) */}
         <div className="hidden md:grid grid-cols-12 gap-4 w-3/4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-4">
             <div className="col-span-4 text-left">Categoria</div>
             <div className="col-span-3 text-center">Data</div>
             <div className="col-span-4">Valor</div>
             <div className="col-span-1"></div>
         </div>
      </div>

      <div className="space-y-3 md:space-y-1">
        {safeList.map((t: any) => (
          <div key={t.id || Math.random()} className="group relative">
            
            {/* === 1. VISUAL MOBILE (CARD) - md:hidden === */}
            <div className="md:hidden bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center shadow-sm">
                <div className="flex gap-3 items-center overflow-hidden flex-1">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate max-w-[140px]">{t.description || 'Sem descrição'}</p>
                    <div className="flex gap-2 text-[10px] text-slate-500 uppercase font-bold mt-0.5 items-center">
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 truncate max-w-[80px]">{t.category || 'Geral'}</span>
                      <span>{formatDate(t.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-2">
                  <p className={`font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPrivacyMode ? '••••' : `R$ ${formatAmount(t.amount)}`}
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                    className="w-9 h-9 flex items-center justify-center bg-slate-700/50 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-500 transition-colors border border-slate-600/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
            </div>

            {/* === 2. VISUAL DESKTOP (TABELA LINHA) - hidden md:grid === */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center bg-slate-800/20 hover:bg-slate-800 p-3 rounded-lg border border-transparent hover:border-slate-700 transition-all cursor-default">
                
                {/* Coluna 1: Descrição + Ícone (Ocupa 4 espaços) */}
                <div className="col-span-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <span className="font-bold text-slate-200 truncate" title={t.description}>
                        {t.description || 'Sem descrição'}
                    </span>
                </div>

                {/* Coluna 2: Categoria (Ocupa 3 espaços) */}
                <div className="col-span-3">
                    <span className="inline-block bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs text-slate-400 font-bold truncate max-w-full">
                        {t.category || 'Geral'}
                    </span>
                </div>

                {/* Coluna 3: Data (Ocupa 2 espaços) */}
                <div className="col-span-2 flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <Calendar size={14} className="text-slate-600"/>
                    {formatDate(t.date)}
                </div>

                {/* Coluna 4: Valor + Botão Excluir (Ocupa 3 espaços) */}
                <div className="col-span-3 flex items-center justify-end gap-4">
                    <span className={`font-bold font-mono text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+ ' : '- '}
                        {isPrivacyMode ? '••••' : formatAmount(t.amount)}
                    </span>
                    
                    {/* Botão Excluir (Só aparece no Hover) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir lançamento"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;