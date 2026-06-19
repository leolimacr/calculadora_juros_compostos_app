import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { getCockpitControlaCopy } from '../../../theme/fpiVoiceGuide';

interface CockpitControlaActionProps {
  onNavigate: (tool: string) => void;
  isPrivacyMode: boolean;
  controlaBalance: number;
  dataHealth: string;
  daysSinceLastSnapshot: number;
  sovereignCommandMode: boolean;
  formatCurrency: (val: number) => string;
}

const CockpitControlaAction: React.FC<CockpitControlaActionProps> = ({
  onNavigate,
  isPrivacyMode,
  controlaBalance,
  dataHealth,
  daysSinceLastSnapshot,
  sovereignCommandMode,
  formatCurrency,
}) => {
  return (
    <button
      onClick={() => onNavigate('manager')}
      className="w-full group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-1 md:p-2 transition-all hover:border-brand-primary/50 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] shadow-soft"
    >
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="relative flex flex-col md:flex-row items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4 md:gap-6 z-10">
            <div className="shrink-0 relative">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-transparent rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500 shadow-soft">
                <img src="/assets/images/brand/controla-icon.png" alt="Controla Icon" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-brand-secondary rounded-full border-2 border-white flex items-center justify-center">
                <Zap size={8} className="text-white fill-white" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none uppercase bg-gradient-to-br from-emerald-400 to-teal-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]">
              Controla
            </h3>
          </div>

          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 md:top-0 text-center">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-2 md:mt-0">
              Fluxo de Caixa
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors shadow-brand-glow">
            Abrir Agora
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="md:pl-[80px] flex flex-col items-center md:items-start gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="space-y-0.5 text-center md:text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Real em Conta</p>
              <p className="text-lg md:text-xl font-bold text-slate-900 leading-none">
                {isPrivacyMode ? '••••••' : formatCurrency(controlaBalance)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest whitespace-nowrap">Histórico Completo</span>
              </div>
              
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg transition-all ${
                dataHealth === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                dataHealth === 'yellow' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                         'bg-rose-50 border-rose-100 text-rose-600'
              }`} title={daysSinceLastSnapshot === 999 ? 'Nenhum check-in realizado' : `Último check-in há ${daysSinceLastSnapshot} dias`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  dataHealth === 'green' ? 'bg-emerald-500' :
                  dataHealth === 'yellow' ? 'bg-amber-500' :
                                           'bg-rose-500 animate-pulse'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {dataHealth === 'green' ? 'Dados Saudáveis' : dataHealth === 'yellow' ? 'Dados Antigos' : 'Atualizar Dados'}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-xl text-center md:text-left">
             {getCockpitControlaCopy(sovereignCommandMode)}
          </p>

          <div className="md:hidden w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest">
            Abrir Agora
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </button>
  );
};

export default CockpitControlaAction;
