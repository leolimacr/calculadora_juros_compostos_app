
import React, { useState, useMemo } from 'react';
import { Transaction, FilterPeriod, Goal } from '../types';
import FilterBar from './FilterBar';
import TransactionHistory from './TransactionHistory';
import GoalsWidget from './GoalsWidget';
import { formatCurrency, maskCurrency } from '../utils/calculations';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onOpenForm: () => void;
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
  isPrivacyMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  onDeleteTransaction, 
  onOpenForm,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  isPrivacyMode = false
}) => {
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

  // Health Score Logic (0-100)
  const healthScore = useMemo(() => {
    if (summary.income === 0) return 0;
    const savingsRate = ((summary.income - summary.expenses) / summary.income) * 100;
    let score = 50 + (savingsRate * 2.5); 
    return Math.min(100, Math.max(0, score));
  }, [summary]);

  const exportCSV = () => {
    const headers = "Data,Tipo,Descrição,Categoria,Valor\n";
    const rows = filteredTransactions.map(t =>
      `${t.date},${t.type === 'income' ? 'Receita' : 'Despesa'},"${t.description}",${t.category},${t.amount}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_pro_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const categoriesData = useMemo(() => {
    const expenseMap = new Map<string, number>();
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const val = expenseMap.get(t.category) || 0;
      expenseMap.set(t.category, val + t.amount);
    });
    return Array.from(expenseMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
  const categoriesList = Array.from(new Set(transactions.map(t => t.category)));

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excelente';
    if (s >= 50) return 'Equilibrado';
    if (s > 20) return 'Atenção';
    return 'Crítico';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
           <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
           <p className="text-sm text-slate-400">Visão geral do seu fluxo de caixa</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            title="Imprimir Relatório"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button 
            onClick={exportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            title="Exportar para Excel/CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button 
            onClick={onOpenForm}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 active:scale-95 transform hover:translate-y-[-1px]"
          >
            <span className="text-lg font-light">+</span> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <div className="no-print">
            <FilterBar 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
                categories={categoriesList}
            />
          </div>
          
          {/* Health Score Widget */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saúde Financeira</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700 ${getScoreColor(healthScore)}`}>
                  {getScoreLabel(healthScore)}
                </span>
             </div>
             <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${healthScore >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${healthScore}%` }}
                ></div>
             </div>
             <p className="text-[10px] text-slate-500">Baseado na taxa de poupança (Receitas vs Despesas).</p>
          </div>

          <div className="no-print">
             <GoalsWidget 
                goals={goals}
                onAddGoal={onAddGoal}
                onUpdateGoal={onUpdateGoal}
                onDeleteGoal={onDeleteGoal}
                isPrivacyMode={isPrivacyMode}
             />
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-emerald-500 shadow-lg border-y border-r border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Entradas</span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight">{maskCurrency(summary.income, isPrivacyMode)}</span>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-orange-500 shadow-lg border-y border-r border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Saídas</span>
              <span className="text-2xl font-black text-orange-400 tracking-tight">{maskCurrency(summary.expenses, isPrivacyMode)}</span>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-indigo-500 shadow-lg border-y border-r border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Saldo Geral</span>
              <span className={`text-2xl font-black tracking-tight ${summary.balance >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>{maskCurrency(summary.balance, isPrivacyMode)}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4">Despesas por Categoria</h3>
              <div className="h-[250px] w-full flex-grow">
                 {categoriesData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoriesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => isPrivacyMode ? '••••••' : formatCurrency(value)}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-500 text-xs">Sem dados para exibir</div>
                 )}
              </div>
            </div>

            {/* Bar Chart (Fluxo) */}
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
               <h3 className="text-sm font-bold text-white mb-4">Fluxo de Caixa</h3>
               <div className="h-[250px] w-full flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Entradas', value: summary.income },
                      { name: 'Saídas', value: summary.expenses },
                      { name: 'Saldo', value: Math.abs(summary.balance) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        formatter={(value: number) => isPrivacyMode ? '••••••' : formatCurrency(value)}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                         { [0,1,2].map((entry, index) => <Cell key={index} fill={['#10b981', '#f97316', '#6366f1'][index]} />) }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </div>

          <TransactionHistory 
             transactions={filteredTransactions} 
             onDelete={onDeleteTransaction} 
             isPrivacyMode={isPrivacyMode}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
