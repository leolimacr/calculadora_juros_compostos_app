import React, { useState } from 'react';
import { Check, CheckCircle, Zap, Shield, Brain, BarChart3, Target, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface PricingProps {
  onNavigate: (tool: string) => void;
  currentPlan: 'free' | 'pro' | 'premium';
  onBack: () => void;
  isAuthenticated: boolean;
  userId?: string; 
}

const PricingPage: React.FC<PricingProps> = ({ onNavigate, currentPlan, onBack, isAuthenticated, userId }) => {
  const isNative = Capacitor.isNativePlatform();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscriptionClick = async (baseUrl: string, planTarget: string) => {
    // 1. Verificação de Login
    if (!isAuthenticated) {
      if (window.confirm("Você precisa estar logado para assinar. Ir para login?")) {
        onNavigate('login');
      }
      return;
    }

    // 2. Verificação de Plano Existente
    if (currentPlan === planTarget || (currentPlan === 'premium' && planTarget === 'pro')) {
      alert("Você já possui este plano ativo!");
      return;
    }

    // 3. Verificação de ID (DIAGNÓSTICO COM ALERTA)
    if (!userId) {
      alert("ERRO: ID do usuário não encontrado. Tente sair e entrar na conta novamente.");
      return;
    }

    // 4. Construção do Link
    const finalUrl = `${baseUrl}?client_reference_id=${userId}`;

    // ⚠️ ALERTA DE TESTE (Vai aparecer na sua tela)
    // alert(`ID ENCONTRADO: ${userId}\n\nAbrindo Stripe...`);

    if (isNative) {
      await Browser.open({ url: finalUrl });
    } else {
      window.open(finalUrl, '_blank');
    }
  };
  const proFeatures = [
    { icon: Zap,      text: 'Lançamentos ilimitados — sem teto, sem corte' },
    { icon: Brain,    text: 'Nexus com memória de 120 dias do seu histórico' },
    { icon: Shield,   text: 'Histórico de conversas salvo por 30 dias' },
  ];

  const premiumFeatures = [
    { icon: Brain,     text: 'Nexus com memória de 4 anos — contexto real de longo prazo' },
    { icon: BarChart3, text: 'Web Search em tempo real: cotações, taxas e notícias no chat' },
    { icon: Target,    text: 'Histórico de conversas salvo por 90 dias' },
    { icon: Shield,    text: 'Acesso completo a todas as ferramentas do ecossistema' },
  ];

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-500">

      {/* HERO DA PRICING */}
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-4 text-center">
        <button
          onClick={onBack}
          className="mb-10 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest mx-auto"
        >
          ← Voltar
        </button>

        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">
          Planos
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          Quanto custa tomar decisões<br />
          <span className="text-emerald-600">
            sem clareza financeira?
          </span>
        </h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
          O Finanças Pro Invest centraliza dívidas, patrimônio e metas num só lugar —
          e o Nexus te diz o próximo passo certo. Escolha o plano que faz sentido pro seu momento.
        </p>
      </div>

      {/* CARDS */}
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* FREE */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gratuito</p>
            <h3 className="text-xl font-black text-slate-900">Para começar</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Veja como funciona, sem compromisso.
            </p>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-black text-slate-900">R$ 0</span>
            <span className="text-slate-400 text-sm"> /sempre</span>
          </div>
          <ul className="space-y-3 mb-8 flex-grow">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
              Até 30 lançamentos
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
              Nexus IA com memória de 10 dias
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
              Ferramentas de simulação gratuitas
            </li>
          </ul>
          <button
            disabled
            className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold uppercase text-[11px] tracking-widest cursor-default"
          >
            {currentPlan === 'free' ? 'Plano atual' : 'Disponível'}
          </button>
        </div>

        {/* PRO */}
        <div className={`rounded-2xl border p-6 flex flex-col transition-all ${
          currentPlan === 'pro'
            ? 'border-sky-400 bg-sky-50'
            : 'border-sky-200 bg-white shadow-lg shadow-sky-100'
        }`}>
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-1">Pro Mobile</p>
            <h3 className="text-xl font-black text-slate-900">Para quem quer controle</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Organize sua rotina financeira sem limitação de lançamentos.
            </p>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-black text-slate-900">R$ 9,90</span>
            <span className="text-slate-400 text-sm"> /mês</span>
            <p className="text-[11px] text-sky-600 font-bold mt-1">Controle financeiro real por R$ 9,90/mês</p>
          </div>
          <ul className="space-y-3 mb-8 flex-grow">
            {proFeatures.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2 text-sm text-slate-700">
                <Icon size={15} className="text-sky-500 mt-0.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscriptionClick('https://buy.stripe.com/dRm7sNdcCe8p2vn5nXaAw02', 'pro')}
            className={`w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 ${
              currentPlan === 'pro'
                ? 'bg-sky-600 text-white cursor-default'
                : 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95'
            }`}
          >
            {currentPlan === 'pro' ? <><CheckCircle size={14} /> Plano ativo</> : isAuthenticated ? <>Assinar Pro <ArrowRight size={14} /></> : 'Fazer login'}
          </button>
        </div>

        {/* PREMIUM */}
        <div className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
          currentPlan === 'premium'
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-emerald-300 bg-white shadow-xl shadow-emerald-100'
        }`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow">
            Mais escolhido
          </div>
          <div className="mb-5 mt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Premium Completo</p>
            <h3 className="text-xl font-black text-slate-900">Para quem quer crescer</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Ecossistema completo com IA de longo prazo e dados em tempo real.
            </p>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-black text-slate-900">
              {billingCycle === 'monthly' ? 'R$ 19,90' : 'R$ 16,58'}
            </span>
            <span className="text-slate-400 text-sm"> /mês</span>
            {billingCycle === 'yearly' && (
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">R$ 199,00/ano — 2 meses grátis</p>
            )}
          </div>

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

          <ul className="space-y-3 mb-8 flex-grow">
            {premiumFeatures.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2 text-sm text-slate-700">
                <Icon size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscriptionClick(
              billingCycle === 'monthly'
                ? 'https://buy.stripe.com/6oU8wRa0q4xPgmdcQpaAw01'
                : 'https://buy.stripe.com/4gMaEZc8y8O54Dv5nXaAw00',
              'premium'
            )}
            className={`w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 ${
              currentPlan === 'premium'
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
            }`}
          >
            {currentPlan === 'premium'
              ? <><CheckCircle size={14} /> Plano ativo</>
              : <>Assinar Premium <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>

      {/* GARANTIA */}
      <div className="max-w-2xl mx-auto px-4 pb-16 text-center space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <p className="text-sm font-black text-slate-800 mb-1">Sem fidelidade. Sem multa. Sem risco.</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Se o produto não entregar valor, você cancela em menos de 1 minuto direto pelo Stripe.
            Seus dados ficam salvos por 30 dias após o cancelamento.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Dúvidas? <a href="mailto:contato@financasproinvest.com.br" className="text-emerald-600 font-bold hover:underline">contato@financasproinvest.com.br</a>
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
