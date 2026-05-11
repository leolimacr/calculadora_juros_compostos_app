import React from 'react';
import { LayoutGrid, ChevronRight, TrendingUp, Home, AlertTriangle, Target, CreditCard, ArrowRight } from 'lucide-react';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
  onNavigate: (route: string) => void;
  onStartNow: () => void;
  isAuthenticated: boolean;
}

export const HomeEcossistema: React.FC<Props> = ({ heroPersona, onNavigate, onStartNow, isAuthenticated }) => {
  const bentoCards = [
    { title: 'Calculadora de Juros Compostos', subtitle: heroPersona === 'dividas' ? 'Entenda os juros como apoio à decisão' : 'Projete crescimento no longo prazo', icon: <TrendingUp size={16} />, bg: 'bg-emerald-50', border: 'border-emerald-200', onClick: () => onNavigate('tool-juros') },
    { title: 'Alugar vs Comprar', subtitle: heroPersona === 'dividas' ? 'Use como apoio antes de comprar' : 'Simule decisões grandes', icon: <Home size={16} />, bg: 'bg-sky-50', border: 'border-sky-200', onClick: () => onNavigate('tool-alugar') },
    { title: heroPersona === 'dividas' ? 'Minhas Dívidas' : 'Meus Investimentos', subtitle: heroPersona === 'dividas' ? 'Cadastre, priorize e acompanhe' : 'Cadastre, acompanhe e revise', icon: heroPersona === 'dividas' ? <AlertTriangle size={16} /> : <Target size={16} />, bg: heroPersona === 'dividas' ? 'bg-amber-50' : 'bg-emerald-50', border: heroPersona === 'dividas' ? 'border-amber-200' : 'border-emerald-200', highlight: true, onClick: () => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos') },
    { title: heroPersona === 'dividas' ? 'À vista ou parcelado?' : 'Controla', subtitle: heroPersona === 'dividas' ? 'Compare antes de comprar' : 'Registre sua rotina financeira', icon: heroPersona === 'dividas' ? <CreditCard size={16} /> : <LayoutGrid size={16} />, bg: 'bg-sky-50', border: 'border-sky-200', onClick: () => onNavigate(heroPersona === 'dividas' ? 'tool-buy-cash-or-installments' : 'manager') },
  ];

  return (
    <section className="px-4 lg:px-12 pb-20 max-w-[1600px] mx-auto w-full relative">
      <div id="secao-ferramentas" style={{ scrollMarginTop: '90px' }} />
      <div className="absolute inset-x-0 -top-10 -bottom-10 bg-gradient-to-b from-slate-50/80 via-slate-50/60 to-slate-100/80 pointer-events-none -z-10" />
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-1/2 space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest"><LayoutGrid size={14} />Acompanhe sua vida financeira dentro do ecossistema</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{heroPersona === 'dividas' ? 'Comece pelas dívidas, fortaleça o contexto e mantenha sua jornada acompanhada.' : 'Cadastre seus investimentos, acompanhe seu patrimônio e mantenha decisões importantes no radar.'}</h2>
          <p className="text-slate-600 text-sm md:text-base max-w-xl">{heroPersona === 'dividas' ? 'Quanto mais você organiza dívidas, gastos e patrimônio, mais útil o ecossistema se torna para acompanhar mudanças e orientar revisões com bom senso.' : 'Quanto mais completo estiver seu patrimônio no ecossistema, mais contexto o sistema terá para acompanhar mudanças e apoiar decisões com mais consistência.'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')} className="group border border-emerald-200 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 transition-all p-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-1">{heroPersona === 'dividas' ? 'Começar pela base principal' : 'Começar pelo cadastro'}</span>
                <span className="text-sm font-bold text-slate-900">{heroPersona === 'dividas' ? 'Minhas Dívidas' : 'Meus Investimentos'}</span>
                <span className="text-[11px] text-emerald-700 font-medium mt-1">{heroPersona === 'dividas' ? 'Cadastre sua realidade atual e organize prioridades com mais contexto' : 'Organize sua carteira e enxergue melhor seu patrimônio'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="group border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all p-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{heroPersona === 'dividas' ? 'Acompanhamento contínuo' : 'Base do acompanhamento inteligente'}</span>
                <span className="text-sm font-bold text-slate-900">Controla</span>
                <span className="text-[11px] text-slate-500 font-medium mt-1">{heroPersona === 'dividas' ? 'Organize gastos e mantenha o contexto vivo para revisar prioridades com mais inteligência.' : 'Registre sua rotina financeira para que o ecossistema acompanhe melhor seu contexto ao longo do tempo.'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
        <div className="w-full lg:w-1/2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bentoCards.map((card, index) => (
              <button key={index} onClick={card.onClick} className={`group relative rounded-2xl border ${card.border} ${card.bg} p-4 sm:p-5 text-left shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[120px]`}>
                {card.highlight && <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-[0.18em] bg-white border border-amber-300 text-amber-700 rounded-full px-2 py-0.5 shadow-sm">{heroPersona === 'dividas' ? 'Prioridade' : 'Base principal'}</span>}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-slate-800 border border-slate-200 shadow-sm">{card.icon}</div>
                  <div><p className="text-xs font-black text-slate-900 leading-tight">{card.title}</p><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-bold">{card.subtitle}</p></div>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 group-hover:text-slate-900">{heroPersona === 'dividas' ? 'Abrir etapa' : 'Abrir módulo'}<ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};