import React, { useMemo } from 'react';
import { Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { NexusAdvisoryContext } from '../../../services/nexusInsightEngine';

interface Props {
  draft: {
    amount: number;
    category: string;
    type: 'income' | 'expense';
  };
  context?: NexusAdvisoryContext;
}

const NexusInlineAdvisor: React.FC<Props> = ({ draft, context }) => {
  const insight = useMemo(() => {
    if (!context || draft.type !== 'expense' || draft.amount <= 0 || !draft.category) {
      return null;
    }

    const { currentMonthBalance, categorySpending } = context;
    const newBalance = currentMonthBalance - draft.amount;
    const currentCategoryTotal = categorySpending[draft.category] || 0;

    // 1. Alerta de Saldo Negativo
    if (newBalance < 0 && currentMonthBalance >= 0) {
      return {
        type: 'warning',
        icon: <AlertCircle className="text-rose-500" size={16} />,
        title: 'Saldo do mês',
        body: 'Este gasto fará seu saldo do mês ficar negativo.',
        color: 'bg-rose-50 border-rose-100 text-rose-700'
      };
    }

    // 2. Alerta de Categoria (Gasto Relevante)
    if (draft.amount > 50 && draft.category !== 'Outros' && draft.category !== 'Sem categoria') {
       // Se o gasto atual é maior que 50% do que já foi gasto no mês na categoria
       if (currentCategoryTotal > 0 && draft.amount > currentCategoryTotal * 0.5) {
          return {
            type: 'info',
            icon: <TrendingUp className="text-amber-500" size={16} />,
            title: 'Aumento na categoria',
            body: `Este valor é significativo comparado ao seu histórico de ${draft.category} este mês.`,
            color: 'bg-amber-50 border-amber-100 text-amber-700'
          };
       }
    }

    return null;
  }, [draft.amount, draft.category, draft.type, context]);

  if (!insight) return null;

  return (
    <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${insight.color}`}>
      <div className="mt-0.5 shrink-0">
        {insight.icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
          <Sparkles size={10} className="fill-current" />
          Nexus: {insight.title}
        </p>
        <p className="text-xs font-medium leading-relaxed">
          {insight.body}
        </p>
      </div>
    </div>
  );
};

export default React.memo(NexusInlineAdvisor);
