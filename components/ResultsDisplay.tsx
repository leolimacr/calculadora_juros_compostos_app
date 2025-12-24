
import React, { useState } from 'react';
import { CalculationResult } from '../types';
import { formatCurrency, maskCurrency } from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ResultsDisplayProps {
  result: CalculationResult;
  isPrivacyMode?: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isPrivacyMode = false }) => {
  const { summary, history } = result;
  const [showRealValue, setShowRealValue] = useState(false);
  const hasTax = summary.totalTax > 0;

  // Pie Chart Data
  const pieData = [
    { name: 'Investido (Bolso)', value: summary.totalInvested, color: '#475569' },
    { name: 'Juros (Lucro)', value: summary.totalInterest - summary.totalTax, color: '#10b981' },
  ];
  if (hasTax) {
    pieData.push({ name: 'Imposto', value: summary.totalTax, color: '#ef4444' });
  }

  // Bar Chart Data (Sampling)
  const chartData = history.filter((_, index) => {
    if (history.length > 60) return index % 6 === 0 || index === history.length - 1;
    if (history.length > 24) return index % 3 === 0 || index === history.length - 1;
    return true;
  }).map(item => ({
    name: `Mês ${item.month}`,
    investido: parseFloat(item.totalInvested.toFixed(2)),
    juros: parseFloat(item.totalInterest.toFixed(2)),
    total: parseFloat(item.totalAccumulated.toFixed(2)),
    real: parseFloat(item.totalReal.toFixed(2))
  }));

  const finalValueDisplay = showRealValue ? summary.totalRealNet : summary.totalNet;
  const multiplier = (summary.totalFinal / summary.totalInvested);

  // Smart Insights Generation
  const getInsight = () => {
    const years = history.length / 12;
    if (multiplier > 3) return "Incrivel! O efeito bola de neve triplicou seu capital. Os juros trabalharam mais que você.";
    if (multiplier > 2) return "Ótimo resultado! Você dobrou seu patrimônio graças aos juros compostos.";
    if (years < 5) return "No curto prazo, o esforço dos aportes conta mais que os juros. Continue firme!";
    return "Consistência é a chave. Com o tempo, a curva exponencial se tornará mais íngreme.";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Controls */}
      <div className="flex justify-end">
         <div className="bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-700">
            <button 
              onClick={() => setShowRealValue(false)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!showRealValue ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Valor Nominal (Hoje)
            </button>
            <button 
              onClick={() => setShowRealValue(true)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${showRealValue ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Poder de Compra Real 
              <span className="text-[9px] bg-black/20 px-1.5 rounded">Inflação</span>
            </button>
         </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Final Highlight */}
        <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                {showRealValue ? 'Patrimônio Real Ajustado' : 'Patrimônio Líquido Final'}
                {showRealValue && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Deflacionado</span>}
              </h3>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 tracking-tight">
                {maskCurrency(finalValueDisplay, isPrivacyMode)}
              </div>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                 {getInsight()}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[140px]">
               <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 backdrop-blur-md">
                 <span className="text-[10px] text-slate-400 font-bold uppercase block">Rentabilidade</span>
                 <span className="text-lg font-bold text-emerald-400">
                   +{((summary.totalNet - summary.totalInvested) / summary.totalInvested * 100).toFixed(0)}%
                 </span>
               </div>
               {hasTax && (
                 <div className="bg-red-900/10 p-3 rounded-xl border border-red-500/10 backdrop-blur-md">
                   <span className="text-[10px] text-red-300/70 font-bold uppercase block">Imposto Estimado</span>
                   <span className="text-sm font-bold text-red-400">
                     -{maskCurrency(summary.totalTax, isPrivacyMode)}
                   </span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg flex flex-col justify-center">
           <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                    <span className="text-xs font-bold text-slate-300">Investido</span>
                 </div>
                 <span className="font-bold text-slate-200">{maskCurrency(summary.totalInvested, isPrivacyMode)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-slate-300">Juros (Bruto)</span>
                 </div>
                 <span className="font-bold text-emerald-400">+{maskCurrency(summary.totalInterest, isPrivacyMode)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-400">Total Bruto</span>
                 <span className="font-bold text-white text-lg">{maskCurrency(summary.totalFinal, isPrivacyMode)}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart Card */}
        <div className="lg:col-span-1 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center justify-center relative">
           <h3 className="absolute top-6 left-6 font-bold text-white text-sm">Composição da Carteira</h3>
           <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                       ))}
                    </Pie>
                    <Tooltip 
                       formatter={(value: number) => isPrivacyMode ? '••••••' : formatCurrency(value)}
                       contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} 
                    />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           {/* Center Text Overlay */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pt-4">
              <span className="text-xs text-slate-500 font-bold block">Multiplicador</span>
              <span className="text-2xl font-black text-white">{multiplier.toFixed(1)}x</span>
           </div>
        </div>

        {/* Stacked Bar Chart Card */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-white flex items-center gap-2">
               <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
               Evolução Patrimonial {showRealValue && "(Poder de Compra)"}
             </h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}}
                  dy={10}
                  tickFormatter={(val) => {
                     const month = parseInt(val.split(' ')[1]);
                     return month % 12 === 0 ? `${month/12} Anos` : '';
                  }}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: '1px solid #1e293b', 
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number) => isPrivacyMode ? '••••••' : formatCurrency(value)}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1' }}
                />
                {showRealValue ? (
                   <Bar dataKey="real" name="Poder de Compra Real" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                ) : (
                   <>
                     <Bar dataKey="investido" name="Dinheiro do Bolso" stackId="a" fill="#475569" radius={[0, 0, 4, 4]} barSize={20} />
                     <Bar dataKey="juros" name="Juros Acumulados" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                   </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
