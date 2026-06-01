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
      className={`w-full group relative overflow-hidden rounded-[2rem] p-6 text-left transition-all active:scale-[0.98] border ${
        isDisabled
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl transition-all ${
          isDisabled ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 group-hover:scale-110'
        }`}>
          <Plus size={24} strokeWidth={3} />
        </div>
        <div>
          <h3 className={`text-base font-black uppercase tracking-tight ${isDisabled ? 'text-slate-500' : 'text-slate-900'}`}>
            Registrar Despesa ou Receita
          </h3>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 ${isDisabled ? 'text-slate-400' : 'text-emerald-600'}`}>
            {isDisabled ? 'Limite mensal atingido' : 'Mantenha sua constância'}
          </p>
        </div>
      </div>
    </button>
  );
};

export default QuickActionCard;
