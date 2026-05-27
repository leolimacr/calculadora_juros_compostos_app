import React from 'react';
import { Plus } from 'lucide-react';

interface QuickActionCardProps {
  onAction: () => void;
  isLimitReached: boolean;
  hasPaidAccess: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  onAction,
  isLimitReached,
  hasPaidAccess,
}) => {
  const isDisabled = isLimitReached && !hasPaidAccess;

  return (
    <button
      type="button"
      onClick={onAction}
      className={`w-full group relative overflow-hidden rounded-2xl p-5 text-left transition-all active:scale-[0.98] shadow-sm border ${
        isDisabled
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl transition-colors ${
          isDisabled ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
        }`}>
          <Plus size={20} strokeWidth={3} />
        </div>
        <div>
          <h3 className={`text-sm font-black uppercase tracking-tight ${isDisabled ? 'text-amber-900' : 'text-slate-900'}`}>
            Lançar Transação
          </h3>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDisabled ? 'text-amber-700' : 'text-slate-500'}`}>
            {isDisabled ? 'Limite mensal atingido' : 'Rápido e simples'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default QuickActionCard;
