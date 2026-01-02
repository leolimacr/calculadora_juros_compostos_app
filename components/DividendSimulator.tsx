
import React, { useState } from 'react';
import { calculateDividends, formatCurrency, maskCurrency } from '../utils/calculations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Breadcrumb from './Breadcrumb';
import Paywall from './Paywall';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

interface DividendSimulatorProps {
  isPrivacyMode?: boolean;
  onNavigate: (path: string) => void;
}

const DividendSimulator: React.FC<DividendSimulatorProps> = ({ isPrivacyMode = false, onNavigate }) => {
  const { hasSitePremium, loadingSubscription } = useSubscriptionAccess();
  
  const [input, setInput] = useState({
    initialInvestment: 1000,
    monthlyContribution: 500,
    assetPrice: 10,
    monthlyYield: 0.8,
    years: 10
  });

  const ToolInput = ({ label, value, onChange, prefix, suffix, step = 1 }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">{prefix}</span>}
        <input
          type="number"
          step={step}
          className={`w-full bg-slate-900 border border-slate-600 rounded-xl py-3 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'}`}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{suffix}</span>}
      </div>
    </div>
  );

  if (loadingSubscription) {
    return <div className="w-full h-96 flex items-center justify-center text-slate-500">Verificando acesso...</div>;
  }

  if (!hasSitePremium) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Simulador de Dividendos' }]} />
        <Paywall 
          source="dividend_simulator"
          title="Viver de Renda Passiva"
          description="Descubra o 'Número Mágico' de cotas necessário para que seus dividendos comprem novas cotas sozinhos (Efeito Bola de Neve)."
          highlights={["Cálculo de Reinvestimento Automático", "Projeção de Renda Mensal", "Visualização de Longo Prazo"]}
          onUpgrade={() => onNavigate('upgrade')}
        />
      </div>
    );
  }

  const result = calculateDividends(input);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Simulador de Dividendos' }]} />
      
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 rounded-full blur-3xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">💎</span>
                    <h2 className="text-2xl font-bold text-white">Simulador de Dividendos</h2>
                 </div>
                 <p className="text-slate-400 text-sm max-w-lg">
                    Descubra quando você atingirá o <strong className="text-emerald-400">Número Mágico</strong>.
                 </p>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-600 backdrop-blur-sm text-right">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Renda Passiva Final</span>
                 <span className="text-3xl font-black text-emerald-400 tracking-tight">
                    {maskCurrency(result.summary.finalMonthlyIncome, isPrivacyMode)}
                    <span className="text-sm font-medium text-slate-500 ml-1">/mês</span>
                 </span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit space-y-6">
             <ToolInput label="Investimento Inicial" prefix="R$" value={input.initialInvestment} onChange={(v: number) => setInput({...input, initialInvestment: v})} />
             <ToolInput label="Aporte Mensal" prefix="R$" value={input.monthlyContribution} onChange={(v: number) => setInput({...input, monthlyContribution: v})} />
             <div className="grid grid-cols-2 gap-4">
                <ToolInput label="Preço da Cota" prefix="R$" value={input.assetPrice} onChange={(v: number) => setInput({...input, assetPrice: v})} step={0.01} />
                <ToolInput label="Dividend Yield" suffix="%" value={input.monthlyYield} onChange={(v: number) => setInput({...input, monthlyYield: v})} step={0.01} />
             </div>
             <ToolInput label="Tempo (Anos)" suffix="Anos" value={input.years} onChange={(v: number) => setInput({...input, years: v})} />
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.history}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                         <XAxis dataKey="month" tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(val) => val % 12 === 0 ? `${val/12}A` : ''} />
                         <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(val) => `R$${val}`} width={60} />
                         <Tooltip formatter={(value: number) => [isPrivacyMode ? '••••••' : formatCurrency(value), "Renda Mensal"]} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                         <Area type="monotone" dataKey="dividends" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="#10b981" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DividendSimulator;
