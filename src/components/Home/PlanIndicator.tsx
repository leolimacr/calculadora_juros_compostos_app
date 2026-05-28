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
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
            <Crown size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 tracking-tight">Plano Pro ativo</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Sua rotina está livre para seguir sem atrito</p>
          </div>
        </div>
        <Sparkles size={18} className="text-emerald-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em]">Sua rotina neste mês</p>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isNearLimit ? 'text-rose-600' : 'text-slate-500'}`}>
          {launchCount} <span className="text-slate-300">/</span> {launchLimit}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isNearLimit ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${usagePercentage}%` }}
        />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
            {isNearLimit ? 'Sua rotina ganhou força — o Pro evita que ela pare' : 'Construindo seu controle financeiro'}
          </p>
          {isNearLimit && (
            <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Seguir sem limite →</span>
          )}
        </div>
        <p className="text-[8px] text-slate-400 font-medium mt-1 leading-relaxed opacity-80">
          {isNearLimit 
            ? "Sua constância trouxe você até aqui. O Pro ajuda a não quebrar esse ritmo." 
            : "Cada lançamento ajuda a dar mais clareza ao seu mês."}
        </p>
      </div>
    </div>
  );
};

export default PlanIndicator;
