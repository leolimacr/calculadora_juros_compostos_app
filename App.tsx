/// <reference types="vite/client" />
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import ContentModal from './components/ContentModal';
import AiAdvisor from './components/AiAdvisor';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Breadcrumb from './components/Breadcrumb';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import MobileBottomNav from './components/MobileBottomNav';
import { HeaderInstallAction } from './components/HeaderInstallAction';
import LockedManager from './components/Auth/LockedManager'; 
import AuthRegister from './components/Auth/AuthRegister';
import AuthLogin from './components/Auth/AuthLogin';
import ChangePasswordForm from './components/Auth/ChangePasswordForm';
import UserPanel from './components/UserPanel';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import Onboarding from './components/Onboarding';
import { MarketTickerBar, MarketStatusBar } from './components/Widgets';
import { TermsPage, PrivacyPage } from './components/LegalPages';
import { PublicHome, DemoPage, GuidesPage, FaqPage, AboutPage } from './components/PublicPages';
import ArticlesPage from './components/ArticlesPage';
import ChangelogPage from './components/ChangelogPage'; 
import AssetDetails from './components/AssetDetails';
import AssetDetailsPage from './components/AssetDetailsPage'; 

import { useAuth } from './contexts/AuthContext';
import { CalculationInput, CalculationResult, Transaction, Goal, ToastMessage, ToastType, MarketQuote } from './types';
import { calculateCompoundInterest } from './utils/calculations';
import { logEvent, ANALYTICS_EVENTS } from './utils/analytics';
import { useFirebase } from './hooks/useFirebase';

// Lazy Loading Heavy Components
const Dashboard = lazy(() => import('./components/Dashboard'));
const TransactionForm = lazy(() => import('./components/TransactionForm'));
const MiniGame = lazy(() => import('./components/MiniGame'));
const DividendSimulator = lazy(() => import('./components/DividendSimulator'));
const RoiCalculator = lazy(() => import('./components/RoiCalculator'));
const EducationalContent = lazy(() => import('./components/EducationalContent'));
const Tools = lazy(() => import('./components/Tools').then(module => ({ default: module.RentVsFinanceTool }))); 
const DebtTool = lazy(() => import('./components/Tools').then(module => ({ default: module.DebtOptimizerTool })));
const FireTool = lazy(() => import('./components/Tools').then(module => ({ default: module.FireCalculatorTool })));
const InflationTool = lazy(() => import('./components/Tools').then(module => ({ default: module.InflationTool })));

// Monetization Lazy Load
const UpgradePage = lazy(() => import('./components/UpgradePage'));
const CheckoutSuccessPage = lazy(() => import('./components/CheckoutSuccessPage'));
const PaywallModal = lazy(() => import('./components/PaywallModal'));
const DevSubscriptionDebug = lazy(() => import('./components/DevSubscriptionDebug'));

type ToolView = 
  | 'home' | 'artigos' | 'guias' | 'faq' | 'sobre' | 'demo' | 'login' | 'register' | 'termos-de-uso' | 'politica-privacidade' | 'upgrade' | 'checkout-success' | 'changelog' | 'verify-email' | 'reset-password'
  | 'panel' | 'settings' | 'perfil' 
  | 'compound' | 'manager' | 'rent' | 'debt' | 'fire' | 'inflation' | 'dividend' | 'roi' | 'game' | 'education'
  | 'asset_details'; 

const PRIVATE_TOOLS: ToolView[] = [
  'panel', 'settings', 'perfil', 'compound', 'manager', 'rent', 'debt', 'fire', 'inflation', 'dividend', 'roi', 'game', 'asset_details'
];

const toolsList = [
  { id: 'manager', label: 'Gerenciador', icon: '💰' },
  { id: 'compound', label: 'Juros Compostos', icon: '📈' },
  { id: 'fire', label: 'Calculadora FIRE', icon: '🔥' },
  { id: 'debt', label: 'Otimizador Dívidas', icon: '🏔️' },
  { id: 'rent', label: 'Aluguel vs Financiamento', icon: '🏠' },
  { id: 'roi', label: 'Calculadora ROI', icon: '📊' },
  { id: 'dividend', label: 'Dividendos', icon: '💎' },
  { id: 'game', label: 'Simulador Crise', icon: '🎮' },
  { id: 'inflation', label: 'Poder de Compra', icon: '💸' },
  { id: 'education', label: 'Academia', icon: '📚' }
];

const LoadingFallback = () => (
  <div className="w-full h-96 bg-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center border border-slate-700">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-500 text-sm font-medium">Carregando...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const { isAuthenticated, hasLocalUser, user, logout, isLoading: isAuthLoading, verifyEmail, completePasswordReset } = useAuth();
  
  const [currentTool, setCurrentTool] = useState<ToolView>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null); 
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketQuote | null>(null);
  const [urlSymbol, setUrlSymbol] = useState<string | null>(null);
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'invalid'>('loading');
  const [resetToken, setResetToken] = useState('');
  const [resetStep, setResetStep] = useState<'input' | 'success'>('input');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); 
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasUser = !!user;
  const rawUserId = (user as any)?.uid || (user as any)?.id || (user as any)?.email || "guest_placeholder";
  const localUserId = rawUserId.replace(/[.#$[\]]/g, '_');

  const authReady = hasUser && localUserId !== "guest_placeholder";
  const firebaseData = useFirebase(localUserId);

  const transactions: Transaction[] = authReady ? firebaseData.lancamentos : [];
  const saveLancamento = authReady ? firebaseData.saveLancamento : async () => {};
  const deleteLancamento = authReady ? firebaseData.deleteLancamento : async () => {};
  const { userMeta, isPremium, usagePercentage } = firebaseData;

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finpro_cat_expense');
    return saved ? JSON.parse(saved) : ['🏠 Moradia', '🛒 Supermercado', '🚗 Transporte', '💊 Saúde', '🎬 Lazer', '🧹 Contas', '💳 Dívidas'];
  });

  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
     const saved = localStorage.getItem('finpro_cat_income');
     return saved ? JSON.parse(saved) : ['💰 Salário', '💸 Freelance', '📈 Dividendos'];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('finpro_goals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const token = params.get('token');
    const tool = params.get('tool');
    const symbol = params.get('symbol');
    const redirect = params.get('redirect');

    if (redirect === 'upgrade') {
        setCurrentTool('upgrade');
    }

    if (action === 'verify' && token) {
        setCurrentTool('verify-email');
        verifyEmail(token).then(status => {
            setVerificationStatus(status);
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (action === 'reset' && token) {
        setCurrentTool('reset-password');
        setResetToken(token);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (tool === 'asset_details' && symbol) {
        setUrlSymbol(symbol);
        setCurrentTool('asset_details');
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    
    if (isAuthenticated) {
        const onboardingDone = localStorage.getItem('finpro_onboarding_completed');
        if (!onboardingDone) {
            setShowOnboarding(true);
        } else {
            if (['home', 'login', 'register', 'verify-email', 'reset-password'].includes(currentTool)) {
                if (currentTool !== 'verify-email' && currentTool !== 'reset-password') {
                    const pref = localStorage.getItem('preferredHomeScreen');
                    if (pref && PRIVATE_TOOLS.includes(pref as ToolView)) {
                        setCurrentTool(pref as ToolView);
                    } else {
                        setCurrentTool('panel');
                    }
                }
            }
        }
    }
  }, [isAuthenticated, isAuthLoading]); 

  useEffect(() => { localStorage.setItem('finpro_cat_expense', JSON.stringify(expenseCategories)); }, [expenseCategories]);
  useEffect(() => { localStorage.setItem('finpro_cat_income', JSON.stringify(incomeCategories)); }, [incomeCategories]);
  useEffect(() => { localStorage.setItem('finpro_goals', JSON.stringify(goals)); }, [goals]);

  const notify = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleCalculate = useCallback((input: CalculationInput) => {
    const calculation = calculateCompoundInterest(input);
    setResult(calculation);
    notify("Cálculo de juros realizado!", 'success');
  }, []);

  const handleSaveTransaction = async (newT: Omit<Transaction, 'id'>) => {
    try {
      await saveLancamento(newT);
      setActiveModal(null);
      notify("Lançamento salvo com sucesso!", 'success');
      logEvent(ANALYTICS_EVENTS.ADD_TRANSACTION, { category: newT.category, type: newT.type });
      if (!localStorage.getItem('finpro_has_used_manager')) localStorage.setItem('finpro_has_used_manager', 'true');
    } catch (error: any) {
      if (error.message === "LIMIT_REACHED") {
         setActiveModal('paywall'); 
      } else {
         const msg = error.message || "Erro ao salvar lançamento.";
         notify(msg, 'error');
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Confirmar exclusão permanente?")) {
      try {
        await deleteLancamento(id);
        notify("Lançamento excluído.", 'info');
      } catch (error) {
        console.error(error);
        notify("Erro ao excluir lançamento.", 'error');
      }
    }
  };

  const handleAddGoal = (goal: Omit<Goal, 'id'>) => {
    setGoals(prev => [...prev, { ...goal, id: Math.random().toString(36).substr(2, 9) }]);
    notify("Nova meta criada! Foco nela.", 'success');
  };

  const handleUpdateGoal = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: amount } : g));
    notify("Progresso atualizado!", 'success');
    logEvent(ANALYTICS_EVENTS.GOAL_PROGRESS_VIEW);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    notify("Meta removida.", 'info');
  };

  const navigateTo = (tool: ToolView, origin: string = 'internal_nav') => {
    if (tool === 'manager') logEvent(ANALYTICS_EVENTS.VIEW_MANAGER, { origin });
    
    if (currentTool === 'asset_details' && tool !== 'asset_details') {
        window.history.pushState({}, '', window.location.pathname);
    }

    setCurrentTool(tool);
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAssetClick = (asset: MarketQuote) => {
    setSelectedAsset(asset);
    setActiveModal('asset_details');
  };

  const handleStartNow = () => {
    if (isAuthenticated) {
      navigateTo('panel');
    } else if (hasLocalUser) {
      navigateTo('login');
    } else {
      navigateTo('register');
    }
  };

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
        logout();
        setCurrentTool('home');
        setIsMobileMenuOpen(false);
        notify("Você foi desconectado.", 'info');
    }
  };

  const handleOnboardingComplete = () => {
      setShowOnboarding(false);
      setCurrentTool('manager'); 
  };

  // --- RENDER CONTENT GUARD ---
  const renderContent = () => {
    if (PRIVATE_TOOLS.includes(currentTool) && !isAuthenticated) {
      return (
        <LockedManager onAuthSuccess={() => {}} />
      );
    }

    switch(currentTool) {
      case 'home': return <PublicHome onNavigate={navigateTo} onStartNow={handleStartNow} onAssetClick={handleAssetClick} />;
      case 'register': return (<div className="flex flex-col items-center justify-center min-h-[70vh]"><div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md"><AuthRegister onSuccess={() => setCurrentTool('panel')} onSwitchToLogin={() => setCurrentTool('login')} /></div></div>);
      case 'login': return (<div className="flex flex-col items-center justify-center min-h-[70vh]"><div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md"><AuthLogin onSuccess={() => setCurrentTool('panel')} onSwitchToRegister={() => setCurrentTool('register')} /></div></div>);
      case 'upgrade': return <UpgradePage onBack={() => navigateTo('panel')} />;
      case 'checkout-success': return <CheckoutSuccessPage onNavigate={navigateTo} />;
      case 'artigos': return <ArticlesPage />;
      case 'changelog': return <ChangelogPage />; 
      case 'demo': return <DemoPage onNavigate={navigateTo} />;
      case 'guias': return <GuidesPage onNavigate={navigateTo} />;
      case 'faq': return <FaqPage />;
      case 'sobre': return <AboutPage onNavigate={navigateTo} />;
      case 'termos-de-uso': return <TermsPage />;
      case 'politica-privacidade': return <PrivacyPage />;
      
      case 'panel': return <UserPanel onNavigate={navigateTo} onAssetClick={handleAssetClick} />; 
      case 'settings': return <SettingsPage onOpenChangePassword={() => setActiveModal('change_password')} />;
      case 'perfil': return <ProfilePage onOpenChangePassword={() => setActiveModal('change_password')} navigateToHome={() => navigateTo('panel')} />;

      case 'asset_details': return (<AssetDetailsPage symbol={selectedAsset?.symbol || urlSymbol || ''} initialAsset={selectedAsset} onBack={() => navigateTo('panel')} />);

      case 'compound': return (<div className="space-y-8 animate-in fade-in duration-500"><Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('panel') }, { label: 'Juros Compostos' }]} /><CalculatorForm onCalculate={handleCalculate} />{result ? <ResultsDisplay result={result} isPrivacyMode={isPrivacyMode} /> : <div className="text-center text-slate-600 py-12 bg-slate-800/50 rounded-2xl border border-slate-800">Preencha os dados acima para simular.</div>}</div>);
      case 'manager': return (<Dashboard transactions={transactions} onDeleteTransaction={handleDeleteTransaction} onOpenForm={() => setActiveModal('transaction')} goals={goals} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPremium} />);
      case 'rent': return <Tools toolType="rent" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'debt': return <DebtTool toolType="debt" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'fire': return <FireTool toolType="fire" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'inflation': return <InflationTool toolType="inflation" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'dividend': return <DividendSimulator isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'roi': return <RoiCalculator isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'game': return <MiniGame isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'education': return (<div className="space-y-8 animate-in fade-in duration-500"><Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('panel') }, { label: 'Academia Financeira' }]} /><h2 className="text-3xl font-bold text-white mb-8">Academia Finanças Pro Invest</h2><EducationalContent onOpenPlans={() => navigateTo('upgrade')} /></div>);
      
      // Verification logic components suppressed for brevity but handled by cases above if logic flows there
      case 'verify-email': return (<div className="flex items-center justify-center min-h-[70vh]"><div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">{verificationStatus === 'loading' ? '...' : (verificationStatus === 'success' ? 'Sucesso! Login...' : 'Link Inválido')}</div></div>);
      case 'reset-password': return (<div className="flex items-center justify-center min-h-[70vh]"><div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full"><p>Redefinir Senha</p></div></div>);

      default: return <PublicHome onNavigate={navigateTo} onStartNow={handleStartNow} onAssetClick={handleAssetClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <BackToTop />
      {import.meta.env.DEV && <Suspense fallback={null}><DevSubscriptionDebug /></Suspense>}
      
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} userName={user?.name || user?.email.split('@')[0]} />}

      {currentTool !== 'asset_details' && (
      <nav className="border-b border-slate-800 bg-[#020617]/95 sticky top-0 z-50 backdrop-blur no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer z-50 group" onClick={() => navigateTo(isAuthenticated ? 'panel' : 'home')}>
              <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <img src="/icon-514.svg" alt="Finanças Pro Invest" className="w-10 h-10 rounded-xl shadow-md" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">Finanças Pro Invest</span>
            </div>
            
            <div className="hidden lg:flex items-center space-x-1">
              <button onClick={() => navigateTo('home')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'home' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>Início</button>
              <button onClick={() => navigateTo('upgrade')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'upgrade' ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-500 hover:text-emerald-400'}`}>Premium ✨</button>
              
              <div className="w-px h-6 bg-slate-800 mx-2"></div>
              <HeaderInstallAction />
              <button onClick={() => setIsAiChatOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><span className="text-lg">🤖</span><span className="hidden xl:inline">IA Advisor</span></button>
            </div>

            <div className="hidden lg:flex items-center gap-3">
               {isAuthenticated && (
                 <>
                    <span className="text-sm font-medium text-slate-300">👋 {user?.name || 'Investidor'}</span>
                    <button onClick={() => navigateTo('panel')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 transition-colors text-sm font-bold border border-slate-700">Painel</button>
                 </>
               )}
               <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className={`p-2.5 rounded-full transition-colors ${isPrivacyMode ? 'text-emerald-500 bg-emerald-900/20' : 'text-slate-400 hover:text-white'}`}>
                   {isPrivacyMode ? '👁️' : '🕶️'}
               </button>
               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               </button>
               {!isAuthenticated && (
                  <button onClick={() => navigateTo('login')} className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95">Entrar</button>
               )}
            </div>
            <div className="lg:hidden flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      )}

      {currentTool !== 'asset_details' && (
      <div className="max-w-[1920px] mx-auto w-full flex flex-col md:flex-row border-b border-slate-800 bg-[#020617] sticky top-16 z-40 no-print shadow-lg">
          <div className="w-full md:w-1/2 border-r border-slate-800/50">
              <MarketTickerBar onAssetClick={handleAssetClick} />
          </div>
          <div className="w-full md:w-1/2">
              <MarketStatusBar />
          </div>
      </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="bg-[#020617] border-l border-slate-800 w-64 h-full relative z-10 p-6 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-white text-lg">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <div className="space-y-2 flex-grow">
                <button onClick={() => navigateTo(isAuthenticated ? 'panel' : 'home')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors"><span>🏠</span> Home</button>
                <button onClick={() => navigateTo('upgrade')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-emerald-400 hover:text-white flex items-center gap-3 transition-colors font-bold"><span>✨</span> Premium</button>
                <button onClick={() => navigateTo('artigos')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors"><span>📚</span> Conteúdos</button>
                
                {isAuthenticated && (
                   <>
                     <div className="h-px bg-slate-800 my-2"></div>
                     <button onClick={() => navigateTo('perfil')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors"><span>👤</span> Perfil</button>
                     <button onClick={() => navigateTo('settings')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors"><span>⚙️</span> Configurações</button>
                     <button onClick={handleLogout} className="w-full text-left p-3 rounded-xl hover:bg-red-900/20 text-red-400 hover:text-red-300 flex items-center gap-3 transition-colors mt-auto"><span>🚪</span> Sair</button>
                   </>
                )}
             </div>
          </div>
        </div>
      )}

      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 w-full rounded-t-3xl p-0 border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                    <button onClick={() => setIsMoreMenuOpen(false)} className="text-sm font-bold text-slate-400 flex items-center gap-1">⬅ Voltar</button>
                    <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2"></div>
                </div>
                <div className="overflow-y-auto p-4 space-y-6 pb-24">
                   <div className="grid grid-cols-2 gap-3">
                      {toolsList.map(tool => (
                          <button key={tool.id} onClick={() => navigateTo(tool.id as ToolView)} className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500/50 active:scale-95 transition-all group">
                              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{tool.icon}</span>
                              <span className="text-[10px] font-bold text-slate-300 text-center">{tool.label}</span>
                          </button>
                      ))}
                   </div>
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setIsMoreMenuOpen(false)}></div>
        </div>
      )}

      <div className="flex-grow flex relative w-full px-4 sm:px-6 lg:px-8 py-8 gap-8 lg:gap-12 max-w-[1920px] mx-auto">
        {isAuthenticated && PRIVATE_TOOLS.includes(currentTool) && currentTool !== 'panel' && currentTool !== 'asset_details' && (
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-3 sticky top-28 h-fit no-print">
            <button onClick={() => navigateTo('panel')} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold mb-4"><span>⬅</span> Voltar ao Painel</button>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Navegação</div>
            {toolsList.slice(0, 5).map(tool => (
              <button key={tool.id} onClick={() => navigateTo(tool.id as ToolView)} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all group ${currentTool === tool.id ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}>
                <span className="text-lg">{tool.icon}</span>
                <span className="text-sm font-medium">{tool.label}</span>
              </button>
            ))}
          </aside>
        )}

        <main className={`flex-1 min-w-0 flex flex-col ${currentTool === 'asset_details' ? 'h-full' : ''}`}>
          <div className="flex-grow">
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                {renderContent()}
              </Suspense>
            </ErrorBoundary>
          </div>
          {currentTool !== 'asset_details' && <Footer onNavigate={(tool) => navigateTo(tool as ToolView)} />}
        </main>
      </div>
      
      {currentTool !== 'asset_details' && <MobileBottomNav currentTool={currentTool} onNavigate={(tool) => navigateTo(tool as ToolView)} onOpenMore={() => setIsMoreMenuOpen(true)} />}

      <Suspense fallback={null}>
        <ContentModal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title="Novo Lançamento">
          <TransactionForm onSave={handleSaveTransaction} onCancel={() => setActiveModal(null)} expenseCategories={expenseCategories} incomeCategories={incomeCategories} onUpdateExpenseCategories={setExpenseCategories} onUpdateIncomeCategories={setIncomeCategories} />
        </ContentModal>
        <PaywallModal isOpen={activeModal === 'paywall'} onClose={() => setActiveModal(null)} onNavigate={navigateTo} userMeta={userMeta} />
      </Suspense>

      {activeModal === 'asset_details' && selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setActiveModal(null)}>
            <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-700" onClick={(e) => e.stopPropagation()}>
                <AssetDetails asset={selectedAsset} onClose={() => setActiveModal(null)} onToggleFullscreen={() => { setActiveModal(null); const newUrl = window.location.pathname + '?tool=asset_details&symbol=' + selectedAsset.symbol; window.history.pushState({}, '', newUrl); setCurrentTool('asset_details'); }} />
            </div>
        </div>
      )}

      <ContentModal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Configurações Rápidas">
        <div className="space-y-4 text-center">
            <p className="text-slate-400">Acesse o painel completo de configurações para mais opções.</p>
            <button onClick={() => { setShowSettings(false); navigateTo('settings'); }} className="w-full bg-slate-700 p-3 rounded-xl text-white font-bold">Ir para Configurações Completas</button>
        </div>
      </ContentModal>
      <ContentModal isOpen={activeModal === 'change_password'} onClose={() => setActiveModal(null)} title="Alterar Senha de Acesso"><ChangePasswordForm onClose={() => setActiveModal(null)} /></ContentModal>
      <ContentModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} title="Consultor Virtual IA"><div className="h-[70vh] md:h-[600px]"><AiAdvisor transactions={transactions} currentCalcResult={result} goals={goals} currentTool={currentTool} /></div></ContentModal>
    </div>
  );
};

export default App;