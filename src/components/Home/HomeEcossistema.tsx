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
    <section className="px-6 lg:px-16 py-28 w-full bg-[#0B0F17] text-[#E5E7EB] font-sans border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Coluna de Texto e Destaque Principal */}
        <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950/40 border border-blue-900/50 text-blue-400 text-xs font-bold uppercase tracking-wider mx-auto lg:mx-0">
            <LayoutGrid size={14} />
            Módulos Práticos
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Ferramentas Auxiliares de Navegação
          </h2>
          
          <p className="text-base md:text-lg text-[#A0A4AB] leading-relaxed max-w-xl">
            Aproveite utilitários avançados de cálculo para simular e estruturar cenários específicos antes de assumir decisões críticas.
          </p>

          {/* Destaque Principal do Controla */}
          <div className="mt-8 p-6 rounded-2xl border border-white/[0.06] bg-[#111622] text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
              Célula de Comando
            </div>
            
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block mb-2">Painel de Controle Integrado</span>
            <h4 className="text-xl font-bold text-white mb-2">O Controla e a Inteligência do Nexus</h4>
            <p className="text-sm text-[#A0A4AB] leading-relaxed mb-6">
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
                className="group relative rounded-2xl border border-white/[0.06] bg-[#111622] p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-blue-500/30 transition-all flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-[#0B0F17] border border-white/[0.08] flex items-center justify-center text-[#A0A4AB] group-hover:text-blue-400 transition-colors">
                    {card.icon}
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-white leading-tight">{card.title}</p>
                    <p className="text-xs text-[#A0A4AB]">{card.subtitle}</p>
                  </div>
                </div>
                
                <span className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300">
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