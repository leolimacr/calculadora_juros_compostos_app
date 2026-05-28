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
    if (!isAuthenticated) {
      if (window.confirm("Você precisa estar logado para assinar. Ir para login?")) {
        onNavigate('login');
      }
      return;
    }

    if (currentPlan === planTarget || (currentPlan === 'premium' && planTarget === 'pro')) {
      alert("Você já possui este plano ativo!");
      return;
    }

    if (!userId) {
      alert("ERRO: ID do usuário não encontrado. Tente sair e entrar na conta novamente.");
      return;
    }

    const finalUrl = `${baseUrl}?client_reference_id=${userId}`;

    if (isNative) {
      await Browser.open({ url: finalUrl });
    } else {
      window.open(finalUrl, '_blank');
    }
  };

  const proFeatures = [
    { icon: Zap, text: 'Lance quantas transações quiser, sem parar no meio da rotina' },
    { icon: BarChart3, text: 'Veja seu mês com mais clareza usando filtros e médias avançadas' },
    { icon: Brain, text: 'Receba insights mais úteis com uma leitura mais completa da sua rotina' },
    { icon: Shield, text: 'Tenha uma experiência mais fluida para cuidar do dinheiro no dia a dia' },
  ];

  const premiumFeatures = [
    { icon: CheckCircle, text: 'Tudo do Pro incluído, sem trocar o que já funciona' },
    { icon: Target, text: 'Central Financeira como camada principal para conectar rotina, dívidas, investimentos e patrimônio' },
    { icon: Brain, text: 'Mais contexto para o Nexus orientar prioridades com visão mais ampla' },
    { icon: Shield, text: 'Acesso à camada mais completa do ecossistema Finanças Pro Invest' },
  ];

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-4 text-center">
        <button
          onClick={onBack}
          className="mb-10 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest mx-auto"
        >
          ← Voltar
        </button>

        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">
          Free, Pro e Premium
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          Comece no Controla.<br />
          <span className="text-emerald-600">
            Evolua para o ecossistema completo.
          </span>
        </h1>
        <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
          O Free coloca você em movimento. O Pro remove a fricção do controle diário.
          O Premium deixa de ser só controle e passa a ser acompanhamento financeiro mais completo,
          com a Central como camada principal de organização.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Free</p>
            <h3 className="text-xl font-black text-slate-900">Entrada</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Para testar o método, começar no Controla e sentir valor antes de subir de nível.
            </p>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-black text-slate-900">R$ 0</span>
            <span className="text-slate-400 text-sm"> /sempre</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
              Até 30 lançamentos no Controla
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
              Visão básica da sua rotina financeira
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
              Visão inicial da Central para entender a evolução do produto
            </li>
          </ul>

          <button
            disabled
            className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold uppercase text-[11px] tracking-widest cursor-default"
          >
            {currentPlan === 'free' ? 'Plano atual' : 'Disponível'}
          </button>
        </div>

        <div className={`rounded-2xl border p-6 flex flex-col transition-all ${
          currentPlan === 'pro'
            ? 'border-sky-400 bg-sky-50'
            : 'border-sky-200 bg-white shadow-lg shadow-sky-100'
        }`}>
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-1">Pro</p>
            <h3 className="text-xl font-black text-slate-900">Controla completo</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Para quem quer transformar o Controla em rotina séria, sem pagar ainda pela camada completa do ecossistema.
            </p>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-black text-slate-900">R$ 9,90</span>
            <span className="text-slate-400 text-sm"> /mês</span>
            <p className="text-[11px] text-sky-600 font-bold mt-1">
              O plano do Controla para rotina sem travas
            </p>
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
            {currentPlan === 'pro'
              ? <><CheckCircle size={14} /> Plano ativo</>
              : isAuthenticated
                ? <>Assinar Pro <ArrowRight size={14} /></>
                : 'Fazer login'}
          </button>
        </div>

        <div className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
          currentPlan === 'premium'
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-emerald-300 bg-white shadow-xl shadow-emerald-100'
        }`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow">
            Próximo nível
          </div>

          <div className="mb-5 mt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Premium</p>
            <h3 className="text-xl font-black text-slate-900">Finanças Pro Invest completo</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Para quem quer parar de olhar peças soltas e passar a acompanhar a vida financeira como um sistema.
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

      <div className="max-w-2xl mx-auto px-4 pb-16 text-center space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <p className="text-sm font-black text-slate-800 mb-1">O plano certo depende do estágio, não do ego.</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Free para começar. Pro para rotina séria. Premium para visão completa. Assim a escada de valor fica clara e natural.
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