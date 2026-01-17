import React from 'react';

const TransactionHistory: React.FC<any> = ({ transactions = [], onDelete, isPrivacyMode }) => {
  const safeList = Array.isArray(transactions) ? transactions : [];

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

  const handleDelete = (id: string) => {
    // AQUI ESTÁ A TRAVA DE SEGURANÇA
    const confirm = window.confirm("Tem certeza que deseja excluir este lançamento?");
    if (confirm) {
        onDelete(id);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <h3 className="text-white font-bold text-sm px-1 flex items-center gap-2">
        <span className="w-1 h-4 bg-slate-500 rounded-full"></span>
        Últimos Lançamentos
      </h3>
      
      {safeList.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700 border-dashed">
          <p className="text-slate-500 text-xs">Seu histórico aparecerá aqui.</p>
        </div>
      ) : (
        safeList.map((t: any) => (
          <div key={t.id || Math.random()} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center shadow-sm relative">
            <div className="flex gap-3 items-center overflow-hidden flex-1">
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {t.type === 'income' ? '↑' : '↓'}
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
              
              {/* LIXEIRA COM CONFIRMAÇÃO */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                className="w-9 h-9 flex items-center justify-center bg-slate-700/50 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-500 transition-colors border border-slate-600/30"
              >
                🗑️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
export default TransactionHistory;