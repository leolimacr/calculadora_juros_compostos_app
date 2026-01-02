
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useFirebase } from './hooks/useFirebase';
import { useSubscriptionAccess } from './hooks/useSubscriptionAccess';
import { CalculationInput, CalculationResult, Transaction, Goal, MarketQuote, ToolView, ToastMessage } from './types';
import { calculateCompoundInterest } from './utils/calculations';

// Components
import { PublicHome, DemoPage, GuidesPage, FaqPage, AboutPage } from './components/PublicPages';
import { TermsPage, PrivacyPage } from './components/LegalPages'; // Importação corrigida
import UserPanel from './components/UserPanel';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import AssetDetailsPage from './components/AssetDetailsPage';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import ContentModal from './components/ContentModal';
import AiAdvisor from './components/AiAdvisor';
import ToastContainer from './components/Toast';
import Breadcrumb from './components/Breadcrumb';
import EducationalContent from './components/EducationalContent';
import AppInstallButton from './components/AppInstallButton';
import InstallPrompt from './components/InstallPrompt';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import { HeaderInstallAction } from './components/HeaderInstallAction';
import MobileBottomNav from './components/MobileBottomNav';
import PaywallModal from './components/PaywallModal';
import UserMenu from './components/UserMenu';

import AuthLogin from './components/Auth/AuthLogin';
import AuthRegister from './components/Auth/AuthRegister';
import LockedManager from './components/Auth/LockedManager';
import UpgradePage from './components/UpgradePage';
import CheckoutSuccessPage from './components/CheckoutSuccessPage';
import ArticlesPage from './components/ArticlesPage';
import ChangelogPage from './components/ChangelogPage';

// Lazy Loaded Tools
const RentVsFinanceTool = lazy(() => import('./components/Tools').then(module => ({ default: module.RentVsFinanceTool }))); 
const DebtOptimizerTool = lazy(() => import('./components/Tools').then(module => ({ default: module.DebtOptimizerTool })));
const FireCalculatorTool = lazy(() => import('./components/Tools').then(module => ({ default: module.FireCalculatorTool })));
const InflationTool = lazy(() => import('./components/Tools').then(module => ({ default: module.InflationTool })));
const DividendSimulator = lazy(() => import('./components/DividendSimulator'));
const RoiCalculator = lazy(() => import('./components/RoiCalculator'));
const MiniGame = lazy(() => import('./components/MiniGame'));

const PRIVATE_TOOLS = ['manager', 'compound', 'rent', 'debt', 'fire', 'dividend', 'roi', 'game', 'panel', 'settings', 'perfil', 'asset_details'];

const App: React.FC = () => {
  const { user, isAuthenticated, verifyEmail, logout } = useAuth();
  const { lancamentos: transactions, saveLancamento, deleteLancamento, userMeta, usagePercentage, isLimitReached, isPremium } = useFirebase(user?.uid || 'guest_placeholder');
  const { hasSitePremium } = useSubscriptionAccess();

  const [currentTool, setCurrentTool] = useState<ToolView>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MarketQuote | null>(null);
  const [urlSymbol, setUrlSymbol] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  // Persistence for goals (Local Storage for simplicity in this version)
  useEffect(() => {
    const savedGoals = localStorage.getItem('finpro_goals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));
  }, []);

  useEffect(() => {
    localStorage.setItem('finpro_goals', JSON.stringify(goals));
  }, [goals]);

  // Handle URL Params (Routing & Verification)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tool = params.get('tool');
    const symbol = params.get('symbol');
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      setCurrentTool('verify-email');
      verifyEmail(oobCode).then(res => {
        setVerificationStatus(res === 'success' ? 'success' : 'error');
      });
    } else if (mode === 'resetPassword' && oobCode) {
      setCurrentTool('reset-password');
      // In a real app, you would pass the code to the reset password component
    } else {
      if (tool) setCurrentTool(tool as ToolView);
      if (symbol) {
        setUrlSymbol(symbol);
      }
    }
  }, []);

  const navigateTo = (tool: string) => {
    setCurrentTool(tool as ToolView);
    window.history.pushState({}, '', `?tool=${tool}`);
    window.scrollTo(0, 0);
  };

  const handleCalculate = (data: CalculationInput) => {
    const res = calculateCompoundInterest(data);
    setResult(res);
  };

  const handleAddTransaction = async (t: any) => {
    try {
      await saveLancamento(t);
      addToast('Lançamento salvo!', 'success');
      setActiveModal(null);
    } catch (e: any) {
      if (e.message === 'LIMIT_REACHED') {
        setActiveModal('paywall');
      } else {
        addToast('Erro ao salvar.', 'error');
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Excluir lançamento?')) {
      await deleteLancamento(id);
      addToast('Excluído.', 'info');
    }
  };

  const addToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToasts(prev => [...prev, { id: Math.random().toString(), message: msg, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAssetClick = (asset: MarketQuote) => {
    setSelectedAsset(asset);
    navigateTo('asset_details');
  };

  const handleStartNow = () => {
    if (isAuthenticated) navigateTo('panel');
    else navigateTo('register');
  };

  // Goals Handlers
  const handleAddGoal = (g: any) => setGoals([...goals, { ...g, id: Math.random().toString() }]);
  const handleUpdateGoal = (id: string, amount: number) => setGoals(goals.map(g => g.id === id ? { ...g, currentAmount: amount } : g));
  const handleDeleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const [expenseCategories, setExpenseCategories] = useState(['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde']);
  const [incomeCategories, setIncomeCategories] = useState(['Salário', 'Freelance', 'Investimentos', 'Outros']);

  const renderContent = () => {
    if (PRIVATE_TOOLS.includes(currentTool) && !isAuthenticated) {
      return <LockedManager onAuthSuccess={() => navigateTo('panel')} />;
    }

    const navProps = { onNavigate: navigateTo };

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
      
      case 'rent': return <Suspense fallback={<div>Carregando...</div>}><RentVsFinanceTool {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      case 'debt': return <Suspense fallback={<div>Carregando...</div>}><DebtOptimizerTool {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      case 'fire': return <Suspense fallback={<div>Carregando...</div>}><FireCalculatorTool {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      case 'inflation': return <Suspense fallback={<div>Carregando...</div>}><InflationTool {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      case 'dividend': return <Suspense fallback={<div>Carregando...</div>}><DividendSimulator {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      case 'roi': return <Suspense fallback={<div>Carregando...</div>}><RoiCalculator {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      case 'game': return <Suspense fallback={<div>Carregando...</div>}><MiniGame {...navProps} isPrivacyMode={isPrivacyMode} /></Suspense>;
      
      case 'education': return (<div className="space-y-8 animate-in fade-in duration-500"><Breadcrumb items={[{ label: 'Painel', action: () => navigateTo('panel') }, { label: 'Academia Financeira' }]} /><h2 className="text-3xl font-bold text-white mb-8">Academia Finanças Pro Invest</h2><EducationalContent onOpenPlans={() => navigateTo('upgrade')} /></div>);
      
      case 'verify-email': return (<div className="flex items-center justify-center min-h-[70vh]"><div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">{verificationStatus === 'loading' ? 'Verificando...' : (verificationStatus === 'success' ? 'E-mail verificado com sucesso! Pode fazer login.' : 'Link inválido ou expirado.')}</div></div>);
      case 'reset-password': return (<div className="flex items-center justify-center min-h-[70vh]"><div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full"><p className="text-white text-center">Redefinição de Senha<br/><span className="text-slate-400 text-sm">Verifique seu e-mail para o link.</span></p></div></div>);

      default: return <PublicHome onNavigate={navigateTo} onStartNow={handleStartNow} onAssetClick={handleAssetClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-lg border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/50">FP</div>
            <span className="font-bold text-white tracking-tight hidden sm:block">Finanças Pro Invest</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Modo Privacidade">
              {isPrivacyMode ? '👁️' : '🙈'}
            </button>
            
            <HeaderInstallAction />
            
            {isAuthenticated ? (
               <UserMenu 
                  onOpenChangePassword={() => setActiveModal('change_password')}
                  onNavigateSettings={() => navigateTo('settings')}
                  onLogout={() => { logout(); navigateTo('home'); }}
               />
            ) : (
               <button onClick={() => navigateTo('login')} className="text-sm font-bold text-white hover:text-emerald-400 transition-colors">
                 Entrar
               </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {renderContent()}
      </main>

      <Footer onNavigate={navigateTo} />
      
      {isAuthenticated && <MobileBottomNav currentTool={currentTool} onNavigate={navigateTo} onOpenMore={() => setActiveModal('menu_mobile')} />}
      <AppInstallButton />
      <InstallPrompt />
      <BackToTop />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ContentModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} title="Consultor Virtual IA">
         <div className="h-[70vh] md:h-[600px]"><AiAdvisor transactions={transactions} currentCalcResult={result} goals={goals} currentTool={currentTool} /></div>
      </ContentModal>

      {/* Floating Action Button for IA */}
      {isAuthenticated && !isAiChatOpen && (
        <button 
          onClick={() => setIsAiChatOpen(true)}
          className="fixed bottom-24 left-6 lg:bottom-12 lg:left-12 z-30 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-transform hover:scale-110 no-print"
          title="Consultor IA"
        >
          🤖
        </button>
      )}

      {/* Modals */}
      <ContentModal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title="Novo Lançamento">
         <TransactionForm 
            onSave={handleAddTransaction} 
            onCancel={() => setActiveModal(null)} 
            expenseCategories={expenseCategories} 
            incomeCategories={incomeCategories}
            onUpdateExpenseCategories={setExpenseCategories}
            onUpdateIncomeCategories={setIncomeCategories}
         />
      </ContentModal>

      <PaywallModal isOpen={activeModal === 'paywall'} onClose={() => setActiveModal(null)} onNavigate={navigateTo} userMeta={userMeta} />
    </div>
  );
}

export default App;
