import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from './useFirebase';
import { useSubscriptionAccess } from './useSubscriptionAccess';
import { useAppSecurity } from './useAppSecurity';
import { useNavigation } from './useNavigation';
import { useReengagementTrigger } from './useReengagementTrigger';
import { NotificationService } from '../services/NotificationService';
import { getPrioritizedInsight, UserContext, NexusInsight } from '../services/nexusInsightEngine';
import { Transaction, Category, UserMeta } from '../types';
import { getConsecutiveDays } from '../utils/streakUtils';

export interface AppState {
  user: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
  authLoading: boolean;
  lancamentos: Transaction[];
  categories: Category[];
  saveLancamento: ReturnType<typeof useFirebase>['saveLancamento'];
  deleteLancamento: ReturnType<typeof useFirebase>['deleteLancamento'];
  saveCategory: ReturnType<typeof useFirebase>['saveCategory'];
  deleteCategory: ReturnType<typeof useFirebase>['deleteCategory'];
  fetchHistory: ReturnType<typeof useFirebase>['fetchHistory'];
  fetchMonth: ReturnType<typeof useFirebase>['fetchMonth'];
  userMeta: UserMeta | null | undefined;
  userMetaLoaded: boolean;
  usagePercentage: number;
  isLimitReached: boolean;
  isPro: boolean;
  isPremium: boolean;
  isAppLocked: boolean;
  storedPin: string | null;
  handleUnlockSuccess: () => void;
  isNative: boolean;
  isMobileBrowser: boolean;
  isLoading: boolean;
  isPrivacyMode: boolean;
  setIsPrivacyMode: React.Dispatch<React.SetStateAction<boolean>>;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSyncing: boolean;
  activeModal: string | null;
  setActiveModal: React.Dispatch<React.SetStateAction<string | null>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingTransaction: Partial<Transaction> | null;
  setEditingTransaction: React.Dispatch<React.SetStateAction<Partial<Transaction> | null>>;
  onboardingDismissed: boolean;
  setOnboardingDismissed: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => Promise<void>;
  handleEditTransaction: (t: Transaction) => void;
  handleCloseModal: () => void;
  getAiContextTransactions: () => Transaction[];
  openTransactionForm: (initialData?: Partial<Transaction>) => void;
  routerNavigate: ReturnType<typeof useNavigate>;
  location: ReturnType<typeof useLocation>;
  scheduleDailyReminder?: (insight?: NexusInsight | null) => Promise<void>;
}

export function useAppState(): AppState {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      const updateHeartbeat = async () => {
        try {
          const STORAGE_KEY = `fpi_last_heartbeat_${user.uid}`;
          const today = new Date().toISOString().split('T')[0];
          if (localStorage.getItem(STORAGE_KEY) !== today) {
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { 
              lastActiveAt: serverTimestamp() 
            }, { merge: true });
            
            localStorage.setItem(STORAGE_KEY, today);
          }
        } catch (error) {
          console.warn('[FinOps] Heartbeat bypass:', error);
        }
      };
      updateHeartbeat();
    }
  }, [isAuthenticated, user?.uid]);

  // PRÉ-CARGA CIRÚRGICA: Busca mês atual + 2 anteriores logo após autenticar.
  // O Set interno do fetchMonth garante que cada mês é buscado no máximo 1x por sessão.
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return;
    const today = new Date();
    // Pequeno delay para garantir que o bridge realtime já iniciou
    const timer = setTimeout(() => {
      [0, 1, 2].forEach(offset => {
        const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
        fetchMonth(d.getFullYear(), d.getMonth() + 1);
      });
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.uid]); // Intencional: roda apenas quando o usuário autentica

  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const {
    lancamentos,
    categories,
    saveLancamento,
    deleteLancamento,
    saveCategory,
    deleteCategory,
    userMeta,
    userMetaLoaded,
    usagePercentage,
    isLimitReached,
    isSyncing,
    fetchHistory,
    fetchMonth,
  } = useFirebase(user?.uid);
  const { isPro, isPremium } = useSubscriptionAccess();
  const { isAppLocked, storedPin, handleUnlockSuccess } = useAppSecurity(user?.uid, isAuthenticated);
  const { navigationReady, resetNavigation } = useNavigation();
  
  useReengagementTrigger({ userId: user?.uid, isLoading: authLoading });

  const routerNavigate = useNavigate();
  const location = useLocation();
  const isNative = Capacitor.isNativePlatform();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | null>(null);

  const isMobileBrowser =
    !isNative &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const getAiContextTransactions = useCallback((): Transaction[] => {
    const days = isPremium ? 1460 : isPro ? 120 : 10;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return lancamentos.filter((t) => new Date(t.date) >= cutoff);
  }, [isPremium, isPro, lancamentos]);

  useEffect(() => {
    if (isAuthenticated && isNative) {
      const setupNotifications = async () => {
        const granted = await NotificationService.requestPermission();
        if (granted) {
          // 1. Prepara contexto para o motor de insights
          const todayStr = new Date().toISOString().split('T')[0];
          const txToday = lancamentos.filter((t: any) => t.date === todayStr).length;

          let daysSince = 0;
          if (lancamentos.length > 0) {
            const lastDate = new Date([...lancamentos].sort((a: any, b: any) => b.date.localeCompare(a.date))[0].date);
            daysSince = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          }

          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          const monthTx = lancamentos.filter((t: any) => {
            const [y, m] = t.date.split('-').map(Number);
            return y === currentYear && m === currentMonth;
          });
          const balance = monthTx.reduce((acc: number, t: any) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

          const ctx: UserContext = {
            hasFinancialProfile: !!userMeta?.financialProfile,
            hasPaidAccess: isPro || isPremium,
            isPremium: isPremium,
            transactionsToday: txToday,
            daysSinceLastTransaction: daysSince,
            launchCount: lancamentos.length,
            launchLimit: userMeta?.launchLimit || 30,
            monthBalance: balance,
            hasFirstInvestment: lancamentos.some((t: any) => t.category?.toLowerCase().includes('investimento')),
            streak: getConsecutiveDays(lancamentos)
          };

          // 2. Obtém insight para a notificação
          const dailyInsight = getPrioritizedInsight(ctx);
          await NotificationService.scheduleDailyReminder(dailyInsight);

          // 3. Lógica de reengajamento (3 dias)
          if (daysSince >= 3) {
            await NotificationService.scheduleReengagementReminder(balance);
          } else {
            await NotificationService.cancelCategory('reengagement');
          }
        }
      };
      setupNotifications();
    }
  }, [isAuthenticated, isNative, lancamentos, userMeta, isPro, isPremium]);

  const handleLogout = useCallback(async () => {
    await NotificationService.cancelAll();
    await logout();
    resetNavigation();
    setMobileMenuOpen(false);
  }, [logout, resetNavigation]);

  const handleEditTransaction = useCallback((t: Transaction) => {
    setEditingTransaction(t);
    setActiveModal('transaction');
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setEditingTransaction(null);
  }, []);

  const openTransactionForm = useCallback((initialData?: Partial<Transaction>) => {
    setEditingTransaction(initialData || null);
    setActiveModal('transaction');
  }, []);

  const isLoading = authLoading;

  return {
    user,
    isAuthenticated,
    authLoading,
    lancamentos,
    categories,
    saveLancamento,
    deleteLancamento,
    fetchHistory,
    fetchMonth,
    saveCategory,
    deleteCategory,
    userMeta,
    userMetaLoaded,
    usagePercentage,
    isLimitReached,
    isPro,
    isPremium,
    isAppLocked,
    storedPin,
    handleUnlockSuccess,
    isNative,
    isMobileBrowser,
    isLoading,
    isPrivacyMode,
    setIsPrivacyMode,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isSyncing,
    activeModal,
    setActiveModal,
    mobileMenuOpen,
    setMobileMenuOpen,
    editingTransaction,
    setEditingTransaction,
    onboardingDismissed,
    setOnboardingDismissed,
    handleLogout,
    handleEditTransaction,
    handleCloseModal,
    getAiContextTransactions,
    openTransactionForm,
    routerNavigate,
    location,
    scheduleDailyReminder: NotificationService.scheduleDailyReminder
  };
}
