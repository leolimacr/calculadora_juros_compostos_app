import { useLocation } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  Wallet, 
  Plus, 
  PieChart, 
  BarChart3, 
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import UsageIndicator from './UsageIndicator';
import TransactionHistory from './TransactionHistory';
import FilterBar from './FilterBar';
import CategoryManager from './CategoryManager';
import { generateFinancialReport } from '../../../utils/reportGenerator';
import { getConsecutiveDays } from '../../../utils/streakUtils';
import { getOperationalInsight, buildUserContext, NexusInsight } from '../../../services/nexusInsightEngine';
import { useCards } from '../../../hooks/useCards';
import { useBills } from '../../../hooks/useBills';
import { getCurrentInvoice, isBillPaid } from '../../../utils/invoiceUtils';
import { CreditCard, RecurringBill } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { CreditCard as CardIcon, Check, RefreshCw, AlertCircle, Clock, Info } from 'lucide-react';
import RecurringBillManager from './RecurringBillManager';
import { useIsMobile } from '../../../hooks/useIsMobile';
import CardManager from './CardManager';

const Dashboard: React.FC<any> = (props) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { 
    transactions = [], 
    categories = [], 
    isLoading,
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
    onTogglePrivacy,
    onEditTransaction,
    onNavigate,
    lastActionTimestamp,
    isSyncing,
    isStale
  } = props;

  const { user } = useAuth();
  const { cards: userCards } = useCards(user?.uid);
  const { bills: recurringBills } = useBills(user?.uid);
  const [isRecurringBillModalOpen, setIsRecurringBillModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).openCards) {
      setIsCardModalOpen(true);
      // Limpa o estado para não reabrir ao atualizar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Lógica para a caixinha educativa (Frente 2)
  const [showIntro, setShowIntro] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dontShowFor15Days, setDontShowFor15Days] = useState(false);

  const checkIntroSuppression = () => {
    const skipUntil = localStorage.getItem('recurring_intro_skip_until');
    if (skipUntil) {
      const skipDate = new Date(skipUntil);
      if (new Date() < skipDate) return true;
    }
    return false;
  };

  const handleRecurringButtonClick = () => {
    if (isMobile && !checkIntroSuppression()) {
      setShowIntro(true);
    } else {
      setIsRecurringBillModalOpen(true);
    }
  };

  const handleConfirmIntro = () => {
    if (dontShowFor15Days) {
      const skipUntil = new Date();
      skipUntil.setDate(skipUntil.getDate() + 15);
      localStorage.setItem('recurring_intro_skip_until', skipUntil.toISOString());
    }
    setShowIntro(false);
    setIsRecurringBillModalOpen(true);
  };

  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

  const activeInvoices = useMemo(() => {
    return userCards
      .map(card => {
        const invoice = getCurrentInvoice(card, safeTransactions);
        return invoice ? { ...invoice, cardName: card.name, cardId: card.id } : null;
      })
      .filter((inv): inv is NonNullable<typeof inv> => inv !== null && inv.total > 0);
  }, [userCards, safeTransactions]);

  const pendingBills = useMemo(() => {
    return recurringBills.filter(bill => bill.isActive && !isBillPaid(bill, safeTransactions));
  }, [recurringBills, safeTransactions]);

  const totalPendingBills = useMemo(() => {
    return pendingBills.reduce((acc, bill) => acc + bill.amount, 0);
  }, [pendingBills]);

  // Estado para controlar a transparência do título no scroll
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [inlineInsight, setInlineInsight] = useState<NexusInsight | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'all' | 'period'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'date-desc' | 'date-asc' | 'category-asc' | 'category-desc'>('date-desc');
  const [showCategorySummary, setShowCategorySummary] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAverages, setShowAverages] = useState(false);
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState(false);
  const [averageMode, setAverageMode] = useState<'real' | 'occurrence'>('real');
  const [averagesWindow, setAveragesWindow] = useState<'year' | 'last3' | 'last6' | 'all' | 'custom'>('year');
  const [customPeriodStart, setCustomPeriodStart] = useState('');
  const [customPeriodEnd, setCustomPeriodEnd] = useState('');
  const [showCustomPeriodPicker, setShowCustomPeriodPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const showBackToTools = !!onNavigate && !Capacitor.isNativePlatform();

  // NOVO SISTEMA DE RENDERIZAÇÃO (Ponto 2 do refinamento)
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // Ejector seat: Máximo 500ms calculando
    const timer = setTimeout(() => setIsCalculating(false), 500);
    
    // Se temos transações (cache ou realtime), liberamos após um pequeno respiro para o useMemo
    if (safeTransactions.length >= 0) {
      const calculationTimer = setTimeout(() => setIsCalculating(false), 300);
      return () => {
        clearTimeout(timer);
        clearTimeout(calculationTimer);
      };
    }
    return () => clearTimeout(timer);
  }, [safeTransactions.length]);

  const isReady = !isLoading || safeTransactions.length > 0;
  const showSkeleton = !isReady || isCalculating;

  const streak = useMemo(() => getConsecutiveDays(safeTransactions), [safeTransactions]);

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
    // Se estiver em modo esqueleto profundo, retorna vazio
    if (!isReady) return [];

    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const query = normalize(searchQuery.trim());
    
    // Injeção de Faturas Virtuais
    const virtualInvoices = activeInvoices.map(inv => ({
      id: `virtual-inv-${inv.cardId}`,
      description: `Fatura - ${inv.cardName}`,
      amount: inv.total,
      date: inv.dueDate || new Date().toISOString().split('T')[0],
      category: `Fatura - Cartão ${inv.cardName}`,
      type: 'expense',
      paymentMethod: 'money', // Representa a saída do saldo real
      isVirtual: true,
      cardId: inv.cardId
    }));

    const base = [...safeTransactions, ...virtualInvoices].filter((t: any) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(t?.category);
      const typeMatch = typeFilter === 'all' || t?.type === typeFilter;
      if (!categoryMatch || !typeMatch || !t.date) return false;

      // Busca textual ignora filtro de data e varre todos os lançamentos
      if (query) {
        return normalize(t.description || '').includes(query) ||
               normalize(t.category || '').includes(query);
      }

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

    return [...base].sort((a: any, b: any) => {
      const dateA = a?.date || '';
      const dateB = b?.date || '';
      if (sortMode === 'date-asc') return dateA.localeCompare(dateB);
      if (sortMode === 'date-desc') return dateB.localeCompare(dateA);
      return 0;
    });
  }, [safeTransactions, activeInvoices, selectedCategories, typeFilter, currentDate, viewMode, startDate, endDate, sortMode, searchQuery, isReady]);

  const stats = useMemo(() => {
    if (!isReady) return { income: 0, expenses: 0, balance: 0, projectedBalance: 0 };

    let income = 0; 
    let expenses = 0;
    let realBalance = 0;
    let virtualImpact = 0;

    filtered.forEach((t: any) => {
        const val = Number(t?.amount) || 0;
        const isCredit = t?.paymentMethod === 'credit';

        if (t?.type === 'income') {
          income += val;
          realBalance += val;
        } else {
          expenses += val;
          if (t.isVirtual) {
            virtualImpact += val;
          } else if (!isCredit) {
            realBalance -= val;
          }
        }
    });
    
    return { 
      income, 
      expenses, 
      balance: realBalance,
      projectedBalance: realBalance - virtualImpact - totalPendingBills
    };
  }, [filtered, isReady, totalPendingBills]);

  const projectedBalance = useMemo(() => {
    return stats.balance - totalPendingBills;
  }, [stats.balance, totalPendingBills]);

  // Efeito para monitorar novos lançamentos e disparar insight
  useEffect(() => {
    if (lastActionTimestamp && safeTransactions.length > 0) {
      const ctx = buildUserContext({
        launchCount: safeTransactions.length,
        transactionsToday: safeTransactions.filter(t => t.date === new Date().toISOString().split('T')[0]).length,
        monthBalance: stats.balance,
        isPremium,
        isFirstSession: userMeta?.isFirstSession,
        cards: userCards,
        transactions: safeTransactions
      });

      const insight = getOperationalInsight(ctx);
      if (insight) {
        setInlineInsight(insight);
        setShowInsight(true);
        const timer = setTimeout(() => setShowInsight(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastActionTimestamp, safeTransactions.length, stats.balance, isPremium, userMeta?.isFirstSession]);

  const categoryStats = useMemo(() => {
    if (!isReady) return { data: [], gradient: '' };

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
  }, [filtered, isReady]);

  const categorySummary = useMemo(() => {
    if (!isReady) return [];

    const map = new Map<string, { income: number; expense: number; total: number; count: number }>();

    filtered.forEach((t: any) => {
      const category = (t?.category || 'Sem categoria').toString();
      const value = Number(t?.amount) || 0;

      const current = map.get(category) || {
        income: 0,
        expense: 0,
        total: 0,
        count: 0
      };

      if (t?.type === 'income') {
        current.income += value;
        current.total += value;
      } else {
        current.expense += value;
        current.total -= value;
      }

      current.count += 1;
      map.set(category, current);
    });

    const result = Array.from(map.entries()).map(([name, values]) => ({
      name,
      ...values
    }));

    if (sortMode === 'category-desc') {
      return result.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR', { sensitivity: 'base' }));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }, [filtered, sortMode, isReady]);

  const categoryTransactionsMap = useMemo(() => {
    if (!isReady) return new Map<string, any[]>();

    const map = new Map<string, any[]>();

    filtered.forEach((t: any) => {
      const category = (t?.category || 'Sem categoria').toString();
      const current = map.get(category) || [];
      current.push(t);
      map.set(category, current);
    });

    return map;
  }, [filtered, isReady]);

  const averagesData = useMemo(() => {
    // OPT 1: Lazy Calculation - Don't calculate if section is hidden
    if (!showAverages || !isReady) return [];

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
    const isMonthClosed = (year: number, month: number) =>
      year < currentYear || (year === currentYear && month < currentMonth);
    const isCurrentMonth = (year: number, month: number) =>
      year === currentYear && month === currentMonth;

    const getWindowMonths = (): { year: number; month: number }[] => {
      const months: { year: number; month: number }[] = [];
      if (averagesWindow === 'year') {
        for (let m = 1; m <= 12; m++) months.push({ year: currentYear, month: m });
      } else if (averagesWindow === 'last3') {
        for (let i = 2; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }
      } else if (averagesWindow === 'last6') {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }
      } else if (averagesWindow === 'custom' && customPeriodStart && customPeriodEnd) {
        const [startYear, startMonth] = customPeriodStart.split('-').map(Number);
        const [endYear, endMonth] = customPeriodEnd.split('-').map(Number);
        let y = startYear; let m = startMonth;
        while (y < endYear || (y === endYear && m <= endMonth)) {
          months.push({ year: y, month: m });
          m++; if (m > 12) { m = 1; y++; }
        }
      } else {
        const set = new Set<string>();
        safeTransactions.forEach((t: any) => {
          if (t?.date) {
            const [y, m] = t.date.split('-').map(Number);
            set.add(`${y}-${String(m).padStart(2, '0')}`);
          }
        });
        Array.from(set).sort().forEach(key => {
          const [y, m] = key.split('-').map(Number);
          months.push({ year: y, month: m });
        });
      }
      return months;
    };

    const windowMonths = getWindowMonths();
    const categoryMonthMap = new Map<string, Map<string, number>>();

    safeTransactions
      .filter((t: any) => t?.type === 'expense' && t?.date)
      .forEach((t: any) => {
        const [y, m] = t.date.split('-').map(Number);
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;
        const cat = (t.category || 'Sem categoria').toString();
        const val = Number(t.amount) || 0;
        if (!categoryMonthMap.has(cat)) categoryMonthMap.set(cat, new Map());
        const mm = categoryMonthMap.get(cat)!;
        mm.set(monthKey, (mm.get(monthKey) || 0) + val);
      });

    const result: {
      category: string;
      average: number;
      averageOccurrence: number;
      totalValue: number;
      totalMonthsInWindow: number;
      monthsWithValue: number;
      months: {
        year: number; month: number; label: string; value: number;
        isClosed: boolean; isCurrentMonth: boolean;
        deviation: number | null; projection: number | null;
      }[];
    }[] = [];

    categoryMonthMap.forEach((monthMap, category) => {
      const monthsData = windowMonths.map(({ year, month }) => {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const value = monthMap.get(monthKey) || 0;
        const closed = isMonthClosed(year, month);
        const current = isCurrentMonth(year, month);
        let projection: number | null = null;
        if (current && value > 0) {
          const dayOfMonth = today.getDate();
          const totalDays = daysInMonth(year, month);
          projection = (value / dayOfMonth) * totalDays;
        }
        const label = new Date(year, month - 1, 1)
          .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          .replace('.', '');
        return { year, month, label, value, isClosed: closed, isCurrentMonth: current, deviation: null as number | null, projection };
      });

      // Meses que contam para média (fechados com valor + opcionalmente mês atual)
      const monthsForAverage = monthsData.filter(m => {
        if (m.isClosed && m.value > 0) return true;
        if (m.isCurrentMonth && includeCurrentMonth && m.value > 0) return true;
        return false;
      });
      if (monthsForAverage.length === 0) return;

      const totalValue = monthsForAverage.reduce((sum, m) => sum + m.value, 0);

      // Total de meses fechados na janela (+ atual se incluído) — para média real
      const totalClosedMonthsInWindow = windowMonths.filter(({ year, month }) =>
        isMonthClosed(year, month) || (isCurrentMonth(year, month) && includeCurrentMonth)
      ).length;

      const averageReal = totalClosedMonthsInWindow > 0 ? totalValue / totalClosedMonthsInWindow : 0;
      const averageOccurrence = totalValue / monthsForAverage.length;

      // Desvio usa a média selecionada pelo usuário
      const activeAverage = averageMode === 'real' ? averageReal : averageOccurrence;

      const withDeviation = monthsData.map(m => ({
        ...m,
        deviation: (m.isClosed || (m.isCurrentMonth && includeCurrentMonth)) && m.value > 0 && activeAverage > 0
          ? ((m.value - activeAverage) / activeAverage) * 100
          : null,
      }));

      result.push({
        category,
        average: averageReal,
        averageOccurrence,
        totalValue,
        totalMonthsInWindow: totalClosedMonthsInWindow,
        monthsWithValue: monthsForAverage.length,
        months: withDeviation,
      });
    });

    return result.sort((a, b) => a.category.localeCompare(b.category, 'pt-BR', { sensitivity: 'base' }));
  }, [safeTransactions, averagesWindow, includeCurrentMonth, averageMode, customPeriodStart, customPeriodEnd, isReady]);

  const categoryNames = useMemo(() => {
    const fromDb = categories.map((c: any) => c.name);
    const fromTransactions = safeTransactions.map((t: any) => t?.category).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromTransactions])).sort();
  }, [categories, safeTransactions]);

  if (showSkeleton) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 md:pt-6 pb-32 space-y-8 animate-in fade-in duration-500 bg-surface-secondary rounded-5xl border border-surface-elevated shadow-card">
        {/* OPT 4: Enhanced Skeleton - Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-3xl bg-slate-100 animate-pulse" />
            <div className="w-10 h-10 rounded-3xl bg-slate-100 animate-pulse" />
            <div className="w-32 h-10 rounded-3xl bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Skeleton Balance Card */}
        <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-8 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-8">
            <div className="h-10 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="h-64 bg-surface-primary border border-surface-elevated rounded-5xl animate-pulse" />
           <div className="h-64 bg-surface-primary border border-surface-elevated rounded-5xl animate-pulse" />
        </div>
      </div>
    );
  }

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

  const handleExportPDF = () => {
    const catLabel = selectedCategories.length === 0 ? 'Todas Categorias' : selectedCategories.join(', ');
    generateFinancialReport(filtered, `${catLabel} - ${periodLabel}`, userMeta?.email || 'Investidor');
  };

  const handleConfirmInvoicePayment = async (inv: any) => {
    if (!user?.uid) return;
    
    // Converte a fatura virtual em uma transação real
    const paymentData = {
      type: 'expense',
      category: `Fatura - Cartão ${inv.cardName}`,
      amount: inv.total,
      description: `Pagamento Fatura ${inv.cardName}`,
      date: inv.dueDate || new Date().toISOString().split('T')[0],
      paymentMethod: 'money',
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    try {
      // Aqui usamos a prop onOpenForm mas passando os dados para salvar direto, 
      // ou podemos simplesmente abrir o form já preenchido e travado.
      // Para seguir sua regra de "confirmação", vamos abrir o form travado:
      onOpenForm({
        ...paymentData,
        isLocked: true, // Nova flag para o TransactionForm
        lockMessage: "Este lançamento é gerado automaticamente pelas suas compras no cartão. Para alterar o valor, edite as compras na Gestão de Cartões."
      });
    } catch (error) {
      console.error("Erro ao processar confirmação de fatura:", error);
    }
  };

  const isFirstAccess = safeTransactions.length === 0;

  return (
    <>
      {/* Barra Fixa Invisível para Título CONTROLA (Mobile Only) */}
      <div className={`fixed top-16 left-0 z-[100] md:hidden h-14 w-full px-4 flex items-center bg-transparent pointer-events-none transition-all duration-300 ${isScrolled ? 'opacity-5' : 'opacity-100'}`}>
        <div className="flex items-center gap-3 pointer-events-auto">
          <img
            src="/controla-icon.png"
            alt="Ícone do Controla"
            className="w-9 h-9 rounded-xl shadow-md border border-emerald-200/50 bg-white object-cover"
          />
          <h2 className="text-3xl font-black tracking-tight uppercase leading-tight bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            Controla
          </h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 md:pt-6 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 bg-surface-secondary rounded-5xl border border-surface-elevated shadow-card">
        <CategoryManager isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} onSave={onSaveCategory} onDelete={onDeleteCategory} />

        {/* SYNC BANNER (Ponto 1 e 4 do refinamento) */}
        {isStale && (
          <div className="flex items-center justify-between gap-4 px-6 py-3 bg-amber-50 border border-amber-100 rounded-3xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                <RefreshCw size={16} className="animate-spin" />
              </div>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                Modo Offline / Sincronizando: Alguns dados podem estar desatualizados
              </p>
            </div>
            <span className="text-[8px] font-bold text-amber-500 uppercase px-2 py-1 bg-white rounded-lg border border-amber-100">
              Somente Leitura
            </span>
          </div>
        )}

	  {/* HEADER DO GERENCIADOR */}
{showBackToTools && (
  <button
    onClick={() => { onNavigate('home'); setTimeout(() => { document.getElementById('secao-ferramentas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }}
    className="hidden md:flex mb-4 items-center gap-2 text-text-muted hover:text-brand-secondary transition-all font-black uppercase text-xxs tracking-ultra-wide"
  >
    ← Voltar
  </button>
)}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <div className="flex items-center gap-3">
    <img
      src="/controla-icon.png"
      alt="Ícone do Controla"
      className="hidden md:block w-8 h-8 md:w-9 md:h-9 rounded-xl shadow-soft border border-surface-elevated bg-surface-primary object-cover"
    />
    <div className="flex flex-col">
      <h2 className="hidden md:block text-lg md:text-2xl font-black text-text-primary tracking-tight uppercase leading-tight">
        Controla
      </h2>
      <div className="flex items-center gap-2">
        <p className="text-text-muted text-xxs md:text-xs font-bold uppercase tracking-ultra-wide">
          {periodLabel}
        </p>
        {streak > 1 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-100 rounded-full animate-in fade-in slide-in-from-top-1">
            <span className="text-amber-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">🔥 {streak} dias</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-primary border border-surface-elevated rounded-full opacity-60">
            <span className="text-text-muted text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Começar ofensiva 🔥</span>
          </div>
        )}
      </div>
    </div>
  </div>

  <div className="flex items-center gap-2 md:gap-3 self-start md:self-auto">
    {/* BOTÃO RECORRÊNCIAS */}
    <div className="relative">
      <button
        onClick={handleRecurringButtonClick}
        onMouseEnter={() => !isMobile && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-2.5 md:p-3 rounded-3xl bg-surface-primary border border-surface-elevated text-text-muted hover:text-brand-secondary hover:border-brand-secondary transition-all active:scale-95 shadow-soft"
      >
        <RefreshCw size={18} />
      </button>

      {/* Tooltip Desktop */}
      {!isMobile && showTooltip && (
        <div className="absolute top-full mt-3 right-0 z-[110] w-64 p-4 bg-surface-primary border border-surface-elevated rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-brand-secondary/10 rounded-lg text-brand-secondary">
              <Info size={14} />
            </div>
            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Planejamento Estratégico</span>
          </div>
          <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
            Este botão organiza seu futuro. Ao cadastrar contas fixas e assinaturas, o Controla projeta seu saldo para o fim do mês, evitando surpresas.
          </p>
        </div>
      )}
    </div>

    {/* BOTÃO OLHINHO */}
    <button
      onClick={onTogglePrivacy}
      className="p-2.5 md:p-3 rounded-3xl bg-surface-primary border border-surface-elevated text-text-muted hover:text-text-primary hover:border-text-muted transition-all active:scale-95 shadow-soft"
    >
      {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
    <button
      onClick={isLimitReached && !isPremium ? onShowPaywall : onOpenForm}
      className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-3xl font-black text-xxs md:text-xs uppercase tracking-ultra-wide shadow-soft transition-transform active:scale-95 ${
        isLimitReached && !isPremium
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-brand-primary text-text-onBrand hover:bg-brand-primary/90 shadow-brand-glow'
      }`}
    >
      {isLimitReached && !isPremium ? <Zap size={16} /> : <Plus size={16} />}
      <span>{isLimitReached && !isPremium ? 'Manter Ritmo' : 'Novo Lançamento'}</span>
    </button>
  </div>
</div>
      {/* CARDS DE SALDO COMPACTOS */}
      <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col">
             <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">Saldo Disponível</p>
             <h2 className={`text-2xl font-black tracking-tight ${stats.balance >= 0 ? 'text-text-primary' : 'text-status-danger'}`}>
                {isPrivacyMode ? '••••••' : `R$ ${stats.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
             </h2>
             {totalPendingBills > 0 && !isPrivacyMode && (
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight mt-1">
                 Projeção: <span className={projectedBalance >= 0 ? 'text-brand-primary' : 'text-status-danger'}>
                   R$ {projectedBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                 </span> com pendentes
               </p>
             )}
          </div>
          <div className="flex items-center gap-6">
              <div className="flex flex-col">
                  <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">Entradas</p>
                  <p className="text-lg font-black text-brand-primary">
                    {isPrivacyMode ? '••••' : `R$ ${stats.income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  </p>
              </div>
              <div className="flex flex-col">
                  <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide mb-1">Saídas</p>
                  <p className="text-lg font-black text-red-600">
                    {isPrivacyMode ? '••••' : `R$ ${stats.expenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  </p>
              </div>
          </div>
      </div>
      
      {/* SEÇÃO DE FATURAS (NOVO) */}
      {activeInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeInvoices.map((inv) => (
            <div key={inv.cardId} className="bg-surface-primary border border-surface-elevated p-4 rounded-3xl shadow-soft flex items-center gap-4 group">
              <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary group-hover:scale-110 transition-transform">
                <CardIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest truncate">
                  Fatura Atual • {inv.cardName}
                </p>
                <h3 className="text-lg font-black text-text-primary mt-0.5">
                  {isPrivacyMode ? '••••' : `R$ ${inv.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                </h3>
                <p className="text-xxs font-bold text-text-muted uppercase tracking-tighter mt-1">
                  Vence em {new Date(inv.dueDate?.replace(/-/g, '/') || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
              <div className="hidden group-hover:block animate-in fade-in slide-in-from-right-1">
                {/* Botão Confirmar removido do Dashboard conforme solicitado - agora fica apenas na Gestão de Cartões */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SEÇÃO DE CONTAS PENDENTES (NOVO - FRENTE 2) */}
      {pendingBills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingBills.map((bill) => (
            <div key={bill.id} className="bg-surface-primary border border-surface-elevated p-4 rounded-3xl shadow-soft flex items-center gap-4 group">
              <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-muted text-[10px] font-black uppercase tracking-widest truncate">
                  {bill.type === 'fixed' ? 'Conta Fixa' : 'Assinatura'} • Dia {bill.dueDay}
                </p>
                <h3 className="text-lg font-black text-text-primary mt-0.5 truncate">
                  {bill.name}
                </h3>
                <p className={`text-sm font-black mt-1 ${bill.amount > 0 ? 'text-text-primary' : 'text-brand-primary'}`}>
                  {isPrivacyMode ? '••••' : `R$ ${bill.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                </p>
              </div>
              <div className="hidden group-hover:block animate-in fade-in slide-in-from-right-1">
                <button 
                  onClick={() => onOpenForm({ 
                    type: 'expense', 
                    category: bill.category, 
                    amount: bill.amount, 
                    description: bill.name,
                    date: new Date().toISOString().split('T')[0],
                    autoFocusAmount: true
                  })}
                  className="p-2 bg-surface-secondary hover:bg-brand-primary/10 text-brand-primary rounded-xl transition-colors shadow-sm"
                  title="Pagar agora"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isFirstAccess && <UsageIndicator userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPremium} />}

      {/* TOAST DE INSIGHT OPERACIONAL */}
      {showInsight && inlineInsight && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-brand-primary text-text-onBrand p-4 rounded-3xl shadow-brand-glow flex items-start gap-3 border border-brand-primary/20 backdrop-blur-md bg-opacity-95">
            <div className="bg-surface-primary/20 p-2 rounded-2xl shrink-0">
              <Zap size={18} className="text-text-onBrand" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-ultra-wide mb-1 opacity-90">{inlineInsight.message.title}</p>
              <p className="text-sm font-medium leading-relaxed">{inlineInsight.message.body}</p>
              {inlineInsight.message.ctaLabel && (
                <button 
                  onClick={() => {
                    if (inlineInsight.action?.type === 'pay_invoice' && inlineInsight.action.payload) {
                      onOpenForm({
                        type: 'expense',
                        category: 'Pagamento de Fatura',
                        amount: inlineInsight.action.payload.amount,
                        description: `Fatura ${inlineInsight.action.payload.cardName}`,
                        date: new Date().toISOString().split('T')[0]
                      });
                      setShowInsight(false);
                    }
                  }}
                  className="mt-2 px-4 py-1.5 bg-surface-primary text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-secondary transition-all active:scale-95 shadow-sm"
                >
                  {inlineInsight.message.ctaLabel}
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowInsight(false)}
              className="p-1 hover:bg-surface-primary/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE — PRIMEIRO ACESSO */}
      {isFirstAccess ? (
        <div className="py-16 px-6 bg-surface-primary border border-dashed border-brand-primary/30 rounded-4xl text-center">
          <div className="w-16 h-16 bg-surface-secondary rounded-3xl border border-surface-elevated flex items-center justify-center mx-auto mb-5">
            <Plus size={28} className="text-brand-primary" />
          </div>
          <p className="text-text-primary font-black text-lg mb-2">
            {userMeta?.isFirstSession ? 'Bem-vindo! Vamos começar?' : 'Seu painel está em branco'}
          </p>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed mb-6">
            {userMeta?.isFirstSession 
              ? 'Que tal lançar sua primeira receita? É rápido e me ajuda a te entender melhor.'
              : 'Registre sua primeira receita ou despesa. Eu cuido dos cálculos para você.'}
          </p>
          <button
            onClick={isLimitReached && !isPremium ? onShowPaywall : onOpenForm}
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-text-onBrand font-black text-xxs uppercase tracking-ultra-wide px-6 py-3 rounded-3xl transition-all active:scale-95 shadow-brand-glow"
          >
            <Plus size={14} /> Adicionar primeiro lançamento
          </button>
        </div>
      ) : (
      /* ÁREA DE GRÁFICOS */
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-primary p-8 rounded-5xl border border-surface-elevated shadow-soft">
            <h3 className="text-text-primary font-black mb-6 text-xxs uppercase tracking-ultra-wide flex items-center gap-3"><PieChart size={16} className="text-brand-primary"/> Composição de Gastos</h3>
            <div className="flex items-center gap-10">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0 shadow-2xl" style={{ background: categoryStats.gradient }}></div>
                <div className="flex-1 space-y-3">
                    {categoryStats.data.length > 0 ? categoryStats.data.map((cat: any) => (
                        <div key={cat.name} className="flex flex-col">
                           <div className="flex justify-between text-xxs font-bold uppercase tracking-ultra-wide mb-1">
                              <span className="text-text-secondary">{cat.name}</span>
                              <span className="text-text-primary">{Math.round(cat.percent)}%</span>
                           </div>
                           <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
                              <div className="h-full transition-all duration-1000" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}></div>
                           </div>
                        </div>
                    )) : (
                      <div className="space-y-1">
                        <p className="text-text-secondary font-bold text-sm">Nenhuma saída no período</p>
                        <p className="text-text-muted text-xxs leading-relaxed">O gráfico aparece quando houver lançamentos de saída registrados.</p>
                      </div>
                    )}
                </div>
            </div>
          </div>
           <div className="bg-surface-primary p-8 rounded-5xl border border-surface-elevated shadow-soft">
            <h3 className="text-text-primary font-black mb-6 text-xxs uppercase tracking-ultra-wide flex items-center gap-3"><BarChart3 size={16} className="text-brand-secondary"/> Visão de Fluxo</h3>
            <div className="flex items-end justify-around h-32 gap-4">
                {[
                    {label: 'Entradas', c:'bg-brand-primary', h:(stats.income/Math.max(stats.income,stats.expenses,1))*100},
                    {label: 'Saídas', c:'bg-status-danger', h:(stats.expenses/Math.max(stats.income,stats.expenses,1))*100}
                ].map((b,i)=>(
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full">
                        <div className="w-full bg-surface-elevated rounded-2xl h-full flex items-end overflow-hidden border border-surface-elevated">
                            <div className={`w-full ${b.c} transition-all duration-1000 shadow-none`} style={{height:`${b.h}%`}}></div>
                        </div>
                        <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide">{b.label}</span>
                    </div>
                ))}
            </div>
          </div>
      </div>
      )}
      {/* FILTROS E TABELA */}
      {!isFirstAccess && <div className="space-y-6">
          <div className="space-y-3">
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
              sortMode={sortMode}
              setSortMode={setSortMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Toggle para ocultar/expandir a tabela de lançamentos */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
              <button
                type="button"
                onClick={() => setShowTransactions((prev) => !prev)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full sm:w-auto ${
                  showTransactions
                    ? 'bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary'
                    : 'bg-status-success/10 border-brand-primary/30 text-brand-primary hover:bg-status-success/20'
                }`}
              >
                {showTransactions ? 'Recolher lançamentos' : 'Mostrar lançamentos'}
                {showTransactions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <div className="text-xxs font-bold text-text-muted uppercase tracking-ultra-wide text-center sm:text-right">
                {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}{showTransactions ? '' : ' oculto(s)'}
              </div>
            </div>

            {showTransactions ? (
              <>
                <TransactionHistory
                  transactions={filtered.slice(0, visibleCount)}
                  onDelete={onDeleteTransaction}
                  onEdit={onEditTransaction}
                  isPrivacyMode={isPrivacyMode}
                  isDisabled={isStale}
                />
                
                <div className="space-y-3 mt-4">
                  {/* Linha 1: Mostrar mais e Mostrar todos (apenas se houver mais para mostrar) */}
                  {filtered.length > visibleCount && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVisibleCount(prev => prev + 5)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                      >
                        + 5 Lançamentos
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibleCount(filtered.length)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                      >
                        Mostrar Todos
                      </button>
                    </div>
                  )}

                  {/* Linha 2: Recolher tudo e Resetar contagem */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactions(false);
                      setVisibleCount(10); // Reseta para os 10 iniciais para a próxima abertura
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary"
                  >
                    Recolher lançamentos <ChevronUp size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-surface-primary border border-surface-elevated rounded-4xl px-6 py-8 shadow-soft">
                <p className="text-text-muted text-xxs font-bold uppercase tracking-ultra-wide">
                  Lançamentos ocultos
                </p>
                <p className="text-xxs text-text-secondary mt-2">
                  Use o botão acima para mostrar novamente.
                </p>
              </div>
            )}
          </div>
          {categorySummary.length > 0 && (
            <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-text-primary font-black text-xxs uppercase tracking-ultra-wide">Resumo por Categoria</h3>
                  <p className="text-text-muted text-xxs font-bold uppercase tracking-ultra-wide mt-1">
                    Visão consolidada dos lançamentos filtrados
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xxs text-text-muted">
                    {categorySummary.length} categoria{categorySummary.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategorySummary(prev => {
                        const next = !prev;
                        if (!next) setOpenCategory(null);
                        return next;
                      });
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xxs font-black uppercase border transition-all ${
                      showCategorySummary
                        ? 'bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary'
                        : 'bg-status-success/10 border-brand-primary/30 text-brand-primary hover:bg-status-success/20'
                    }`}
                  >
                    {showCategorySummary ? 'Ocultar Resumo por Categoria' : 'Mostrar Resumo por Categoria'}
                  </button>
                </div>
              </div>

              {showCategorySummary && (
                <>
                <div className="space-y-3 mt-4">
                  {categorySummary.map((cat) => {
                    const isOpen = openCategory === cat.name;
                    const catTransactions = categoryTransactionsMap.get(cat.name) || [];

                    return (
                      <div
                        key={cat.name}
                        className="bg-surface-secondary border border-surface-elevated rounded-3xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenCategory(prev => (prev === cat.name ? null : cat.name))}
                          className="w-full p-4 text-left hover:bg-surface-elevated transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                              <p className="text-sm font-black text-text-primary">{cat.name}</p>
                              <p className="text-xxs font-bold uppercase tracking-ultra-wide text-text-muted mt-1">
                                {cat.count} lançamento{cat.count !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xxs font-bold uppercase tracking-ultra-wide text-brand-primary mt-2">
                                {isOpen ? 'Toque para ocultar lançamentos' : 'Toque para visualizar lançamentos'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                              <div className="text-left sm:text-center">
                                <p className="text-xxs font-black text-text-muted uppercase mb-1">Entradas</p>
                                <p className="text-sm font-black text-brand-primary">
                                  {isPrivacyMode ? '••••' : `R$ ${cat.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>

                              <div className="text-left sm:text-center">
                                <p className="text-xxs font-black text-text-muted uppercase mb-1">Saídas</p>
                                <p className="text-sm font-black text-status-danger">
                                  {isPrivacyMode ? '••••' : `R$ ${cat.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>

                              <div className="text-left sm:text-center sm:border-l sm:border-surface-elevated sm:pl-6">
                                <p className="text-xxs font-black text-text-muted uppercase mb-1">Saldo</p>
                                <p className={`text-sm font-black ${cat.total >= 0 ? 'text-brand-primary' : 'text-status-danger'}`}>
                                  {isPrivacyMode ? '••••' : `R$ ${cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-surface-elevated bg-surface-primary px-4 py-3">
                            {catTransactions.length === 0 ? (
                              <p className="text-xxs text-text-muted italic">Nenhum lançamento encontrado nesta categoria.</p>
                            ) : (
                              <div className="space-y-3">
                                {catTransactions.map((t: any) => (
                                  <div
                                    key={t.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-surface-elevated bg-surface-secondary px-3 py-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-text-primary break-words">
                                        {t.description}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-xxs font-bold uppercase tracking-ultra-wide text-text-muted">
                                          {new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className={`text-xxs font-black uppercase tracking-ultra-wide ${
                                          t.type === 'income' ? 'text-brand-primary' : 'text-status-danger'
                                        }`}>
                                          {t.type === 'income' ? 'Entrada' : 'Saída'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-left sm:text-right">
                                      <p className={`text-sm font-black ${
                                        t.type === 'income' ? 'text-brand-primary' : 'text-status-danger'
                                      }`}>
                                        {isPrivacyMode
                                          ? '••••'
                                          : `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* BOTÃO OCULTAR NO RODAPÉ DO RESUMO */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCategorySummary(false);
                    setOpenCategory(null);
                  }}
                  className="mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full sm:w-auto bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary"
                >
                  Ocultar Resumo por Categoria <ChevronUp size={16} />
                </button>
                </>
              )}
            </div>
          )}
          {/* ANÁLISE DE MÉDIAS */}
          {(averagesData.length > 0 || averagesWindow === 'custom') && (
            <div className="bg-surface-primary border border-surface-elevated rounded-4xl p-5 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-text-primary font-black text-xxs uppercase tracking-ultra-wide flex items-center gap-2">
                    Análise de Médias
                    {!isPremium && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-brand-secondary/10 text-brand-secondary rounded-full font-bold tracking-normal normal-case">
                        No Pro, sua visão de rotina ganha mais fluidez
                      </span>
                    )}
                  </h3>
                  <p className="text-text-muted text-xxs font-bold uppercase tracking-ultra-wide mt-1">
                    Média mensal por categoria · apenas despesas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAverages(prev => !prev)}
                  className={`px-4 py-2.5 rounded-2xl text-xxs font-black uppercase border transition-all ${
                    showAverages
                      ? 'bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary'
                      : 'bg-status-info/10 border-brand-secondary/30 text-brand-secondary hover:bg-status-info/20'
                  }`}
                >
                  {showAverages ? 'Ocultar Análise' : 'Mostrar Análise de Médias'}
                </button>
              </div>

              {showAverages && (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pb-4 border-b border-surface-elevated">
                    <div className="flex flex-wrap gap-2">
                    <div className="flex bg-surface-secondary rounded-2xl p-1 border border-surface-elevated gap-1 flex-wrap">
                      {([
                        { key: 'year' as const, label: 'Ano atual' },
                        { key: 'last3' as const, label: 'Últ. 3m' },
                        { key: 'last6' as const, label: 'Últ. 6m' },
                        { key: 'all' as const, label: 'Tudo' },
                        { key: 'custom' as const, label: 'Escolher período' },
                      ]).map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setAveragesWindow(opt.key);
                            if (opt.key === 'custom') setShowCustomPeriodPicker(true);
                            else setShowCustomPeriodPicker(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xxs font-black uppercase transition-all ${
                            averagesWindow === opt.key
                              ? 'bg-brand-secondary text-text-onBrand shadow-soft'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* SELETOR DE PERÍODO CUSTOMIZADO */}
                    {averagesWindow === 'custom' && (
                      <div className="flex flex-wrap items-center gap-3 mt-1 w-full">
                        {/* Seletor DE */}
                        <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide shrink-0">De</span>
                        <div className="flex items-center gap-2 bg-surface-secondary border border-surface-elevated rounded-2xl px-3 py-2">
                          <select
                            value={customPeriodStart ? customPeriodStart.split('-')[1] : ''}
                            onChange={e => {
                              const year = customPeriodStart ? customPeriodStart.split('-')[0] : new Date().getFullYear().toString();
                              if (e.target.value) setCustomPeriodStart(`${year}-${e.target.value}`);
                            }}
                            className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                          >
                            <option value="">Mês</option>
                            {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                              <option key={m} value={m}>
                                {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}
                              </option>
                            ))}
                          </select>
                          <select
                            value={customPeriodStart ? customPeriodStart.split('-')[0] : ''}
                            onChange={e => {
                              const month = customPeriodStart ? customPeriodStart.split('-')[1] : '01';
                              if (e.target.value) setCustomPeriodStart(`${e.target.value}-${month}`);
                            }}
                            className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                          >
                            <option value="">Ano</option>
                            {Array.from({ length: 36 }, (_, i) => 2015 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        <span className="text-xxs font-black text-text-muted uppercase">até</span>

                        {/* Seletor ATÉ */}
                        <div className="flex items-center gap-2 bg-surface-secondary border border-surface-elevated rounded-2xl px-3 py-2">
                          <select
                            value={customPeriodEnd ? customPeriodEnd.split('-')[1] : ''}
                            onChange={e => {
                              const year = customPeriodEnd ? customPeriodEnd.split('-')[0] : new Date().getFullYear().toString();
                              if (e.target.value) setCustomPeriodEnd(`${year}-${e.target.value}`);
                            }}
                            className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                          >
                            <option value="">Mês</option>
                            {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                              <option key={m} value={m}>
                                {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}
                              </option>
                            ))}
                          </select>
                          <select
                            value={customPeriodEnd ? customPeriodEnd.split('-')[0] : ''}
                            onChange={e => {
                              const month = customPeriodEnd ? customPeriodEnd.split('-')[1] : '01';
                              if (e.target.value) setCustomPeriodEnd(`${e.target.value}-${month}`);
                            }}
                            className="text-xxs font-black text-text-primary bg-transparent outline-none border-none cursor-pointer"
                          >
                            <option value="">Ano</option>
                            {Array.from({ length: 36 }, (_, i) => 2015 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        {customPeriodStart && customPeriodEnd && customPeriodStart <= customPeriodEnd && (
                          <span className="text-xxs font-black text-brand-secondary uppercase tracking-ultra-wide">
                            {(() => {
                              const [sy, sm] = customPeriodStart.split('-').map(Number);
                              const [ey, em] = customPeriodEnd.split('-').map(Number);
                              const total = (ey - sy) * 12 + (em - sm) + 1;
                              return `${total} ${total === 1 ? 'mês' : 'meses'}`;
                            })()}
                          </span>
                        )}

                        {customPeriodStart && customPeriodEnd && customPeriodStart > customPeriodEnd && (
                          <span className="text-xxs font-black text-status-danger uppercase tracking-ultra-wide">
                            ⚠ Data final anterior à inicial
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex bg-surface-secondary rounded-2xl p-1 border border-surface-elevated gap-1">
                      {([
                        { key: 'real' as const, label: 'Média real' },
                        { key: 'occurrence' as const, label: 'Média de ocorrência' },
                      ]).map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setAverageMode(opt.key)}
                          className={`px-3 py-1.5 rounded-xl text-xxs font-black uppercase transition-all ${
                            averageMode === opt.key
                              ? 'bg-brand-secondary text-text-onBrand shadow-soft'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => setIncludeCurrentMonth(p => !p)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          includeCurrentMonth ? 'bg-brand-secondary' : 'bg-surface-elevated'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-surface-primary rounded-full shadow-soft transition-transform ${
                          includeCurrentMonth ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </div>
                      <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide">
                        Incluir mês atual na média
                      </span>
                    </label>
                  </div>

                  {averagesData.length === 0 && averagesWindow === 'custom' && customPeriodStart && customPeriodEnd && (
                    <div className="mt-4 py-8 px-4 text-center bg-surface-secondary border border-surface-elevated rounded-3xl">
                      <p className="text-text-muted text-xxs font-black uppercase tracking-ultra-wide">Nenhuma despesa no período selecionado</p>
                      <p className="text-xxs text-text-muted mt-1">Tente um intervalo diferente ou verifique os lançamentos cadastrados.</p>
                    </div>
                  )}

                  <div className="space-y-6 mt-4">
                    {averagesData.map(({ category, average, averageOccurrence, totalValue, totalMonthsInWindow, monthsWithValue, months }) => {
                      const activeAverage = averageMode === 'real' ? average : averageOccurrence;
                      const maxValue = Math.max(...months.map(m => Math.max(m.value, m.projection || 0)), 1);
                      return (
                        <div key={category}>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <p className="text-sm font-black text-text-primary">{category}</p>
                            <div className="flex flex-wrap gap-4 sm:text-right">
                              <div>
                                <p className="text-xxs font-black text-text-muted uppercase">Total no período</p>
                                <p className="text-sm font-black text-text-secondary">
                                  {isPrivacyMode ? '••••' : `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>
                              <div>
                                <p className="text-xxs font-black text-text-muted uppercase">
                                  {averageMode === 'real'
                                    ? `Média real · ${totalMonthsInWindow} ${totalMonthsInWindow === 1 ? 'mês' : 'meses'}`
                                    : `Média de ocorrência · ${monthsWithValue} ${monthsWithValue === 1 ? 'mês' : 'meses'}`}
                                </p>
                                <p className="text-sm font-black text-brand-secondary">
                                  {isPrivacyMode ? '••••' : `R$ ${activeAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {months.map(m => {
                              if (!m.isClosed && !m.isCurrentMonth) return null;
                              // Média real: exibe todos os meses fechados (mesmo sem valor)
                              // Média de ocorrência: exibe só meses que tiveram lançamento
                              if (averageMode === 'occurrence' && m.value === 0 && !m.isCurrentMonth) return null;
                              const barWidth = (m.value / maxValue) * 100;
                              const projWidth = m.projection ? (m.projection / maxValue) * 100 : 0;
                              const avgWidth = (average / maxValue) * 100;
                              const isAbove = m.deviation !== null && m.deviation > 0;
                              const isBelow = m.deviation !== null && m.deviation < 0;
                              return (
                                <div key={`${m.year}-${m.month}`} className="flex items-center gap-3">
                                  <span className="text-xxs font-black text-text-muted uppercase w-12 shrink-0 text-right">
                                    {m.label}
                                  </span>
                                  <div className="flex-1 relative h-6 bg-surface-elevated rounded-lg overflow-visible">
                                    <div
                                      className={`absolute left-0 top-0 h-full rounded-lg transition-all duration-700 ${
                                        m.isCurrentMonth ? 'bg-surface-secondary' : isAbove ? 'bg-status-danger/60' : isBelow ? 'bg-status-success/60' : 'bg-brand-secondary/60'
                                      }`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                    {m.isCurrentMonth && m.projection && (
                                      <div
                                        className="absolute left-0 top-0 h-full rounded-lg border-2 border-dashed border-text-muted bg-transparent transition-all duration-700"
                                        style={{ width: `${projWidth}%` }}
                                      />
                                    )}
                                    <div
                                      className="absolute top-0 h-full w-0.5 bg-brand-secondary opacity-60"
                                      style={{ left: `${Math.min(avgWidth, 99)}%` }}
                                    />
                                  </div>
                                  <div className="w-40 shrink-0 flex items-center gap-2">
                                    <span className="text-xxs font-black text-text-secondary">
                                      {isPrivacyMode ? '••••' : `R$ ${m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    </span>
                                    {m.isCurrentMonth && m.projection && !isPrivacyMode && (
                                      <span className="text-xxs text-text-muted font-bold">
                                        {`→ R$ ${m.projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                      </span>
                                    )}
                                    {m.deviation !== null && (
                                      <span className={`text-xxs font-black ${isAbove ? 'text-status-danger' : 'text-brand-primary'}`}>
                                        {isAbove ? '▲' : '▼'} {Math.abs(Math.round(m.deviation))}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAverages(false)}
                    className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-3xl text-xxs font-black uppercase tracking-ultra-wide border transition-all active:scale-95 w-full sm:w-auto bg-surface-elevated border-surface-elevated text-text-secondary hover:bg-surface-secondary"
                  >
                    Ocultar Análise <ChevronUp size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* SOMATÓRIO DOS LANÇAMENTOS FILTRADOS */}
          {filtered.length > 0 && (
            <div className="bg-surface-primary border border-surface-elevated rounded-3xl p-5 mt-4 shadow-soft">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xxs font-black text-text-muted uppercase tracking-ultra-wide">Resultado dos filtros</span>
                  <span className="text-xxs text-text-secondary">({filtered.length} lançamento{filtered.length !== 1 ? 's' : ''})</span>
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
                            <p className="text-xxs font-black text-text-muted uppercase mb-1">Entradas</p>
                            <p className="text-sm font-black text-brand-primary">  
                              {isPrivacyMode ? '••••' : `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        )}
                        {totalExpense > 0 && (
                          <div className="text-center">
                            <p className="text-xxs font-black text-text-muted uppercase mb-1">Saídas</p>
                            <p className="text-sm font-black text-status-danger">  
                              {isPrivacyMode ? '••••' : `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </p>
                          </div>
                        )}
                        <div className="text-center border-l border-surface-elevated pl-6">
                          <p className="text-xxs font-black text-text-muted uppercase mb-1">Total</p>
                          <p className={`text-lg font-black ${net >= 0 ? 'text-brand-primary' : 'text-status-danger'}`}>
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
      </div>}

      <RecurringBillManager 
        isOpen={isRecurringBillModalOpen} 
        onClose={(newBills) => {
          setIsRecurringBillModalOpen(false);
          if (newBills) setRecurringBills(newBills);
        }} 
        userId={user?.uid || ''} 
        categories={categories}
      />

      <CardManager
        isOpen={isCardModalOpen}
        onClose={(newCards) => {
          setIsCardModalOpen(false);
          if (newCards) setUserCards(newCards);
        }}
        userId={user?.uid || ''}
        transactions={safeTransactions}
        onEditTransaction={onEditTransaction}
      />

      {/* Popover Educativo Mobile (Frente 2) */}
      {showIntro && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-primary w-full max-w-sm rounded-4xl shadow-2xl border border-surface-elevated overflow-hidden p-6 space-y-6 animate-in zoom-in duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary">
                <RefreshCw size={24} className="animate-spin-slow" />
              </div>
              <h3 className="text-xl font-black text-text-primary tracking-tight leading-tight">
                Planeje seu Futuro
              </h3>
            </div>

            <p className="text-sm font-medium text-text-secondary leading-relaxed">
              Este botão organiza seu futuro. Ao cadastrar contas fixas e assinaturas, o Controla projeta seu saldo para o fim do mês. Assim, você sabe exatamente quanto dinheiro terá <strong>livre</strong> para investir, evitando surpresas no orçamento.
            </p>

            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={dontShowFor15Days}
                    onChange={(e) => setDontShowFor15Days(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-surface-elevated rounded-lg checked:bg-brand-secondary checked:border-brand-secondary transition-all"
                  />
                  <Check size={12} className="absolute left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-xxs font-bold text-text-muted uppercase tracking-widest group-hover:text-text-secondary transition-colors">
                  Não mostrar novamente nos próximos 15 dias
                </span>
              </label>

              <button
                onClick={handleConfirmIntro}
                className="w-full py-4 bg-brand-secondary text-text-onBrand rounded-3xl font-black uppercase text-xxs tracking-ultra-wide shadow-soft active:scale-95 transition-transform"
              >
                Entendi e quero acessar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Dashboard;
