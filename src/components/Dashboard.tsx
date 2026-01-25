import React, { useState, useMemo } from 'react';
import { Browser } from '@capacitor/browser';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  PieChart, 
  BarChart3, 
  Lock
} from 'lucide-react';
import UsageIndicator from './UsageIndicator';
import TransactionHistory from './TransactionHistory';
import FilterBar from './FilterBar';
import CategoryManager from './CategoryManager';
import { generateFinancialReport } from '../utils/reportGenerator';

const Dashboard: React.FC<any> = (props) => {
  const { 
    transactions = [], 
    categories = [], 
    onDeleteTransaction, 
    onOpenForm, 
    onSaveCategory, 
    onDeleteCategory, 
    userMeta, 
    usagePercentage, 
    isPremium, 
    isLimitReached, 
    onShowPaywall, 
    isPrivacyMode 
  } = props;

  const [selectedCategory, setSelectedCategory] = useState('Todas Categorias');
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'all' | 'period'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const changeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + offset);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + offset);
    else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + offset);
    setCurrentDate(newDate);
  };

  const handleDateSelect = (dateString: string) => {
    if (!dateString) return;
    const [year, month, day] = dateString.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, day));
  };

  const periodLabel = useMemo(() => {
      if (viewMode === 'all') return 'Tudo';
      if (viewMode === 'year') return currentDate.getFullYear().toString();
      if (viewMode === 'day') return currentDate.toLocaleDateString('pt-BR');
      if (viewMode === 'period') {
          const f = (d: string) => d.split('-').reverse().join('/');
          return `${f(startDate)} até ${f(endDate)}`;
      }
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [viewMode, currentDate, startDate, endDate]);

  const filtered = useMemo(() => {
    return safeTransactions.filter((t: any) => {
      const categoryMatch = selectedCategory === 'Todas Categorias' || t?.category === selectedCategory;
      if (!categoryMatch || !t.date) return false;
      if (viewMode === 'all') return true;
      const [year, month, day] = t.date.split('-').map(Number);
      if (viewMode === 'period') return t.date >= startDate && t.date <= endDate;
      const isSameYear = year === currentDate.getFullYear();
      const isSameMonth = month === (currentDate.getMonth() + 1);
      const isSameDay = day === currentDate.getDate();
      if (viewMode === 'year') return isSameYear;
      if (viewMode === 'month') return isSameYear && isSameMonth;
      if (viewMode === 'day') return isSameYear && isSameMonth && isSameDay;
      return false;
    });
  }, [safeTransactions, selectedCategory, currentDate, viewMode, startDate, endDate]);

  const stats = useMemo(() => {
    let income = 0; let expenses = 0;
    filtered.forEach((t: any) => {
        const val = Number(t?.amount) || 0;
        if (t?.type === 'income') income += val;
        else expenses += val;
    });
    return { income, expenses, balance: income - expenses };
  }, [filtered]);

  const categoryStats = useMemo(() => {
    const map = new Map();
    let totalExp = 0;
    filtered.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      const val = Number(t.amount) || 0;
      map.set(t.category, (map.get(t.category) || 0) + val);
      totalExp += val;
    });
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const data = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value], i) => ({
        name, percent: totalExp > 0 ? (value / totalExp) * 100 : 0, color: colors[i % colors.length]
    }));
    const gradient = `conic-gradient(${data.length ? data.map((d, i, arr) => {
        let start = 0; for(let j=0; j<i; j++) start += arr[j].percent;
        const end = start + d.percent;
        return `${d.color} ${(start/100)*360}deg ${(end/100)*360}deg`;
    }).join(', ') : '#334155 0deg 360deg'})`;
    return { data, gradient };
  }, [filtered]);

  const handleOpenWebsite = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br' });
  };

  const handleExportPDF = () => {
    generateFinancialReport(filtered, `${selectedCategory} - ${periodLabel}`, userMeta?.email || 'Investidor');
  };

  // === LÓGICA DE CATEGORIAS CORRIGIDA (Híbrida) ===
  const categoryNames = useMemo(() => {
    // 1. Pega nomes da lista oficial do banco (pastinha)
    const fromDb = categories.map((c: any) => c.name);
    // 2. Pega nomes que já existem nos lançamentos (retrocompatibilidade)
    const fromTransactions = safeTransactions.map((t: any) => t?.category).filter(Boolean);
    // 3. Une tudo em uma lista única e sem repetições
    return Array.from(new Set([...fromDb, ...fromTransactions])).sort();
  }, [categories, safeTransactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-6 animate-in fade-in duration-500 pb-32">
      <CategoryManager isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} onSave={onSaveCategory} onDelete={onDeleteCategory} />

      <div className="flex justify-between items-center">
         <div className="hidden md:block">
            <h2 className="text-3xl font-black text-white tracking-tight">Painel</h2>
            <p className="text-slate-400">Gerencie seu patrimônio com inteligência.</p>
         </div>
         <h2 className="md:hidden text-2xl font-black text-white tracking-tight">Painel</h2>
         <button onClick={isLimitReached && !isPremium ? onShowPaywall : onOpenForm} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${isLimitReached && !isPremium ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500 text-white hover:bg-emerald-400'}`}>
            {isLimitReached && !isPremium ? <Lock size={18}/> : <Plus size={18} />}
            <span>{isLimitReached && !isPremium ? 'Limite' : 'Novo'}</span>
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/10 group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={64} /></div>
             <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Saldo no Período</p>
             <h2 className="text-3xl font-black tracking-tight">{isPrivacyMode ? 'R$ •••' : `R$ ${stats.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</h2>
             <p className="text-[10px] text-emerald-200/60 mt-1 truncate">{periodLabel}</p>
          </div>
          <div className="flex gap-4 md:contents">
              <div className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Entradas</p>
                  <p className="text-emerald-400 font-bold text-sm">R$ {isPrivacyMode ? '••' : stats.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <div className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Saídas</p>
                  <p className="text-red-400 font-bold text-sm">R$ {isPrivacyMode ? '••' : stats.expenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
          </div>
      </div>

      <UsageIndicator userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPremium} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700">
            <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2"><PieChart size={14} className="text-emerald-500"/> Categorias</h3>
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full flex-shrink-0" style={{ background: categoryStats.gradient }}></div>
                <div className="flex-1 text-[10px] space-y-1">
                    {categoryStats.data.length > 0 ? categoryStats.data.map((cat: any) => (
                        <div key={cat.name} className="flex justify-between"><span className="text-slate-400">{cat.name}</span><span className="text-white font-bold">{Math.round(cat.percent)}%</span></div>
                    )) : <p className="text-slate-500 italic text-[10px]">Sem dados no período.</p>}
                </div>
            </div>
          </div>
          <div className="hidden md:block bg-slate-800/40 p-5 rounded-3xl border border-slate-700">
            <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} className="text-indigo-400"/> Fluxo</h3>
            <div className="flex items-end justify-between h-20 gap-2">
                {[
                    {c:'bg-emerald-500', h:(stats.income/Math.max(stats.income,stats.expenses,1))*100},
                    {c:'bg-orange-500', h:(stats.expenses/Math.max(stats.income,stats.expenses,1))*100}
                ].map((b,i)=>(
                    <div key={i} className="flex-1 bg-slate-900 rounded-t-lg h-full flex items-end overflow-hidden">
                        <div className={`w-full ${b.c} transition-all duration-1000`} style={{height:`${b.h}%`}}></div>
                    </div>
                ))}
            </div>
          </div>
      </div>

      <div className="space-y-4">
          <FilterBar 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
            categories={categoryNames}
            viewMode={viewMode}
            setViewMode={setViewMode}
            changeDate={changeDate}
            periodLabel={periodLabel}
            onExportPDF={handleExportPDF}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onDateSelect={handleDateSelect}
          />
          <TransactionHistory transactions={filtered} onDelete={onDeleteTransaction} isPrivacyMode={isPrivacyMode} />
      </div>

      <div className="md:hidden mt-4">
          <button onClick={handleOpenWebsite} className="w-full bg-slate-800 border border-sky-500/20 p-5 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all shadow-lg group">
            <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-sky-500/20" />
            <div className="text-left">
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Acesse o Site</p>
              <p className="text-sky-400 font-black text-lg leading-tight group-hover:text-sky-300">Ecossistema Pro Invest</p>
            </div>
          </button>
      </div>
    </div>
  );
};

export default Dashboard;