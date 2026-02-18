import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { LayoutDashboard, Sparkles, Settings, X, LogOut, ChevronRight } from 'lucide-react';
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
	  case 'termos':
		return wrap(<TermsPage />);
	  case 'privacidade':
        return wrap(<PrivacyPage />);
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
          <div className="w-72 max-w-[85%] h-full bg-[#020617] border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 mb-1">
                  Menu Principal
                </span>
                <span className="text-sm font-black text-white truncate max-w-[180px] uppercase tracking-tight">
                  {isAuthenticated
                    ? (userMeta?.nickname || user?.displayName || 'Investidor')
                    : 'Visitante'}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Opções de Navegação */}
            <div className="flex-1 px-4 py-6 flex flex-col gap-4 overflow-y-auto">
              
              {/* Botão Gerenciador (Dourado/Premium) */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) handleNavigate('manager');
                  else handleNavigate('login');
                }}
                className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-amber-500/40 to-transparent transition-all active:scale-95 shadow-lg shadow-amber-950/20"
              >
                <div className="bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg">
                    <LayoutDashboard size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left leading-tight">
                    <span className="block text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5">App Nativo</span>
                    <span className="block text-[13px] font-bold text-white uppercase tracking-tight">Gerenciador</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-400" />
                </div>
              </button>

              {/* Botão Nexus IA (Sky/Neon) */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) handleNavigate('chat');
                  else handleNavigate('login');
                }}
                className="w-full group relative p-px rounded-2xl bg-gradient-to-b from-sky-500/40 to-transparent transition-all active:scale-95 shadow-lg shadow-sky-950/20"
              >
                <div className="bg-[#0f172a] rounded-[15px] p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg">
                    <Sparkles size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left leading-tight">
                    <span className="block text-[9px] font-black text-sky-500 uppercase tracking-widest mb-0.5">Inteligência</span>
                    <span className="block text-[13px] font-bold text-white uppercase tracking-tight">Nexus IA</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-sky-400" />
                </div>
              </button>

              {/* Botão Configurações (Clean Glass) */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) handleNavigate('settings');
                  else handleNavigate('login');
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95 text-left group"
              >
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                  <Settings size={18} />
                </div>
                <span className="flex-1 text-[13px] font-bold text-slate-300 uppercase tracking-widest">Configurações</span>
                <ChevronRight size={16} className="text-slate-700" />
              </button>
            </div>

            {/* Rodapé do Menu (Sair) */}
            {isAuthenticated && (
               <div className="p-6 border-t border-white/5 bg-slate-950/30">
                 <button 
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                 >
                   <LogOut size={16} /> Sair da Conta
                 </button>
               </div>
            )}
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
