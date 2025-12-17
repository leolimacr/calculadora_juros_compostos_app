
import React from 'react';
import { CalculationResult } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ResultsDisplayProps {
  result: CalculationResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const { summary, history } = result;

  // Formatting chart data to be more readable (sampling for long periods)
  const chartData = history.filter((_, index) => {
    if (history.length > 60) return index % 6 === 0 || index === history.length - 1;
    if (history.length > 24) return index % 3 === 0 || index === history.length - 1;
    return true;
  }).map(item => ({
    name: `Mês ${item.month}`,
    investido: parseFloat(item.totalInvested.toFixed(2)),
    juros: parseFloat(item.totalInterest.toFixed(2)),
    total: parseFloat(item.totalAccumulated.toFixed(2)),
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-red-800">Resultado</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-800 text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
          <span className="text-sm font-medium opacity-90 mb-1 text-center">Valor total final</span>
          <span className="text-2xl font-bold tracking-tight">{formatCurrency(summary.totalFinal)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-slate-500 mb-1 text-center">Valor total investido</span>
          <span className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalInvested)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-slate-500 mb-1 text-center">Total em juros</span>
          <span className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalInterest)}</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="space-y-4">
        <h3 className="text-center font-bold text-red-800">Gráfico:</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e293b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorJuros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#991b1b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#991b1b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#64748b'}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                tick={{fontSize: 12, fill: '#64748b'}}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area 
                type="monotone" 
                dataKey="investido" 
                name="Valor Investido" 
                stackId="1" 
                stroke="#1e293b" 
                fillOpacity={1} 
                fill="url(#colorInvestido)" 
              />
              <Area 
                type="monotone" 
                dataKey="juros" 
                name="Total em Juros" 
                stackId="1" 
                stroke="#991b1b" 
                fillOpacity={1} 
                fill="url(#colorJuros)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <h3 className="text-center font-bold text-red-800">Tabela de Evolução:</h3>
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Mês</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Juros</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Total Investido</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Total Juros</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Total Acumulado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {history.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{row.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatCurrency(row.interest)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatCurrency(row.totalInvested)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatCurrency(row.totalInterest)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{formatCurrency(row.totalAccumulated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
