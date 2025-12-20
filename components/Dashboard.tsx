
import React, { useState, useMemo } from 'react';
import { Transaction, FilterPeriod } from '../types';
import FilterBar from './FilterBar';
import TransactionHistory from './TransactionHistory';
import { formatCurrency } from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenForm: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, onDeleteTransaction, onOpenForm }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todas Categorias');
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('tudo');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const catMatch = selectedCategory === 'Todas Categorias' || t.category === selectedCategory;
      
      const tDate = new Date(t.date);
      const now = new Date();
      let periodMatch = true;

      if (selectedPeriod === 'hoje') {
        periodMatch = tDate.toDateString() === now.toDateString();
      } else if (selectedPeriod === 'mes') {
        periodMatch = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else if (selectedPeriod === 'ano') {
        periodMatch = tDate.getFullYear() === now.getFullYear();
      }

      return catMatch && periodMatch;
    });
  }, [transactions, selectedCategory, selectedPeriod]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [filteredTransactions]);

  const chartData = [
    { name: 'Entradas', value: summary.income, color: '#10b981' },
    { name: 'Saídas', value: summary.expenses, color: '#f97316' },
    { name: 'Saldo', value: summary.balance, color: '#6366f1' }
  ];

  const categoriesList = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Action Header */}
      <div className="flex justify-end">
        <button 
          onClick={onOpenForm}
          className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all flex items-center gap-2 active:scale-95"
        >
          <span className="text-lg">+</span> Novo Lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <FilterBar 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            categories={categoriesList}
          />

          <div className="space-y-4">
            {/* Card Entradas */}
            <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entradas</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(summary.income)}</span>
            </div>
            {/* Card Saídas */}
            <div className="bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Saídas</span>
              <span className="text-2xl font-black text-orange-600 tracking-tight">{formatCurrency(summary.expenses)}</span>
            </div>
            {/* Card Saldo */}
            <div className="bg-white p-6 rounded-2xl border-l-4 border-indigo-500 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Saldo Geral</span>
              <span className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(summary.balance)}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Chart Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-8 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Visão Comparativa
            </h3>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History */}
          <TransactionHistory 
            transactions={filteredTransactions} 
            onDelete={onDeleteTransaction} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
