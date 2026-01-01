
import React, { useState } from 'react';
import { STRIPE_PLANS, SubscriptionPlanId } from '../config/stripePlans';
import { startCheckout } from '../services/stripeService';
import { useAuth } from '../contexts/AuthContext';

interface UpgradePageProps {
  onBack: () => void;
}

const UpgradePage: React.FC<UpgradePageProps> = ({ onBack }) => {
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlanId | null>(null);

  const handleSubscribe = async (planId: SubscriptionPlanId) => {
    if (!isAuthenticated) {
        alert("Faça login ou crie uma conta para assinar.");
        return;
    }
    setLoadingPlan(planId);
    await startCheckout(planId);
    setLoadingPlan(null);
  };

  const plans = Object.values(STRIPE_PLANS);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 pb-24">
      
      {/* Header */}
      <div className="text-center mb-12">
        <button onClick={onBack} className="text-slate-500 hover:text-white mb-6 text-sm font-bold flex items-center justify-center gap-2 mx-auto">
            <span>←</span> Voltar
        </button>
        <span className="inline-block py-1 px-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 text-xs font-bold uppercase tracking-widest mb-4 shadow-lg shadow-emerald-500/20">
          Upgrade
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
          Escolha o plano que<br />combina com você
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Desbloqueie todo o potencial do Finanças Pro Invest. Cancele quando quiser.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.planId} 
            className={`relative bg-slate-800 rounded-3xl p-8 flex flex-col border transition-all hover:scale-105 ${
                plan.recommended 
                    ? 'border-emerald-500 shadow-2xl shadow-emerald-900/20 order-first md:order-none md:-mt-4 md:mb-4 bg-gradient-to-b from-slate-800 to-slate-900' 
                    : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider">
                    Recomendado
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.label}</h3>
                <p className="text-sm text-slate-400 min-h-[40px]">{plan.description}</p>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-sm text-slate-400 font-bold">R$</span>
                    <span className="text-4xl font-black text-white">{plan.amountBRL.toFixed(2).replace('.', ',')}</span>
                    <span className="text-slate-500 font-bold">/{plan.billingPeriod === 'monthly' ? 'mês' : 'ano'}</span>
                </div>
                {plan.billingPeriod === 'annual' && (
                    <p className="text-xs text-emerald-400 font-bold mt-2">
                        Cobrado anualmente (Economia real)
                    </p>
                )}
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
                {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="text-emerald-500 font-bold">✓</span>
                        {feature}
                    </li>
                ))}
            </ul>

            <button 
                onClick={() => handleSubscribe(plan.planId)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                    plan.recommended 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                } ${loadingPlan !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loadingPlan === plan.planId ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                    'Assinar Agora'
                )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center border-t border-slate-800 pt-8">
        <p className="text-sm text-slate-500 mb-2">
            Pagamento seguro via Stripe 🔒
        </p>
        <p className="text-xs text-slate-600">
            Dúvidas? Entre em contato com suporte@financasproinvest.com.br
        </p>
      </div>
    </div>
  );
};

export default UpgradePage;
