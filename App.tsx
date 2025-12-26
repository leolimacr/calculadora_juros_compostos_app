
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
import UserMenu from './components/UserMenu'; 
import ChangePasswordForm from './components/Auth/ChangePasswordForm';
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
  | 'home' | 'artigos' | 'guias' | 'faq' | 'sobre' | 'demo' // Públicas
  | 'compound' | 'manager' | 'rent' | 'debt' | 'fire' | 'inflation' | 'dividend' | 'roi' | 'game' | 'education'; // Privadas

// Ferramentas que exigem login
const PRIVATE_TOOLS: ToolView[] = [
  'compound', 'manager', 'rent', 'debt', 'fire', 'inflation', 'dividend', 'roi', 'game', 'education'
];

const LoadingFallback = () => (
  <div className="w-full h-96 bg-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center border border-slate-700">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-500 text-sm font-medium">Carregando conteúdo...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const { isAuthenticated, hasLocalUser, logout, isLoading: isAuthLoading } = useAuth();
  
  const [currentTool, setCurrentTool] = useState<ToolView>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
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
    const isMobile = window.innerWidth < 768;
    const shouldRedirect = hasLocalUser || localStorage.getItem('finpro_has_used_manager') === 'true';
    const hasRedirected = sessionStorage.getItem('finpro_redirected');
    
    // Se o usuário tem conta, redireciona para o manager ao abrir (mobile friendly)
    if (isMobile && shouldRedirect && !hasRedirected) {
         logEvent(ANALYTICS_EVENTS.VIEW_MANAGER, { origin: 'mobile_redirect' });
         setCurrentTool('manager');
         sessionStorage.setItem('finpro_redirected', 'true');
    }
  }, [hasLocalUser, isAuthLoading]);

  useEffect(() => { localStorage.setItem('finpro_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('finpro_cat_expense', JSON.stringify(expenseCategories)); }, [expenseCategories]);
  useEffect(() => { localStorage.setItem('finpro_cat_income', JSON.stringify(incomeCategories)); }, [incomeCategories]);
  useEffect(() => { localStorage.setItem('finpro_goals', JSON.stringify(goals)); }, [goals]);

  const notify = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleResetData = (target: 'all' | 'transactions' | 'goals') => {
    if (confirm("Tem certeza? Esta ação não pode ser desfeita.")) {
        if (target === 'transactions' || target === 'all') setTransactions([]);
        if (target === 'goals' || target === 'all') setGoals([]);
        if (target === 'all') {
            setExpenseCategories(['🏠 Moradia', '🛒 Supermercado', '🚗 Transporte', '💊 Saúde', '🎬 Lazer', '🧹 Contas', '💳 Dívidas']);
            setIncomeCategories(['💰 Salário', '💸 Freelance', '📈 Dividendos']);
            localStorage.removeItem('finpro_debts');
            localStorage.removeItem('finpro_has_used_manager');
            logout(); 
            localStorage.removeItem('finpro_auth_user'); 
        }
        notify("Dados resetados com sucesso.", 'success');
        setShowSettings(false);
    }
  };

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const privateMenuItems = [
    { id: 'manager', label: 'Gerenciador', icon: '💰' },
    { id: 'compound', label: 'Juros Compostos', icon: '📈' },
    { id: 'rent', label: 'Aluguel vs Financiar', icon: '🏠' },
    { id: 'debt', label: 'Otimizador Dívidas', icon: '🏔️' },
    { id: 'fire', label: 'Calc. FIRE', icon: '🔥' },
    { id: 'inflation', label: 'Poder de Compra', icon: '💸' },
    { id: 'dividend', label: 'Sim. Dividendos', icon: '💎' }, 
    { id: 'roi', label: 'Calc. ROI', icon: '📊' },
    { id: 'education', label: 'Academia Pro', icon: '🎓' },
    { id: 'game', label: 'Simulador Jogo', icon: '🎮' },
  ];

  // --- RENDER CONTENT GUARD ---
  const renderContent = () => {
    // 1. Protection Check
    if (PRIVATE_TOOLS.includes(currentTool) && !isAuthenticated) {
      return (
        <LockedManager onAuthSuccess={() => {
           // Stay on the requested tool after login
           // The AuthContext update will trigger re-render and pass this check
        }} />
      );
    }

    // 2. Route Switch
    switch(currentTool) {
      case 'home': return <PublicHome onNavigate={navigateTo} />;
      case 'artigos': return <ArticlesPage onReadArticle={() => {}} />;
      case 'demo': return <DemoPage onNavigate={navigateTo} />;
      case 'guias': return <GuidesPage onNavigate={navigateTo} />;
      case 'faq': return <FaqPage />;
      case 'sobre': return <AboutPage onNavigate={navigateTo} />;
      
      // Private Tools
      case 'compound': 
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('manager') }, { label: 'Juros Compostos' }]} />
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
            navigateToHome={() => navigateTo('home')}
          />
        );
      case 'rent': return <Tools toolType="rent" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'debt': return <DebtTool toolType="debt" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'fire': return <FireTool toolType="fire" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'inflation': return <InflationTool toolType="inflation" isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'dividend': return <DividendSimulator isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'roi': return <RoiCalculator isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'game': return <MiniGame isPrivacyMode={isPrivacyMode} navigateToHome={() => navigateTo('manager')} />;
      case 'education': return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('manager') }, { label: 'Academia Financeira' }]} />
            <h2 className="text-3xl font-bold text-white mb-8">Academia Finanças Pro Invest</h2>
            <EducationalContent onOpenPlans={() => {/* Removed plans modal */}} />
        </div>
      );
      default: return <PublicHome onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <InstallPrompt />
      <BackToTop />

      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-[#020617]/95 sticky top-0 z-50 backdrop-blur no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer z-50 group" onClick={() => navigateTo('home')}>
              {/* Money Bag + Bars Icon (SVG Customizado) */}
              <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-10 h-10 drop-shadow-md">
                  {/* Saco de dinheiro verde */}
                  <path d="M32 58C44 58 52 50 52 38C52 28 44 26 40 24L32 10L24 24C20 26 12 28 12 38C12 50 20 58 32 58Z" fill="#10B981" />
                  <path d="M26 24L38 24" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
                  <text x="32" y="48" fontSize="24" textAnchor="middle" fill="#ECFDF5" fontWeight="bold" fontFamily="sans-serif">$</text>
                  
                  {/* Barras Douradas */}
                  <rect x="48" y="36" width="6" height="20" rx="1" fill="#F59E0B" stroke="#020617" strokeWidth="1" />
                  <rect x="56" y="24" width="6" height="32" rx="1" fill="#F59E0B" stroke="#020617" strokeWidth="1" />
                  
                  {/* Seta de Crescimento */}
                  <path d="M48 20 L60 8 M60 8 L52 8 M60 8 L60 16" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
              <button onClick={() => navigateTo('faq')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'faq' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>FAQ</button>
              <button onClick={() => navigateTo('sobre')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentTool === 'sobre' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'}`}>Sobre</button>
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
               {isAuthenticated && (
                 <button 
                    onClick={() => navigateTo('manager')} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 transition-colors text-sm font-bold border border-slate-700"
                 >
                   <span>⚡</span> Painel
                 </button>
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

               <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 text-slate-400 hover:text-white transition-colors"
                  title="Configurações Gerais"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </button>

               {isAuthenticated ? (
                  <div className="pl-3 border-l border-slate-700">
                    <UserMenu onOpenChangePassword={() => setActiveModal('change_password')} />
                  </div>
               ) : (
                  <button
                    onClick={() => navigateTo('manager')}
                    className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                  >
                    Entrar
                  </button>
               )}
            </div>

            {/* Mobile Menu Button */}
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

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#020617] pt-24 px-4 pb-8 overflow-y-auto lg:hidden animate-in slide-in-from-top-10 duration-200 safe-area-bottom">
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Navegação</div>
            {['home', 'artigos', 'guias', 'demo', 'faq', 'sobre'].map(page => (
               <button
                 key={page}
                 onClick={() => navigateTo(page as ToolView)}
                 className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 transition-all ${currentTool === page ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-900/50 text-slate-400'}`}
               >
                 <span className="font-semibold text-lg capitalize">{page}</span>
               </button>
            ))}
            
            {isAuthenticated && (
              <>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-6">Minhas Ferramentas</div>
                {privateMenuItems.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => navigateTo(tool.id as ToolView)}
                    className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 transition-all ${currentTool === tool.id ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900/50 text-slate-400'}`}
                  >
                    <span className="text-xl">{tool.icon}</span>
                    <span className="font-semibold text-lg">{tool.label}</span>
                  </button>
                ))}
              </>
            )}
            
            {!isAuthenticated && (
               <button 
                 onClick={() => { setIsMobileMenuOpen(false); navigateTo('manager'); }}
                 className="w-full text-left px-6 py-5 rounded-2xl flex items-center gap-4 bg-emerald-600 text-white font-bold mt-4"
               >
                 Entrar / Cadastrar
               </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-grow flex relative w-full px-4 py-8 gap-12 max-w-7xl mx-auto">
        
        {/* Sidebar (Only shown if Logged In AND viewing a Private Tool) */}
        {isAuthenticated && PRIVATE_TOOLS.includes(currentTool) && (
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-3 sticky top-28 h-fit no-print">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Minhas Ferramentas</div>
            {privateMenuItems.map(tool => (
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

        {/* AI FAB */}
        <button
          onClick={() => setIsAiChatOpen(true)}
          className="hidden lg:flex fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-2xl shadow-emerald-900/50 items-center justify-center text-3xl animate-in slide-in-from-bottom-10 hover:scale-110 transition-transform active:scale-95 border-2 border-white/10 group no-print"
          aria-label="Abrir Consultor IA"
        >
          <span className="group-hover:animate-pulse">🤖</span>
        </button>

      </div>
      
      {/* Mobile Bottom Navigation (Only for Logged Users inside App) */}
      {isAuthenticated && PRIVATE_TOOLS.includes(currentTool) && (
        <MobileBottomNav 
           currentTool={currentTool} 
           onNavigate={(tool) => navigateTo(tool as ToolView)} 
           onOpenAi={() => setIsAiChatOpen(true)}
        />
      )}

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
        title="Configurações e Dados"
      >
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Gerenciamento de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleResetData('transactions')} className="p-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-red-500/50 transition-colors text-left">
                        <span className="block font-bold text-slate-200 text-sm mb-1">Apagar Lançamentos</span>
                    </button>
                    <button onClick={() => handleResetData('goals')} className="p-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-red-500/50 transition-colors text-left">
                        <span className="block font-bold text-slate-200 text-sm mb-1">Apagar Metas</span>
                    </button>
                    <button onClick={() => handleResetData('all')} className="md:col-span-2 p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 transition-colors text-left group">
                        <span className="block font-bold text-red-400 text-sm mb-1 group-hover:text-red-300">🏭 Factory Reset (Apagar Tudo)</span>
                    </button>
                </div>
            </div>
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
