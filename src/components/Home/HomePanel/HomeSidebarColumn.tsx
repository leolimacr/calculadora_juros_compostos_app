import React, { useMemo } from 'react';
import { Wallet, ChevronRight, LayoutGrid } from 'lucide-react';import PlanIndicator from '../PlanIndicator';
import RecentTransactions from '../RecentTransactions';
import { FPI_COPY } from '../../../theme/fpiVoiceGuide';
import type { Transaction } from '../../../types';

interface HomeSidebarColumnProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  hasPaidAccess: boolean;
  userMeta: any;
  onNavigate: (tool: string) => void;
}

const HomeSidebarColumn: React.FC<HomeSidebarColumnProps> = ({
  transactions,
  isPrivacyMode,
  hasPaidAccess,
  userMeta,
  onNavigate,
}) => {
  const historyLocked = !hasPaidAccess;

  const monthLaunchCount = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    return transactions.filter((t) => {
      const parts = t.date?.split('-').map(Number);
      return parts?.[0] === y && parts?.[1] === m;
    }).length;
  }, [transactions]);

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Card Nobre de Análise - Topo (Desktop Only) */}
      <button
        type="button"
        onClick={() => onNavigate('manager')}
        className="hidden lg:block group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-6 text-left transition-all hover:border-brand-primary/30 hover:shadow-floating shadow-card w-full"
      >
        <div className="absolute top-4 right-4 w-24 h-24 overflow-hidden rounded-2xl border border-slate-100 shadow-floating transition-all group-hover:rotate-3 group-hover:scale-110 pointer-events-none hidden sm:block">
          <img 
            src="/assets/images/brand/controla-icon.png" 
            alt="Preview do Controla" 
            className="w-full h-full object-cover object-top"
          />
        </div>

        <div className="flex flex-col h-full relative z-10">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl w-fit mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Controla (Completo)</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{FPI_COPY.homeControlaDetail}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Acessar Painel</span>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
          </div>
        </div>
      </button>

      <PlanIndicator launchCount={monthLaunchCount} />

      {/* Card de Navegação Secundária - Estratégia */}
      <button
        type="button"
        onClick={() => onNavigate('central')}
        className="group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-6 text-left transition-all hover:border-sky-200 hover:shadow-xl hover:-translate-y-1 shadow-sm w-full"
      >
        <div className="flex flex-col h-full">
          <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl w-fit mb-4 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
            <LayoutGrid size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">Central</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">Visão de longo prazo e futuro.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-600">Ver Estratégia</span>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-500 transition-all group-hover:translate-x-1" />
          </div>
        </div>
      </button>

      <RecentTransactions
        transactions={transactions}
        isPrivacyMode={isPrivacyMode}
        onNavigate={onNavigate}
        historyLocked={historyLocked}
      />
    </div>
  );
};

export default HomeSidebarColumn;
