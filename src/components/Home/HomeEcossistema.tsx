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
    { title: 'Quanto meu dinheiro rende no futuro?', subtitle: 'Simule quanto você acumula investindo um pouco por mês.', icon: <TrendingUp size={16} />, bg: 'bg-emerald-50', border: 'border-emerald-200', onClick: () => onNavigate('tool-juros') },
    { title: 'Alugar ou comprar um imóvel?', subtitle: 'Compare os custos e veja o que vale mais a pena para você.', icon: <Home size={16} />, bg: 'bg-sky-50', border: 'border-sky-200', onClick: () => onNavigate('tool-alugar') },
    { title: heroPersona === 'dividas' ? 'Calculadora de Dívidas' : 'Meus Investimentos', subtitle: heroPersona === 'dividas' ? 'Simule cenários de quitação sem cadastrar dados' : 'Cadastre, acompanhe e revise', icon: heroPersona === 'dividas' ? <AlertTriangle size={16} /> : <Target size={16} />, bg: heroPersona === 'dividas' ? 'bg-amber-50' : 'bg-emerald-50', border: heroPersona === 'dividas' ? 'border-amber-200' : 'border-emerald-200', highlight: heroPersona !== 'dividas', onClick: () => onNavigate(heroPersona === 'dividas' ? 'tool-dividas' : 'investimentos') },
    { title: heroPersona === 'dividas' ? 'Vale a pena parcelar?' : 'Controla', subtitle: heroPersona === 'dividas' ? 'Descubra se é melhor pagar à vista ou em prestações.' : 'Registre sua rotina financeira', icon: heroPersona === 'dividas' ? <CreditCard size={16} /> : <LayoutGrid size={16} />, bg: 'bg-sky-50', border: 'border-sky-200', onClick: () => onNavigate(heroPersona === 'dividas' ? 'tool-buy-cash-or-installments' : 'manager') },
  ];

  return (
    <section className="px-4 lg:px-12 pb-20 max-w-[1600px] mx-auto w-full relative">
      <div id="secao-ferramentas" style={{ scrollMarginTop: '90px' }} />
      <div className="absolute inset-x-0 -top-10 -bottom-10 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 pointer-events-none -z-10" />
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-1/2 space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest shadow-sm"><LayoutGrid size={14} />Seu ecossistema financeiro</span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">{heroPersona === 'dividas' ? 'Tudo que você precisa para sair das dívidas — num só lugar.' : 'Tudo que você precisa para fazer seu patrimônio crescer — num só lugar.'}</h2>
          <p className="text-slate-500 text-sm md:text-base max-w-xl leading-relaxed">{heroPersona === 'dividas' ? 'Cada ferramenta resolve um problema real. Comece pelo que é mais urgente hoje e deixe o Finanças Pro Invest cuidar do resto.' : 'Cada ferramenta cobre uma frente do seu patrimônio. Use separado ou junto — o Nexus conecta tudo para você.'}</p>

          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')} className="group border-2 border-emerald-500 rounded-3xl bg-white hover:bg-emerald-50 transition-all p-6 flex items-center justify-between gap-4 shadow-xl shadow-emerald-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-bl-xl tracking-widest shadow-sm">
                Passo 1: Recomendado
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2">{heroPersona === 'dividas' ? 'Ponto de Partida' : 'Base do patrimônio'}</span>
                <span className="text-xl font-black text-slate-900 mb-1">{heroPersona === 'dividas' ? 'Minhas Dívidas' : 'Meus Investimentos'}</span>
                <span className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">{heroPersona === 'dividas' ? 'Cadastre o que você deve e visualize o custo real de cada juros para priorizar o pagamento.' : 'Registre sua carteira e acompanhe o crescimento real do seu patrimônio com inteligência.'}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <ChevronRight className="w-6 h-6" />
              </div>
            </button>

            <button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="group border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-white transition-all p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rotina diária</span>
                <span className="text-lg font-bold text-slate-800">Controla</span>
                <span className="text-xs text-slate-500 font-medium">{heroPersona === 'dividas' ? 'Registre seus gastos e receitas para o Nexus calibrar seus conselhos.' : 'Registre suas entradas e saídas para o Nexus calibrar seus conselhos.'}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="w-full lg:w-1/2 pt-2 lg:pt-14">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
            <span className="h-px bg-slate-200 flex-grow"></span>
            Simuladores & Ferramentas de apoio
            <span className="h-px bg-slate-200 flex-grow"></span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bentoCards.map((card, index) => (
              <button key={index} onClick={card.onClick} className={`group relative rounded-2xl border ${card.border} bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between min-h-[140px]`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 group-hover:bg-white transition-colors">{card.icon}</div>
                  <div>
                    <p className="text-[13px] font-black text-slate-900 leading-tight mb-0.5">{card.title}</p>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-bold">{card.subtitle}</p>
                  </div>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 group-hover:text-emerald-600 transition-colors uppercase tracking-wider">
                  {heroPersona === 'dividas' ? 'Abrir calculadora' : 'Abrir módulo'}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};