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
    { 
      title: 'Simulador de Juros Compostos', 
      subtitle: 'Projete o poder da multiplicação mensal.', 
      icon: <TrendingUp size={18} />, 
      onClick: () => onNavigate('tool-juros') 
    },
    { 
      title: 'Alugar ou Comprar Imóvel', 
      subtitle: 'Decisões imobiliárias na ponta do lápis.', 
      icon: <Home size={18} />, 
      onClick: () => onNavigate('tool-alugar') 
    },
    { 
      title: heroPersona === 'dividas' ? 'Simulador de Dívidas' : 'Organizador de Carteira', 
      subtitle: heroPersona === 'dividas' ? 'Simule estratégias de quitação' : 'Consolide seus ativos e provisões', 
      icon: heroPersona === 'dividas' ? <AlertTriangle size={18} /> : <Target size={18} />, 
      onClick: () => onNavigate(heroPersona === 'dividas' ? 'tool-dividas' : 'investimentos') 
    },
    { 
      title: 'Comprar à Vista ou Parcelar?', 
      subtitle: 'Compare o desconto contra o rendimento real.', 
      icon: <CreditCard size={18} />, 
      onClick: () => onNavigate('tool-buy-cash-or-installments') 
    },
  ];

  return (
    <section className="px-6 lg:px-16 py-28 w-full bg-surface-secondary text-slate-700 font-sans border-t border-slate-200">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Coluna de Texto e Destaque Principal */}
        <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mx-auto lg:mx-0">
            <LayoutGrid size={14} />
            Módulos Práticos
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Ferramentas Auxiliares de Navegação
          </h2>
          
          <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-xl">
            Aproveite utilitários avançados de cálculo para simular e estruturar cenários específicos antes de assumir decisões críticas.
          </p>

          {/* Destaque Principal do Controla */}
          <div className="mt-8 p-6 rounded-2xl border border-slate-200 bg-white text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
              Célula de Comando
            </div>
            
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block mb-2">Painel de Controle Integrado</span>
            <h4 className="text-xl font-bold text-slate-900 mb-2">O Controla e a Inteligência do Nexus</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              A verdadeira mágica acontece quando seus dados estão conectados. O Controla gerencia seus fluxos diários enquanto o Nexus prevê tensões patrimoniais de forma totalmente automatizada.
            </p>

            <button 
              onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'investimentos')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs"
            >
              <span>{heroPersona === 'dividas' ? 'Acessar Gestão de Débitos' : 'Acessar Gestão Patrimonial'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Grade de Ferramentas Auxiliares */}
        <div className="w-full lg:w-1/2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {bentoCards.map((card, index) => (
              <button 
                key={index} 
                onClick={card.onClick} 
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                    {card.icon}
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-slate-900 leading-tight">{card.title}</p>
                    <p className="text-xs text-slate-500">{card.subtitle}</p>
                  </div>
                </div>
                
                <span className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Calcular agora
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