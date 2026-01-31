import React from 'react';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface PricingProps {
  onNavigate: (tool: string) => void;
  currentPlan: 'free' | 'pro' | 'premium';
  onBack: () => void;
}

const PricingPage: React.FC<PricingProps> = ({ onNavigate, currentPlan, onBack }) => {
  const isNative = Capacitor.isNativePlatform();

  const handleSubscribe = async (plan: string) => {
    // No Android, abrimos o site para evitar taxas da loja, mas de forma discreta
    const url = `https://www.financasproinvest.com.br/checkout/${plan}`;
    if (isNative) {
      await Browser.open({ url });
    } else {
      window.location.href = url;
    }
  };

  const PlanCard = ({ title, price, features, recommended = false, type }: any) => (
    <div className={`relative p-8 rounded-[2.5rem] border ${recommended ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800'} flex flex-col`}>
      {recommended && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Recomendado</div>}
      
      <h3 className="text-xl font-black text-white mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-3xl font-black text-white">{price}</span>
        {price !== 'Grátis' && <span className="text-slate-500 text-sm">/mês</span>}
      </div>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* LÓGICA DE BOTÃO "SAFE FOR GOOGLE" */}
      {currentPlan === type ? (
        <button disabled className="w-full py-4 bg-slate-700/50 text-slate-400 rounded-2xl font-bold cursor-not-allowed">Plano Atual</button>
      ) : (
        <button 
          onClick={() => handleSubscribe(type)}
          className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${recommended ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
        >
          {isNative ? 'Gerenciar no Site' : 'Começar Agora'}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-500 pb-32">
      <button onClick={onBack} className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2">← Voltar</button>
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6">Invista no seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Futuro</span></h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Escolha o plano ideal para acelerar sua liberdade financeira com inteligência artificial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PlanCard 
          title="Starter" 
          price="Grátis" 
          type="free"
          features={['Gestão de gastos manual', 'Gráficos básicos', 'Acesso limitado ao Nexus IA', 'Sem sincronização bancária']} 
        />
        <PlanCard 
          title="Pro" 
          price="R$ 29,90" 
          type="pro"
          recommended={true}
          features={['Tudo do Free', 'Nexus IA Ilimitado', 'Consultoria de Investimentos', 'Sincronização Bancária (Open Finance)', 'Relatórios em PDF']} 
        />
        <PlanCard 
          title="Wealth" 
          price="R$ 49,90" 
          type="premium"
          features={['Tudo do Pro', 'Gestão de Carteira Completa', 'Rebalanceamento Automático', 'Acesso Antecipado a Features', 'Suporte Prioritário']} 
        />
      </div>

      {isNative && (
        <p className="text-center text-slate-500 text-xs mt-8 max-w-md mx-auto">
          Para garantir a segurança dos seus dados e a melhor oferta, as assinaturas são gerenciadas exclusivamente através do nosso portal web seguro.
        </p>
      )}
    </div>
  );
};

export default PricingPage;