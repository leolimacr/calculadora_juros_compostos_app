
import React, { useState, useEffect } from 'react';
import { PLANS, SubscriptionPlanId } from '../config/stripePlans';
import { startCheckout } from '../services/stripeService';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import { trackViewUpgradePage } from '../services/analyticsService';

interface UpgradePageProps {
  onBack: () => void;
}

const UpgradePage: React.FC<UpgradePageProps> = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  const { plan: currentPlan } = useSubscriptionAccess();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    trackViewUpgradePage();
  }, []);

  const handleSubscribe = async (planId: SubscriptionPlanId) => {
    if (!isAuthenticated) {
        alert("Faça login ou crie uma conta para assinar.");
        return;
    }
    setLoadingPlan(planId);
    try {
        await startCheckout(planId);
    } catch (error) {
        console.error("Erro no checkout UI:", error);
    }
    setTimeout(() => setLoadingPlan(null), 3000); 
  };

  const PlanCard = ({ planConfig, current, disabled }: { planConfig: any, current: boolean, disabled: boolean }) => {
    const isFree = planConfig.id === 'free';
    const isPro = planConfig.id.includes('pro');
    
    return (
        <div className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${
            planConfig.recommended 
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500 shadow-2xl shadow-emerald-900/20 scale-105 z-10' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }`}>
            {planConfig.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap">
                    Mais Popular
                </div>
            )}

            <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">{planConfig.label}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-slate-400 font-bold">R$</span>
                    <span className="text-4xl font-black text-white">{planConfig.price.toFixed(2).replace('.', ',')}</span>
                    {planConfig.period && <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{planConfig.period}</span>}
                </div>
                {planConfig.trialDays && (
                    <p className="text-xs text-emerald-400 font-bold mt-2 bg-emerald-900/30 py-1 px-2 rounded inline-block">
                        {planConfig.trialDays} dias grátis
                    </p>
                )}
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
                {planConfig.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className={`font-bold text-xs flex items-center justify-center w-5 h-5 rounded-full ${isFree ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500 text-slate-900'}`}>✓</span>
                        {feature}
                    </li>
                ))}
            </ul>

            <button 
                onClick={() => !isFree && !current && handleSubscribe(planConfig.id)}
                disabled={disabled || current || isFree}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                    current 
                        ? 'bg-slate-700 text-slate-400 cursor-default border border-slate-600'
                        : isFree 
                            ? 'bg-slate-700 text-slate-400 cursor-default'
                            : planConfig.recommended 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' 
                                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {disabled ? <span className="animate-spin text-lg">↻</span> : current ? 'Plano Atual' : isFree ? 'Plano Atual' : `Testar ${planConfig.label}`}
            </button>
            
            {!isFree && !current && (
                <p className="text-[10px] text-center text-slate-500 mt-3">
                    Cancele a qualquer momento.
                </p>
            )}
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 pb-32">
      <div className="text-center mb-16">
        <button onClick={onBack} className="text-slate-500 hover:text-white mb-6 text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors">
            <span>←</span> Voltar ao Painel
        </button>
        <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-500/20">
          Planos & Preços
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
          Escolha o Plano Perfeito
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Tenha acesso ilimitado a todas as ferramentas financeiras e tome decisões com dados profissionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
        <PlanCard 
            planConfig={PLANS.FREE} 
            current={currentPlan === 'free'} 
            disabled={false} 
        />
        <PlanCard 
            planConfig={PLANS.PRO} 
            current={currentPlan === 'pro'} 
            disabled={loadingPlan === PLANS.PRO.id} 
        />
        <PlanCard 
            planConfig={PLANS.PREMIUM} 
            current={currentPlan === 'premium'} 
            disabled={loadingPlan === PLANS.PREMIUM.id} 
        />
      </div>

      <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-white text-center mb-8">Perguntas Frequentes</h3>
          <div className="space-y-4">
              <details className="bg-slate-800 rounded-xl border border-slate-700 group">
                  <summary className="p-6 font-bold text-white cursor-pointer list-none flex justify-between items-center">
                      Posso cancelar quando quiser?
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6 text-slate-400 text-sm">Sim. Não há fidelidade. Você pode cancelar a assinatura direto pelo painel e continuará com acesso até o fim do período pago.</div>
              </details>
              <details className="bg-slate-800 rounded-xl border border-slate-700 group">
                  <summary className="p-6 font-bold text-white cursor-pointer list-none flex justify-between items-center">
                      Como funciona o teste grátis?
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6 text-slate-400 text-sm">Você tem 7 dias de acesso total sem cobrança. Se não gostar, basta cancelar antes do 7º dia e nada será cobrado do seu cartão.</div>
              </details>
          </div>
      </div>
    </div>
  );
};

export default UpgradePage;
