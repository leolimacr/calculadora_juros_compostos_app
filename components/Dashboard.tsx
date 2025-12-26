
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

  // Analytics
  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.VIEW_DAILY_SUMMARY);
  }, []);

  useEffect(() => {
    goals.forEach(goal => {
      if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
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

  // Data Logic
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

      {/* Botão Novo Lançamento (TOPO) */}
      <button 
        onClick={onOpenForm}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] transform hover:-translate-y-1 mb-4 border border-emerald-500/20"
      >
        <span className="text-2xl font-light leading-none">+</span> NOVO LANÇAMENTO
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          
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
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">Fluxo de Caixa</h3>
                  <button onClick={exportCSV} className="text-[10px] text-slate-400 hover:text-white border border-slate-600 px-2 py-1 rounded">CSV</button>
               </div>
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
