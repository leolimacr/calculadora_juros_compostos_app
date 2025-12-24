
import React, { useState } from 'react';
import { calculateDividends, formatCurrency, maskCurrency } from '../utils/calculations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DividendSimulatorProps {
  isPrivacyMode?: boolean;
}

const DividendSimulator: React.FC<DividendSimulatorProps> = ({ isPrivacyMode = false }) => {
  const [input, setInput] = useState({
    initialInvestment: 1000,
    monthlyContribution: 500,
    assetPrice: 10, // Preço base (ex: cota de FII base 10)
    monthlyYield: 0.8, // % mensal
    years: 10
  });

  const result = calculateDividends(input);

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

  return (
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
                  Descubra quando você atingirá o <strong className="text-emerald-400">Número Mágico</strong>: o momento em que seus dividendos compram novas cotas sozinhos.
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
        
        {/* Controls */}
        <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit space-y-6">
           <ToolInput label="Investimento Inicial" prefix="R$" value={input.initialInvestment} onChange={(v: number) => setInput({...input, initialInvestment: v})} />
           <ToolInput label="Aporte Mensal" prefix="R$" value={input.monthlyContribution} onChange={(v: number) => setInput({...input, monthlyContribution: v})} />
           <div className="grid grid-cols-2 gap-4">
              <ToolInput label="Preço da Cota" prefix="R$" value={input.assetPrice} onChange={(v: number) => setInput({...input, assetPrice: v})} step={0.01} />
              <ToolInput label="Dividend Yield" suffix="%" value={input.monthlyYield} onChange={(v: number) => setInput({...input, monthlyYield: v})} step={0.01} />
           </div>
           <ToolInput label="Tempo (Anos)" suffix="Anos" value={input.years} onChange={(v: number) => setInput({...input, years: v})} />
           
           <div className="pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs text-slate-400 font-bold uppercase">Patrimônio Acumulado</span>
                 <span className="text-white font-bold">{maskCurrency(result.summary.totalValue, isPrivacyMode)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-400 font-bold uppercase">Total de Cotas</span>
                 <span className="text-emerald-400 font-bold">{result.summary.totalShares.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Charts & Stats */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Magic Number Card */}
           <div className={`p-6 rounded-2xl border transition-all duration-500 flex items-center gap-6 relative overflow-hidden ${result.summary.magicNumberMonth > 0 ? 'bg-gradient-to-r from-indigo-900 to-slate-900 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>
              <div className="absolute top-0 right-0 text-9xl opacity-5 rotate-12 -mr-8 -mt-4 select-none">✨</div>
              <div className="text-4xl">🚀</div>
              <div>
                 <h4 className="font-bold text-white text-lg mb-1">Efeito Bola de Neve</h4>
                 {result.summary.magicNumberMonth > 0 ? (
                    <p className="text-indigo-200 text-sm">
                       Parabéns! No <strong className="text-white text-lg">Mês {result.summary.magicNumberMonth}</strong>, seus dividendos começarão a comprar pelo menos 1 nova cota sem sair do seu bolso.
                    </p>
                 ) : (
                    <p className="text-slate-400 text-sm">
                       Neste período, seus dividendos ainda não são suficientes para comprar 1 cota inteira sozinhos. Tente aumentar o aporte ou o tempo.
                    </p>
                 )}
              </div>
           </div>

           {/* Chart */}
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="font-bold text-white mb-6 pl-2 border-l-4 border-emerald-500">Evolução da Renda Passiva</h3>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.history}>
                       <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                       <XAxis 
                          dataKey="month" 
                          tick={{fontSize: 10, fill: '#64748b'}} 
                          tickFormatter={(val) => val % 12 === 0 ? `${val/12}A` : ''}
                       />
                       <YAxis 
                          tick={{fontSize: 10, fill: '#64748b'}} 
                          tickFormatter={(val) => `R$${val}`}
                          width={60}
                       />
                       <Tooltip 
                          formatter={(value: number) => [isPrivacyMode ? '••••••' : formatCurrency(value), "Renda Mensal"]}
                          labelFormatter={(label) => `Mês ${label}`}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey="dividends" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DividendSimulator;
