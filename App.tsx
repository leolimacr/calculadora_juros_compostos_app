
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
import InstallPrompt from './components/InstallPrompt';
import MobileBottomNav from './components/MobileBottomNav';
import LockedManager from './components/Auth/LockedManager'; 
import AuthRegister from './components/Auth/AuthRegister';
import AuthLogin from './components/Auth/AuthLogin';
import ChangePasswordForm from './components/Auth/ChangePasswordForm';
import UserPanel from './components/UserPanel';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import Onboarding from './components/Onboarding';
import { TermsPage, PrivacyPage } from './components/LegalPages';
import { PublicHome, DemoPage, GuidesPage, FaqPage, AboutPage } from './components/PublicPages';
import ArticlesPage from './components/ArticlesPage';

import { useAuth } from './contexts/AuthContext';
import { CalculationInput, CalculationResult, Transaction, Goal, ToastMessage, ToastType } from './types';
import { calculateCompoundInterest } from './utils/calculations';
import { logEvent, ANALYTICS_EVENTS } from './utils/analytics';

// Lazy Loading Components
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

// Definição de Rotas/Views
type ToolView = 
  | 'home' | 'artigos' | 'guias' | 'faq' | 'sobre' | 'demo' | 'login' | 'register' | 'termos-de-uso' | 'politica-privacidade' // Públicas
  | 'panel' | 'settings' | 'perfil' // Privadas (Gerais)
  | 'compound' | 'manager' | 'rent' | 'debt' | 'fire' | 'inflation' | 'dividend' | 'roi' | 'game' | 'education'; // Privadas (Ferramentas)

// Ferramentas que exigem login
const PRIVATE_TOOLS: ToolView[] = [
  'panel', 'settings', 'perfil', 'compound', 'manager', 'rent', 'debt', 'fire', 'inflation', 'dividend', 'roi', 'game'
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
  const { isAuthenticated, hasLocalUser, user, logout, isLoading: isAuthLoading } = useAuth();
  
  const [currentTool, setCurrentTool] = useState<ToolView>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null); 
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  
  // Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Top Right Menu
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); // Bottom Drawer
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finpro_transactions');
    if (saved) return JSON.parse(saved);
    const hasLocalAccount = localStorage.getItem('finpro_auth_user');
    if (hasLocalAccount) return [];
    return [
      { id: '1', type: 'income', date: new Date().toISOString().split('T')[0], description: 'Salário Inicial (Exemplo)', category: '💰 Salário', amount: 5000 },
      { id: '2', type: 'expense', date: new Date().toISOString().split('T')[0], description: 'Exemplo de Despesa', category: '🛒 Supermercado', amount: 450.50 },
    ];
  });

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

  // Effects & Handlers
  useEffect(() => {
    if (isAuthLoading) return;
    
    // Check Onboarding Logic
    if (isAuthenticated) {
        const onboardingDone = localStorage.getItem('finpro_onboarding_completed');
        if (!onboardingDone) {
            setShowOnboarding(true);
        } else {
            // Check Home Preference logic if landing on login/home
            if (['home', 'login', 'register'].includes(currentTool)) {
                const pref = localStorage.getItem('preferredHomeScreen');
                if (pref && PRIVATE_TOOLS.includes(pref as ToolView)) {
                    setCurrentTool(pref as ToolView);
                } else {
                    setCurrentTool('panel');
                }
            }
        }
    }
  }, [isAuthenticated, isAuthLoading]); // Run once on auth change

  useEffect(() => { localStorage.setItem('finpro_transactions', JSON.stringify(transactions)); }, [transactions]);
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

  const handleSaveTransaction = (newT: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...newT, id: Math.random().toString(36).substr(2, 9) }, ...prev]);
    setActiveModal(null);
    notify("Lançamento salvo com sucesso!", 'success');
    logEvent(ANALYTICS_EVENTS.ADD_TRANSACTION, { category: newT.category, type: newT.type });
    if (!localStorage.getItem('finpro_has_used_manager')) localStorage.setItem('finpro_has_used_manager', 'true');
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Confirmar exclusão permanente?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      notify("Lançamento excluído.", 'info');
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
    setCurrentTool(tool);
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setCurrentTool('manager'); // Direct to manager after onboarding
  };

  // --- RENDER CONTENT GUARD ---
  const renderContent = () => {
    // 1. Protection Check for Private Tools
    if (PRIVATE_TOOLS.includes(currentTool) && !isAuthenticated) {
      return (
        <LockedManager onAuthSuccess={() => {
           // Stay on the requested tool after login logic in useEffect
        }} />
      );
    }

    // 2. Route Switch
    switch(currentTool) {
      // Public Views
      case 'home': return <PublicHome onNavigate={navigateTo} onStartNow={handleStartNow} />;
      case 'register': 
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
             <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md">
                <AuthRegister onSuccess={() => setCurrentTool('panel')} onSwitchToLogin={() => setCurrentTool('login')} />
             </div>
          </div>
        );
      case 'login': 
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
             <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md">
                <AuthLogin onSuccess={() => setCurrentTool('panel')} onSwitchToRegister={() => setCurrentTool('register')} />
             </div>
          </div>
        );
      case 'artigos': return <ArticlesPage onReadArticle={() => {}} />;
      case 'demo': return <DemoPage onNavigate={navigateTo} />;
      case 'guias': return <GuidesPage onNavigate={navigateTo} />;
      case 'faq': return <FaqPage />;
      case 'sobre': return <AboutPage onNavigate={navigateTo} />;
      case 'termos-de-uso': return <TermsPage />;
      case 'politica-privacidade': return <PrivacyPage />;
      
      // Private User Views
      case 'panel': return <UserPanel onNavigate={navigateTo} />;
      case 'settings': return <SettingsPage onOpenChangePassword={() => setActiveModal('change_password')} />;
      case 'perfil': return <ProfilePage onOpenChangePassword={() => setActiveModal('change_password')} navigateToHome={() => navigateTo('panel')} />;

      // Private Tools
      case 'compound': 
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('panel') }, { label: 'Juros Compostos' }]} />
            <CalculatorForm onCalculate={handleCalculate} />
            {result ? <ResultsDisplay result={result} isPrivacyMode={isPrivacyMode} /> : <div className="text-center text-slate-600 py-12 bg-slate-800/50 rounded-2xl border border-slate-800">Preencha os dados acima para simular.</div>}
          </div>
        );
      case 'manager':
        return (
          <Dashboard 
            transactions={transactions} 
            onDeleteTransaction={handleDeleteTransaction} 
            onOpenForm={() => setActiveModal('transaction')}
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            isPrivacyMode={isPrivacyMode}
            navigateToHome={() => navigateTo('panel')}
          />
        );
      case 'rent': return <Tools toolType="rent" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'debt': return <DebtTool toolType="debt" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'fire': return <FireTool toolType="fire" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'inflation': return <InflationTool toolType="inflation" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'dividend': return <DividendSimulator isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'roi': return <RoiCalculator isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'game': return <MiniGame isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('panel')} />;
      case 'education': return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('panel') }, { label: 'Academia Financeira' }]} />
            <h2 className="text-3xl font-bold text-white mb-8">Academia Finanças Pro Invest</h2>
            <EducationalContent onOpenPlans={() => {/* Removed plans modal */}} />
        </div>
      );
      default: return <PublicHome onNavigate={navigateTo} onStartNow={handleStartNow} />;
    }
  };

  const toolsList = [
    { id: 'manager', label: 'Gerenciador Financeiro', icon: '💰' },
    { id: 'fire', label: 'Calculadora FIRE', icon: '🔥' },
    { id: 'compound', label: 'Juros Compostos', icon: '📈' },
    { id: 'debt', label: 'Otimizador Dívidas', icon: '🏔️' },
    { id: 'rent', label: 'Aluguel vs Financiamento', icon: '🏠' },
    { id: 'roi', label: 'Calculadora ROI', icon: '📊' },
    { id: 'dividend', label: 'Sim. Dividendos', icon: '💎' },
    { id: 'game', label: 'Simulador Resiliência', icon: '🎮' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <InstallPrompt />
      <BackToTop />
      
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} userName={user?.name || user?.email.split('@')[0]} />}

      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-[#020617]/95 sticky top-0 z-50 backdrop-blur no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer z-50 group" onClick={() => navigateTo(isAuthenticated ? 'panel' : 'home')}>
              {/* Money Bag + Bars Icon (SVG Customizado) */}
              <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/icon-512.png"
                  alt="Finanças Pro Invest"
                  className="w-10 h-10 rounded-xl shadow-md"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">
                Finanças Pro Invest
              </span>
            </div>
            
            {/* Desktop Center Links (Public) */}
            <div className="hidden lg:flex items-center space-x-1">
              <button onClick={() => navigateTo('home')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'home' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>Início</button>
              <button onClick={() => navigateTo('artigos')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'artigos' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>Artigos</button>
              <button onClick={() => navigateTo('guias')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'guias' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>Guias</button>
              <button onClick={() => navigateTo('demo')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'demo' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>Demo</button>
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
               {isAuthenticated && (
                 <>
                    <span className="text-sm font-medium text-slate-300">👋 Bem-vindo, {user?.name || 'Investidor'}!</span>
                    <button 
                        onClick={() => navigateTo('panel')} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 transition-colors text-sm font-bold border border-slate-700"
                    >
                    <span>⚡</span> Meu Painel
                    </button>
                 </>
               )}

               <button 
                  onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                  className={`p-2.5 rounded-full transition-colors ${isPrivacyMode ? 'text-emerald-500 bg-emerald-900/20' : 'text-slate-400 hover:text-white'}`}
                  title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
               >
                   {isPrivacyMode ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                   ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                   )}
               </button>

               {/* Top Right Menu (Hamburger Desktop) */}
               <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
               </button>

               {!isAuthenticated && (
                  <button
                    onClick={() => navigateTo('login')}
                    className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                  >
                    Entrar
                  </button>
               )}
            </div>

            {/* Mobile Top Menu Button (Visible only on mobile) */}
            <div className="lg:hidden flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-300 hover:text-white p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Top Menu Drawer (Right Side) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="bg-[#020617] border-l border-slate-800 w-64 h-full relative z-10 p-6 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-white text-lg">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <div className="space-y-2 flex-grow">
                <button onClick={() => navigateTo(isAuthenticated ? 'panel' : 'home')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                   <span>🏠</span> Home
                </button>
                <button onClick={() => navigateTo('faq')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                   <span>❓</span> FAQ
                </button>
                <button onClick={() => navigateTo('sobre')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                   <span>ℹ️</span> Sobre
                </button>
                
                {isAuthenticated && (
                   <>
                     <div className="h-px bg-slate-800 my-2"></div>
                     <button onClick={() => navigateTo('perfil')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                        <span>👤</span> Perfil
                     </button>
                     <button onClick={() => navigateTo('settings')} className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                        <span>⚙️</span> Configurações
                     </button>
                     <button onClick={handleLogout} className="w-full text-left p-3 rounded-xl hover:bg-red-900/20 text-red-400 hover:text-red-300 flex items-center gap-3 transition-colors mt-auto">
                        <span>🚪</span> Sair
                     </button>
                   </>
                )}
                
                {!isAuthenticated && (
                   <button onClick={() => navigateTo('login')} className="w-full text-left p-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-3 justify-center mt-4">
                      Entrar
                   </button>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Bottom Drawer "Mais" */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-slate-900 w-full rounded-t-3xl p-0 border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                    <button onClick={() => setIsMoreMenuOpen(false)} className="text-sm font-bold text-slate-400 flex items-center gap-1">
                       ⬅ Voltar
                    </button>
                    <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2"></div>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-6 pb-24">
                   {/* Seção Ferramentas */}
                   <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">🔧 Ferramentas</h4>
                      <div className="grid grid-cols-2 gap-3">
                          {toolsList.map(tool => (
                              <button
                                  key={tool.id}
                                  onClick={() => navigateTo(tool.id as ToolView)}
                                  className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500/50 active:scale-95 transition-all group"
                              >
                                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{tool.icon}</span>
                                  <span className="text-[10px] font-bold text-slate-300 text-center">{tool.label}</span>
                              </button>
                          ))}
                      </div>
                   </div>

                   <div className="h-px bg-slate-800"></div>

                   {/* Seção Explorar */}
                   <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">📚 Explorar & Aprender</h4>
                      <div className="space-y-2">
                         <button onClick={() => navigateTo('artigos')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">📄</span> <span className="text-sm font-bold text-slate-300">Artigos & Insights</span>
                         </button>
                         <button onClick={() => navigateTo('guias')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">📋</span> <span className="text-sm font-bold text-slate-300">Guias Práticos</span>
                         </button>
                         <button onClick={() => navigateTo('home')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">📊</span> <span className="text-sm font-bold text-slate-300">Cotações do Mercado</span>
                         </button>
                         <button onClick={() => navigateTo('faq')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">❓</span> <span className="text-sm font-bold text-slate-300">Perguntas Frequentes</span>
                         </button>
                         <button onClick={() => navigateTo('termos-de-uso')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">📜</span> <span className="text-sm font-bold text-slate-300">Termos de Uso</span>
                         </button>
                         <button onClick={() => navigateTo('politica-privacidade')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">🔒</span> <span className="text-sm font-bold text-slate-300">Política de Privacidade</span>
                         </button>
                         <button onClick={() => navigateTo('sobre')} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex items-center gap-3">
                            <span className="text-xl">ℹ️</span> <span className="text-sm font-bold text-slate-300">Sobre Nós</span>
                         </button>
                      </div>
                   </div>
                </div>
            </div>
            {/* Close area */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsMoreMenuOpen(false)}></div>
        </div>
      )}

      <div className="flex-grow flex relative w-full px-4 sm:px-6 lg:px-8 py-8 gap-8 lg:gap-12 max-w-[1920px] mx-auto">
        
        {/* Sidebar (Only shown if Logged In AND viewing a Private Tool AND NOT on Panel) */}
        {isAuthenticated && PRIVATE_TOOLS.includes(currentTool) && currentTool !== 'panel' && (
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-3 sticky top-28 h-fit no-print">
            <button 
                onClick={() => navigateTo('panel')}
                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold mb-4"
            >
                <span>⬅</span> Voltar ao Painel
            </button>
            
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Navegação Rápida</div>
            {toolsList.slice(0, 5).map(tool => (
              <button
                key={tool.id}
                onClick={() => navigateTo(tool.id as ToolView)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all group ${
                  currentTool === tool.id 
                    ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 shadow-md' 
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{tool.icon}</span>
                <span className="text-sm font-medium">{tool.label}</span>
              </button>
            ))}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-grow">
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                {renderContent()}
              </Suspense>
            </ErrorBoundary>
          </div>
          <Footer onNavigate={(tool) => navigateTo(tool as ToolView)} />
        </main>

        {/* AI FAB (Desktop Only) */}
        <button
          onClick={() => setIsAiChatOpen(true)}
          className="hidden lg:flex fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-2xl shadow-emerald-900/50 items-center justify-center text-3xl animate-in slide-in-from-bottom-10 hover:scale-110 transition-transform active:scale-95 border-2 border-white/10 group no-print"
          aria-label="Abrir Consultor IA"
          title="Consultor IA"
        >
          <span className="group-hover:animate-pulse">🤖</span>
        </button>

      </div>
      
      {/* Mobile Bottom Navigation (Only for Mobile) */}
      <MobileBottomNav 
          currentTool={currentTool} 
          onNavigate={(tool) => navigateTo(tool as ToolView)} 
          onOpenMore={() => setIsMoreMenuOpen(true)}
      />

      {/* Modals */}
      <Suspense fallback={null}>
        <ContentModal 
          isOpen={activeModal === 'transaction'} 
          onClose={() => setActiveModal(null)} 
          title="Novo Lançamento"
        >
          <TransactionForm 
            onSave={handleSaveTransaction} 
            onCancel={() => setActiveModal(null)}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            onUpdateExpenseCategories={setExpenseCategories}
            onUpdateIncomeCategories={setIncomeCategories}
          />
        </ContentModal>
      </Suspense>

      <ContentModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        title="Configurações Rápidas"
      >
        <div className="space-y-4 text-center">
            <p className="text-slate-400">Acesse o painel completo de configurações para mais opções.</p>
            <button 
                onClick={() => { setShowSettings(false); navigateTo('settings'); }} 
                className="w-full bg-slate-700 p-3 rounded-xl text-white font-bold"
            >
                Ir para Configurações Completas
            </button>
        </div>
      </ContentModal>

      <ContentModal
        isOpen={activeModal === 'change_password'}
        onClose={() => setActiveModal(null)}
        title="Alterar Senha de Acesso"
      >
        <ChangePasswordForm onClose={() => setActiveModal(null)} />
      </ContentModal>

      <ContentModal 
        isOpen={isAiChatOpen} 
        onClose={() => setIsAiChatOpen(false)} 
        title="Consultor Virtual IA"
      >
         <div className="h-[70vh] md:h-[600px]">
            <AiAdvisor 
              transactions={transactions} 
              currentCalcResult={result} 
              goals={goals}
              currentTool={currentTool}
            />
         </div>
      </ContentModal>
    </div>
  );
};

export default App;
