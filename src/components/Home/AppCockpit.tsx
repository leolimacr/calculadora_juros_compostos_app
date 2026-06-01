import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChevronRight, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  Car,
  Plus,
  Lock,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Target,
  Crown,
  PartyPopper,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import type { Transaction, UserMeta, RecurringBill, CreditCard as CreditCardType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useBills } from '../../hooks/useBills';
import { isBillPaid, getCurrentInvoice } from '../../utils/invoiceUtils';
import { useDebts } from '../../services/debt/debt.hooks';
import { useWealthData } from '../../hooks/useWealthData';
import { useCards } from '../../hooks/useCards';
import { useWealthHistory } from '../../hooks/useWealthHistory';

interface AppCockpitProps {
  transactions: Transaction[];
  isPrivacyMode: boolean;
  onNavigate: (tool: string, state?: any) => void;
  userMeta?: UserMeta | null;
  isPremium: boolean;
  isPro: boolean;
  isSyncing?: boolean;
}

const AppCockpit: React.FC<AppCockpitProps> = ({
  transactions,
  isPrivacyMode,
  onNavigate,
  userMeta,
  isPremium,
  isPro,
  isSyncing
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bills: recurringBills, isLoading: loadingBills } = useBills(user?.uid);
  const { 
    history: wealthHistory, 
    daysSinceLastSnapshot, 
    dataHealth, 
    saveSnapshot, 
    isSaving 
  } = useWealthHistory(user?.uid);

  // Hooks de Dados Reais
  const { 
    assets,
    passives,
    totalInvestments, 
    totalProperty, 
    patrimonioLiquido, 
    totalDebts,
    debts,
    loading: loadingWealth 
  } = useWealthData();

  // Composição de Investimentos por Categoria
  const investmentComposition = useMemo(() => {
    const categories: Record<string, number> = {};
    assets.forEach(asset => {
      const cat = asset.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + (asset.currentValue || 0);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  // Composição de Bens por Categoria
  const propertyComposition = useMemo(() => {
    const categories: Record<string, number> = {};
    passives.forEach(item => {
      const cat = item.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + (item.currentValue || 0);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [passives]);

  const { cards: userCards = [], isLoading: loadingCards } = useCards(user?.uid);

  const safeTx = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

  // Lógica de Urgência
  const urgentBills = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return recurringBills.filter(bill => {
      if (!bill.isActive) return false;
      const isDueSoon = bill.dueDay === currentDay || bill.dueDay === (currentDay + 1);
      if (!isDueSoon) return false;
      return !isBillPaid(bill, safeTx);
    });
  }, [recurringBills, safeTx]);

  // Saudação Dinâmica
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Cálculos de Totais
  const totals = useMemo(() => {
    const totalCards = userCards.reduce((sum, card) => {
      const inv = getCurrentInvoice(card, safeTx);
      return sum + (inv?.total || 0);
    }, 0);

    const hasIncompleteCards = userCards.some(c => !c.closingDay || !c.dueDay);

    const controlaBalance = safeTx.reduce((acc, t) => {
      if (!t.date) return acc;
      const [year, month] = t.date.split('-').map(Number);
      const now = new Date();
      if (year !== now.getFullYear() || month !== (now.getMonth() + 1)) return acc;

      const val = Number(t.amount) || 0;
      if (t.type === 'income') return acc + val;
      if (t.type === 'expense' && t.paymentMethod !== 'credit') return acc - val;
      return acc;
    }, 0);

    return {
      debt: totalDebts,
      cards: totalCards,
      investments: totalInvestments,
      bens: totalProperty,
      controlaBalance,
      hasCards: userCards.length > 0,
      hasDebts: debts.length > 0,
      hasInvestments: totalInvestments > 0,
      hasBens: totalProperty > 0,
      hasIncompleteCards,
      validatedModules: wealthHistory[0]?.validatedModules || {}
    };
  }, [totalDebts, userCards, safeTx, totalInvestments, totalProperty, debts.length, wealthHistory]);

  const detailedCards = useMemo(() => {
    return userCards.map(card => {
      const inv = getCurrentInvoice(card, safeTx);
      const balance = inv?.total || 0;
      const limit = card.limit || 0;
      const available = Math.max(0, limit - balance);
      const usagePercent = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
      
      const purchaseCount = safeTx.filter(t => 
        t.cardId === card.id && 
        t.type === 'expense' && 
        inv && t.date >= inv.periodStart && t.date <= inv.periodEnd
      ).length;

      return {
        ...card,
        balance,
        available,
        usagePercent,
        purchaseCount,
        dueDate: inv?.dueDate
      };
    }).filter(c => c.isActive !== false);
  }, [userCards, safeTx]);

  // Dados Reais para Evoluçío (Frente 4)
  const evolutionData = useMemo(() => {
    if (wealthHistory.length >= 2) {
      return wealthHistory.map(h => ({
        name: new Date(h.date).toLocaleDateString('pt-BR', { month: 'short' }),
        value: h.totalNetWorth,
        investments: h.totalAssets,
        isReal: h.isReal
      }));
    }

    const currentPL = patrimonioLiquido;
    const currentInvest = totalInvestments;
    // Fallback: Simulaçío baseada no valor atual (tracejada futuramente)
    return [
      { name: 'Jan', value: currentPL * 0.85, investments: currentInvest * 0.82, isReal: false },
      { name: 'Fev', value: currentPL * 0.88, investments: currentInvest * 0.85, isReal: false },
      { name: 'Mar', value: currentPL * 0.92, investments: currentInvest * 0.90, isReal: false },
      { name: 'Abr', value: currentPL * 0.95, investments: currentInvest * 0.93, isReal: false },
      { name: 'Mai', value: currentPL, investments: currentInvest, isReal: false }
    ];
  }, [patrimonioLiquido, totalInvestments, wealthHistory]);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderCardsCard = (item: { 
    id: string; 
    label: string; 
    icon: any; 
    color: string; 
    value: number; 
    action: () => void;
    locked?: boolean;
    proFeature?: string;
    hasItems?: boolean;
    warning?: boolean;
    isValidated?: boolean;
  }) => {
    const hasData = item.hasItems ?? item.value > 0;
    const displayCards = detailedCards.slice(0, 3);
    const totalPurchases = detailedCards.reduce((sum, c) => sum + c.purchaseCount, 0);

    return (
      <button
        key={item.id}
        onClick={item.action}
        className={`group relative flex flex-col p-6 rounded-[2rem] border transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
          item.warning ? 'border-status-danger/30 hover:border-status-danger' : 'border-slate-200 hover:border-brand-primary/40'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              item.warning ? 'bg-status-danger/10 text-status-danger' : 'bg-amber-50 text-amber-600'
            }`}>
              <item.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {item.label}
              </p>
              <p className={`text-lg font-black tracking-tight ${
                hasData ? 'text-slate-900' : 'text-slate-400 italic font-medium'
              }`}>
                {isPrivacyMode ? '••••••' : item.warning ? 'Configurar Datas' : hasData ? formatCurrency(item.value) : 'Cadastrar +'}
              </p>
            </div>
          </div>
          {item.warning && (
            <div className="px-2 py-1 bg-status-danger text-white rounded-lg text-[8px] font-black uppercase animate-pulse">
              Ajustar
            </div>
          )}
        </div>

        {hasData && !item.warning && (
          <div className="flex-1 space-y-4 mb-4">
            <div className="grid grid-cols-1 gap-3">
              {displayCards.map(card => (
                <div key={card.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-700 uppercase tracking-tight">{card.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{card.purchaseCount} compras</span>
                      <span className="text-slate-900">{isPrivacyMode ? '••••' : formatCurrency(card.balance)}</span>
                    </div>
                  </div>
                  {card.limit > 0 && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${card.usagePercent > 90 ? 'bg-status-danger' : card.usagePercent > 70 ? 'bg-amber-500' : 'bg-brand-primary'}`}
                          style={{ width: `${card.usagePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400">
                        <span>Uso: {card.usagePercent.toFixed(0)}%</span>
                        <span>Restam {isPrivacyMode ? '••••' : formatCurrency(card.available)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {totalPurchases > 0 && (
              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest text-center py-2 bg-brand-primary/5 rounded-xl border border-brand-primary/10 group-hover:bg-brand-primary/10 transition-colors">
                Clique para ver as {totalPurchases} compras em aberto
              </p>
            )}
          </div>
        )}

        {!hasData && !item.warning && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-2 opacity-40">
            <div className="p-3 bg-slate-50 rounded-full">
              <Plus size={20} className="text-slate-300" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Organize seus gastos no crédito</p>
          </div>
        )}

        {(hasData || item.warning) && (
          <div className="pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Gestão Completa de Cartões</span>
            <ChevronRight size={14} className="text-brand-primary" />
          </div>
        )}
      </button>
    );
  };

  const renderInventoryCard = (item: { 
    id: string; 
    label: string; 
    icon: any; 
    color: string; 
    value: number; 
    action: () => void;
    locked?: boolean;
    proFeature?: string;
    hasItems?: boolean;
    warning?: boolean;
    isValidated?: boolean;
  }) => {
    const hasData = item.hasItems ?? item.value > 0;
    const isLocked = item.locked && !isPremium;

    return (
      <button
        key={item.id}
        onClick={item.action}
        className={`group relative flex flex-col p-6 rounded-[2rem] border transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 ${
          item.warning ? 'border-status-danger/30 hover:border-status-danger' : 'border-slate-200 hover:border-brand-primary/40'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-2xl ${
            item.warning ? 'bg-status-danger/10 text-status-danger' :
            item.color === 'rose' ? 'bg-rose-50 text-rose-600' :
            item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
            item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            'bg-sky-50 text-sky-600'
          }`}>
            <item.icon size={22} />
          </div>
          <div className="flex items-center gap-2">
            {item.isValidated && (
              <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg border border-emerald-100" title="Validado hoje">
                <ShieldCheck size={14} />
              </div>
            )}
            {item.warning ? (
              <div className="px-2 py-1 bg-status-danger text-white rounded-lg text-[8px] font-black uppercase animate-pulse">
                Ajustar
              </div>
            ) : isLocked ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 animate-pulse">
                <Crown size={10} className="text-emerald-600 fill-emerald-600" />
                <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter">Pro</span>
              </div>
            ) : !hasData ? (
              <Plus size={16} className="text-slate-300 group-hover:text-brand-primary" />
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {item.label}
          </p>
          <p className={`text-lg font-black tracking-tight ${
            hasData ? 'text-slate-900' : 'text-slate-400 italic font-medium'
          }`}>
            {isPrivacyMode ? '••••••' : item.warning ? 'Configurar Datas' : hasData ? formatCurrency(item.value) : 'Cadastrar +'}
          </p>
          {isLocked && item.proFeature && (
            <p className="text-[9px] font-bold text-slate-400 mt-2 line-through decoration-slate-300">
              {item.proFeature}
            </p>
          )}
        </div>

        {(hasData || item.warning) && (
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">
              {item.isValidated ? 'Ver detalhes' : 'Validar agora'}
            </span>
            <ChevronRight size={14} className="text-brand-primary" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-14 md:pt-6 pb-28 space-y-8 animate-in fade-in duration-500">
      
      {/* SYNC BANNER */}
      {isSyncing && (
        <div className="flex items-center justify-center gap-3 px-6 py-2 bg-sky-500/10 border border-sky-500/20 rounded-2xl animate-in slide-in-from-top-4">
          <RefreshCw size={12} className="text-sky-500 animate-spin" />
          <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">
            Sincronizando dados em tempo real...
          </span>
        </div>
      )}
      
      {/* SLOT DINÂMICO (TOPO) */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-soft">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-secondary/5 rounded-full blur-3xl -ml-24 -mb-24" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            {urgentBills.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-status-danger animate-pulse">
                  <AlertCircle size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Atenção Prioritária</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-slate-900">
                  {urgentBills.length} {urgentBills.length === 1 ? 'conta vence' : 'contas vencem'} <br />
                  <span className="text-brand-secondary">hoje ou amanhã.</span>
                </h1>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{greeting}, {userMeta?.nickname || userMeta?.displayName?.split(' ')[0] || 'Investidor'}</p>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-slate-900">
                    Seu patrimônio líquido é <br />
                    <span className={patrimonioLiquido >= 0 ? 'text-brand-primary' : 'text-status-danger'}>
                      {isPrivacyMode ? '••••••' : patrimonioLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </h1>

                  {totals.hasIncompleteCards && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-in fade-in duration-500">
                      <AlertCircle size={12} className="text-amber-500 shrink-0" />
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Cartões sem data</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl hover:bg-white transition-all group active:scale-95 shadow-sm"
          >
            <div className="p-2 bg-violet-500 rounded-xl text-white shadow-lg shadow-violet-500/20">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Nexus IA</p>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Análise Estratégica</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* BOTÃO MESTRE (ACTION) */}
      <button
        onClick={() => onNavigate('manager')}
        className="w-full group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-1 md:p-2 transition-all hover:border-brand-primary/50 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] shadow-soft"
      >
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-6 md:p-8">
          <div className="shrink-0 relative">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-transparent rounded-[2rem] flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500 shadow-soft">
              <img src="/controla-icon.png" alt="Controla Icon" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-secondary rounded-full border-4 border-white flex items-center justify-center">
              <Zap size={10} className="text-white fill-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-1">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">Controla (Fluxo de Caixa)</h3>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Saldo do Mês</span>
                </div>
                
                {/* INDICADOR DE SAÚDE DOS DADOS (Frente 4) */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg transition-all ${
                  dataHealth === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                  dataHealth === 'yellow' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                           'bg-rose-50 border-rose-100 text-rose-600'
                }`} title={daysSinceLastSnapshot === 999 ? 'Nenhum check-in realizado' : `Último check-in há ${daysSinceLastSnapshot} dias`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    dataHealth === 'green' ? 'bg-emerald-500' :
                    dataHealth === 'yellow' ? 'bg-amber-500' :
                                             'bg-rose-500 animate-pulse'
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {dataHealth === 'green' ? 'Dados Saudáveis' : dataHealth === 'yellow' ? 'Dados Antigos' : 'Atualizar Dados'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mb-2">
              {isPrivacyMode ? '••••••' : formatCurrency(totals.controlaBalance)}
            </p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">Gerencie seu orçamento diário, lançamentos e saldo disponível em tempo real.</p>
          </div>

          <div className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors shadow-brand-glow">
            Abrir Agora
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>

      {/* BENTO GRID (INVENTÁRIO) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Inventário de Gestão</h4>
          {!isPremium && <button onClick={() => onNavigate('pricing')} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver benefícios Pro</button>}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { id: 'invest', label: 'Investimentos', icon: TrendingUp, color: 'emerald', value: totals.investments, hasItems: totals.hasInvestments, action: () => onNavigate('investimentos'), locked: true, proFeature: '+ Rentabilidade Real', isValidated: totals.validatedModules?.investments },
            { id: 'patrimonio', label: 'Bens', icon: Building2, color: 'sky', value: totals.bens, hasItems: totals.hasBens, action: () => onNavigate('passivos'), locked: true, proFeature: '+ Valorização Automática', isValidated: totals.validatedModules?.property },
            { id: 'cartoes', label: 'Cartões', icon: CreditCard, color: 'amber', value: totals.cards, hasItems: totals.hasCards, warning: totals.hasIncompleteCards, action: () => onNavigate('manager', { openCards: true }) },
            { id: 'dividas', label: 'Dívidas', icon: AlertCircle, color: 'rose', value: totals.debt, hasItems: totals.hasDebts, action: () => onNavigate('minhas-dividas'), isValidated: totals.validatedModules?.debts }
          ].map(item => {
            if (item.id === 'cartoes') return renderCardsCard(item);
            return renderInventoryCard(item);
          })}
        </div>
      </div>

      {/* DASHBOARD DE ANÁLISE (GRÁFICOS) */}
      <div className="space-y-6">
        {/* EVOLUÇÃO PATRIMONIAL (FRENTE 3) */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-soft overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                <LineChartIcon size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">Evolução Patrimonial</h3>
                <p className="text-xs text-slate-500 font-medium">Crescimento do seu patrimônio líquido.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* STATUS DE VALIDAÇÃO MODULAR NO GRÁFICO */}
              {totals.validatedModules?.investments && totals.validatedModules?.debts && totals.validatedModules?.property ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  Dados Consolidados
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle size={14} />
                  Validação Pendente
                </div>
              )}
            </div>
          </div>

          <div className={`h-80 w-full ${!isPremium ? 'blur-sm grayscale opacity-40 pointer-events-none' : ''}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis hide domain={['auto', 'auto']} padding={{ top: 40, bottom: 20 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number, name: string) => [
                    formatCurrency(val), 
                    name === 'value' ? 'Patrimônio Líquido' : 'Investimentos'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  name="value"
                  stroke="#10b981" 
                  strokeWidth={3} 
                  strokeDasharray={evolutionData.some(d => !d.isReal) ? "5 5" : "0"}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    offset={10}
                    content={(props: any) => {
                      const { x, y, value, index } = props;
                      if (index !== 0 && index !== evolutionData.length - 1) return null;
                      return (
                        <text 
                          x={x} 
                          y={y - 10} 
                          fill="#10b981" 
                          fontSize={10} 
                          fontWeight="bold" 
                          textAnchor={index === 0 ? "start" : "end"}
                        >
                          {formatCurrency(value)}
                        </text>
                      );
                    }}
                  />
                </Area>
                <Area 
                  type="monotone" 
                  dataKey="investments" 
                  name="investments"
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  strokeDasharray={evolutionData.some(d => !d.isReal) ? "5 5" : "0"}
                  fillOpacity={0.6} 
                  fill="url(#colorInvest)" 
                >
                  <LabelList 
                    dataKey="investments" 
                    position="bottom" 
                    offset={10}
                    content={(props: any) => {
                      const { x, y, value, index } = props;
                      if (index !== 0 && index !== evolutionData.length - 1) return null;
                      return (
                        <text 
                          x={x} 
                          y={y + 20} 
                          fill="#f59e0b" 
                          fontSize={10} 
                          fontWeight="bold" 
                          textAnchor={index === 0 ? "start" : "end"}
                        >
                          {formatCurrency(value)}
                        </text>
                      );
                    }}
                  />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="text-[10px] font-black uppercase text-slate-500">Patrimônio Líquido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-[10px] font-black uppercase text-slate-500">Investimentos</span>
            </div>
          </div>
          
          {!isPremium && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <p className="text-xs text-slate-600 font-medium">A evolução histórica é exclusiva Pro.</p>
              <button onClick={() => onNavigate('pricing')} className="mt-2 text-xs font-black text-brand-primary uppercase tracking-widest hover:underline">Fazer Upgrade →</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COMPOSIÇÃO DE INVESTIMENTOS */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-soft overflow-hidden group">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingUp size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">Sua Carteira de Investimentos</h3>
                <p className="text-xs text-slate-500 font-medium">Diversificação por categoria.</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {investmentComposition.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentComposition}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {investmentComposition.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#10b981', // emerald-500
                          '#6366f1', // indigo-500
                          '#f59e0b', // amber-500
                          '#ec4899', // pink-500
                          '#06b6d4', // cyan-500
                          '#8b5cf6'  // violet-500
                        ][index % 6]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [formatCurrency(val), 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <Target size={32} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhum investimento <br/> cadastrado</p>
                </div>
              )}
            </div>

            {investmentComposition.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-col gap-2 mb-4">
                  {investmentComposition.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [
                          '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'
                        ][index % 6] }} />
                        <span className="text-[10px] font-black uppercase text-slate-500">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-900">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{((item.value / totalInvestments) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-900">Total Geral</span>
                  <span className="text-[11px] font-black text-brand-primary">{formatCurrency(totalInvestments)}</span>
                </div>
              </div>
            )}
          </div>

          {/* COMPOSIÇÃO DE BENS */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-soft overflow-hidden group">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">Bens</h3>
                <p className="text-xs text-slate-500 font-medium">Distribuição do seu patrimônio físico.</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {propertyComposition.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyComposition}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {propertyComposition.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#0ea5e9', // sky-500
                          '#8b5cf6', // violet-500
                          '#f43f5e', // rose-500
                          '#f59e0b', // amber-500
                          '#10b981', // emerald-500
                          '#6366f1'  // indigo-500
                        ][index % 6]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [formatCurrency(val), 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <Target size={32} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhum bem <br/> cadastrado</p>
                </div>
              )}
            </div>

            {propertyComposition.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-col gap-2 mb-4">
                  {propertyComposition.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [
                          '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'
                        ][index % 6] }} />
                        <span className="text-[10px] font-black uppercase text-slate-500">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-900">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{((item.value / totalProperty) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-900">Total Geral</span>
                  <span className="text-[11px] font-black text-brand-primary">{formatCurrency(totalProperty)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER LITE */}
      <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Finanças Pro Invest · {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('test-explorar')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors">Explorar Ferramentas</button>
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          <button onClick={() => onNavigate('mais')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors">Configurações</button>
        </div>
      </div>

    </div>
  );
};

export default AppCockpit;
