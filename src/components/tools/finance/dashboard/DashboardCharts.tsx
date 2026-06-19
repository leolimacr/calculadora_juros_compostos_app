import React from 'react';
import { PieChart, BarChart3 } from 'lucide-react';
import { getFlowLabels } from '../../../../theme/fpiVoiceGuide';

interface DashboardChartsProps {
  categoryStats: {
    data: any[];
    gradient: string;
  };
  stats: {
    income: number;
    expenses: number;
  };
  commandMode?: boolean;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  categoryStats,
  stats,
  commandMode = false,
}) => {
  const voice = getFlowLabels(commandMode);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Composição por categoria */}
      <div className="bg-surface-primary p-8 rounded-5xl border border-surface-elevated shadow-soft">
        <h3 className="text-text-primary font-black mb-6 text-xxs uppercase tracking-ultra-wide flex items-center gap-3">
          <PieChart size={16} className="text-brand-primary" /> {voice.compositionTitle}
        </h3>
        <div className="flex items-center gap-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0 shadow-2xl" style={{ background: categoryStats.gradient }}></div>
          <div className="flex-1 space-y-3">
            {categoryStats.data.length > 0 ? categoryStats.data.map((cat: any) => (
              <div key={cat.name} className="flex flex-col">
                <div className="flex justify-between text-xxs font-bold uppercase tracking-ultra-wide mb-1">
                  <span className="text-text-secondary">{cat.name}</span>
                  <span className="text-text-primary">{Math.round(cat.percent)}%</span>
                </div>
                <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}></div>
                </div>
              </div>
            )) : (
              <div className="space-y-1">
                <p className="text-text-secondary font-bold text-sm">Nenhum compromisso no período</p>
                <p className="text-text-muted text-xxs leading-relaxed">O gráfico aparece quando houver movimentações de saída registradas.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visão de Fluxo */}
      <div className="bg-surface-primary p-8 rounded-5xl border border-surface-elevated shadow-soft">
        <h3 className="text-text-primary font-black mb-6 text-xxs uppercase tracking-ultra-wide flex items-center gap-3">
          <BarChart3 size={16} className="text-brand-secondary" /> {voice.flowChart}
        </h3>
        <div className="flex items-end justify-around h-32 gap-4">
          {[
            { label: voice.income, c: 'bg-brand-primary', h: (stats.income / Math.max(stats.income, stats.expenses, 1)) * 100 },
            { label: voice.expense, c: 'bg-status-danger', h: (stats.expenses / Math.max(stats.income, stats.expenses, 1)) * 100 }
          ].map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full">
              <div className="w-full bg-surface-elevated rounded-2xl h-full flex items-end overflow-hidden border border-surface-elevated">
                <div className={`w-full ${b.c} transition-all duration-1000 shadow-none`} style={{ height: `${b.h}%` }}></div>
              </div>
              <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
