import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from './contexts/AuthContext';
import { useFirebase } from './hooks/useFirebase';
import { useSubscriptionAccess } from './hooks/useSubscriptionAccess';
import { NotificationService } from './services/NotificationService';
import { ToastMessage } from './types';
import { 
  LogOut, X, Settings, Smartphone, Sparkles, Wallet, Eye, EyeOff, LayoutGrid, Globe, Download, ArrowRight
} from 'lucide-react';

// Components
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

// Ferramentas
import { 
  FireCalculatorTool, CompoundInterestTool, InflationTool, RentVsFinanceTool, DebtOptimizerTool, DividendsTool 
} from './components/Tools';

// BLOQUEIO DO SITE NO CELULAR
const AppOnlyBlock = ({ onBack }: { onBack: () => void }) => {
    const handleDownload = () => {
        const appIntent = "intent://#Intent;scheme=financaspro;package=com.financasproinvest.mobile;end";
        window.location.href = appIntent;
        setTimeout(() => {
            window.open('https://play.google.com/store/apps/details?id=com.financasproinvest.mobile', '_blank');
        }, 1200);
    };

    return (
        <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20 shadow-2xl relative">
                <Download size={32} className="animate-bounce" />
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">Gerenciador <br/> <span className="text-emerald-400">Financeiro</span></h2>
                <div className="bg-sky-500/10 text-sky-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-sky-500/20 inline-block">Abrir no Aplicativo</div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto font-medium">Detectamos que você está no celular. Para uma melhor experiência e segurança, use nosso <strong>App Nativo</strong>.</p>
            <div className="pt-6 flex flex-col gap-4">
                <button onClick={handleDownload} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    ABRIR GERENCIADOR AGORA
                </button>
                <button onClick={onBack} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">Voltar para o Início</button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { lancamentos, categories, saveLancamento, deleteLancamento, saveCategory, deleteCategory, userMeta, usagePercentage, isLimitReached } = useFirebase(user?.uid);
  const { isPro, isPremium } = useSubscriptionAccess();
  const isNative = Capacitor.isNativePlatform();

  const [currentTool, setCurrentTool] = useState<string>(() => {
    if (isNative) return 'manager';
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [homeKey, setHomeKey] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const isMobileBrowser = !isNative && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const getAiContextTransactions = () => {
    let d = (isPremium ? 1460 : (isPro ? 120 : 10)); 
    const c = new Date(); c.setDate(c.getDate() - d); 
    return lancamentos.filter(t => new Date(t.date) >= c);
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

  useEffect(() => {
    if (isAuthenticated && user?.uid && isNative) checkSecurity();
    else setIsAppLocked(false);
  }, [isAuthenticated, user]);

  async function checkSecurity() {
    try {
      const { value: pin } = await Preferences.get({ key: `pin_${user?.uid}` });
      if (pin) {
        setStoredPin(pin);
        const { value: last } = await Preferences.get({ key: `last_auth_${user?.uid}` });
        if ((Date.now() - (last ? parseInt(last) : 0)) > 7 * 24 * 60 * 60 * 1000) setIsAppLocked(true);
      }
    } catch (e) {}
  }

  const handleUnlockSuccess = async () => {
    await Preferences.set({ key: `last_auth_${user?.uid}`, value: Date.now().toString() });
    setIsAppLocked(false);
  };

  const navigateTo = (tool: string) => {
    if (tool === 'home') setHomeKey(prev => prev + 1);
    setCurrentTool(tool);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
    if (!isNative) {
        const path = tool === 'home' ? '/' : `/${tool}`;
        window.history.pushState({}, '', path);
    }
  };

  const handleOpenWebsite = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br', windowName: '_system' });
  };

  const handleLogout = async () => {
      await NotificationService.cancelAll();
      await logout();
      navigateTo('home');
  };

  const handleEditTransaction = (t: any) => { setEditingTransaction(t); setActiveModal('transaction'); };
  const handleCloseModal = () => { setActiveModal(null); setEditingTransaction(null); };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-sky-500 font-bold animate-pulse text-xs uppercase tracking-widest">Carregando...</div>;

  const renderContent = () => {
    if (isAppLocked && isAuthenticated && storedPin) {
      return <SecurityLock storedPin={storedPin} useBiometrics={false} onSuccess={handleUnlockSuccess} />;
    }
    const wrap = (comp: React.ReactNode) => <div className="pt-16 pb-24 min-h-screen">{comp}</div>;
    
    switch(currentTool) {
       case 'login': return wrap(<AuthLogin onSuccess={() => navigateTo('home')} onSwitchToRegister={() => navigateTo('register')} />);
       case 'register': return wrap(<AuthRegister onSuccess={() => navigateTo('home')} onSwitchToLogin={() => navigateTo('login')} />);
       case 'manager': 
          if (!isAuthenticated) { navigateTo('login'); return null; }
          if (isMobileBrowser) return wrap(<AppOnlyBlock onBack={() => navigateTo('home')} />);
          return wrap(<Dashboard transactions={lancamentos} categories={categories} onDeleteTransaction={deleteLancamento} onOpenForm={() => { setEditingTransaction(null); setActiveModal('transaction'); }} onSaveCategory={saveCategory} onDeleteCategory={deleteCategory} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPro || isPremium} isLimitReached={isLimitReached} onShowPaywall={() => setActiveModal('paywall')} isPrivacyMode={isPrivacyMode} onNavigate={navigateTo} onEditTransaction={handleEditTransaction} />);
       case 'settings': if (!isAuthenticated) { navigateTo('login'); return null; } return wrap(<SettingsPage onBack={() => navigateTo('manager')} />);
       case 'pricing': return wrap(<PricingPage onNavigate={navigateTo} currentPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'} onBack={() => navigateTo('home')} isAuthenticated={isAuthenticated} userId={user?.uid} />);
       case 'chat': return <AiChatPage onNavigate={navigateTo} filteredTransactions={getAiContextTransactions()} simulations={[]} />;
       case 'article-2026': return wrap(<InvestmentArticle2026 onNavigate={navigateTo} />);
       case 'tool-fire': return wrap(<FireCalculatorTool onNavigate={navigateTo} isAuthenticated={isAuthenticated} />);
       case 'tool-juros': return wrap(<CompoundInterestTool onNavigate={navigateTo} isAuthenticated={isAuthenticated} />);
       case 'tool-inflacao': return wrap(<InflationTool onNavigate={navigateTo} isAuthenticated={isAuthenticated} />);
       case 'tool-alugar': return wrap(<RentVsFinanceTool onNavigate={navigateTo} isAuthenticated={isAuthenticated} />);
       case 'tool-dividas': return wrap(<DebtOptimizerTool onNavigate={navigateTo} isAuthenticated={isAuthenticated} />);
       case 'tool-dividendos': return wrap(<DividendsTool onNavigate={navigateTo} isAuthenticated={isAuthenticated} />);
       case 'home': 
       default: return <PublicHome key={homeKey} onNavigate={navigateTo} onStartNow={() => navigateTo(isAuthenticated ? 'manager' : 'register')} isAuthenticated={isAuthenticated} userEmail={user?.email} userMeta={userMeta} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-x-hidden">
       <header className="fixed top-0 left-0 w-full z-[100] bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 h-16 flex items-center px-4 md:px-8 shadow-2xl">
          {/* LADO ESQUERDO: LOGO E TÍTULO DOURADO */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigateTo('home')}>
              <img src="/icon.png" alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg" />
              <div className="flex flex-col leading-none">
                {/* 1. NOME COMPLETO RESTAURADO */}
                <h1 className="text-sm md:text-xl font-black text-sky-400 tracking-tighter uppercase whitespace-nowrap">Finanças Pro Invest</h1>
                {isNative && isAuthenticated && (
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1 truncate">Seja Bem Vindo, {userMeta?.nickname || 'Investidor'}!</span>
                )}
              </div>
              {/* 4. TÍTULO DO GERENCIADOR DOURADO RESTAURADO */}
              {currentTool === 'manager' && !isNative && (
                <div className="hidden lg:flex items-center border-l border-slate-700 pl-4 ml-4">
                   <span className="text-lg font-black text-yellow-400 tracking-tight uppercase">Gerenciador Financeiro</span>
                </div>
              )}
          </div>

          {/* LADO DIREITO: BOTÕES E SAUDAÇÃO */}
          <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
              {/* 2. SAUDAÇÃO DESKTOP CORRIGIDA */}
              {!isNative && isAuthenticated && (
                <div className="hidden xl:flex items-center gap-3 mr-2 text-sm border-r border-slate-800 pr-4">
                   <div className="flex flex-col text-right leading-none">
                      <span className="text-slate-500 text-[9px] font-black uppercase mb-1">Seja Bem Vindo,</span>
                      <span className="text-white font-bold text-xs">{userMeta?.nickname || user?.displayName?.split(' ')[0] || 'Investidor'}!</span>
                   </div>
                   <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                      {isPrivacyMode ? <EyeOff size={16}/> : <Eye size={16}/>}
                   </button>
                </div>
              )}

              {isNative && isAuthenticated && (
                <button onClick={handleOpenWebsite} className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-slate-300 font-black text-[9px] uppercase active:scale-95 transition-all">
                  <Globe size={12} /> SITE
                </button>
              )}

              {isAuthenticated && currentTool !== 'manager' && (
                // 3. BOTÃO COM NOME SOLICITADO
                <button onClick={() => navigateTo('manager')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-full font-black text-[10px] md:text-xs uppercase shadow-lg transition-all active:scale-95 hover:bg-emerald-600 hover:text-white">
                  <Wallet size={14} className="shrink-0" /> 
                  <span className="whitespace-nowrap">Ir Para GERENCIADOR FINANCEIRO</span>
                </button>
              )}

              {isAuthenticated && !isNative && (
                <div className="hidden md:flex items-center gap-2">
                   {/* 2. ÍCONE DE ESTRELINHAS RECOLOCADO */}
                   <button onClick={() => navigateTo('chat')} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase transition-all ${currentTool === 'chat' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 border-slate-800 text-sky-400'}`}>
                      <Sparkles size={14} /> Nexus IA
                   </button>
                   <button onClick={() => navigateTo('settings')} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={18} /></button>
                   <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 ml-1"><LogOut size={18} /></button>
                </div>
              )}

              {!isAuthenticated && !isNative && (
                <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                   <button onClick={() => navigateTo('login')} className="text-slate-400 hover:text-white transition-colors">Entrar</button>
                   <button onClick={() => navigateTo('register')} className="bg-sky-600 text-white px-5 py-2 rounded-full hover:bg-sky-500 shadow-lg transition-all">Criar Conta</button>
                </div>
              )}

              {(!isNative || !isAuthenticated) && (
                <div className="lg:hidden">
                   <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300 p-2"><LayoutGrid size={24}/></button>
                </div>
              )}
          </div>
       </header>

       <main className="flex-grow">{renderContent()}</main>

       {isNative && isAuthenticated && !isAppLocked && (
            <MobileBottomNav currentTool={currentTool} onNavigate={navigateTo} onOpenMore={() => navigateTo('settings')} onAdd={() => { setEditingTransaction(null); setActiveModal('transaction'); }} />
       )}
       
       <ContentModal isOpen={activeModal === 'transaction'} onClose={handleCloseModal} title={editingTransaction ? "Editar Lançamento" : "Novo Lançamento"}>
          <TransactionForm 
            initialData={editingTransaction}
            onSave={async (t: any) => { try { const cleanData = { ...t, amount: Number(t.amount) }; await saveLancamento(cleanData); handleCloseModal(); } catch (e) { throw e; } }} 
            onCancel={handleCloseModal} 
            expenseCategories={categories.filter(c => c.type === 'expense').map(c => c.name)} 
            incomeCategories={categories.filter(c => c.type === 'income').map(c => c.name)} 
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
