
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

  const PlanCard = ({ title, price, period, features, recommended, cta, action, disabled, current }: any) => (
    <div 
      className={`relative rounded-3xl p-8 flex flex-col border transition-all ${
          recommended 
              ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500 shadow-2xl shadow-emerald-900/30 z-10 scale-105' 
              : 'bg-slate-800 border-slate-700 opacity-90 hover:opacity-100 hover:border-slate-500'
      }`}
    >
      {recommended && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap">
              ⭐ Mais Popular
          </div>
      )}

      <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-slate-400 font-bold">R$</span>
              <span className="text-4xl font-black text-white">{price}</span>
              {period && <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{period}</span>}
          </div>
      </div>

      <ul className="space-y-4 mb-8 flex-grow">
          {features.map((feature: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  {feature}
              </li>
          ))}
      </ul>

      <button 
          onClick={action}
          disabled={disabled || current}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
              current 
                ? 'bg-slate-700 text-slate-400 cursor-default'
                : recommended 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
          {disabled ? <span className="animate-spin text-lg">↻</span> : current ? 'Plano Atual' : cta}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div className="text-center mb-12">
        <button onClick={onBack} className="text-slate-500 hover:text-white mb-6 text-sm font-bold flex items-center justify-center gap-2 mx-auto">
            <span>←</span> Voltar ao Painel
        </button>
        <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-500/30">
          Planos & Preços
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
          Invista na sua Liberdade
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Escolha a ferramenta certa para o tamanho dos seus sonhos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* FREE */}
        <PlanCard 
          title={PLANS.FREE.label}
          price={PLANS.FREE.price.toFixed(2)}
          period=""
          features={PLANS.FREE.features}
          cta="Plano Atual"
          current={currentPlan === 'free'}
          disabled={false}
          action={() => {}}
        />

        {/* PRO */}
        <PlanCard 
          title={PLANS.PRO.label}
          price={PLANS.PRO.price.toFixed(2).replace('.', ',')}
          period={PLANS.PRO.period}
          features={PLANS.PRO.features}
          recommended={true}
          cta="Assinar Pro"
          current={currentPlan === 'pro'}
          disabled={loadingPlan === PLANS.PRO.id}
          action={() => handleSubscribe(PLANS.PRO.id as SubscriptionPlanId)}
        />

        {/* PREMIUM */}
        <PlanCard 
          title={PLANS.PREMIUM.label}
          price={PLANS.PREMIUM.price.toFixed(2).replace('.', ',')}
          period={PLANS.PREMIUM.period}
          features={PLANS.PREMIUM.features}
          cta="Assinar Premium"
          current={currentPlan === 'premium'}
          disabled={loadingPlan === PLANS.PREMIUM.id}
          action={() => handleSubscribe(PLANS.PREMIUM.id as SubscriptionPlanId)}
        />
      </div>

      <div className="mt-16 text-center">
        <p className="text-slate-500 text-sm">
          Pagamento seguro via Stripe. Cancele quando quiser.<br/>
          Dúvidas? Entre em contato com suporte@financasproinvest.com.br
        </p>
      </div>
    </div>
  );
};

export default UpgradePage;
