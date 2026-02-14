import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './contexts/AuthContext';
import { useFirebase } from './hooks/useFirebase';
import { useSubscriptionAccess } from './hooks/useSubscriptionAccess';
import { useAppSecurity } from './hooks/useAppSecurity';
import { useNavigation } from './hooks/useNavigation';
import { NotificationService } from './services/NotificationService';
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  userId?: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  category: string;
  amount: number;
}

// Components
import AppHeader from './components/AppHeader';
import AppOnlyBlock from './components/AppOnlyBlock';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import ContentModal from './components/ContentModal';
import ToastContainer from './components/Toast';
import MobileBottomNav from './components/MobileBottomNav';
import AuthLogin from './components/Auth/AuthLogin';
import AuthRegister from './components/Auth/AuthRegister';
import PricingPage from './components/PricingPage';
import SettingsPage from './components/SettingsPage';
import { PublicHome, InvestmentArticle2026 } from './components/PublicPages';
import AiChatPage from './components/AiChatPage';
import SecurityLock from './components/SecurityLock';

// Tools
import { 
  FireCalculatorTool, CompoundInterestTool, InflationTool, RentVsFinanceTool, DebtOptimizerTool, DividendsTool 
} from './components/Tools';

const App: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { lancamentos, categories, saveLancamento, deleteLancamento, saveCategory, deleteCategory, userMeta, usagePercentage, isLimitReached } = useFirebase(user?.uid);
  const { isPro, isPremium } = useSubscriptionAccess();
  const { isAppLocked, storedPin, handleUnlockSuccess } = useAppSecurity(user?.uid, isAuthenticated);
  const { currentTool, homeKey, navigateTo } = useNavigation();

  const isNative = Capacitor.isNativePlatform();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts] = useState<ToastMessage[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const isMobileBrowser = !isNative && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const getAiContextTransactions = (): Transaction[] => {
    const days = isPremium ? 1460 : (isPro ? 120 : 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return lancamentos.filter(t => new Date(t.date) >= cutoff);
  };

  useEffect(() => {
    if (isAuthenticated && isNative) {
      const setupNotifications = async () => {
        const granted = await NotificationService.requestPermission();
        if (granted) await NotificationService.scheduleDailyReminder();
      };
      setupNotifications();
    }
  }, [isAuthenticated, isNative]);

  const handleNavigate = (tool: string) => {
    navigateTo(tool);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await NotificationService.cancelAll();
    await logout();
    handleNavigate('home');
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setActiveModal('transaction');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingTransaction(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-sky-500 font-bold animate-pulse text-xs uppercase tracking-widest">
        Carregando...
      </div>
    );
  }

  const renderContent = () => {
    if (isAppLocked && isAuthenticated && storedPin) {
      return <SecurityLock storedPin={storedPin} useBiometrics={false} onSuccess={handleUnlockSuccess} />;
    }

    const wrap = (comp: React.ReactNode) => <div className="pt-16 pb-24 min-h-screen">{comp}</div>;

    switch (currentTool) {
      case 'login':
        return wrap(<AuthLogin onSuccess={() => handleNavigate('home')} onSwitchToRegister={() => handleNavigate('register')} />);
      case 'register':
        return wrap(<AuthRegister onSuccess={() => handleNavigate('home')} onSwitchToLogin={() => handleNavigate('login')} />);
      case 'manager':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        if (isMobileBrowser) return wrap(<AppOnlyBlock onBack={() => handleNavigate('home')} />);
        return wrap(
          <Dashboard
            transactions={lancamentos}
            categories={categories}
            onDeleteTransaction={deleteLancamento}
            onOpenForm={() => { setEditingTransaction(null); setActiveModal('transaction'); }}
            onSaveCategory={saveCategory}
            onDeleteCategory={deleteCategory}
            userMeta={userMeta}
            usagePercentage={usagePercentage}
            isPremium={isPro || isPremium}
            isLimitReached={isLimitReached}
            onShowPaywall={() => setActiveModal('paywall')}
            isPrivacyMode={isPrivacyMode}
            onNavigate={handleNavigate}
            onEditTransaction={handleEditTransaction}
          />
        );
      case 'settings':
        if (!isAuthenticated) { handleNavigate('login'); return null; }
        if (isMobileBrowser) return wrap(<AppOnlyBlock onBack={() => handleNavigate('home')} />);
        return wrap(<SettingsPage onBack={() => handleNavigate('manager')} />);
      case 'pricing':
        return wrap(<PricingPage onNavigate={handleNavigate} currentPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'} onBack={() => handleNavigate('home')} isAuthenticated={isAuthenticated} userId={user?.uid} />);
      case 'chat':
        if (isMobileBrowser) return wrap(<AppOnlyBlock onBack={() => handleNavigate('home')} />);
        return <AiChatPage onNavigate={handleNavigate} filteredTransactions={getAiContextTransactions()} simulations={[]} />;
      case 'article-2026':
        return wrap(<InvestmentArticle2026 onNavigate={handleNavigate} />);
      case 'tool-fire':
        return wrap(<FireCalculatorTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />);
      case 'tool-juros':
        return wrap(<CompoundInterestTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />);
      case 'tool-inflacao':
        return wrap(<InflationTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />);
      case 'tool-alugar':
        return wrap(<RentVsFinanceTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />);
      case 'tool-dividas':
        return wrap(<DebtOptimizerTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />);
      case 'tool-dividendos':
        return wrap(<DividendsTool onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />);
      case 'home':
      default:
        return (
          <PublicHome
            key={homeKey}
            onNavigate={handleNavigate}
            onStartNow={() => handleNavigate(isAuthenticated ? 'manager' : 'register')}
            isAuthenticated={isAuthenticated}
            userEmail={user?.email}
            userMeta={userMeta}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-x-hidden">
      <AppHeader
        currentTool={currentTool}
        isAuthenticated={isAuthenticated}
        userMeta={userMeta}
        userDisplayName={user?.displayName?.split(' ')[0]}
        userEmail={user?.email}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <main className="flex-grow">{renderContent()}</main>
	
	{/* Painel móvel do menu (topo) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-72 max-w-[80%] h-full bg-[#020617] border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                {isAuthenticated
                  ? `Seja Bem Vindo, ${userMeta?.nickname || user?.displayName || 'Investidor'}!`
                  : 'Entrar'}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-white text-sm font-bold"
              >
                X
              </button>
            </div>

            {/* Opções */}
            <div className="flex-1 px-4 py-4 flex flex-col gap-3 text-sm">
              {/* Ir para Gerenciador Financeiro */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) handleNavigate('manager');
                  else handleNavigate('login');
                }}
                className="w-full text-left px-3 py-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 transition-all font-bold text-[11px] uppercase tracking-widest"
              >
                <span className="block">Ir para</span>
                <span className="block">Gerenciador Financeiro</span>
              </button>

              {/* Nexus IA */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) handleNavigate('chat');
                  else handleNavigate('login');
                }}
                className="w-full text-left px-3 py-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-900 transition-all font-bold text-[11px] uppercase tracking-widest"
              >
                Nexus IA
              </button>

              {/* Configurações */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) handleNavigate('settings');
                  else handleNavigate('login');
                }}
                className="w-full text-left px-3 py-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-500/60 hover:bg-slate-900 transition-all font-bold text-[11px] uppercase tracking-widest"
              >
                Configurações
              </button>
            </div>
          </div>
        </div>
      )}
		
      {isNative && isAuthenticated && !isAppLocked && (
        <MobileBottomNav
          currentTool={currentTool}
          onNavigate={handleNavigate}
          onOpenMore={() => handleNavigate('settings')}
          onAdd={() => { setEditingTransaction(null); setActiveModal('transaction'); }}
        />
      )}

      <ContentModal isOpen={activeModal === 'transaction'} onClose={handleCloseModal} title={editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}>
        <TransactionForm
          initialData={editingTransaction}
          onSave={async (t: any) => { try { const { id, ...rest } = t; const cleanData = { ...rest, amount: Number(t.amount) }; if (id) cleanData.id = id; await saveLancamento(cleanData); handleCloseModal(); } catch (e) { throw e; } }}
          onCancel={handleCloseModal}
          expenseCategories={categories.filter((c: any) => c.type === 'expense').map((c: any) => c.name)}
          incomeCategories={categories.filter((c: any) => c.type === 'income').map((c: any) => c.name)}
          onUpdateExpenseCategories={async (newCat: any) => {
              const name = typeof newCat === 'function' ? newCat([]).pop() : newCat;
              if (name) await saveCategory({ name, type: 'expense', color: '#3b82f6', icon: 'tag' });
          }}
          onUpdateIncomeCategories={async (newCat: any) => {
              const name = typeof newCat === 'function' ? newCat([]).pop() : newCat;
              if (name) await saveCategory({ name, type: 'income', color: '#10b981', icon: 'tag' });
          }}
          categories={categories}
          onSaveCategory={saveCategory}
          onDeleteCategory={deleteCategory}
        />
      </ContentModal>

      <ToastContainer toasts={toasts} removeToast={() => {}} />
    </div>
  );
};

export default App;
