import React, { useState, useMemo } from 'react';
import { 
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
    isPrivacyMode,
    onEditTransaction
  } = props;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
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
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(t?.category);
      const typeMatch = typeFilter === 'all' || t?.type === typeFilter;
      if (!categoryMatch || !typeMatch || !t.date) return false;
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
  }, [safeTransactions, selectedCategories, typeFilter, currentDate, viewMode, startDate, endDate]);

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

  const handleExportPDF = () => {
    const catLabel = selectedCategories.length === 0 ? 'Todas Categorias' : selectedCategories.join(', ');
    generateFinancialReport(filtered, `${catLabel} - ${periodLabel}`, userMeta?.email || 'Investidor');
  };

  const categoryNames = useMemo(() => {
    const fromDb = categories.map((c: any) => c.name);
    const fromTransactions = safeTransactions.map((t: any) => t?.category).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromTransactions])).sort();
  }, [categories, safeTransactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-8 animate-in fade-in duration-500 pb-32">
      <CategoryManager isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} onSave={onSaveCategory} onDelete={onDeleteCategory} />

      {/* HEADER DO GERENCIADOR */}
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Fluxo de Caixa</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{periodLabel}</p>
         </div>
         <button onClick={isLimitReached && !isPremium ? onShowPaywall : onOpenForm} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-transform active:scale-95 ${isLimitReached && !isPremium ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'}`}>
            {isLimitReached && !isPremium ? <Lock size={16}/> : <Plus size={16} />}
            <span>{isLimitReached && !isPremium ? 'Limite Atingido' : 'Novo Lançamento'}</span>
         </button>
      </div>

      {/* CARDS DE SALDO PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-[#020617] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-800 group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={80} /></div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Saldo Disponível</p>
             <h2 className="text-4xl font-black tracking-tighter">
                {isPrivacyMode ? '••••••' : `R$ ${stats.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
             </h2>
             <div className="mt-6 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stats.balance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.balance >= 0 ? 'Saúde Financeira Estável' : 'Atenção ao Orçamento'}</span>
             </div>
          </div>

          <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 flex flex-col justify-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Entradas</p>
              <p className="text-2xl font-black text-emerald-400 tracking-tight">
                {isPrivacyMode ? '••••' : `R$ ${stats.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
              </p>
          </div>

          <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 flex flex-col justify-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Saídas</p>
              <p className="text-2xl font-black text-red-400 tracking-tight">
                {isPrivacyMode ? '••••' : `R$ ${stats.expenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
              </p>
          </div>
      </div>

      <UsageIndicator userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPremium} />

      {/* ÁREA DE GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
            <h3 className="text-white font-black mb-6 text-xs uppercase tracking-[0.2em] flex items-center gap-3"><PieChart size={16} className="text-emerald-500"/> Composição de Gastos</h3>
            <div className="flex items-center gap-10">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0 shadow-2xl" style={{ background: categoryStats.gradient }}></div>
                <div className="flex-1 space-y-3">
                    {categoryStats.data.length > 0 ? categoryStats.data.map((cat: any) => (
                        <div key={cat.name} className="flex flex-col">
                           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                              <span className="text-slate-400">{cat.name}</span>
                              <span className="text-white">{Math.round(cat.percent)}%</span>
                           </div>
                           <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="h-full transition-all duration-1000" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}></div>
                           </div>
                        </div>
                    )) : <p className="text-slate-500 italic text-xs">Sem dados para análise.</p>}
                </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
            <h3 className="text-white font-black mb-6 text-xs uppercase tracking-[0.2em] flex items-center gap-3"><BarChart3 size={16} className="text-sky-500"/> Visão de Fluxo</h3>
            <div className="flex items-end justify-around h-32 gap-4">
                {[
                    {label: 'Entradas', c:'bg-emerald-500', h:(stats.income/Math.max(stats.income,stats.expenses,1))*100},
                    {label: 'Saídas', c:'bg-red-500', h:(stats.expenses/Math.max(stats.income,stats.expenses,1))*100}
                ].map((b,i)=>(
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full">
                        <div className="w-full bg-slate-800/50 rounded-2xl h-full flex items-end overflow-hidden border border-slate-700/30">
                            <div className={`w-full ${b.c} transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.2)]`} style={{height:`${b.h}%`}}></div>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{b.label}</span>
                    </div>
                ))}
            </div>
          </div>
      </div>

      {/* FILTROS E TABELA */}
      <div className="space-y-6">
          <FilterBar 
            selectedCategories={selectedCategories} 
            setSelectedCategories={setSelectedCategories}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
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
          <TransactionHistory transactions={filtered} onDelete={onDeleteTransaction} onEdit={onEditTransaction} isPrivacyMode={isPrivacyMode} />
          
          {/* SOMATÓRIO DOS LANÇAMENTOS FILTRADOS */}
          {filtered.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mt-4 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado dos filtros</span>
                  <span className="text-[10px] text-slate-600">({filtered.length} lançamento{filtered.length !== 1 ? 's' : ''})</span>
                </div>
                <div className="flex items-center gap-6">
                  {(() => {
                    let totalIncome = 0;
                    let totalExpense = 0;
                    filtered.forEach((t: any) => {
                      const val = Number(t?.amount) || 0;
                      if (t?.type === 'income') totalIncome += val;
                      else totalExpense += val;
                    });
                    const net = totalIncome - totalExpense;
                    return (
                      <>
                        {totalIncome > 0 && (
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Entradas</p>
                            <p className="text-sm font-black text-emerald-400">
                              {isPrivacyMode ? '••••' : `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        )}
                        {totalExpense > 0 && (
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Saídas</p>
                            <p className="text-sm font-black text-red-400">
                              {isPrivacyMode ? '••••' : `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        )}
                        <div className="text-center border-l border-slate-700 pl-6">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total</p>
                          <p className={`text-lg font-black ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPrivacyMode ? '••••' : `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;