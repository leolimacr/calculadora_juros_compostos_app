import React from 'react';

// Links do Stripe (COLE SEUS LINKS REAIS AQUI NOVAMENTE)
const STRIPE_LINKS = {
    pro_monthly: "https://buy.stripe.com/dRm7sNdcCe8p2vn5nXaAw02", // Link R$ 9,90
    fire_annual: "https://buy.stripe.com/4gMaEZc8y8O54Dv5nXaAw00", // Link R$ 199,00
    fire_monthly: "https://buy.stripe.com/6oU8wRa0q4xPgmdcQpaAw01" // Link R$ 19,90
};

const PricingPage: React.FC<any> = ({ onNavigate, currentPlan, onBack }) => {

  return (
    <div className="min-h-screen bg-[#020617] text-white py-12 px-4 animate-in fade-in duration-700">
      
      {/* CABEÇALHO */}
      <div className="max-w-7xl mx-auto text-center mb-16 relative">
        {onBack && (
            <button onClick={onBack} className="absolute left-0 top-0 md:hidden bg-slate-800 p-2 rounded-lg text-slate-400">
                ← Voltar
            </button>
        )}
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Invista no seu <span className="text-emerald-500">Futuro</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Escolha o plano ideal para acelerar sua jornada rumo à independência financeira.
        </p>
      </div>

      {/* GRID DE PLANOS */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-start">
        
        {/* --- PLANO 1: INICIANTE (FREE) --- */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8 flex flex-col h-full hover:border-slate-700 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Iniciante</h3>
            <p className="text-slate-400 text-sm mb-6">Para começar a organizar a casa.</p>
            
            <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-slate-500 font-bold">R$</span>
                <span className="text-4xl font-black text-white">0,00</span>
            </div>

            <button disabled={true} className="w-full py-4 bg-slate-800 text-slate-400 rounded-xl font-bold mb-8 cursor-not-allowed border border-slate-700">
                {currentPlan === 'free' ? 'Seu Plano Atual' : 'Plano Básico'}
            </button>

            <div className="space-y-4 text-sm">
                <FeatureItem active={true} text="Acesso a 3 Ferramentas Básicas" />
                <FeatureItem active={true} text="Simulador de Juros Compostos" />
                <FeatureItem active={true} text="Calculadora de Inflação" />
                <FeatureItem active={false} text="Consultor IA Ilimitado" />
                <FeatureItem active={false} text="Ferramentas FIRE e Otimizador" />
            </div>
        </div>

        {/* --- PLANO 2: ESSENCIAL (PRO) --- */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-[2rem] p-8 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <h3 className="text-xl font-bold text-white mb-2">Essencial (Pro)</h3>
            <p className="text-slate-400 text-sm mb-6">Para quem quer organizar de verdade.</p>
            
            <div className="flex items-baseline gap-1 mb-8">
                <span className="text-sm text-slate-500 font-bold">R$</span>
                <span className="text-4xl font-black text-white">9,90</span>
                <span className="text-sm text-slate-500">/mês</span>
            </div>

            {/* BOTÃO TRANSFORMADO EM LINK DIRETO (A) */}
            <a 
                href={STRIPE_LINKS.pro_monthly}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center py-4 rounded-xl font-bold mb-8 shadow-lg transition-all active:scale-95 ${currentPlan === 'pro' ? 'bg-slate-700 text-slate-400 pointer-events-none' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'}`}
            >
                {currentPlan === 'pro' ? 'Seu Plano Atual' : 'Assinar PRO'}
            </a>

            <div className="space-y-4 text-sm">
                <FeatureItem active={true} text="6 Ferramentas Essenciais" />
                <FeatureItem active={true} text="Otimizador de Dívidas" />
                <FeatureItem active={true} text="Simulador de Dividendos" />
                <FeatureItem active={true} text="Histórico de Chat (90 dias)" />
                <FeatureItem active={false} text="Análises Avançadas de IA" />
            </div>
        </div>

        {/* --- PLANO 3: LIBERDADE (FIRE) --- */}
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-[2rem] p-8 flex flex-col h-full relative shadow-2xl shadow-emerald-900/10 scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Recomendado
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Liberdade (FIRE)</h3>
            <p className="text-slate-400 text-sm mb-6">Acelere sua independência financeira.</p>
            
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-slate-500 font-bold">R$</span>
                <span className="text-5xl font-black text-white">19,90</span>
                <span className="text-sm text-slate-500">/mês</span>
            </div>

            {/* BOX PROMOCIONAL ANUAL */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                <p className="text-xs text-emerald-200 font-bold flex items-center gap-2">
                    <span>🔥</span> Oferta Anual: Pague R$ 199,00 à vista e ganhe 2 meses grátis.
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {/* Botão Anual (Principal) - LINK DIRETO */}
                <a 
                    href={STRIPE_LINKS.fire_annual}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-4 rounded-xl font-black uppercase tracking-wide shadow-lg transition-all active:scale-95 ${currentPlan === 'premium' ? 'bg-slate-700 text-slate-400 pointer-events-none' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'}`}
                >
                    {currentPlan === 'premium' ? 'Seu Plano Atual' : 'Assinar ANUAL (R$ 199)'}
                </a>
                
                {/* Botão Mensal (Secundário) - LINK DIRETO */}
                <a 
                    href={STRIPE_LINKS.fire_monthly}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm transition-all"
                >
                    Prefiro Mensal (R$ 19,90)
                </a>
            </div>

            <div className="space-y-4 text-sm pt-4 border-t border-slate-800">
                <FeatureItem active={true} text="TUDO do plano PRO" />
                <FeatureItem active={true} text="Calculadora FIRE Avançada" />
                <FeatureItem active={true} text="Consultor IA VIP (Memória Ilimitada)" />
                <FeatureItem active={true} text="Dados de Ações em Tempo Real" />
                <FeatureItem active={true} text="Suporte VIP via WhatsApp" />
            </div>
        </div>

      </div>
      
      <p className="text-center text-slate-500 text-xs mt-16">
        Pagamento seguro via Stripe. Cancele a qualquer momento nas configurações.
      </p>
    </div>
  );
};

// Componente auxiliar
const FeatureItem = ({ active, text }: { active: boolean, text: string }) => (
    <div className={`flex items-center gap-3 ${active ? 'text-slate-300' : 'text-slate-600'}`}>
        {active ? (
            <span className="text-emerald-500 font-bold text-lg">✓</span>
        ) : (
            <span className="text-slate-700 text-lg">✕</span>
        )}
        <span>{text}</span>
    </div>
);

export default PricingPage;