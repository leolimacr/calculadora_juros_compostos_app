import React, { useState } from 'react';
import { Check, ExternalLink, CheckCircle, Lock } from 'lucide-react';
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-500 pb-32">
      <button onClick={onBack} className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">← Voltar</button>
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Escolha sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Liberdade</span></h1>
        {/* Mostra o ID na tela para você confirmar visualmente */}
        <p className="text-slate-500 text-xs font-mono mb-4 bg-slate-900 inline-block px-4 py-1 rounded-full border border-slate-800">
           Sua ID: {userId || 'Carregando...'}
        </p>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Planos flexíveis para quem leva o patrimônio a sério.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* PLANO FREE */}
        <div className="p-8 rounded-[2.5rem] border bg-slate-900/50 border-slate-800 flex flex-col opacity-80">
          <h3 className="text-xl font-black text-white mb-1">Plano Free</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Essencial</p>
          <div className="mb-8"><span className="text-4xl font-black text-white">Grátis</span></div>
          <ul className="space-y-4 mb-8 flex-grow text-sm text-slate-400">
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Limite de 30 lançamentos</li>
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Nexus IA (Memória 10 dias)</li>
          </ul>
          <button disabled className="w-full py-4 bg-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-xs tracking-widest">
            {currentPlan === 'free' ? 'Plano Atual' : 'Disponível'}
          </button>
        </div>

        {/* PLANO PRO - R$ 9,90 */}
        <div className={`p-8 rounded-[2.5rem] border flex flex-col shadow-2xl transition-all ${currentPlan === 'pro' ? 'border-sky-500 bg-sky-500/5' : 'bg-slate-900/50 border-slate-800'}`}>
          <h3 className="text-xl font-black text-white mb-1">Pro Mobile</h3>
          <p className="text-xs text-sky-500 font-bold uppercase tracking-widest mb-6">Foco em Organização</p>
          <div className="mb-8"><span className="text-4xl font-black text-white">R$ 9,90</span><span className="text-slate-500 text-sm font-bold">/mês</span></div>
          <ul className="space-y-4 mb-8 flex-grow text-sm text-slate-300">
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Lançamentos Ilimitados</li>
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Nexus IA (Memória 120 dias)</li>
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Histórico de Chat (30 dias)</li>
          </ul>
          <button 
            onClick={() => handleSubscriptionClick("https://buy.stripe.com/dRm7sNdcCe8p2vn5nXaAw02", 'pro')}
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${currentPlan === 'pro' ? 'bg-sky-600 text-white cursor-default' : 'bg-slate-100 hover:bg-white text-black active:scale-95'}`}
          >
            {currentPlan === 'pro' ? <><CheckCircle size={14}/> Plano Ativo</> : (isAuthenticated ? 'Assinar Agora' : 'Fazer Login')}
          </button>
        </div>

        {/* PLANO PREMIUM */}
        <div className={`relative p-8 rounded-[2.5rem] border flex flex-col shadow-2xl transition-all ${currentPlan === 'premium' ? 'border-emerald-500 bg-emerald-500/5' : 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500/30'}`}>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Recomendado</div>
          <h3 className="text-xl font-black text-white mb-1">Premium Completo</h3>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-6">O Poder do Ecossistema</p>
          <div className="mb-4">
            <span className="text-4xl font-black text-white">{billingCycle === 'monthly' ? 'R$ 19,90' : 'R$ 199,00'}</span>
            <span className="text-slate-500 text-sm font-bold">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
          </div>
          
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl mb-8 w-full border border-slate-700">
            <button onClick={() => setBillingCycle('monthly')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${billingCycle === 'monthly' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>Mensal</button>
            <button onClick={() => setBillingCycle('yearly')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${billingCycle === 'yearly' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'}`}>Anual (-17%)</button>
          </div>

          <ul className="space-y-4 mb-8 flex-grow text-sm text-slate-200">
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Nexus IA (Memória 4 anos)</li>
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Histórico de Chat (90 dias)</li>
            <li className="flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5" /> Nexus Web Search (Real-time)</li>
          </ul>
          <button 
            onClick={() => handleSubscriptionClick(billingCycle === 'monthly' ? "https://buy.stripe.com/6oU8wRa0q4xPgmdcQpaAw01" : "https://buy.stripe.com/4gMaEZc8y8O54Dv5nXaAw00", 'premium')}
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${currentPlan === 'premium' ? 'bg-emerald-600 text-white cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95'}`}
          >
            {currentPlan === 'premium' ? <><CheckCircle size={14}/> Plano Ativo</> : 'Assinar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;