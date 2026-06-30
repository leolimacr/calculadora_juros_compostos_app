import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCards } from '../../../../hooks/useCards';
import { useBills } from '../../../../hooks/useBills';
import { useBudget } from '../../../../hooks/useBudget';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { getCurrentInvoice, isBillPaid } from '../../../../utils/invoiceUtils';
import { useInvoicesByUser } from '../../../../hooks/useCardInvoices';
import { getConsecutiveDays, getMonthlyConsistency } from '../../../../utils/streakUtils';
import type { NexusInsight } from '../../../../services/nexusInsightEngine';
import { buildUserContext, getOperationalInsight } from '../../../../services/nexusInsightEngine';
import { generateFinancialReport } from '../../../../utils/reportGenerator';
import { aggregateAllTimeFlow, buildSovereignSnapshot } from '../../../../utils/calculations';
import {
  isCommandMode,
  shouldOfferCalibration,
  getCalibrationInviteCopy,
  deferCalibration,
  dismissCalibrationInvite,
} from '../../../../services/personaCalibrationService';
import {
  canUseViewMode,
  getCurrentMonthAnchor,
  getCurrentMonthStartIso,
  hasHistoryAccess as planHasHistoryAccess,
  isDateBeforeCurrentMonth,
  isMonthBeforeCurrent,
  isPeriodRangeAllowed,
  isTransactionVisible,
  type HistoryViewMode,
} from '../../../../utils/historyTimeGate';


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
    isPremium, 
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
  const { budget: currentBudget, isLoading: budgetLoading } = useBudget(user?.uid);
  const { invoices: storedInvoices } = useInvoicesByUser(user?.uid);

  const [isRecurringBillModalOpen, setIsRecurringBillModalOpen] = useState(false);
  const [isBudgetSetupOpen, setIsBudgetSetupOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [showIntro, setShowIntro] = useState(false);
  const [dontShowFor15Days, setDontShowFor15Days] = useState(false);

  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationInviteVisible, setCalibrationInviteVisible] = useState(
    () => !isCommandMode(userMeta)
  );
  const [localCommandMode, setLocalCommandMode] = useState(() => isCommandMode(userMeta));

  const [inlineInsight, setInlineInsight] = useState<NexusInsight | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);

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
  const [showHistoryPaywall, setShowHistoryPaywall] = useState(false);
    const [filterCardId, setFilterCardId] = useState<string | null>(null);
  const [filterCardName, setFilterCardName] = useState('');
  const [filterPeriodStart, setFilterPeriodStart] = useState('');
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('');
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [cardManagerReason, setCardManagerReason] = useState<string | null>(null);

  /** AppRoutes passa isPro||isPremium como isPremium — equivale a acesso ao histórico. */
  const hasHistoryAccess = !!isPremium;
  const historyLocked = !hasHistoryAccess;
  const historyPlan = hasHistoryAccess ? 'pro' : 'free';

  const openHistoryPaywall = () => setShowHistoryPaywall(true);

  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

  const historyVisibleTransactions = useMemo(
    () =>
      safeTransactions.filter((t: { date?: string }) =>
        isTransactionVisible(t.date, historyPlan)
      ),
    [safeTransactions, historyPlan]
  );
  const isReady = !isLoading || safeTransactions.length > 0;
  const showSkeleton = !isReady || isCalculating;
  const isFirstAccess = safeTransactions.length === 0;
  const showBackToTools = !!onNavigate && !Capacitor.isNativePlatform();


  // Efeito para abrir a gestão de cartões, aplicar filtro de cartão, ou limpar filtro via estado de navegação
  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.openCards) {
      setIsCardModalOpen(true);
      setFocusedCardId((state?.focusedCardId as string) || null);
      setCardManagerReason((state?.reason as string) || null);
      window.history.replaceState({}, document.title);
      return;
    }
    if (state?.clearCardFilter) {
      setFilterCardId(null);
      setFilterCardName('');
      setFilterPeriodStart('');
      setFilterPeriodEnd('');
      window.history.replaceState({}, document.title);
      return;
    }
    if (state?.filterCardId) {
      setFilterCardId(state.filterCardId as string);
      setFilterCardName((state.filterCardName as string) || '');
      setFilterPeriodStart((state.periodStart as string) || '');
      setFilterPeriodEnd((state.periodEnd as string) || '');
      setShowTransactions(true);
      window.history.replaceState(
        { filterCardId: state.filterCardId, filterCardName: state.filterCardName, periodStart: state.periodStart, periodEnd: state.periodEnd },
        document.title
      );
    }
  }, [location.state]);

  useEffect(() => {
    if (!cardManagerReason) return;
    const t = setTimeout(() => setCardManagerReason(null), 5000);
    return () => clearTimeout(t);
  }, [cardManagerReason]);

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

  // Garante que Free não permaneça em mês passado após reload
  useEffect(() => {
    if (hasHistoryAccess) return;
    setCurrentDate((prev) => (isDateBeforeCurrentMonth(prev) ? new Date() : prev));
  }, [hasHistoryAccess]);

  // NOVO: Busca segmentada automática ao navegar (Segurança de Custo + Dados Completos)
  useEffect(() => {
    if (!user?.uid || !fetchMonth) return;
    
    if (viewMode === 'month' || viewMode === 'day') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      if (planHasHistoryAccess(historyPlan) || !isMonthBeforeCurrent(year, month)) {
        fetchMonth(year, month);
      }
    } else if (viewMode === 'year' && hasHistoryAccess) {
      const year = currentDate.getFullYear();
      for (let m = 1; m <= 12; m++) {
        fetchMonth(year, m);
      }
    }
  }, [currentDate, viewMode, user?.uid, fetchMonth, hasHistoryAccess, historyPlan]);

  // PRÉ-CARGA: histórico retroativo só no Pro+; Free carrega mês atual (+ futuro sob demanda)
  useEffect(() => {
    if (!user?.uid || !fetchMonth) return;
    const today = new Date();
    if (hasHistoryAccess) {
      const depth = isCommandMode(userMeta) || localCommandMode ? 6 : 3;
      for (let offset = 0; offset < depth; offset++) {
        const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
        fetchMonth(d.getFullYear(), d.getMonth() + 1);
      }
    } else {
      fetchMonth(today.getFullYear(), today.getMonth() + 1);
    }
  }, [user?.uid, fetchMonth, userMeta?.persona?.calibratedAt, localCommandMode, hasHistoryAccess]);

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
        if (!invoice) return null;
        const storedInvoice = storedInvoices.find(
          si => si.cardId === card.id && si.periodEnd === invoice.periodEnd
        );
        return {
          ...invoice,
          cardName: card.name,
          cardId: card.id,
          storedStatus: storedInvoice?.status || null,
          storedPaidAmount: storedInvoice?.paidAmount || 0,
          storedRemaining: storedInvoice?.remainingAmount || 0,
          storedTransactionCount: storedInvoice?.transactionCount || 0,
          storedInvoiceId: storedInvoice?.id || null,
        };
      })
      .filter((inv): inv is NonNullable<typeof inv> => inv !== null && inv.total > 0);
  }, [userCards, safeTransactions, storedInvoices]);

  const pendingBills = useMemo(() => {
    return recurringBills.filter(bill => bill.isActive && !isBillPaid(bill, safeTransactions));
  }, [recurringBills, safeTransactions]);

  const totalPendingBills = useMemo(() => {
    return pendingBills.reduce((acc, bill) => acc + bill.amount, 0);
  }, [pendingBills]);

  const streak = useMemo(() => getConsecutiveDays(safeTransactions), [safeTransactions]);
  const monthlyConsistency = useMemo(() => getMonthlyConsistency(safeTransactions), [safeTransactions]);

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

      if (!isTransactionVisible(t.date, historyPlan)) return false;

      if (filterCardId && t.cardId !== filterCardId) return false;

      if (filterCardId && t.isVirtual) return false;

      if (filterPeriodStart && filterPeriodEnd && (t.date < filterPeriodStart || t.date > filterPeriodEnd)) return false;

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
  }, [safeTransactions, activeInvoices, selectedCategories, typeFilter, currentDate, viewMode, startDate, endDate, sortMode, searchQuery, isLoading, historyPlan, filterCardId, filterPeriodStart, filterPeriodEnd]);

  const stats = useMemo(() => {
    if (!isReady) {
      return {
        income: 0,
        expenses: 0,
        balance: 0,
        projectedBalance: 0,
        freeBalance: 0,
        sovereignFreeBalance: 0,
        freedomDeficit: 0,
        protectionBuffer: 0,
        leewayDays: 0,
        freedomVelocity: 0,
        colchaoShortfall: 0,
        reserveShortfall: 0,
        sovereignSnapshot: null,
      };
    }

    let income = 0; 
    let expenses = 0;
    let realBalance = 0;
    let virtualImpact = 0;

    const statsTransactions = viewMode === 'all'
      ? safeTransactions
      : safeTransactions.filter((t: any) => {
          if (!t.date) return false;
          const [year, month, day] = t.date.split('-').map(Number);
          if (!year) return false;
          if (viewMode === 'year') return year === currentDate.getFullYear();
          if (viewMode === 'month') return year === currentDate.getFullYear() && month === (currentDate.getMonth() + 1);
          if (viewMode === 'day') return year === currentDate.getFullYear() && month === (currentDate.getMonth() + 1) && day === currentDate.getDate();
          if (viewMode === 'period') return t.date >= startDate && t.date <= endDate;
          return false;
        });

    statsTransactions.forEach((t: any) => {
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
    
    const allTimeFlow = aggregateAllTimeFlow(safeTransactions);
    const commandModeActive = isCommandMode(userMeta) || localCommandMode;
    const sovereign = buildSovereignSnapshot({
      monthBalance: realBalance,
      accumulatedBalance: allTimeFlow.realBalance,
      accumulatedIncome: allTimeFlow.income,
      accumulatedExpenses: allTimeFlow.expenses,
      virtualImpact,
      pendingBills: totalPendingBills,
      financialProfile: userMeta?.financialProfile,
      commandMode: commandModeActive,
      income,
      expenses,
      monthlyAport: Math.max(0, income - expenses),
    });

    return {
      income,
      expenses,
      balance: realBalance,
      projectedBalance: sovereign.projectedBalance,
      freeBalance: sovereign.sovereignFreeBalance,
      sovereignFreeBalance: sovereign.sovereignFreeBalance,
      freedomDeficit: sovereign.freedomDeficit,
      protectionBuffer: sovereign.protectionBuffer,
      leewayDays: sovereign.leewayDays,
      freedomVelocity: sovereign.freedomVelocity,
      colchaoShortfall: sovereign.colchaoShortfall,
      reserveShortfall: sovereign.reserveShortfall,
      sovereignSnapshot: sovereign,
    };
  }, [safeTransactions, isLoading, viewMode, currentDate, startDate, endDate, totalPendingBills, userMeta, localCommandMode]);

  const commandMode = isCommandMode(userMeta) || localCommandMode;

  useEffect(() => {
    if (isCommandMode(userMeta)) {
      setLocalCommandMode(true);
      setCalibrationInviteVisible(false);
    }
  }, [userMeta?.persona?.calibratedAt]);

  const showCalibrationOffer = useMemo(
    () =>
      calibrationInviteVisible &&
      shouldOfferCalibration({
        userMeta,
        launchCount: safeTransactions.length,
        hasRecurringOrCards: recurringBills.length > 0 || userCards.length > 0,
        userId: user?.uid,
      }),
    [calibrationInviteVisible, userMeta, safeTransactions.length, recurringBills.length, userCards.length, user?.uid]
  );

  const calibrationInviteCopy = useMemo(
    () => getCalibrationInviteCopy(safeTransactions.length),
    [safeTransactions.length]
  );

  const handleDeferCalibration = () => {
    if (user?.uid) deferCalibration(user.uid);
    setCalibrationInviteVisible(false);
  };

  const handleDismissCalibrationInvite = () => {
    if (user?.uid) dismissCalibrationInvite(user.uid);
    setCalibrationInviteVisible(false);
  };

  const handleStartCalibration = () => {
    setShowCalibrationModal(true);
    setCalibrationInviteVisible(false);
  };

  const handleCalibrationComplete = () => {
    setLocalCommandMode(true);
    setShowCalibrationModal(false);
    setCalibrationInviteVisible(false);
  };

  // Efeito para monitorar novos lançamentos e disparar insight
  useEffect(() => {
    if (transactions.length > 0) {
      const ctx = buildUserContext({
        launchCount: transactions.length,
        transactionsToday: transactions.filter((t: any) => t.date === new Date().toISOString().split('T')[0]).length,
        monthBalance: stats.balance,
        monthIncome: stats.income,
        monthExpenses: stats.expenses,
        isPremium,
        isFirstSession: userMeta?.isFirstSession,
        financialProfile: userMeta?.financialProfile,
        marcoZero: userMeta?.financialProfile?.marcoZero,
        reserveCurrent: userMeta?.financialProfile?.emergencyReserveCurrent,
        reserveTarget: userMeta?.financialProfile?.emergencyReserveTarget,
        sovereignFreeBalance: stats.sovereignFreeBalance,
        freedomDeficit: stats.freedomDeficit,
        obligationsDeduction: stats.sovereignSnapshot?.obligationsDeduction,
        commandMode,
        persona: userMeta?.persona,
        cards: userCards,
        transactions: transactions,
      });

      const insight = getOperationalInsight(ctx);
      if (insight) {
        const now = Date.now();
        if (lastToastRef.current?.id === insight.id && now - lastToastRef.current.time < 60_000) {
          return;
        }
        lastToastRef.current = { id: insight.id, time: now };
        setInlineInsight(insight);
        setShowInsight(true);
        const timer = setTimeout(() => setShowInsight(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    transactions.length,
    isPremium,
    userMeta?.isFirstSession,
    userMeta?.persona,
    stats.balance,
    stats.sovereignFreeBalance,
    stats.freedomDeficit,
    commandMode,
    userMeta?.financialProfile,
    userCards,
    transactions,
  ]);

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


  const isNavigationTargetPast = (target: Date, mode: HistoryViewMode = viewMode) => {
    if (mode === 'month' || mode === 'year') {
      return isMonthBeforeCurrent(target.getFullYear(), target.getMonth() + 1);
    }
    const monthStart = getCurrentMonthAnchor();
    return target < monthStart;
  };

  const guardedChangeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + offset);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + offset);
    else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + offset);

    if (historyLocked && isNavigationTargetPast(newDate)) {
      openHistoryPaywall();
      return;
    }
    setCurrentDate(newDate);
  };

  const guardedSetViewMode = (mode: HistoryViewMode) => {
    if (!canUseViewMode(mode, historyPlan)) {
      openHistoryPaywall();
      return;
    }
    setViewMode(mode);
  };

  const guardedDateSelect = (dateString: string) => {
    if (!dateString) return;
    const [year, month, day] = dateString.split('-').map(Number);
    const selected = new Date(year, month - 1, day);
    if (historyLocked && isNavigationTargetPast(selected, 'day')) {
      openHistoryPaywall();
      return;
    }
    setCurrentDate(selected);
  };

  const guardedSetStartDate = (date: string) => {
    if (historyLocked && !isPeriodRangeAllowed(date, endDate, historyPlan)) {
      openHistoryPaywall();
      return;
    }
    setStartDate(date);
  };

  const guardedSetEndDate = (date: string) => {
    if (historyLocked && !isPeriodRangeAllowed(startDate, date, historyPlan)) {
      openHistoryPaywall();
      return;
    }
    setEndDate(date);
  };

  const handleExportPDF = () => {
    const catLabel = selectedCategories.length === 0 ? 'Todas Categorias' : selectedCategories.join(', ');
    generateFinancialReport(filtered, `${catLabel} - ${periodLabel}`, userMeta?.email || 'Investidor', commandMode);
  };

  // Funções de compatibilidade com modais para evitar falhas de runtime com referências indefinidas
  const setRecurringBills = (_newBills: any) => {
    // O react-query gerencia as atualizações de estado nos hooks de consulta.
    // Esta função é mantida vazia apenas para evitar erros de referência no onClose do modal.
  };

  const setUserCards = (_newCards: any) => {
    // O react-query gerencia as atualizações de estado nos hooks de consulta.
    // Esta função é mantida vazia apenas para evitar erros de referência no onClose do modal.
  };

  const handleClearCardFilter = useCallback(() => {
    setFilterCardId(null);
    setFilterCardName('');
    setFilterPeriodStart('');
    setFilterPeriodEnd('');
    window.history.replaceState({}, document.title);
  }, []);

  const handleFilterByCard = useCallback((
    cardId: string,
    cardName: string,
    periodStart: string,
    periodEnd: string
  ) => {
    setFilterCardId(cardId);
    setFilterCardName(cardName);
    setFilterPeriodStart(periodStart);
    setFilterPeriodEnd(periodEnd);
    setShowTransactions(true);
  }, []);

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
    currentBudget,
    budgetLoading,
    isBudgetSetupOpen,
    setIsBudgetSetupOpen,
    selectedCategories,
    setSelectedCategories,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode: guardedSetViewMode,
    currentDate,
    startDate,
    setStartDate: guardedSetStartDate,
    endDate,
    setEndDate: guardedSetEndDate,
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
    monthlyConsistency,
    periodLabel,
    filtered,
    stats,
    projectedBalance: stats.projectedBalance,
    commandMode,
    showCalibrationOffer,
    calibrationInviteCopy,
    showCalibrationModal,
    setShowCalibrationModal,
    handleDeferCalibration,
    handleDismissCalibrationInvite,
    handleStartCalibration,
    handleCalibrationComplete,
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
    changeDate: guardedChangeDate,
    handleDateSelect: guardedDateSelect,
    handleExportPDF,
    historyLocked,
    showHistoryPaywall,
    setShowHistoryPaywall,
    hasHistoryAccess,
    historyVisibleTransactions,
    currentMonthStartIso: getCurrentMonthStartIso(),
    filterCardId,
    filterCardName,
    filterPeriodStart,
    filterPeriodEnd,
    focusedCardId,
    setFocusedCardId,
    cardManagerReason,
    handleClearCardFilter,
    handleFilterByCard,
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
    isPremium,
    isPrivacyMode,
    onTogglePrivacy,
    onEditTransaction,
    onNavigate,
    isSyncing,
    isStale,
    isMobile,
  };
};
export type UseDashboardStateReturn = ReturnType<typeof useDashboardState>;
