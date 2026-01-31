import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from './contexts/AuthContext';
import { useFirebase } from './hooks/useFirebase';
import { useSubscriptionAccess } from './hooks/useSubscriptionAccess';
import { ToastMessage } from './types';
import { 
  LogOut,
  X,
  ExternalLink,
  Settings,
  Smartphone,
  Sparkles,
  CreditCard,
  Eye,      // Novo
  EyeOff,   // Novo
  Download  // Novo
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import ContentModal from './components/ContentModal';
import ToastContainer from './components/Toast';
import MobileBottomNav from './components/MobileBottomNav';
import PaywallModal from './components/PaywallModal';
import AuthLogin from './components/Auth/AuthLogin';
import AuthRegister from './components/Auth/AuthRegister';
import PricingPage from './components/PricingPage';
import SettingsPage from './components/SettingsPage';
import { PublicHome } from './components/PublicPages';
import AiChatPage from './components/AiChatPage';
import SecurityLock from './components/SecurityLock';

const App: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  
  const { 
    lancamentos, 
    categories, 
    saveLancamento, 
    deleteLancamento, 
    saveCategory, 
    deleteCategory, 
    userMeta, 
    usagePercentage, 
    isLimitReached 
  } = useFirebase(user?.uid);

  const { isPro, isPremium } = useSubscriptionAccess();
  const isNative = Capacitor.isNativePlatform();

  const [currentTool, setCurrentTool] = useState<string>(() => {
    if (Capacitor.isNativePlatform()) return 'manager';
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  
  // ✅ NOVO: Estado de Privacidade (Olho Mágico)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // ✅ NOVO: Detecta se é Web Mobile para mostrar Smart Banner
  const isMobileWeb = !isNative && window.innerWidth < 768;

  useEffect(() => {
    if (isAuthenticated && user?.uid && isNative) {
      checkSecurity();
    } else {
      setIsAppLocked(false);
    }
  }, [isAuthenticated, user]);

  async function checkSecurity() {
    try {
      const { value: pin } = await Preferences.get({ key: `pin_${user?.uid}` });
      const { value: lastAuth } = await Preferences.get({ key: `last_auth_${user?.uid}` });
      const { value: alwaysAskVal } = await Preferences.get({ key: `always_ask_${user?.uid}` });
      const { value: bioVal } = await Preferences.get({ key: `use_biometrics_${user?.uid}` });
      
      setBiometricsEnabled(bioVal === 'true');

      if (pin) {
        setStoredPin(pin);
        const now = Date.now();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const timeSinceLastAuth = lastAuth ? now - parseInt(lastAuth) : sevenDaysInMs + 1;

        if (alwaysAskVal === 'true' || timeSinceLastAuth > sevenDaysInMs) {
          setIsAppLocked(true);
        }
      }
    } catch (error) {
      console.error("Erro na segurança:", error);
    }
  }

  const handleUnlockSuccess = async () => {
    await Preferences.set({ key: `last_auth_${user?.uid}`, value: Date.now().toString() });
    setIsAppLocked(false);
  };

  const navigateTo = (tool: string) => {
    setCurrentTool(tool);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
    if (!isNative) {
        const path = tool === 'home' ? '/' : `/${tool}`;
        window.history.pushState({}, '', path);
    }
  };

  const handleOpenWebsite = async (path = '') => {
    await Browser.open({ url: `https://www.financasproinvest.com.br${path}` });
  };

  const handleLogout = async () => {
      await logout();
      navigateTo('home');
  };

  const handleLoginSuccess = () => {
    if (isNative) navigateTo('manager');
    else navigateTo('home');
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-sky-500 font-bold animate-pulse">CARREGANDO...</div>;
  }

  const renderContent = () => {
    if (isAppLocked && isAuthenticated && storedPin) {
      return <SecurityLock storedPin={storedPin} useBiometrics={biometricsEnabled} onSuccess={handleUnlockSuccess} />;
    }

    const wrap = (comp: React.ReactNode) => <div className="pt-16 pb-24 animate-in fade-in duration-300 min-h-screen">{comp}</div>;

    switch(currentTool) {
       case 'login': return wrap(<AuthLogin onSuccess={handleLoginSuccess} onSwitchToRegister={() => navigateTo('register')} />);
       case 'register': return wrap(<AuthRegister onSuccess={handleLoginSuccess} onSwitchToLogin={() => navigateTo('login')} />);
       
       // ✅ Passando isPrivacyMode para o Dashboard
       case 'manager': 
          if (!isAuthenticated) { navigateTo('login'); return null; }
          return wrap(<Dashboard transactions={lancamentos} categories={categories} onDeleteTransaction={deleteLancamento} onOpenForm={() => setActiveModal('transaction')} onSaveCategory={saveCategory} onDeleteCategory={deleteCategory} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPro || isPremium} isLimitReached={isLimitReached} onShowPaywall={() => setActiveModal('paywall')} isPrivacyMode={isPrivacyMode} />);
       
       case 'settings': 
          if (!isAuthenticated) { navigateTo('login'); return null; }
          return wrap(<SettingsPage onBack={() => navigateTo('manager')} />);
       case 'pricing': return wrap(<PricingPage onNavigate={navigateTo} currentPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'} onBack={() => navigateTo(isNative ? 'manager' : 'home')} />);
       case 'chat': return <AiChatPage onNavigate={navigateTo} />;
       case 'home': 
       default: 
         if (isNative && isAuthenticated) {
            setTimeout(() => navigateTo('manager'), 0);
            return null;
         }
         return <PublicHome onNavigate={navigateTo} onStartNow={() => navigateTo(isAuthenticated ? 'manager' : 'register')} isAuthenticated={isAuthenticated} userEmail={user?.email} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
       
       {/* HEADER FIXO */}
       <header className="fixed top-0 left-0 w-full z-[50] bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-4 lg:px-8 shadow-2xl transition-all">
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => navigateTo('home')}>
              <img src="/icon.png" alt="Logo" className="w-9 h-9 rounded-lg shadow-lg" />
              <div className="flex flex-col leading-tight">
                <h1 className="text-sm sm:text-base md:text-xl font-black text-sky-400 tracking-tight">Finanças Pro Invest</h1>
                {currentTool === 'manager' && <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Gerenciador Financeiro</span>}
              </div>
          </div>

          {/* SAUDAÇÃO CENTRAL (Desktop) */}
          {isAuthenticated && (
            <div className="hidden lg:flex flex-1 justify-center px-4 items-center gap-4">
               <p className="text-slate-400 text-sm">
                 Olá, <span className="text-emerald-400 font-bold">{userMeta?.nickname || user?.displayName?.split(' ')[0] || 'Investidor'}!</span>
               </p>
               {/* ✅ Botão de Privacidade no Desktop */}
               <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="text-slate-500 hover:text-white transition-colors" title="Ocultar valores">
                  {isPrivacyMode ? <EyeOff size={18}/> : <Eye size={18}/>}
               </button>
            </div>
          )}

          <div className="flex items-center gap-4">
              
              {/* Botão de Privacidade no Mobile */}
              {isAuthenticated && (
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="lg:hidden text-slate-400 p-2">
                    {isPrivacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              )}

              {/* Botão App Android */}
              {!isNative && (
                <button onClick={() => window.open('https://play.google.com/store/apps', '_blank')} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/40 rounded-full text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-90">
                  <Smartphone size={14} />
                  <span className="text-[10px] font-black uppercase">App Android</span>
                </button>
              )}

              {/* Botão Acesso Site (Nativo) */}
              {isNative && (
                <button onClick={() => handleOpenWebsite()} className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/40 rounded-full text-sky-400 transition-all active:scale-90">
                  <span className="text-[10px] font-black uppercase">Acesse o site</span>
                  <ExternalLink size={14} />
                </button>
              )}

              {/* MENU DESKTOP */}
              <div className="hidden md:flex items-center gap-4 font-bold text-sm shrink-0">
                  <button onClick={() => navigateTo('pricing')} className="text-slate-400 hover:text-white transition-colors">Planos</button>
                  {isAuthenticated ? (
                    <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-700">
                        <button onClick={() => navigateTo('chat')} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${currentTool === 'chat' ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-sky-400'}`}>
                            <Sparkles size={16}/> Consultor IA
                        </button>
                        <button onClick={() => navigateTo('settings')} className={`p-2 rounded-full transition-colors ${currentTool === 'settings' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Configurações">
                            <Settings size={20} />
                        </button>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 ml-1"><LogOut size={20} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigateTo('login')} className="text-slate-400 hover:text-white">Entrar</button>
                        <button onClick={() => navigateTo('register')} className="bg-sky-600 text-white px-5 py-2 rounded-full hover:bg-sky-500 transition-all">Criar Conta</button>
                    </div>
                  )}
              </div>

              {/* MENU HAMBURGUER (Mobile) */}
              <div className="md:hidden">
                 <button onClick={() => setMobileMenuOpen(true)} className="text-slate-300 p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
              </div>
          </div>
       </header>

       {/* ✅ SMART BANNER (Aparece só na Web Mobile) */}
       {isMobileWeb && (
         <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-emerald-500/30 p-3 z-[100] flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
                <img src="/icon.png" className="w-10 h-10 rounded-lg shadow-lg" alt="App Icon" />
                <div>
                    <p className="text-white font-bold text-xs">Finanças Pro Invest</p>
                    <p className="text-emerald-400 text-[10px]">Experiência completa no App</p>
                </div>
            </div>
            <button onClick={() => window.open('https://play.google.com/store/apps', '_blank')} className="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95">
                Baixar
            </button>
         </div>
       )}

       {/* MENU MOBILE EXPANDIDO */}
       {mobileMenuOpen && (
           <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md md:hidden" onClick={() => setMobileMenuOpen(false)}>
               <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a] rounded-t-[3rem] border-t border-slate-800 p-10 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white">Menu</h2>
                        <button onClick={() => setMobileMenuOpen(false)} className="p-2.5 bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
                    </div>
                    {isAuthenticated ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-5 bg-slate-900/50 p-5 rounded-3xl border border-slate-800 shadow-inner">
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-2xl">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-base font-bold text-white truncate w-48">{user?.email}</span>
                                    <span className="text-[11px] text-emerald-400 font-black uppercase tracking-[0.2em] mt-1">{isPremium ? 'PREMIUM 👑' : isPro ? 'PRO ⭐' : 'PLANO FREE'}</span>
                                </div>
                            </div>
                            <nav className="flex flex-col gap-3">
                                <button onClick={() => navigateTo('chat')} className="w-full text-left py-4 px-6 bg-slate-800/50 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 border border-slate-800/50 text-sky-400">
                                    <Sparkles size={18} /> Consultor IA Nexus
                                </button>
                                <button onClick={() => navigateTo('settings')} className="w-full text-left py-4 px-6 bg-slate-800/50 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 border border-slate-800/50">
                                    <Settings size={18} className="text-slate-400" /> Configurações
                                </button>
                                <button onClick={handleLogout} className="w-full text-center py-4 px-6 text-red-500 font-black uppercase text-xs tracking-[0.2em] mt-2">Sair da Conta</button>
                            </nav>
                        </div>
                    ) : (
                        <button onClick={() => navigateTo('login')} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-xs tracking-widest shadow-xl">Entrar</button>
                    )}
               </div>
           </div>
       )}

       <main className="flex-grow">{renderContent()}</main>

       {isNative && isAuthenticated && !isAppLocked && (
            <MobileBottomNav currentTool={currentTool} onNavigate={navigateTo} onOpenMore={() => setMobileMenuOpen(true)} onAdd={() => setActiveModal('transaction')} />
       )}
       
       <ContentModal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title="Novo Lançamento">
          <TransactionForm onSave={async (t: any) => { await saveLancamento(t); setActiveModal(null); }} onCancel={() => setActiveModal(null)} expenseCategories={categories.filter(c => c.type === 'expense').map(c => c.name)} incomeCategories={categories.filter(c => c.type === 'income').map(c => c.name)} onUpdateExpenseCategories={()=>{}} onUpdateIncomeCategories={()=>{}} />
       </ContentModal>
       <PaywallModal open={activeModal === 'paywall'} onClose={() => setActiveModal(null)} onUpgrade={() => handleOpenWebsite('/pricing')} />
       <ToastContainer toasts={toasts} removeToast={() => {}} />
    </div>
  );
};

export default App;