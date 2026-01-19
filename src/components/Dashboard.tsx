import React, { useState, useMemo } from 'react';
import { Browser } from '@capacitor/browser'; // ADICIONADO IMPORT
import UsageIndicator from './UsageIndicator';
import TransactionHistory from './TransactionHistory';
import FilterBar from './FilterBar';

const Dashboard: React.FC<any> = (props) => {
  const { 
    transactions = [], 
    onDeleteTransaction, 
    onOpenForm, 
    userMeta, 
    usagePercentage, 
    isPremium, 
    isLimitReached, 
    onShowPaywall, 
    isPrivacyMode 
  } = props;

  const [selectedCategory, setSelectedCategory] = useState('Todas Categorias');
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const filtered = useMemo(() => 
    safeTransactions.filter((t: any) => selectedCategory === 'Todas Categorias' || t?.category === selectedCategory)
  , [safeTransactions, selectedCategory]);

  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filtered.forEach((t: any) => {
        const val = Number(t?.amount) || 0;
        if (t?.type === 'income') income += val;
        else expenses += val;
    });
    return { income, expenses, balance: income - expenses };
  }, [filtered]);

  const barHeights = useMemo(() => {
    const maxValue = Math.max(stats.income, stats.expenses, Math.abs(stats.balance)) || 1;
    return {
        income: (stats.income / maxValue) * 100,
        expenses: (stats.expenses / maxValue) * 100,
        balance: (Math.abs(stats.balance) / maxValue) * 100
    };
  }, [stats]);

  const categoryStats = useMemo(() => {
    const map = new Map();
    let totalExp = 0;
    filtered.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      const val = Number(t.amount) || 0;
      map.set(t.category, (map.get(t.category) || 0) + val);
      totalExp += val;
    });
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    let currentDeg = 0;
    const data = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value], i) => {
        const percent = totalExp > 0 ? (value / totalExp) * 100 : 0;
        const deg = (percent / 100) * 360;
        const item = { name, percent, color: colors[i % colors.length], start: currentDeg, end: currentDeg + deg };
        currentDeg += deg;
        return item;
      });
    const gradient = data.length ? `conic-gradient(${data.map(d => `${d.color} ${d.start}deg ${d.end}deg`).join(', ')})` : 'conic-gradient(#334155 0deg 360deg)';
    return { data, gradient };
  }, [filtered]);

  const formatMoney = (val: number) => {
    try { return val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); } catch { return val.toFixed(2); }
  };

  // FUNÇÃO SEGURA PARA ABRIR O SITE
  const handleOpenWebsite = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      
      {/* 1. CARD SALDO */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/10">
        <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Saldo Total</p>
        <h2 className="text-4xl font-black mb-6 tracking-tight">
            {isPrivacyMode ? 'R$ ••••••' : `R$ ${formatMoney(stats.balance)}`}
        </h2>
        <div className="flex justify-between bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div><p className="text-[10px] uppercase font-black text-emerald-200">Ganhos</p><p className="font-bold text-sm">R$ {isPrivacyMode ? '•••' : formatMoney(stats.income)}</p></div>
            <div className="w-[1px] bg-white/10"></div>
            <div><p className="text-[10px] uppercase font-black text-red-200">Gastos</p><p className="font-bold text-sm">R$ {isPrivacyMode ? '•••' : formatMoney(stats.expenses)}</p></div>
        </div>
      </div>

      {/* 2. BANNER ECOSSISTEMA (LINK CORRIGIDO) */}
      <button onClick={handleOpenWebsite} className="w-full bg-slate-800 border border-sky-500/20 p-5 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all shadow-lg group">
        <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-sky-500/20" />
        <div className="text-left">
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Ecossistema</p>
          <p className="text-sky-400 font-black text-lg leading-tight group-hover:text-sky-300 transition-colors">Finanças Pro Invest</p>
        </div>
      </button>

      <UsageIndicator userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPremium} />

      {/* 3. BOTÃO NOVO LANÇAMENTO */}
      <button 
        onClick={isLimitReached && !isPremium ? onShowPaywall : onOpenForm}
        className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${isLimitReached && !isPremium ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 text-white'}`}
      >
        {isLimitReached && !isPremium ? '🔒 LIMITE ATINGIDO' : '+ NOVO LANÇAMENTO'}
      </button>

      {/* 4. GRÁFICO PIZZA */}
      <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
        <h3 className="text-white font-bold mb-6 text-sm flex items-center gap-2"><span className="w-1 h-4 bg-emerald-500 rounded-full"></span> Distribuição</h3>
        <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full relative flex-shrink-0 shadow-2xl" style={{ background: categoryStats.gradient }}>
                <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                    <span className="text-xl">📊</span>
                </div>
            </div>
            <div className="flex-1 space-y-2">
                {categoryStats.data.length > 0 ? categoryStats.data.map((cat: any) => (
                    <div key={cat.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: cat.color }}></div><span className="text-slate-300">{cat.name}</span></div>
                        <span className="text-white font-bold">{Math.round(cat.percent)}%</span>
                    </div>
                )) : <p className="text-slate-500 text-xs italic">Sem gastos registrados.</p>}
            </div>
        </div>
      </div>

      {/* 5. FLUXO DE CAIXA */}
      <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
        <h3 className="text-white font-bold mb-8 text-sm flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span> Fluxo de Caixa
        </h3>
        <div className="flex items-end justify-between h-40 gap-4 px-2 pb-2">
            {[ 
              { label: 'Entradas', val: stats.income, color: 'bg-emerald-500', h: barHeights.income },
              { label: 'Saídas', val: stats.expenses, color: 'bg-orange-500', h: barHeights.expenses },
              { label: 'Saldo', val: stats.balance, color: stats.balance >= 0 ? 'bg-indigo-500' : 'bg-red-500', h: barHeights.balance }
            ].map((bar) => (
                <div key={bar.label} className="w-1/3 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full bg-slate-900 rounded-t-xl relative h-full flex items-end overflow-hidden">
                        <div className={`w-full ${bar.color} rounded-t-xl transition-all duration-1000`} style={{ height: `${bar.h || 2}%` }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{bar.label}</span>
                </div>
            ))}
        </div>
      </div>

      <FilterBar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} categories={Array.from(new Set(safeTransactions.map((t: any) => t?.category || 'Geral')))} />
      <TransactionHistory transactions={filtered} onDelete={onDeleteTransaction} isPrivacyMode={isPrivacyMode} />
    </div>
  );
};
export default Dashboard;