import React from 'react';
import { Crown, ChevronRight, ArrowLeft } from 'lucide-react';

interface PremiumUpgradePromptProps {
  title?: string;
  description?: string;
  onNavigate: (tool: string) => void;
}

const PremiumUpgradePrompt: React.FC<PremiumUpgradePromptProps> = ({
  title = 'Camada estratégica Premium',
  description = 'Gestão de dívidas, investimentos e patrimônio fazem parte do ecossistema completo. Conheça o Premium para conectar sua rotina a decisões de longo prazo.',
  onNavigate,
}) => (
  <div className="max-w-lg mx-auto px-4 pt-20 pb-32 animate-in fade-in duration-300">
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-center space-y-6">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
        <Crown size={28} />
      </div>
      <div className="space-y-3">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onNavigate('pricing')}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl transition-all uppercase text-xs tracking-widest"
        >
          Conhecer Premium <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="w-full inline-flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 font-bold py-2 text-[11px] uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Voltar à Home
        </button>
      </div>
    </div>
  </div>
);

export default PremiumUpgradePrompt;
