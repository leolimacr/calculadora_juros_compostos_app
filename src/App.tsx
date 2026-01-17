import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { useAuth } from './contexts/AuthContext';
import { useFirebase } from './hooks/useFirebase';
import { useSubscriptionAccess } from './hooks/useSubscriptionAccess';
import { ToastMessage } from './types';

// Components
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import ContentModal from './components/ContentModal';
import ToastContainer from './components/Toast';
import MobileBottomNav from './components/MobileBottomNav';
import PaywallModal from './components/PaywallModal';
import MobileMenu from './components/MobileMenu';
import AuthLogin from './components/Auth/AuthLogin';
import AuthRegister from './components/Auth/AuthRegister';
import PricingPage from './components/PricingPage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import GoalsPage from './components/GoalsPage';
import AiAdvisor from './components/AiAdvisor';
import { PublicHome } from './components/PublicPages';
import BlogPage from './components/Blog/BlogPage';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import { calculateCompoundInterest } from './utils/calculations';

// Tela de Boas-vindas do APP (Só aparece no celular)
const AppWelcomeScreen: React.FC<{ onLogin: () => void, onRegister: () => void }> = ({ onLogin, onRegister }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-6 text-center animate-in fade-in">
    <div className="flex items-center gap-3 mb-2">
       <img src="/icon.png" alt="Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-sky-500/20" />
       <h1 className="text-2xl font-black text-sky-400 tracking-tight">Finanças Pro Invest</h1>
    </div>
    <p className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-12">Gerenciador Financeiro</p>
    <div className="w-full space-y-4 max-w-sm">
      <button onClick={onLogin} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold text-lg shadow-lg">Entrar</button>
      <button onClick={onRegister} className="w-full py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold text-lg">Criar conta</button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { lancamentos, saveLancamento, deleteLancamento, userMeta, usagePercentage, isLimitReached } = useFirebase(user?.uid || 'guest');
  const { isPro, isPremium } = useSubscriptionAccess();
  const isNative = Capacitor.isNativePlatform();

  // --- CORREÇÃO DA NAVEGAÇÃO (A BÚSSOLA CORRIGIDA) ---
  const [currentTool, setCurrentTool] = useState<string>(() => {
    // 1. Se for APP, sempre começa no Gerenciador
    if (Capacitor.isNativePlatform()) return 'manager';
    
    // 2. Se for SITE, verifica a URL
    const path = window.location.pathname;
    
    // Prioridades de Rota
    if (path.includes('/pricing')) return 'pricing';
    if (path.includes('/simulador')) return 'compound';
    if (path.includes('/blog')) return 'blog';
    if (path.includes('/login')) return 'login';
    
    // 3. O padrão ABSOLUTO do site é a HOME
    return 'home';
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [expenseCategories, setExpenseCategories] = useState(['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde']);
  const [incomeCategories, setIncomeCategories] = useState(['Salário', 'Investimentos', 'Freelance']);

  // Listener para URL no navegador (Voltar/Avançar no Browser)
  useEffect(() => {
    if (!isNative) {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path.includes('pricing')) setCurrentTool('pricing');
            else if (path.includes('simulador')) setCurrentTool('compound');
            else setCurrentTool('home');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isNative]);

  // Listener do botão voltar físico (Android)
  useEffect(() => {
    if (isNative) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack && currentTool === 'manager') {
          if(window.confirm('Deseja sair do Finanças Pro Invest?')) CapacitorApp.exitApp();
        } else if (currentTool !== 'manager') {
          setCurrentTool('manager');
        } else {
          window.history.back();
        }
      });
    }
  }, [isNative, currentTool]);

  const addToast = (msg: string, type: 'success' | 'error') => {
    setToasts(prev => [...prev, { id: Math.random().toString(), message: msg, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Navegação Inteligente
  const navigateTo = (tool: string) => {
    setCurrentTool(tool);
    window.scrollTo(0, 0);
    // Atualiza a URL no navegador sem recarregar a página
    if (!isNative) {
        const path = tool === 'home' ? '/' : `/${tool}`;
        window.history.pushState({}, '', path);
    }
  };

  const handleOpenSite = async () => {
    if (isNative) {
        await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing' });
    } else {
        navigateTo('pricing');
    }
  };

  const handleAddTransaction = async (t: any) => {
    try {
      await saveLancamento(t);
      addToast('Salvo com sucesso!', 'success');
      setActiveModal(null);
    } catch (e: any) {
      if (e.message === 'LIMIT_REACHED') setActiveModal('paywall');
      else addToast('Erro ao salvar.', 'error');
    }
  };

  const handleCalculate = (values: any) => {
    const res = calculateCompoundInterest(values);
    setCalcResult(res);
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-sky-500 font-bold">Carregando...</div>;

  // Lógica de Login: No App bloqueia, no Site libera a Home
  if (isNative && !isAuthenticated) {
     if (currentTool === 'register') return <AuthRegister onSuccess={() => setCurrentTool('manager')} onSwitchToLogin={() => setCurrentTool('login')} />;
     if (currentTool === 'login') return <AuthLogin onSuccess={() => setCurrentTool('manager')} onSwitchToRegister={() => setCurrentTool('register')} />;
     return <AppWelcomeScreen onLogin={() => setCurrentTool('login')} onRegister={() => setCurrentTool('register')} />;
  }

  const renderContent = () => {
    switch(currentTool) {
       // --- APP & SITE LOGADO ---
       case 'manager': return <Dashboard transactions={lancamentos} onDeleteTransaction={deleteLancamento} onOpenForm={() => setActiveModal('transaction')} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPro} isLimitReached={isLimitReached} onShowPaywall={() => setActiveModal('paywall')} onOpenSite={handleOpenSite} isPrivacyMode={isPrivacyMode} />;
       case 'settings': return <SettingsPage onBack={() => navigateTo(isNative ? 'manager' : 'home')} />;
       case 'perfil': return <ProfilePage onNavigateHome={() => navigateTo(isNative ? 'manager' : 'home')} />;
       case 'pricing': return <PricingPage onNavigate={setCurrentTool} currentPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'} onBack={() => navigateTo(isNative ? 'manager' : 'home')} onCheckout={() => window.open('https://buy.stripe.com/test_...', '_blank')} />;
       case 'goals': return <GoalsPage onBack={() => navigateTo('manager')} goals={goals} onAddGoal={(g: any) => setGoals([...goals, { ...g, id: Math.random().toString() }])} onDeleteGoal={(id: string) => setGoals(goals.filter(g => g.id !== id))} onUpdateGoal={(id: string, amount: number) => setGoals(goals.map(g => g.id === id ? { ...g, currentAmount: amount } : g))} />;
       case 'ai_chat': return <div className="pt-20"><AiAdvisor transactions={lancamentos} currentCalcResult={null} goals={goals} currentTool="manager" /></div>;
       
       // --- PÁGINAS DO SITE (WEB) ---
       case 'home': return <PublicHome onNavigate={(t: string) => navigateTo(t)} onStartNow={() => navigateTo('register')} onAssetClick={() => {}} />;
       case 'compound': return <div className="pt-20"><CalculatorForm onCalculate={handleCalculate} />{calcResult && <ResultsDisplay result={calcResult} isPrivacyMode={false} />}</div>;
       case 'blog': return <BlogPage onNavigate={navigateTo} />;

       // Fallback de segurança
       default: return isNative ? <Dashboard transactions={lancamentos} onDeleteTransaction={deleteLancamento} onOpenForm={() => setActiveModal('transaction')} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPro} isLimitReached={isLimitReached} onShowPaywall={() => setActiveModal('paywall')} onOpenSite={handleOpenSite} isPrivacyMode={isPrivacyMode} /> : <PublicHome onNavigate={navigateTo} onStartNow={() => navigateTo('register')} onAssetClick={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
       {/* HEADER */}
       <header className={`sticky top-0 z-40 bg-[#020617]/95 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-center shadow-lg relative ${isNative ? 'h-24' : 'h-16'}`}>
          <div className="flex flex-col items-center justify-center cursor-pointer" onClick={() => !isNative && navigateTo('home')}>
            <div className="flex items-center gap-2 mb-0.5">
              <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-sky-500/20" />
              <h1 className="text-lg font-black text-sky-400 tracking-tight leading-none">Finanças Pro Invest</h1>
            </div>
            {isNative && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Gerenciador Financeiro</p>}
          </div>
          
          {/* Menu Desktop do Site */}
          {!isNative && (
            <div className="absolute right-4 flex gap-4 text-sm font-bold items-center">
               <button onClick={() => navigateTo('compound')} className="text-slate-400 hover:text-white">Simulador</button>
               <button onClick={() => navigateTo('pricing')} className="text-slate-400 hover:text-white">Planos</button>
               {isAuthenticated ? (
                 <button onClick={() => navigateTo('manager')} className="text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg hover:bg-emerald-500/10">Painel</button>
               ) : (
                 <button onClick={() => navigateTo('login')} className="bg-sky-600 px-4 py-1.5 rounded-lg text-white shadow-lg hover:bg-sky-500">Entrar</button>
               )}
            </div>
          )}

          {isNative && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="bg-slate-800 p-3 rounded-xl active:scale-95 transition-transform text-lg text-sky-400">
                    {isPrivacyMode ? '👁️' : '🙈'}
                </button>
            </div>
          )}
       </header>

       <main className="flex-grow container mx-auto px-4 py-6 pb-32">
          {renderContent()}
       </main>

       {isNative && <MobileBottomNav currentTool={currentTool} onNavigate={setCurrentTool} onOpenMore={() => setActiveModal('menu_mobile')} onAdd={() => setActiveModal('transaction')} />}
       <ToastContainer toasts={toasts} removeToast={removeToast} />
       
       <ContentModal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} title="Novo Lançamento">
          <TransactionForm onSave={handleAddTransaction} onCancel={() => setActiveModal(null)} expenseCategories={expenseCategories} incomeCategories={incomeCategories} onUpdateExpenseCategories={setExpenseCategories} onUpdateIncomeCategories={setIncomeCategories} />
       </ContentModal>

       <PaywallModal open={activeModal === 'paywall'} onClose={() => setActiveModal(null)} onUpgrade={handleOpenSite} />
       <MobileMenu isOpen={activeModal === 'menu_mobile'} onClose={() => setActiveModal(null)} onNavigate={(t) => { setActiveModal(null); setCurrentTool(t); }} onUpgrade={handleOpenSite} isPro={isPro} />
    </div>
  );
}
export default App;
// Versão Final 1.0.0