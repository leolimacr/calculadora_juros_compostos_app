import React from 'react';
import { Browser } from '@capacitor/browser';

const PricingPage: React.FC<any> = ({ onNavigate, currentPlan, onBack }) => { // onBack adicionado
  const openCheckout = async () => {
    // Redireciona para o site oficial (página de preços/checkout)
    await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing' });
  };

  const PlanCard = ({ name, price, period, color, featured }: any) => (
    <div className={`p-6 rounded-[2.5rem] border-2 relative ${featured ? 'border-emerald-500 bg-slate-800' : 'border-slate-800 bg-slate-900/50'}`}>
        {featured && <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg tracking-widest">Recomendado</div>}
        <h3 className={`text-lg font-black uppercase tracking-widest mb-1 text-${color}-400`}>{name}</h3>
        <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-black text-white">{price}</span>
            <span className="text-sm text-slate-500">{period}</span>
        </div>
        <button onClick={openCheckout} className={`w-full py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all ${featured ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'}`}>
            Escolher Plano
        </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 pt-4 animate-in slide-in-from-bottom">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="bg-slate-800 p-3 rounded-xl text-slate-300 hover:text-white">←</button>
        <h2 className="text-2xl font-black text-white">Planos Premium</h2>
      </div>
      
      <div className="space-y-4">
        <PlanCard name="Start" price="R$ 9,90" period="/mês" color="blue" />
        <PlanCard name="Pro" price="R$ 19,90" period="/mês" color="emerald" featured={true} />
        <PlanCard name="Pro Anual" price="R$ 199,00" period="/ano" color="indigo" />
      </div>
    </div>
  );
};
export default PricingPage;