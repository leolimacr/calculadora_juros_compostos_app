
import React, { useState } from 'react';
import { calculateRoi, formatCurrency, maskCurrency } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface RoiCalculatorProps {
  isPrivacyMode?: boolean;
}

const RoiCalculator: React.FC<RoiCalculatorProps> = ({ isPrivacyMode = false }) => {
  const [input, setInput] = useState({
    initialInvestment: 50000,
    revenue: 85000,
    costs: 12000,
    period: 24 // meses
  });

  const result = calculateRoi(input);

  const ToolInput = ({ label, value, onChange, prefix, suffix, step = 1 }: any) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
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

  const chartData = [
    { name: 'Custo Total', value: result.totalCosts },
    { name: 'Receita Bruta', value: input.revenue },
    { name: 'Lucro Líquido', value: result.netProfit },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full blur-3xl"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">📊</span>
                  <h2 className="text-2xl font-bold text-white">Calculadora de ROI</h2>
               </div>
               <p className="text-slate-400 text-sm max-w-lg">
                  Analise a viabilidade de projetos e investimentos calculando o Retorno sobre o Investimento e a rentabilidade anualizada.
               </p>
            </div>
            <div className={`p-4 rounded-xl border backdrop-blur-sm text-right ${result.roi >= 0 ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">ROI Global</span>
               <span className={`text-4xl font-black tracking-tight ${result.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.roi.toFixed(1)}%
               </span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls */}
        <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit space-y-6">
           <h3 className="font-bold text-white border-b border-slate-700 pb-2 mb-4">Dados do Projeto</h3>
           
           <ToolInput label="Investimento Inicial" prefix="R$" value={input.initialInvestment} onChange={(v: number) => setInput({...input, initialInvestment: v})} />
           <ToolInput label="Custos Adicionais" prefix="R$" value={input.costs} onChange={(v: number) => setInput({...input, costs: v})} />
           <ToolInput label="Receita Total Gerada" prefix="R$" value={input.revenue} onChange={(v: number) => setInput({...input, revenue: v})} />
           <ToolInput label="Duração do Projeto" suffix="Meses" value={input.period} onChange={(v: number) => setInput({...input, period: v})} />
           
           <div className="pt-4 border-t border-slate-700">
             <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs text-slate-400 font-bold uppercase">Custo Total</span>
                   <span className="text-white font-bold">{maskCurrency(result.totalCosts, isPrivacyMode)}</span>
                </div>
             </div>
           </div>
        </div>

        {/* Results & Charts */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Detailed Stats */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Lucro Líquido Real</span>
                 <div className={`text-3xl font-black mt-2 ${result.netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {maskCurrency(result.netProfit, isPrivacyMode)}
                 </div>
                 <p className="text-[10px] text-slate-500 mt-2">Receita Total - (Investimento + Custos)</p>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Retorno Anualizado (CAGR)</span>
                 <div className="text-3xl font-black mt-2 text-blue-400">
                    {result.annualizedRoi.toFixed(2)}% <span className="text-sm text-slate-500 font-bold">a.a.</span>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-2">Rentabilidade equivalente por ano</p>
              </div>
           </div>

           {/* Chart */}
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="font-bold text-white mb-6 pl-2 border-l-4 border-blue-500">Análise Financeira</h3>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                       <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                       <YAxis hide />
                       <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          formatter={(value: number) => isPrivacyMode ? '••••••' : formatCurrency(value)}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                       />
                       <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={
                                entry.name === 'Lucro Líquido' 
                                   ? (entry.value >= 0 ? '#10b981' : '#ef4444') 
                                   : entry.name === 'Receita Bruta' ? '#3b82f6' : '#64748b'
                             } />
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
