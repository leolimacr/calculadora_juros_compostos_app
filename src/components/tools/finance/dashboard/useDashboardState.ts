import { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import pLimit from 'p-limit';

const limit = pLimit(5); // Concurrency limit of 5
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../../../contexts/AuthContext';
import { useEntitlement } from '../../../../hooks/useEntitlement';
import { useCards } from '../../../../hooks/useCards';
import { useBills } from '../../../../hooks/useBills';
import { useBudget } from '../../../../hooks/useBudget';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { isBillPaid } from '../../../../utils/invoiceUtils';
import { useInvoicesByUser } from '../../../../hooks/useCardInvoices';
import { getConsecutiveDays, getMonthlyConsistency } from '../../../../utils/streakUtils';
import { generateFinancialReport } from '../../../../utils/reportGenerator';
import { aggregateAllTimeFlow, buildSovereignSnapshot, calculateRealCashBalance } from '../../../../utils/calculations';
import { getLocalDateString } from '../../../../utils/dateHelpers';
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
    userMetaLoading,
    lastActionTimestamp,
    isSyncing,
    isStale
  } = props;

  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const { isPremium: isPremiumCanonical } = useEntitlement();

  const { cards: userCards } = useCards(user?.uid);
  const { bills: recurringBills } = useBills(user?.uid);
  const { budget: currentBudget, isLoading: budgetLoading } = useBudget(user?.uid);
  const { invoices: storedInvoices } = useInvoicesByUser(user?.uid);
  const udsCardRef = useRef(userCards);
  const udsBillRef = useRef(recurringBills);
  const udsBudgetRef = useRef(currentBudget);
  const udsInvoiceRef = useRef(storedInvoices);
  void (udsCardRef, udsBillRef, udsBudgetRef, udsInvoiceRef);

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

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'all' | 'period'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [sortMode, setSortMode] = useState<'date-desc' | 'date-asc' | 'category-asc' | 'category-desc'>('date-desc');
  const [showTransactions, setShowTransactions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [showHistoryPaywall, setShowHistoryPaywall] = useState(false);
	const [filterCardId, setFilterCardId] = useState<string | null>(null);
  const [filterCardName, setFilterCardName] = useState('');
  const [filterPeriodStart, setFilterPeriodStart] = useState('');
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('');
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [cardManagerReason, setCardManagerReason] = useState<string | null>(null);
  const [deferredHeavyStats, setDeferredHeavyStats] = useState<any>(null);

  /** AppRoutes passa isPro||isPremium como isPremium — equivale a acesso ao histórico. */
  const hasHistoryAccess = !!isPremium;
  const historyLocked = !hasHistoryAccess;
  const historyPlan = hasHistoryAccess ? 'pro' : 'free';

  const openHistoryPaywall = () => setShowHistoryPaywall(true);

  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);
  const deferredTransactions = useDeferredValue(safeTransactions);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (safeTransactions.length > 0 && !hasHydrated) {
      setHasHydrated(true);
    }
  }, [safeTransactions, hasHydrated]);

  const historyVisibleTransactions = useMemo(
    () =>
      safeTransactions.filter((t: { date?: string }) =>
        isTransactionVisible(t.date, historyPlan)
      ),
    [safeTransactions, historyPlan]
  );
  const isReady = !isLoading || safeTransactions.length > 0 || hasHydrated;
  const showSkeleton = !hasHydrated && isLoading && safeTransactions.length === 0;
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

  // Garante que Free não permaneça em mês passado após reload
  useEffect(() => {
    if (hasHistoryAccess) return;
    setCurrentDate((prev) => (isDateBeforeCurrentMonth(prev) ? new Date() : prev));
  }, [hasHistoryAccess]);

  // Busca segmentada automática ao navegar (Segurança de Custo + Dados Completos)
  useEffect(() => {
    if (!user?.uid || !fetchMonth) return;
    const promises = [];
    
    if (viewMode === 'month' || viewMode === 'day') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      if (planHasHistoryAccess(historyPlan) || !isMonthBeforeCurrent(year, month)) {
        promises.push(limit(() => fetchMonth(year, month)));
      }
    } else if (viewMode === 'year' && hasHistoryAccess) {
      const year = currentDate.getFullYear();
      for (let m = 1; m <= 12; m++) {
        promises.push(limit(() => fetchMonth(year, m)));
      }
    }
    Promise.all(promises);
  }, [currentDate, viewMode, user?.uid, fetchMonth, hasHistoryAccess, historyPlan]);

  // PRÉ-CARGA: meses anteriores — executa UMA ÚNICA VEZ no mount
  const preloadDoneRef = useRef(false);
  useEffect(() => {
    if (!user?.uid || !fetchMonth || !hasHistoryAccess) return;
    if (preloadDoneRef.current) return;
    preloadDoneRef.current = true;

    const promises = [];
    const today = new Date();
    const depth = isCommandMode(userMeta) || localCommandMode ? 6 : 3;
    for (let offset = 1; offset < depth; offset++) {
      const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      promises.push(limit(() => fetchMonth(d.getFullYear(), d.getMonth() + 1)));
    }
    Promise.all(promises);
  }, [user?.uid, fetchMonth, hasHistoryAccess]);

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

  const [showFutureExpenseForm, setShowFutureExpenseForm] = useState(false);
  const handleFutureExpenseClick = useCallback(() => {
    setShowFutureExpenseForm(true);
  }, []);

  const handleConfirmIntro = () => {
    if (dontShowFor15Days) {
      const skipUntil = new Date();
      skipUntil.setDate(skipUntil.getDate() + 15);
      localStorage.setItem('recurring_intro_skip_until', skipUntil.toISOString());
    }
    setShowIntro(false);
    setIsRecurringBillModalOpen(true);
  };

  // Índice O(1) de transações por cardId para activeInvoices
  const transactionsByCardId = useMemo(() => {
    const map = new Map<string, import('../../../../types').Transaction[]>();
    for (let i = 0; i < deferredTransactions.length; i++) {
      const t = deferredTransactions[i];
      if (t.cardId) {
        let arr = map.get(t.cardId);
        if (!arr) {
          arr = [];
          map.set(t.cardId, arr);
        }
        arr.push(t);
      }
    }
    return map;
  }, [deferredTransactions]);

  const activeInvoices = useMemo(() => {
    const result = userCards
      .map(card => {
        if (!card.closingDay || !card.dueDay) return null;
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let y1, m1, d1, y2, m2, d2, dy, dm, dd;

        if (currentDay > card.closingDay) {
          y1 = currentYear; m1 = currentMonth; d1 = card.closingDay + 1;
          y2 = currentMonth === 11 ? currentYear + 1 : currentYear;
          m2 = (currentMonth + 1) % 12; d2 = card.closingDay;
          dy = y2; dm = m2; dd = card.dueDay;
          if (dd < d2) { dm = (dm + 1) % 12; if (dm === 0) dy++; }
        } else {
          y1 = currentMonth === 0 ? currentYear - 1 : currentYear;
          m1 = (currentMonth - 1 + 12) % 12; d1 = card.closingDay + 1;
          y2 = currentYear; m2 = currentMonth; d2 = card.closingDay;
          dy = y2; dm = m2; dd = card.dueDay;
          if (dd < d2) { dm = (dm + 1) % 12; if (dm === 0) dy++; }
        }

        const ps = `${y1}-${String(m1 + 1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
        const pe = `${y2}-${String(m2 + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
        const ddStr = `${dy}-${String(dm + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

        // Lookup O(1) via índice transactionsByCardId
        const cardTxns = transactionsByCardId.get(card.id) || [];
        const cardTransactions = cardTxns.filter(
          t => t.type === 'expense' && t.date >= ps && t.date <= pe
        );
        const total = cardTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const storedInvoice = storedInvoices.find(
          si => si.cardId === card.id && si.periodEnd === pe
        );

        if (total <= 0) return null;

        return {
          total,
          periodStart: ps,
          periodEnd: pe,
          dueDate: ddStr,
          cardName: card.name,
          cardId: card.id,
          storedStatus: storedInvoice?.status || null,
          storedPaidAmount: storedInvoice?.paidAmount || 0,
          storedRemaining: storedInvoice?.remainingAmount || 0,
          storedTransactionCount: storedInvoice?.transactionCount || 0,
          storedInvoiceId: storedInvoice?.id || null,
          transactions: cardTransactions,
        };
      })
      .filter((inv): inv is NonNullable<typeof inv> => inv !== null);
    return result;
  }, [userCards, transactionsByCardId, storedInvoices]);

  const pendingBills = useMemo(() => {
    return recurringBills.filter(bill => bill.isActive && !isBillPaid(bill, deferredTransactions));
  }, [recurringBills, deferredTransactions]);

  const totalPendingBills = useMemo(() => {
    return pendingBills.reduce((acc, bill) => acc + bill.amount, 0);
  }, [pendingBills]);

  const realCashData = useMemo(() => {
    return calculateRealCashBalance(
      safeTransactions,
      storedInvoices,
      userCards,
      recurringBills,
    );
  }, [safeTransactions, storedInvoices, userCards, recurringBills]);

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

  const virtualInvoices = useMemo(() => {
    if (!hasHydrated) return [];
    const todayIso = getLocalDateString();
    return activeInvoices
      .filter((inv) => (inv.storedStatus || 'open') !== 'paid' && Math.max(0, inv.storedRemaining || inv.total || 0) > 0)
      .map(inv => ({
        id: `virtual-inv-${inv.cardId}`,
        description: `Lançamento futuro - Fatura ${inv.cardName}`,
        amount: inv.storedRemaining || inv.total,
        date: todayIso,
        dueDate: inv.dueDate,
        category: `Lançamento futuro - Cartão ${inv.cardName}`,
        type: 'expense',
        paymentMethod: 'money',
        isVirtual: true,
        isFutureLaunch: true,
        cardId: inv.cardId,
      }));
  }, [activeInvoices, hasHydrated]);

  const combinedTransactions = useMemo(() => {
    if (!hasHydrated) return [];
    return [...deferredTransactions, ...virtualInvoices];
  }, [deferredTransactions, virtualInvoices, hasHydrated]);

  const filtered = useMemo(() => {
    if (!hasHydrated) return [];
    if (!isReady) return [];

    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const query = normalize(searchQuery.trim());

    const base = combinedTransactions.filter((t: any) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(t?.category);
      const typeMatch = typeFilter === 'all' || t?.type === typeFilter;
      if (!categoryMatch || !typeMatch || !t.date) return false;

      if (!isTransactionVisible(t.date, historyPlan)) return false;

      if (filterCardId && t.cardId !== filterCardId) return false;

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

    const result = [...base].sort((a: any, b: any) => {
      const dateA = a?.date || '';
      const dateB = b?.date || '';
      const dateCmp = dateA.localeCompare(dateB);
      if (sortMode === 'date-asc') {
        if (dateCmp !== 0) return dateCmp;
      } else if (sortMode === 'date-desc') {
        if (dateCmp !== 0) return -dateCmp;
      } else {
        return 0;
      }
      // Empatou na data: desempata pela criação, o mais recente primeiro
      const sortKeyCmp = (b?.sortKey || '').localeCompare(a?.sortKey || '');
      if (sortKeyCmp !== 0) return sortKeyCmp;
      return (b?.createdAtMs ?? 0) - (a?.createdAtMs ?? 0);
    });
    return result;
  }, [combinedTransactions, selectedCategories, typeFilter, currentDate, viewMode, startDate, endDate, sortMode, searchQuery, isLoading, historyPlan, filterCardId, filterPeriodStart, filterPeriodEnd, hasHydrated]);

  const deferredFiltered = useDeferredValue(filtered);

  // Lightweight stats: single-pass, sem aggregateAllTimeFlow ou buildSovereignSnapshot
  const stats = useMemo(() => {
    if (!hasHydrated) {
      return {
        income: 0,
        expenses: 0,
        cashExpenses: 0,
        creditExpenses: 0,
        virtualExpenses: 0,
        balance: 0,
        accumulatedBalance: 0,
        accumulatedIncome: 0,
        accumulatedExpenses: 0,
        accumulatedCashExpenses: 0,
        accumulatedCreditExpenses: 0,
        accumulatedVirtualExpenses: 0,
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
        creditTransactions: [],
      };
    }

    let income = 0;
    let expenses = 0;
    let cashExpenses = 0;
    let creditExpenses = 0;
    let virtualExpenses = 0;

    const statsTransactions = viewMode === 'all'
      ? deferredTransactions
      : deferredTransactions.filter((t: any) => {
          if (!t.date) return false;
          const [year, month, day] = t.date.split('-').map(Number);
          if (!year) return false;
          if (viewMode === 'year') return year === currentDate.getFullYear();
          if (viewMode === 'month') return year === currentDate.getFullYear() && month === (currentDate.getMonth() + 1);
          if (viewMode === 'day') return year === currentDate.getFullYear() && month === (currentDate.getMonth() + 1) && day === currentDate.getDate();
          if (viewMode === 'period') return t.date >= startDate && t.date <= endDate;
          return false;
        });

    for (let i = 0; i < statsTransactions.length; i++) {
      const t = statsTransactions[i] as any;
      const val = Number(t?.amount) || 0;
      const isCredit = t?.paymentMethod === 'credit';

      if (t?.type === 'income') {
        income += val;
      } else {
        expenses += val;
        if (t.isVirtual) {
          virtualExpenses += val;
        } else if (isCredit) {
          creditExpenses += val;
        } else {
          cashExpenses += val;
        }
      }
    }

    return {
      income,
      expenses,
      cashExpenses,
      creditExpenses,
      virtualExpenses,
      balance: income - expenses,
      accumulatedBalance: 0,
      accumulatedIncome: 0,
      accumulatedExpenses: 0,
      accumulatedCashExpenses: 0,
      accumulatedCreditExpenses: 0,
      accumulatedVirtualExpenses: 0,
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
      creditTransactions: [],
    };
  }, [deferredTransactions, isLoading, viewMode, currentDate, startDate, endDate, hasHydrated]);

  // Heavy calculations (aggregateAllTimeFlow, buildSovereignSnapshot) em background via requestIdleCallback
  useEffect(() => {
    setDeferredHeavyStats(null);
    if (!hasHydrated) return;

    const calculateHeavy = () => {
      const allTimeFlow = aggregateAllTimeFlow(safeTransactions);

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

      let income = 0;
      let expenses = 0;
      let realBalance = 0;
      let virtualImpact = 0;
      let cashExpenses = 0;
      let creditExpenses = 0;
      let virtualExpenses = 0;

      for (let i = 0; i < statsTransactions.length; i++) {
        const t = statsTransactions[i] as any;
        const val = Number(t?.amount) || 0;
        const isCredit = t?.paymentMethod === 'credit';

        if (t?.type === 'income') {
          income += val;
          realBalance += val;
        } else {
          expenses += val;
          if (t.isVirtual) {
            virtualImpact += val;
            virtualExpenses += val;
          } else if (isCredit) {
            creditExpenses += val;
          } else {
            realBalance -= val;
            cashExpenses += val;
          }
        }
      }

      const creditTransactions: any[] = [];
      for (let i = 0; i < statsTransactions.length; i++) {
        const t = statsTransactions[i] as any;
        if (t.type === 'expense' && (t.paymentMethod === 'credit' || t.isVirtual)) {
          creditTransactions.push({
            id: t.id,
            description: t.description || '',
            amount: Number(t.amount) || 0,
            date: t.date,
            paymentMethod: t.paymentMethod,
            isVirtual: t.isVirtual,
            cardName: ((userCards || []).find((c: any) => c.id === t.cardId))?.name || '',
          });
        }
      }

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

      setDeferredHeavyStats({
        income,
        expenses,
        cashExpenses,
        creditExpenses,
        virtualExpenses,
        balance: realBalance,
        accumulatedBalance: allTimeFlow.realBalance,
        accumulatedIncome: allTimeFlow.income,
        accumulatedExpenses: allTimeFlow.expenses,
        accumulatedCashExpenses: allTimeFlow.cashExpenses,
        accumulatedCreditExpenses: allTimeFlow.creditExpenses,
        accumulatedVirtualExpenses: allTimeFlow.virtualExpenses,
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
        creditTransactions,
      });
    };

    const handle = requestIdleCallback(calculateHeavy, { timeout: 3000 });
    return () => cancelIdleCallback(handle);
  }, [safeTransactions, hasHydrated, viewMode, currentDate, startDate, endDate, totalPendingBills, userMeta, localCommandMode, userCards]);

  const finalStats = deferredHeavyStats ?? stats;

  // Restored definitions for return properties that were deleted in prior refactor
  const commandMode = isCommandMode(userMeta) || localCommandMode;
  const showCalibrationOffer = false;
  const calibrationInviteCopy = { title: '', body: '' };
  const handleDeferCalibration = () => {};
  const handleDismissCalibrationInvite = () => {};
  const handleStartCalibration = () => {
    setShowCalibrationModal(true);
    setCalibrationInviteVisible(false);
  };
  const handleCalibrationComplete = () => {
    setLocalCommandMode(true);
    setShowCalibrationModal(false);
    setCalibrationInviteVisible(false);
  };
  const categoryStats = useMemo(() => {
    if (!isReady) return { data: [], gradient: '' };

    const totalsByCategory = new Map<string, number>();
    let totalExpenses = 0;

    for (const transaction of filtered) {
      if (transaction?.type !== 'expense') continue;

      const amount = Number(transaction.amount) || 0;
      const category = (transaction.category || 'Sem categoria').toString();
      totalsByCategory.set(category, (totalsByCategory.get(category) || 0) + amount);
      totalExpenses += amount;
    }

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const data = Array.from(totalsByCategory.entries())
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .slice(0, 5)
      .map(([name, amount], index) => ({
        name,
        percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: colors[index % colors.length],
      }));

    let accumulatedPercent = 0;
    const gradient = `conic-gradient(${data.length > 0
      ? data.map((item) => {
          const start = accumulatedPercent;
          accumulatedPercent += item.percent;
          return `${item.color} ${(start / 100) * 360}deg ${(accumulatedPercent / 100) * 360}deg`;
        }).join(', ')
      : '#334155 0deg 360deg'})`;

    return { data, gradient };
  }, [filtered, isReady]);

  const categorySummary = useMemo(() => {
    if (!isReady) return [];

    const summaryByCategory = new Map<string, { income: number; expense: number; total: number; count: number }>();

    for (const transaction of filtered) {
      const category = (transaction?.category || 'Sem categoria').toString();
      const amount = Number(transaction?.amount) || 0;
      const current = summaryByCategory.get(category) || { income: 0, expense: 0, total: 0, count: 0 };

      if (transaction?.type === 'income') {
        current.income += amount;
        current.total += amount;
      } else {
        current.expense += amount;
        current.total -= amount;
      }

      current.count += 1;
      summaryByCategory.set(category, current);
    }

    const data = Array.from(summaryByCategory.entries()).map(([name, values]) => ({ name, ...values }));
    return data.sort((a, b) => {
      const direction = sortMode === 'category-desc' ? -1 : 1;
      return direction * a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });
  }, [filtered, isReady, sortMode]);

  const categoryTransactionsMap = useMemo(() => {
    if (!isReady) return new Map<string, any[]>();

    const transactionsByCategory = new Map<string, any[]>();
    for (const transaction of filtered) {
      const category = (transaction?.category || 'Sem categoria').toString();
      const entries = transactionsByCategory.get(category) || [];
      entries.push(transaction);
      transactionsByCategory.set(category, entries);
    }

    return transactionsByCategory;
  }, [filtered, isReady]);
  const categoryNames = useMemo(() => {
    const fromDb = (categories || []).map((c: any) => c.name).filter(Boolean);
    const fromTx = safeTransactions.map((t: any) => t?.category).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromTx])).sort();
  }, [categories, safeTransactions]);
  const handleExportPDF = () => {};
  const handleClearCardFilter = () => {
    setFilterCardId(null);
    setFilterCardName('');
    setFilterPeriodStart('');
    setFilterPeriodEnd('');
  };
  const handleFilterByCard = (cardId: string, cardName: string, periodStart: string, periodEnd: string) => {
    setFilterCardId(cardId);
    setFilterCardName(cardName);
    setFilterPeriodStart(periodStart);
    setFilterPeriodEnd(periodEnd);
    setShowTransactions(true);
  };
  const setRecurringBills = () => {};
  const setUserCards = () => {};
  const guardedSetViewMode = setViewMode;
  const guardedSetStartDate = setStartDate;
  const guardedSetEndDate = setEndDate;
  const guardedChangeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + offset);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + offset);
    else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + offset);
    setCurrentDate(newDate);
  };
  const guardedDateSelect = (dateString: string) => {
    if (!dateString) return;
    const [year, month, day] = dateString.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, day));
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
    // Memos
    safeTransactions,
    realCashData,
    activeInvoices,
    pendingBills,
    totalPendingBills,
    streak,
    monthlyConsistency,
    periodLabel,
    filtered: deferredFiltered,
    stats: finalStats,
    projectedBalance: finalStats.projectedBalance,
    accumulatedBalance: finalStats.accumulatedBalance || finalStats.balance || 0,
    colchaoTarget: userMeta?.financialProfile?.colchaoInicialTarget || 0,

    reserveTarget: userMeta?.financialProfile?.emergencyReserveTarget || 0,
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
    showFutureExpenseForm,
    setShowFutureExpenseForm,

    // Handlers
    handleRecurringButtonClick,
    handleFutureExpenseClick,
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
    userMetaLoading,
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
