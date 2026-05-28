import React from 'react';
import { Browser } from '@capacitor/browser';
import { TrendingUp, Target, Zap, X, ChevronRight, Sparkles, LayoutGrid, Brain } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export default function PaywallModal({ open, onClose, feature }: PaywallModalProps) {
  if (!open) return null;

  // Determina o contexto com base na feature que disparou o paywall
  const isControla = feature?.toLowerCase().includes('controla') || feature?.toLowerCase().includes('lançamento');
  const isIA = feature?.toLowerCase().includes('nexus') || feature?.toLowerCase().includes('ia') || feature?.toLowerCase().includes('chat');
  
  const context = {
    title: isControla ? 'Você está criando uma rotina de controle real' : isIA ? 'Sua evolução pode ganhar mais profundidade' : 'Eleve seu nível de controle',
    subtitle: isControla 
      ? 'Você deu um passo importante. O plano Free te trouxe até aqui; o Pro garante que sua rotina siga sem interrupções e com mais clareza.'
      : 'Sua jornada no Free já tomou forma. No Pro, você amplia sua visão com análises profundas que acompanham sua vida financeira.',
    icon: isControla ? <TrendingUp size={22} className="text-emerald-400" /> : <Sparkles size={22} className="text-violet-400" />,
    cta: isControla ? 'Continuar meu ritmo com mais fluidez' : 'Ampliar minha visão com mais contexto',
    benefits: isControla ? [
      { icon: <Zap size={14} className="text-amber-500" />, text: 'Lançamentos ilimitados para sua rotina não parar' },
      { icon: <LayoutGrid size={14} className="text-sky-500" />, text: 'Filtros e visão mensal para entender melhor o que mudou' },
      { icon: <Brain size={14} className="text-emerald-500" />, text: 'Insights mais úteis com mais contexto da sua rotina' },
      { icon: <Target size={14} className="text-indigo-500" />, text: 'Mais fluidez para acompanhar seu dinheiro no dia a dia' },
    ] : [
      { icon: <Zap size={14} className="text-amber-500" />, text: 'Perguntas ilimitadas ao Nexus IA' },
      { icon: <TrendingUp size={14} className="text-emerald-500" />, text: 'Visão completa de Investimentos e Patrimônio' },
      { icon: <Target size={14} className="text-sky-500" />, text: 'Estratégia matemática para quitação de dívidas' },
      { icon: <Brain size={14} className="text-indigo-500" />, text: 'Conexão inteligente entre todos os módulos' },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {context.icon}
          </div>
          <h2 className="text-white text-lg font-black tracking-tight mb-1">
            {context.title}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto font-medium">
            {context.subtitle}
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-3">
          {context.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <span className="text-slate-700 text-sm font-bold tracking-tight">{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => Browser.open({ url: 'https://financasproinvest.com.br/pricing' })}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 uppercase text-xs tracking-widest"
          >
            {context.cta} <ChevronRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="w-full text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest py-2 transition-colors"
          >
            Continuar no Free por enquanto
          </button>
        </div>
      </div>
    </div>
  );
}
