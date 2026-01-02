
import React, { useState } from 'react';
import { calculateRoi, formatCurrency, maskCurrency } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import Breadcrumb from './Breadcrumb';
import Paywall from './Paywall';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

interface RoiCalculatorProps {
  isPrivacyMode?: boolean;
  onNavigate: (path: string) => void;
}

const RoiCalculator: React.FC<RoiCalculatorProps> = ({ isPrivacyMode = false, onNavigate }) => {
  const { hasSitePremium, loadingSubscription } = useSubscriptionAccess();
  
  const [input, setInput] = useState({
    initialInvestment: 50000,
    revenue: 85000,
    costs: 12000,
    period: 24
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

  if (loadingSubscription) return <div className="w-full h-96 flex items-center justify-center text-slate-500">Verificando acesso...</div>;

  if (!hasSitePremium) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Calculadora ROI' }]} />
        <Paywall 
          source="roi_calculator"
          title="Análise de Projetos e Negócios"
          description="Calcule a viabilidade e o retorno real de qualquer investimento ou projeto."
          highlights={["ROI Anualizado (CAGR)", "Análise de Lucro Líquido Real", "Simulação de Custos vs Receita"]}
          onUpgrade={() => onNavigate('upgrade')}
        />
      </div>
    );
  }

  const result = calculateRoi(input);
  const chartData = [
    { name: 'Custo Total', value: result.totalCosts },
    { name: 'Receita Bruta', value: input.revenue },
    { name: 'Lucro Líquido', value: result.netProfit },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Calculadora ROI' }]} />
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit space-y-6">
             <h3 className="font-bold text-white border-b border-slate-700 pb-2 mb-4">Dados do Projeto</h3>
             <ToolInput label="Investimento Inicial" prefix="R$" value={input.initialInvestment} onChange={(v: number) => setInput({...input, initialInvestment: v})} />
             <ToolInput label="Custos Adicionais" prefix="R$" value={input.costs} onChange={(v: number) => setInput({...input, costs: v})} />
             <ToolInput label="Receita Total" prefix="R$" value={input.revenue} onChange={(v: number) => setInput({...input, revenue: v})} />
             <ToolInput label="Duração" suffix="Meses" value={input.period} onChange={(v: number) => setInput({...input, period: v})} />
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg text-center">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ROI Anualizado</span>
               <div className="text-4xl font-black mt-2 text-blue-400">{result.annualizedRoi.toFixed(2)}% <span className="text-sm font-bold">a.a.</span></div>
             </div>
             
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => isPrivacyMode ? '••••••' : formatCurrency(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                         {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Lucro Líquido' ? (entry.value >= 0 ? '#10b981' : '#ef4444') : entry.name === 'Receita Bruta' ? '#3b82f6' : '#64748b'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoiCalculator;
