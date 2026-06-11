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
  LabelList,
  ScatterChart,
  Scatter,
  ComposedChart,
  Customized
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

  // Composição de Dívidas por Tipo
  const debtComposition = useMemo(() => {
    const categories: Record<string, number> = {};
    debts.forEach(debt => {
      const cat = debt.tipo || 'Outros';
      categories[cat] = (categories[cat] || 0) + (debt.saldoDevedor || 0);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [debts]);

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
    // 1. Mapear histórico com lógica de "limpeza" de dados legados
    let data = wealthHistory.map(h => {
      // HEURÍSTICA DE RECONSTRUÇÃO:
      // Se nío temos o total de investimentos puro no histórico (h.totalInvestments),
      // nós pegamos o Total de Ativos da época e subtraímos o valor de Bens.
      // Prioridade: 1. Valor salvo | 2. Ativos - Bens Salvos | 3. Ativos - Bens Atuais (Heurística de Conserto)
      let pureInvestments = h.totalInvestments;
      
      if (pureInvestments === undefined) {
        const propertyValueToSubtract = h.totalProperty !== undefined ? h.totalProperty : totalProperty;
        pureInvestments = Math.max(0, h.totalAssets - propertyValueToSubtract);
      }

      return {
        name: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        value: h.totalNetWorth,
        investments: pureInvestments,
        debts: h.totalDebts,
        isReal: true
      };
    });

    // 2. Definir o Ponto de "Agora" (Realidade dos Cards)
    const todayLabel = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const todayFull = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    
    const currentReality = {
      name: todayLabel,
      fullDate: todayFull,
      value: patrimonioLiquido,
      investments: totalInvestments,
      debts: totalDebts,
      isReal: true
    };

    // 3. Mesclar Realidade com Histórico (Live Edge)
    if (data.length === 0) {
      return [currentReality];
    }

    const lastHistoryPoint = data[data.length - 1];
    
    // Se o último ponto do histórico já é de hoje, nós o "atualizamos" com a realidade viva do card
    if (lastHistoryPoint.name === todayLabel) {
      data[data.length - 1] = currentReality;
    } else {
      // Se o último ponto é de outro dia, adicionamos a realidade de hoje como o "bico" do gráfico
      data.push(currentReality);
    }

    return data;
  }, [patrimonioLiquido, totalInvestments, totalDebts, wealthHistory]);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const ConsolidatedLabel = (props: any) => {
    const { x, y, payload, index, data } = props;
    
    if (!payload || !payload.fullDate) return null;
    
    const { value: pl, investments, debts, fullDate } = payload;
    const totalPoints = data?.length || 0;

    // Toque inteligente para as extremidades:
    // Se for o primeiro ponto, move a etiqueta um pouco para a direita.
    // Se for o último ponto, move a etiqueta um pouco para a esquerda.
    let shiftX = 0;
    if (index === 0) shiftX = 25;
    if (index === totalPoints - 1 && totalPoints > 1) shiftX = -25;

    return (
      <g transform={`translate(${x + shiftX},${y})`}>
        {/* Fundo para legibilidade */}
        <rect 
          x="-45" 
          y="-75" 
          width="90" 
          height="65" 
          fill="white" 
          fillOpacity="0.95" 
          rx="12"
          stroke="#e2e8f0"
          strokeWidth="1"
          className="drop-shadow-lg"
        />
        
        {/* Patrimônio Líquido */}
        <text x="0" y="-58" textAnchor="middle" fontSize="10" fontWeight="900" fill="#10b981">
          {formatCurrency(pl)}
        </text>
        
        {/* Investimentos */}
        <text x="0" y="-46" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#f59e0b">
          Inv: {formatCurrency(investments)}
        </text>
        
        {/* Dívidas */}
        <text x="0" y="-36" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#f43f5e">
          Dív: {formatCurrency(debts)}
        </text>
        
        {/* Data */}
        <text x="0" y="-22" textAnchor="middle" fontSize="8" fontWeight="black" fill="#94a3b8">
          {fullDate}
        </text>
        
        {/* Linha conectora vertical */}
        <line x1={-shiftX} y1="-10" x2={-shiftX} y2="-4" stroke="#e2e8f0" strokeWidth="2" />
      </g>
    );
  };

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
        className={`group relative flex flex-row md:flex-col p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] items-center md:items-start gap-4 md:gap-0 ${
          item.warning ? 'border-status-danger/30 hover:border-status-danger' : 'border-slate-200 hover:border-brand-primary/40'
        }`}
      >
        <div className={`p-3 rounded-2xl md:mb-6 shrink-0 ${
          item.warning ? 'bg-status-danger/10 text-status-danger' : 'bg-amber-50 text-amber-600'
        }`}>
          <item.icon size={22} />
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {item.label}
          </p>
          <p className={`text-lg font-black tracking-tight ${
            hasData ? 'text-slate-900' : 'text-slate-400 italic font-medium'
          }`}>
            {isPrivacyMode ? '••••••' : item.warning ? 'Configurar Datas' : hasData ? formatCurrency(item.value) : 'Cadastrar +'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {item.warning ? (
            <div className="px-2 py-1 bg-status-danger text-white rounded-lg text-[8px] font-black uppercase animate-pulse">
              Ajustar
            </div>
          ) : (
            <ChevronRight size={14} className="text-brand-primary md:hidden" />
          )}
        </div>

        {hasData && !item.warning && (
          <div className="hidden md:block flex-1 space-y-4 mb-4 w-full">
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
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center py-4 space-y-2 opacity-40 w-full">
            <div className="p-3 bg-slate-50 rounded-full">
              <Plus size={20} className="text-slate-300" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Organize seus gastos no crédito</p>
          </div>
        )}

        {(hasData || item.warning) && (
          <div className="hidden md:flex pt-4 border-t border-slate-50 items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-auto w-full">
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
        className={`group relative flex flex-row md:flex-col p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 items-center md:items-start gap-4 md:gap-0 ${
          item.warning ? 'border-status-danger/30 hover:border-status-danger' : 'border-slate-200 hover:border-brand-primary/40'
        }`}
      >
        <div className={`p-3 rounded-2xl md:mb-6 shrink-0 ${
          item.warning ? 'bg-status-danger/10 text-status-danger' :
          item.color === 'rose' ? 'bg-rose-50 text-rose-600' :
          item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
          item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
          'bg-sky-50 text-sky-600'
        }`}>
          <item.icon size={22} />
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {item.label}
          </p>
          <p className={`text-lg font-black tracking-tight ${
            hasData ? 'text-slate-900' : 'text-slate-400 italic font-medium'
          }`}>
            {isPrivacyMode ? '••••••' : item.warning ? 'Configurar Datas' : hasData ? formatCurrency(item.value) : 'Cadastrar +'}
          </p>
          {isLocked && item.proFeature && (
            <p className="text-[9px] font-bold text-slate-400 mt-2 line-through decoration-slate-300 hidden md:block">
              {item.proFeature}
            </p>
          )}
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
          <ChevronRight size={14} className="text-brand-primary md:hidden" />
        </div>

        {(hasData || item.warning) && (
          <div className="hidden md:flex mt-4 pt-4 border-t border-slate-50 items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity w-full">
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
        </div>
      </div>

      {/* BOTÃO MESTRE (ACTION) */}
      <button
        onClick={() => onNavigate('manager')}
        className="w-full group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 p-1 md:p-2 transition-all hover:border-brand-primary/50 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] shadow-soft"
      >
        <div className="flex flex-col gap-4 p-6 md:p-8">
          {/* HEADER ROW: BRAND (LEFT) + SUBTITLE (CENTER TOP) */}
          <div className="relative flex flex-col md:flex-row items-center justify-between w-full gap-4">
            
            {/* BRAND: ICON + NAME */}
            <div className="flex items-center gap-4 md:gap-6 z-10">
              <div className="shrink-0 relative">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-transparent rounded-[2rem] flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500 shadow-soft">
                  <img src="/controla-icon.png" alt="Controla Icon" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-secondary rounded-full border-4 border-white flex items-center justify-center">
                  <Zap size={10} className="text-white fill-white" />
                </div>
              </div>

              <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none uppercase bg-gradient-to-br from-emerald-400 to-teal-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]">
                Controla
              </h3>
            </div>

            {/* SUBTITLE: TOP CENTER ON DESKTOP */}
            <div className="md:absolute md:left-1/2 md:-translate-x-1/2 md:top-0 text-center">
              <span className="block text-xs md:text-sm font-black text-slate-900 uppercase tracking-[0.3em] leading-none mt-2 md:mt-0">
                Fluxo de Caixa
              </span>
            </div>

            {/* ACTION BUTTON: RIGHT */}
            <div className="hidden md:flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-colors shadow-brand-glow">
              Abrir Agora
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* DATA SECTION: ALIGNED UNDER BRAND NAME ON DESKTOP */}
          <div className="md:pl-[104px] flex flex-col items-center md:items-start gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <p className="text-3xl md:text-4xl font-black text-slate-900 leading-none">
                {isPrivacyMode ? '••••••' : formatCurrency(totals.controlaBalance)}
              </p>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest whitespace-nowrap">Saldo do Mês</span>
                </div>
                
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
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {dataHealth === 'green' ? 'Dados Saudáveis' : dataHealth === 'yellow' ? 'Dados Antigos' : 'Atualizar Dados'}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-xl text-center md:text-left">
              Gerencie seu orçamento diário, lançamentos e saldo disponível em tempo real.
            </p>

            <div className="md:hidden w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest">
              Abrir Agora
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </button>

      {/* BENTO GRID (INVENTÁRIO) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Inventário de Gestão</h4>
          {!isPremium && <button onClick={() => onNavigate('pricing')} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver benefícios Pro</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className={`relative h-[500px] w-full bg-slate-50/50 rounded-3xl p-4 border border-slate-100 ${!isPremium ? 'blur-sm grayscale opacity-40 pointer-events-none' : ''}`}>
            {evolutionData.length > 0 && (
              <svg viewBox="0 0 1000 500" className="w-full h-full overflow-visible">
                {/* Definições de Gradientes e Filtros */}
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                  </filter>
                </defs>

                {/* Cálculos de Escala */}
                {(() => {
                  const padding = { top: 120, right: 80, bottom: 60, left: 80 };
                  const width = 1000 - padding.left - padding.right;
                  const height = 500 - padding.top - padding.bottom;
                  
                  // Encontrar Min/Max para escala Y
                  const allValues = evolutionData.flatMap(d => [d.value, d.investments, d.debts]);
                  const minVal = Math.min(...allValues, 0) * 0.9;
                  const maxVal = Math.max(...allValues, 1000) * 1.2;
                  const range = maxVal - minVal;

                  const getY = (val: number) => padding.top + height - ((val - minVal) / range) * height;
                  const getX = (index: number) => {
                    if (evolutionData.length <= 1) return 1000 / 2;
                    return padding.left + (index * (width / (evolutionData.length - 1)));
                  };

                  const points = evolutionData.map((d, i) => ({
                    x: getX(i),
                    plY: getY(d.value),
                    invY: getY(d.investments),
                    debY: getY(d.debts),
                    data: d
                  }));

                  return (
                    <g>
                      {/* Linhas de Grade Horizontais */}
                      {[0, 0.25, 0.5, 0.75, 1].map(p => (
                        <line 
                          key={p}
                          x1={padding.left} 
                          y1={padding.top + height * p} 
                          x2={padding.left + width} 
                          y2={padding.top + height * p} 
                          stroke="#e2e8f0" 
                          strokeDasharray="4 4" 
                        />
                      ))}

                      {/* Áreas e Linhas */}
                      {evolutionData.length > 1 && (
                        <>
                          {/* Área PL */}
                          <path 
                            d={`M ${points[0].x} ${padding.top + height} ${points.map(p => `L ${p.x} ${p.plY}`).join(' ')} L ${points[points.length-1].x} ${padding.top + height} Z`}
                            fill="#10b981" fillOpacity="0.1"
                          />
                          <path 
                            d={`M ${points.map(p => `${p.x} ${p.plY}`).join(' L ')}`}
                            fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                          />

                          {/* Área Investimentos */}
                          <path 
                            d={`M ${points[0].x} ${padding.top + height} ${points.map(p => `L ${p.x} ${p.invY}`).join(' ')} L ${points[points.length-1].x} ${padding.top + height} Z`}
                            fill="#f59e0b" fillOpacity="0.05"
                          />
                          <path 
                            d={`M ${points.map(p => `${p.x} ${p.invY}`).join(' L ')}`}
                            fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4"
                          />

                          {/* Área Dívidas */}
                          <path 
                            d={`M ${points[0].x} ${padding.top + height} ${points.map(p => `L ${p.x} ${p.debY}`).join(' ')} L ${points[points.length-1].x} ${padding.top + height} Z`}
                            fill="#f43f5e" fillOpacity="0.05"
                          />
                          <path 
                            d={`M ${points.map(p => `${p.x} ${p.debY}`).join(' L ')}`}
                            fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 4"
                          />
                        </>
                      )}

                      {/* Pontos e Rótulos (Sempre Visíveis) */}
                      {points.map((p, i) => (
                        <g key={i}>
                          {/* Pontos nos cruzamentos */}
                          <circle cx={p.x} cy={p.plY} r="6" fill="#10b981" stroke="white" strokeWidth="3" />
                          <circle cx={p.x} cy={p.invY} r="4" fill="#f59e0b" stroke="white" strokeWidth="2" />
                          <circle cx={p.x} cy={p.debY} r="4" fill="#f43f5e" stroke="white" strokeWidth="2" />

                          {/* Bloco de Informação Flutuante */}
                          <g transform={`translate(${p.x},${Math.min(p.plY, p.invY, p.debY) - 20})`}>
                            <rect x="-55" y="-85" width="110" height="75" fill="white" rx="12" filter="url(#shadow)" stroke="#f1f5f9" strokeWidth="1" />
                            
                            {/* Patrimônio Líquido */}
                            <text x="0" y="-65" textAnchor="middle" fontSize="12" fontWeight="900" fill="#10b981">
                              {formatCurrency(p.data.value)}
                            </text>
                            
                            {/* Detalhes */}
                            <text x="0" y="-50" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f59e0b">
                              Invest: {formatCurrency(p.data.investments)}
                            </text>
                            <text x="0" y="-38" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f43f5e">
                              Dívidas: {formatCurrency(p.data.debts)}
                            </text>
                            
                            {/* Data */}
                            <rect x="-30" y="-28" width="60" height="14" rx="4" fill="#f8fafc" />
                            <text x="0" y="-18" textAnchor="middle" fontSize="9" fontWeight="900" fill="#64748b">
                              {p.data.fullDate}
                            </text>

                            {/* Linha Conectora */}
                            <line x1="0" y1="-5" x2="0" y2="15" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                          </g>

                          {/* Data no Eixo X */}
                          <text x={p.x} y={padding.top + height + 25} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#94a3b8">
                            {p.data.name}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            )}
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f43f5e]" />
              <span className="text-[10px] font-black uppercase text-slate-500">Dívidas</span>
            </div>
          </div>
          {!isPremium && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <p className="text-xs text-slate-600 font-medium">A evolução histórica é exclusiva Pro.</p>
              <button onClick={() => onNavigate('pricing')} className="mt-2 text-xs font-black text-brand-primary uppercase tracking-widest hover:underline">Fazer Upgrade →</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* COMPOSIÇÃO DE DÍVIDAS */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-soft overflow-hidden group">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">Minhas Dívidas</h3>
                <p className="text-xs text-slate-500 font-medium">Distribuição por categoria.</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {debtComposition.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={debtComposition}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {debtComposition.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#f43f5e', // rose-500
                          '#f59e0b', // amber-500
                          '#8b5cf6', // violet-500
                          '#6366f1', // indigo-500
                          '#0ea5e9', // sky-500
                          '#10b981'  // emerald-500
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
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full animate-bounce">
                    <PartyPopper size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-emerald-600">Parabéns!</p>
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-4">
                      Você não possui dívidas cadastradas. <br/> 
                      Sua saúde financeira agradece!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {debtComposition.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-col gap-2 mb-4">
                  {debtComposition.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [
                          '#f43f5e', '#f59e0b', '#8b5cf6', '#6366f1', '#0ea5e9', '#10b981'
                        ][index % 6] }} />
                        <span className="text-[10px] font-black uppercase text-slate-500">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-900">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] font-bold text-slate-400">{((item.value / totalDebts) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-900">Total Geral</span>
                  <span className="text-[11px] font-black text-status-danger">{formatCurrency(totalDebts)}</span>
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
