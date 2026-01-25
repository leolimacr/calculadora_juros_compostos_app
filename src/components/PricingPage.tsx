import React from 'react';
import { Browser } from '@capacitor/browser';
import { ArrowLeft, Check, X, Star, Zap, Crown } from 'lucide-react';

// Links do Stripe
const STRIPE_LINKS = {
    pro_monthly: "https://buy.stripe.com/dRm7sNdcCe8p2vn5nXaAw02",
    fire_annual: "https://buy.stripe.com/4gMaEZc8y8O54Dv5nXaAw00",
    fire_monthly: "https://buy.stripe.com/6oU8wRa0q4xPgmdcQpaAw01"
};

const PricingPage: React.FC<any> = ({ currentPlan, onBack }) => {

  // Função para abrir o checkout no navegador externo (Fuga dos 30%)
  const handleSubscribe = async (url: string) => {
    await Browser.open({ url });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white pt-6 pb-20 px-4 animate-in fade-in duration-700">
      
      {/* HEADER AJUSTADO (Sem sobreposição) */}
      <div className="max-w-7xl mx-auto mb-12">
        {onBack && (
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-2xl text-slate-400 hover:text-white transition-all mb-8 shadow-lg border border-slate-700/50"
            >
                <ArrowLeft size={20} />
                <span className="text-sm font-bold">Voltar</span>
            </button>
        )}
        
        <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                Invista no seu <span className="text-emerald-500 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Futuro</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                Escolha o plano ideal para acelerar sua jornada rumo à independência financeira.
            </p>
        </div>
      </div>

      {/* GRID DE PLANOS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start px-2">
        
        {/* --- PLANO 1: INICIANTE --- */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-full opacity-80">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Zap size={20} className="text-slate-500" /> Iniciante
            </h3>
            <p className="text-slate-400 text-sm mb-6">Para começar a organizar a casa.</p>
            
            <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-slate-500 font-bold">R$</span>
                <span className="text-4xl font-black text-white">0,00</span>
            </div>

            <button disabled className="w-full py-4 bg-slate-800/50 text-slate-500 rounded-2xl font-bold mb-8 border border-slate-800">
                {currentPlan === 'free' ? 'Seu Plano Atual' : 'Plano Gratuito'}
            </button>

            <div className="space-y-4">
                <FeatureItem active={true} text="25 Lançamentos Mensais" />
                <FeatureItem active={true} text="Simulador de Juros Compostos" />
                <FeatureItem active={true} text="5 Conversas com IA / mês" />
                <FeatureItem active={false} text="Gerenciador no Desktop" />
            </div>
        </div>

        {/* --- PLANO 2: ESSENCIAL (PRO) --- */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-[2.5rem] p-8 flex flex-col h-full relative overflow-hidden shadow-2xl shadow-indigo-900/10">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Star size={20} className="text-indigo-400" /> Essencial (Pro)
            </h3>
            <p className="text-slate-400 text-sm mb-6">Para quem quer organizar de verdade.</p>
            
            <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-slate-500 font-bold">R$</span>
                <span className="text-4xl font-black text-white">9,90</span>
                <span className="text-sm text-slate-500">/mês</span>
            </div>

            <button 
                onClick={() => handleSubscribe(STRIPE_LINKS.pro_monthly)}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg ${currentPlan === 'pro' ? 'bg-slate-700 text-slate-400 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
            >
                {currentPlan === 'pro' ? 'Seu Plano Atual' : 'Assinar PRO'}
            </button>

            <div className="space-y-4 mt-8">
                <FeatureItem active={true} text="Lançamentos Ilimitados" />
                <FeatureItem active={true} text="Acesso total no Desktop" />
                <FeatureItem active={true} text="Categorias Personalizadas" />
                <FeatureItem active={true} text="IA: Especialista em Caixa" />
            </div>
        </div>

        {/* --- PLANO 3: LIBERDADE (PREMIUM) --- */}
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-[2.5rem] p-8 flex flex-col h-full relative shadow-2xl shadow-emerald-500/10 md:scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-xl">
                Recomendado
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Crown size={20} className="text-yellow-500" /> Liberdade (Premium)
            </h3>
            <p className="text-slate-400 text-sm mb-6">Acelere sua independência financeira.</p>
            
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-slate-500 font-bold">R$</span>
                <span className="text-5xl font-black text-white">19,90</span>
                <span className="text-sm text-slate-500">/mês</span>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
                <p className="text-[10px] text-emerald-200 font-black uppercase tracking-widest text-center">
                    Oferta Anual: R$ 199,00 (Ganhe 2 meses)
                </p>
            </div>

            <div className="space-y-3 mb-8">
                <button 
                    onClick={() => handleSubscribe(STRIPE_LINKS.fire_annual)}
                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg transition-all active:scale-95 ${currentPlan === 'premium' ? 'bg-slate-700 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'}`}
                >
                    {currentPlan === 'premium' ? 'Seu Plano Atual' : 'Assinar ANUAL'}
                </button>
                
                <button 
                    onClick={() => handleSubscribe(STRIPE_LINKS.fire_monthly)}
                    className="w-full py-3 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Plano Mensal
                </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
                <FeatureItem active={true} text="IA: Analista de Dados RAG" />
                <FeatureItem active={true} text="Relatórios Estratégicos Mobile" />
                <FeatureItem active={true} text="Cotações em Tempo Real" />
                <FeatureItem active={true} text="Suporte Prioritário" />
            </div>
        </div>

      </div>
      
      <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-16 max-w-md mx-auto leading-relaxed">
        Pagamento seguro via Stripe Brasil.<br/>Sua assinatura pode ser cancelada a qualquer momento.
      </p>
    </div>
  );
};

// Componente auxiliar
const FeatureItem = ({ active, text }: { active: boolean, text: string }) => (
    <div className={`flex items-center gap-3 ${active ? 'text-slate-300' : 'text-slate-600 italic'}`}>
        {active ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check size={12} className="text-emerald-500" strokeWidth={4} />
            </div>
        ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <X size={12} className="text-slate-600" />
            </div>
        )}
        <span className="text-xs font-bold">{text}</span>
    </div>
);

export default PricingPage;