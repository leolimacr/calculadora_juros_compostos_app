
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, FilterPeriod, Goal } from '../types';
import FilterBar from './FilterBar';
import TransactionHistory from './TransactionHistory';
import GoalsWidget from './GoalsWidget';
import Breadcrumb from './Breadcrumb';
import { formatCurrency, maskCurrency } from '../utils/calculations';
import { logEvent, ANALYTICS_EVENTS } from '../utils/analytics';
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
  navigateToHome?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  onDeleteTransaction, 
  onOpenForm,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  isPrivacyMode = false,
  navigateToHome
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Todas Categorias');
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('mes'); 

  // Analytics: View Manager & Daily Summary
  useEffect(() => {
    // Dispara eventos de engajamento ao montar o dashboard
    logEvent(ANALYTICS_EVENTS.VIEW_DAILY_SUMMARY);
  }, []);

  // Analytics: Goal Completion Tracking
  useEffect(() => {
    goals.forEach(goal => {
      if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
        // Usa sessionStorage para garantir que só dispare uma vez por sessão por meta
        const sessionKey = `finpro_goal_completed_${goal.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          logEvent(ANALYTICS_EVENTS.GOAL_COMPLETED, { 
            goal_id: goal.id, 
            goal_name: goal.name,
            value: goal.targetAmount 
          });
          sessionStorage.setItem(sessionKey, 'true');
        }
      }
    });
  }, [goals]);

  // Daily Summary Calculations
  const dailyStats = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    // Reset hours for accurate comparison
    today.setHours(0,0,0,0);
    startOfWeek.setHours(0,0,0,0);

    let spentToday = 0;
    let spentWeek = 0;
    
    transactions.forEach(t => {
       if (t.type === 'expense') {
          const tDate = new Date(t.date);
          const tDateString = new Date(tDate.getTime() + tDate.getTimezoneOffset() * 60000).toDateString();
          
          if (tDateString === new Date().toDateString()) {
             spentToday += t.amount;
          }
          
          if (tDate >= startOfWeek) {
             spentWeek += t.amount;
          }
       }
    });

    // Budget Logic
    const monthlyIncome = transactions
       .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
       .reduce((acc, t) => acc + t.amount, 0);
    
    const budgetLimit = monthlyIncome > 0 ? monthlyIncome : 5000; 
    const spentMonth = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((acc, t) => acc + t.amount, 0);
    
    const remainingBudget = Math.max(0, budgetLimit - spentMonth);
    const dailyBudget = remainingBudget / (new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1);

    return { spentToday, spentWeek, remainingBudget, dailyBudget };
  }, [transactions]);


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

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-in fade-in duration-500">
      {navigateToHome && <Breadcrumb items={[{ label: 'Home', action: navigateToHome }, { label: 'Dashboard Financeiro' }]} />}

      {/* Daily Summary Cards (Habit Loop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gasto Hoje</span>
            <div className="text-2xl font-black text-white mt-1">{maskCurrency(dailyStats.spentToday, isPrivacyMode)}</div>
            <div className="absolute top-2 right-2 text-xl opacity-20">📅</div>
         </div>
         
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gasto Semana</span>
            <div className="text-2xl font-black text-white mt-1">{maskCurrency(dailyStats.spentWeek, isPrivacyMode)}</div>
            <div className="absolute top-2 right-2 text-xl opacity-20">🗓️</div>
         </div>

         <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-2xl border border-emerald-500/30 shadow-lg relative overflow-hidden col-span-2 md:col-span-2">
            <div className="flex justify-between items-start">
               <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Meta Diária Segura</span>
                  <div className="text-2xl font-black text-white mt-1">{maskCurrency(dailyStats.dailyBudget, isPrivacyMode)}</div>
                  <p className="text-[10px] text-slate-400 mt-1">Para não estourar o mês.</p>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Restante Mês</span>
                  <div className="text-lg font-bold text-slate-300">{maskCurrency(dailyStats.remainingBudget, isPrivacyMode)}</div>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
           <h2 className="text-2xl font-bold text-white">Fluxo de Caixa</h2>
           <p className="text-sm text-slate-400">Visão detalhada dos seus lançamentos</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={exportCSV}
            className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all items-center gap-2"
          >
            Exportar CSV
          </button>
          <button 
            onClick={onOpenForm}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-95 transform hover:translate-y-[-1px]"
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
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-emerald-500 shadow-lg border-y border-r border-slate-700 flex justify-between items-center">
              <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entradas</span>
                 <span className="text-xl font-black text-emerald-400 tracking-tight">{maskCurrency(summary.income, isPrivacyMode)}</span>
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-orange-500 shadow-lg border-y border-r border-slate-700 flex justify-between items-center">
              <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Saídas</span>
                 <span className="text-xl font-black text-orange-400 tracking-tight">{maskCurrency(summary.expenses, isPrivacyMode)}</span>
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-indigo-500 shadow-lg border-y border-r border-slate-700 flex justify-between items-center">
              <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Saldo</span>
                 <span className={`text-xl font-black tracking-tight ${summary.balance >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>{maskCurrency(summary.balance, isPrivacyMode)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4">Despesas por Categoria</h3>
              <div className="h-[200px] w-full flex-grow">
                 {categoriesData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoriesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
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
               <div className="h-[200px] w-full flex-grow">
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
