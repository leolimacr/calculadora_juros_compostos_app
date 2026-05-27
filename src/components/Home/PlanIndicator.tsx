import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

interface PlanIndicatorProps {
  isPro: boolean;
  launchCount: number;
  launchLimit: number;
}

const PlanIndicator: React.FC<PlanIndicatorProps> = ({
  isPro,
  launchCount,
  launchLimit,
}) => {
  const usagePercentage = Math.min((launchCount / launchLimit) * 100, 100);
  const isNearLimit = usagePercentage >= 80;

  if (isPro) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <Crown size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Plano Pro Ativo</p>
            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">Recursos ilimitados</p>
          </div>
        </div>
        <Sparkles size={16} className="text-emerald-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Uso do Limite</p>
        <span className={`text-[10px] font-black uppercase ${isNearLimit ? 'text-rose-600' : 'text-slate-500'}`}>
          {launchCount}/{launchLimit}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isNearLimit ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${usagePercentage}%` }}
        />
      </div>
      <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
        {isNearLimit ? 'Limite quase atingido. Considere o Pro!' : 'Você está no plano Free'}
      </p>
    </div>
  );
};

export default PlanIndicator;
