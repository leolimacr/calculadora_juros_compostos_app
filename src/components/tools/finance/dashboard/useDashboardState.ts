import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCards } from '../../../../hooks/useCards';
import { useBills } from '../../../../hooks/useBills';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { getCurrentInvoice, isBillPaid } from '../../../../utils/invoiceUtils';
import { getConsecutiveDays } from '../../../../utils/streakUtils';
import { buildUserContext, getOperationalInsight, NexusInsight } from '../../../../services/nexusInsightEngine';
import { generateFinancialReport } from '../../../../utils/reportGenerator';


export const useDashboardState = (props: any) => {
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
    fetchMonth,
    lastActionTimestamp,
    isSyncing,
    isStale
  } = props;

  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  
  const { cards: userCards } = useCards(user?.uid);
  const { bills: recurringBills } = useBills(user?.uid);

  const [isRecurringBillModalOpen, setIsRecurringBillModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [showIntro, setShowIntro] = useState(false);
  const [dontShowFor15Days, setDontShowFor15Days] = useState(false);

  const [inlineInsight, setInlineInsight] = useState<NexusInsight | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'all' | 'period'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortMode, setSortMode] = useState<'date-desc' | 'date-asc' | 'category-asc' | 'category-desc'>('date-desc');
  const [showTransactions, setShowTransactions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isCalculating, setIsCalculating] = useState(true);

  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);
  const isReady = !isLoading || safeTransactions.length > 0;
  const showSkeleton = !isReady || isCalculating;
  const isFirstAccess = safeTransactions.length === 0;
  const showBackToTools = !!onNavigate && !Capacitor.isNativePlatform();


  // Efeito para abrir a gestão de cartões via estado de navegação
  useEffect(() => {
    if (location.state && (location.state as any).openCards) {
      setIsCardModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Temporizador para simulação/suavização de cálculo pesado
  useEffect(() => {
    const timer = setTimeout(() => setIsCalculating(false), 500);
    
    if (transactions.length >= 0) {
      const calculationTimer = setTimeout(() => setIsCalculating(false), 300);
      return () => {
        clearTimeout(timer);
        clearTimeout(calculationTimer);
      };
    }
    return () => clearTimeout(timer);
  }, [transactions.length]);

  // NOVO: Busca segmentada automática ao navegar (Segurança de Custo + Dados Completos)
  useEffect(() => {
    if (!user?.uid || !fetchMonth) return;
    
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      fetchMonth(year, month);
    } else if (viewMode === 'year') {
      const year = currentDate.getFullYear();
      // Carrega todos os 12 meses do ano visualizado para alimentar os gráficos/resumos anuais
      for (let m = 1; m <= 12; m++) {
        fetchMonth(year, m);
      }
    }
  }, [currentDate, viewMode, user?.uid, fetchMonth]);

  // PRÉ-CARGA CIRÚRGICA: Busca o mês atual + 2 anteriores ao montar o Dashboard.
  // Máximo de 3 leituras por sessão — o Set interno do fetchMonth garante
  // que cada mês só é buscado uma vez, mesmo que o efeito seja re-executado.
  useEffect(() => {
    if (!user?.uid || !fetchMonth) return;
    const today = new Date();
    [0, 1, 2].forEach(offset => {
      const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      fetchMonth(d.getFullYear(), d.getMonth() + 1);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Intencional: roda apenas uma vez quando o usuário está autenticado

  // Efeito para monitorar novos lançamentos e disparar insight
  useEffect(() => {
    if (lastActionTimestamp && transactions.length > 0) {
      const ctx = buildUserContext({
        launchCount: transactions.length,
        transactionsToday: transactions.filter((t: any) => t.date === new Date().toISOString().split('T')[0]).length,
        monthBalance: stats.balance,
        isPremium,
        isFirstSession: userMeta?.isFirstSession,
        cards: userCards,
        transactions: transactions
      });

      const insight = getOperationalInsight(ctx);
      if (insight) {
        setInlineInsight(insight);
        setShowInsight(true);
        const timer = setTimeout(() => setShowInsight(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastActionTimestamp, transactions.length, isPremium, userMeta?.isFirstSession]);

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
      paymentMethod: 'money',
      isVirtual: true,
      cardId: inv.cardId
    }));

    const base = [...safeTransactions, ...virtualInvoices].filter((t: any) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(t?.category);
      const typeMatch = typeFilter === 'all' || t?.type === typeFilter;
      if (!categoryMatch || !typeMatch || !t.date) return false;

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
  }, [safeTransactions, activeInvoices, selectedCategories, typeFilter, currentDate, viewMode, startDate, endDate, sortMode, searchQuery, isLoading]);

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
  }, [filtered, isLoading, totalPendingBills]);

  const projectedBalance = useMemo(() => {
    return stats.balance - totalPendingBills;
  }, [stats.balance, totalPendingBills]);

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
  }, [filtered, isLoading]);

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
  }, [filtered, sortMode, isLoading]);

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
  }, [filtered, isLoading]);

  const categoryNames = useMemo(() => {
    const fromDb = categories.map((c: any) => c.name);
    const fromTransactions = safeTransactions.map((t: any) => t?.category).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromTransactions])).sort();
  }, [categories, safeTransactions]);


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

  // Funções de compatibilidade com modais para evitar falhas de runtime com referências indefinidas
  const setRecurringBills = (newBills: any) => {
    // O react-query gerencia as atualizações de estado nos hooks de consulta.
    // Esta função é mantida vazia apenas para evitar erros de referência no onClose do modal.
  };

  const setUserCards = (newCards: any) => {
    // O react-query gerencia as atualizações de estado nos hooks de consulta.
    // Esta função é mantida vazia apenas para evitar erros de referência no onClose do modal.
  };

  return {
    // Parent values & state values
    user,
    userCards,
    recurringBills,
    isRecurringBillModalOpen,
    setIsRecurringBillModalOpen,
    isCardModalOpen,
    setIsCardModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    showIntro,
    setShowIntro,
    dontShowFor15Days,
    setDontShowFor15Days,
    inlineInsight,
    showInsight,
    setShowInsight,
    selectedCategories,
    setSelectedCategories,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
    currentDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortMode,
    setSortMode,
    showTransactions,
    setShowTransactions,
    searchQuery,
    setSearchQuery,
    visibleCount,
    setVisibleCount,
    isCalculating,
    
    // Memos
    safeTransactions,
    activeInvoices,
    pendingBills,
    totalPendingBills,
    streak,
    periodLabel,
    filtered,
    stats,
    projectedBalance,
    categoryStats,
    categorySummary,
    categoryTransactionsMap,
    categoryNames,
    isReady,
    showSkeleton,
    isFirstAccess,
    showBackToTools,

    // Handlers
    handleRecurringButtonClick,
    handleConfirmIntro,
    changeDate,
    handleDateSelect,
    handleExportPDF,
    setRecurringBills,
    setUserCards,

    // Raw Props forwarders
    transactions,
    categories,
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
    isSyncing,
    isStale,
  };
};
export type UseDashboardStateReturn = ReturnType<typeof useDashboardState>;
