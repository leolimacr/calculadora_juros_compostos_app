import React, { useState, useEffect, useCallback } from 'react';
import { Check, CheckCircle, Zap, Shield, BarChart3, Target, ArrowRight, Crown, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useEntitlement } from '../hooks/useEntitlement';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../hooks/useNavigation';
import { PLANS } from '../../config/stripePlans';
import { isBillingReady, purchaseViaGooglePlay, PLAY_STORE_PRODUCT_IDS } from '../services/purchaseService';
import VipWaitlistModal from './Billing/VipWaitlistModal';
import type { BillingTier, BillingStatus } from '../types/billing';

const TIER_ORDER: Record<BillingTier, number> = { free: 0, pro: 1, premium: 2 };

const PLAN_META = [
  {
    tier: 'free' as BillingTier,
    label: 'Free',
    title: 'Sua base',
    desc: 'O essencial para construir o hábito financeiro sem limite.',
    accent: 'slate',
    config: PLANS.FREE,
    // E7-11: copy de features em fonte única (config/stripePlans.ts).
    features: PLANS.FREE.features,
    featureIcons: [Check, Check, Check, Check, Check],
  },
  {
    tier: 'pro' as BillingTier,
    label: 'Pro',
    title: 'Seu passado',
    desc: 'Seus meses anteriores revelam sua verdadeira proteção.',
    accent: 'sky',
    config: PLANS.PRO,
    // E7-11: copy de features em fonte única (config/stripePlans.ts).
    features: PLANS.PRO.features,
    featureIcons: [Target, HistoryIcon, FileTextIcon, BarChart3, Check],
  },
  {
    tier: 'premium' as BillingTier,
    label: 'Premium',
    title: 'Sua soberania',
    desc: 'Rotina, dívidas, investimentos e patrimônio conectados num só comando.',
    accent: 'emerald',
    config: PLANS.PREMIUM,
    // E7-11: copy de features em fonte única (config/stripePlans.ts).
    features: PLANS.PREMIUM.features,
    featureIcons: [CheckCircle, Target, Shield, BarChart3, Zap, Check],
  },
];

function HistoryIcon(props: { size?: number; className?: string }) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function FileTextIcon(props: { size?: number; className?: string }) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}

interface ButtonConfig {
  label: string;
  action: 'checkout' | 'portal' | 'none';
  disabled: boolean;
}

function getButtonConfig(
  columnTier: BillingTier,
  effectiveTier: BillingTier,
  billingStatus: BillingStatus,
): ButtonConfig {
  const userOrder = TIER_ORDER[effectiveTier] ?? 0;
  const colOrder = TIER_ORDER[columnTier] ?? 0;

  if (columnTier === 'free') {
    return { label: effectiveTier === 'free' ? 'Atual' : 'Incluso', action: 'none', disabled: true };
  }

  if (effectiveTier !== 'free' && userOrder >= colOrder) {
    if (effectiveTier === columnTier) {
      if (billingStatus === 'past_due') return { label: 'Regularizar', action: 'portal', disabled: false };
      if (billingStatus === 'canceled') return { label: 'Reativar', action: 'portal', disabled: false };
      return { label: 'Gerenciar', action: 'portal', disabled: false };
    }
    return { label: 'Incluso', action: 'none', disabled: true };
  }

  if (!isBillingReady()) {
    return {
      label: `Garantir Vaga • ${columnTier === 'pro' ? 'Pro' : 'Premium'}`,
      action: 'checkout',
      disabled: false,
    };
  }

  if (effectiveTier !== 'free' && userOrder < colOrder) {
    return { label: 'Fazer Upgrade', action: 'checkout', disabled: false };
  }

  return { label: `Assinar ${columnTier === 'pro' ? 'Pro' : 'Premium'}`, action: 'checkout', disabled: false };
}

function getStatusBadge(billingStatus: BillingStatus): { label: string; color: string } | null {
  switch (billingStatus) {
    case 'trialing': return { label: 'Teste Gratuito', color: 'text-sky-600' };
    case 'active':   return null;
    case 'past_due': return { label: 'Pagamento Pendente', color: 'text-amber-600' };
    case 'canceled': return { label: 'Cancelado', color: 'text-slate-500' };
    default:         return null;
  }
}

const PricingPage: React.FC = () => {
  const { loading, effectiveTier, billingStatus } = useEntitlement();
  const { user } = useAuth();
  const { handleNavigate } = useNavigation();
  const isNative = Capacitor.isNativePlatform();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [selectedVipTier, setSelectedVipTier] = useState<BillingTier>('pro');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
      const timer = setTimeout(() => setCheckoutSuccess(false), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCheckout = useCallback(async (planId: string, tier: BillingTier) => {
    if (!user) {
      handleNavigate('login');
      return;
    }

    if (!isBillingReady()) {
      setSelectedVipTier(tier);
      setVipModalOpen(true);
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      if (isNative) {
        const playId = planId === 'premium_annual'
          ? PLAY_STORE_PRODUCT_IDS.premium_yearly
          : planId === 'premium_monthly'
            ? PLAY_STORE_PRODUCT_IDS.premium_monthly
            : PLAY_STORE_PRODUCT_IDS.pro_monthly;

        await purchaseViaGooglePlay(playId);
        setCheckoutSuccess(true);
      } else {
        const fn = httpsCallable(functions, 'createCheckoutSession');
        const result = await fn({
          planId,
          successUrl: window.location.origin + '/app/mais/pricing?checkout=success',
          cancelUrl: window.location.href,
        });
        const data = result.data as { sessionUrl: string };
        window.open(data.sessionUrl, '_blank');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar pagamento';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }, [user, isNative, handleNavigate]);

  const handlePortal = useCallback(async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const fn = httpsCallable(functions, 'createPortalSession');
      const result = await fn({ returnUrl: window.location.href });
      const data = result.data as { url: string };
      if (isNative) {
        await Browser.open({ url: data.url });
      } else {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao abrir gerenciamento';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }, [isNative]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-full mb-6" />
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-6" />
                <div className="space-y-2 mb-8">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-3 bg-slate-100 rounded w-full" />
                  ))}
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-4 text-center">
        <button
          onClick={() => handleNavigate('central')}
          className="mb-10 text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest mx-auto"
        >
          ← Voltar
        </button>

        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">
          Sua base. Seu passado. Sua soberania.
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          Três camadas,<br />
          <span className="text-emerald-600">uma evolução.</span>
        </h1>
        <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
          No Free, você constrói o hábito e vê sua proteção. No Pro, seu passado revela sua verdadeira segurança. No Premium, rotina, dívidas e patrimônio se conectam num só comando.
        </p>

        {!isBillingReady() && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800 shadow-sm">
            <Crown size={14} className="text-amber-600 shrink-0" />
            <span>Acesso Antecipado • Assinaturas em liberação gradual via Lista VIP</span>
          </div>
        )}
      </div>

      {checkoutSuccess && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center text-sm font-bold text-emerald-700">
            Assinatura ativada com sucesso! Bem-vindo ao {effectiveTier === 'premium' ? 'Premium' : effectiveTier === 'pro' ? 'Pro' : 'novo plano'}.
          </div>
        </div>
      )}

      {actionError && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-sm font-bold text-red-600">
            {actionError}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLAN_META.map((plan) => {
          const btn = getButtonConfig(plan.tier, effectiveTier, billingStatus);
          const statusBadge = effectiveTier === plan.tier ? getStatusBadge(billingStatus) : null;

          const accentMap: Record<string, { border: string; bg: string; btn: string; text: string; shadow: string }> = {
            slate: {
              border: 'border-slate-200',
              bg: 'bg-slate-50',
              btn: 'bg-slate-100 text-slate-500 cursor-default',
              text: 'text-slate-500',
              shadow: '',
            },
            sky: {
              border: effectiveTier === 'pro' ? 'border-sky-400' : 'border-sky-200',
              bg: effectiveTier === 'pro' ? 'bg-sky-50' : 'bg-white',
              btn: 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95',
              text: 'text-sky-500',
              shadow: 'shadow-lg shadow-sky-100',
            },
            emerald: {
              border: effectiveTier === 'premium' ? 'border-emerald-400' : 'border-emerald-300',
              bg: effectiveTier === 'premium' ? 'bg-emerald-50' : 'bg-white',
              btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95',
              text: 'text-emerald-600',
              shadow: 'shadow-xl shadow-emerald-100',
            },
          };

          const style = accentMap[plan.accent] ?? accentMap.slate;

          return (
            <div key={plan.tier} className={`relative rounded-2xl border ${style.border} ${style.bg} ${style.shadow} p-6 flex flex-col transition-all`}>
              {plan.tier === 'premium' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow">
                  Próximo nível
                </div>
              )}

              <div className="mb-5">
                <p className={`text-[10px] font-black uppercase tracking-widest ${style.text} mb-1`}>{plan.label}</p>
                <h3 className="text-xl font-black text-slate-900">{plan.title}</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-black text-slate-900">
                  {plan.tier === 'free' ? 'R$ 0' : `R$ ${plan.config.price.toFixed(2).replace('.', ',')}`}
                </span>
                <span className="text-slate-500 text-sm">
                  {plan.tier === 'free' ? ' /sempre' : plan.tier === 'premium' && billingCycle === 'yearly' ? ' /mês' : plan.config.period}
                </span>
                {plan.tier === 'premium' && billingCycle === 'yearly' && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5">R$ 199,00/ano — 2 meses grátis</p>
                )}
                {statusBadge && (
                  <p className={`text-[11px] font-bold mt-1 ${statusBadge.color}`}>{statusBadge.label}</p>
                )}
              </div>

              {plan.tier === 'premium' && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-full">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      billingCycle === 'yearly' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'
                    }`}
                  >
                    Anual
                  </button>
                </div>
              )}

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((text, idx) => {
                  const Icon = plan.featureIcons[idx] ?? Check;
                  const iconColor = plan.tier === 'pro' ? 'text-sky-500' : plan.tier === 'premium' ? 'text-emerald-500' : 'text-slate-500';
                  return (
                    <li key={text} className="flex items-start gap-2 text-sm text-slate-600">
                      <Icon size={15} className={`${iconColor} mt-0.5 shrink-0`} />
                      {text}
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => {
                  if (btn.disabled) return;
                  if (btn.action === 'checkout') {
                    const targetPlanId = plan.tier === 'premium'
                      ? (billingCycle === 'yearly' ? 'premium_annual' : 'premium_monthly')
                      : 'pro_monthly';
                    handleCheckout(targetPlanId, plan.tier);
                  } else if (btn.action === 'portal') {
                    handlePortal();
                  }
                }}
                disabled={btn.disabled || actionLoading}
                className={`w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 ${
                  btn.disabled ? style.btn : `${style.btn}`
                } ${actionLoading ? 'opacity-70' : ''}`}
              >
                {actionLoading && !btn.disabled ? (
                  <><Loader2 size={14} className="animate-spin" /> Aguarde...</>
                ) : btn.label === 'Gerenciar' ? (
                  <><Crown size={14} /> Gerenciar</>
                ) : btn.label === 'Regularizar' ? (
                  <><Crown size={14} /> Regularizar</>
                ) : btn.label === 'Reativar' ? (
                  <><Crown size={14} /> Reativar</>
                ) : btn.label === 'Incluso' || btn.label === 'Atual' ? (
                  <><Check size={14} /> {btn.label}</>
                ) : (
                  <>{btn.label} <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 text-center space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <p className="text-sm font-black text-slate-800 mb-1">Comece grátis. Evolua no seu ritmo.</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            O Free já inclui sua Base de Proteção e o essencial para o dia a dia. Suba de plano quando quiser mergulhar no passado ou assumir o comando completo.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Dúvidas? <a href="mailto:contato@financasproinvest.com.br" className="text-emerald-600 font-bold hover:underline">contato@financasproinvest.com.br</a>
        </p>
      </div>

      <VipWaitlistModal
        isOpen={vipModalOpen}
        onClose={() => setVipModalOpen(false)}
        tier={selectedVipTier}
        cycle={billingCycle}
      />
    </div>
  );
};

export default PricingPage;
