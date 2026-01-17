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

const AppWelcomeScreen: React.FC<{ onLogin: () => void, onRegister: () => void }> = ({ onLogin, onRegister }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-6 text-center animate-in fade-in">
    <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center gap-3 mb-1">
            <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-sky-500/20" />
            <h1 className="text-2xl font-black text-sky-400 tracking-tight">Finanças Pro Invest</h1>
        </div>
        <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Gerenciador Financeiro</p>
    </div>
    
    <div className="w-full space-y-4 max-w-sm">
      <button onClick={onLogin} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform">Entrar</button>
      <button onClick={onRegister} className="w-full py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform">Criar conta</button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { lancamentos, saveLancamento, deleteLancamento, userMeta, usagePercentage, isLimitReached } = useFirebase(user?.uid || 'guest');
  const { isPro, isPremium } = useSubscriptionAccess();
  
  const isNative = Capacitor.isNativePlatform();
  const [currentTool, setCurrentTool] = useState<string>('manager');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);

  const [expenseCategories, setExpenseCategories] = useState(['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde']);
  const [incomeCategories, setIncomeCategories] = useState(['Salário', 'Investimentos', 'Freelance']);

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

  const handleOpenSite = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br/pricing' });
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

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-sky-500 font-bold">Carregando...</div>;

  if (!isAuthenticated) {
     if (currentTool === 'register') return <AuthRegister onSuccess={() => setCurrentTool('manager')} onSwitchToLogin={() => setCurrentTool('login')} />;
     if (currentTool === 'login') return <AuthLogin onSuccess={() => setCurrentTool('manager')} onSwitchToRegister={() => setCurrentTool('register')} />;
     return <AppWelcomeScreen onLogin={() => setCurrentTool('login')} onRegister={() => setCurrentTool('register')} />;
  }

  const renderContent = () => {
    switch(currentTool) {
       case 'manager': return <Dashboard transactions={lancamentos} onDeleteTransaction={deleteLancamento} onOpenForm={() => setActiveModal('transaction')} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPro} isLimitReached={isLimitReached} onShowPaywall={() => setActiveModal('paywall')} onOpenSite={handleOpenSite} isPrivacyMode={isPrivacyMode} />;
       case 'settings': return <SettingsPage onBack={() => setCurrentTool('manager')} />;
       case 'perfil': return <ProfilePage onNavigateHome={() => setCurrentTool('manager')} />;
       case 'pricing': return <PricingPage onNavigate={setCurrentTool} currentPlan={isPremium ? 'premium' : isPro ? 'pro' : 'free'} onBack={() => setCurrentTool('manager')} onCheckout={handleOpenSite} />;
       case 'goals': return <GoalsPage onBack={() => setCurrentTool('manager')} goals={goals} onAddGoal={(g: any) => setGoals([...goals, { ...g, id: Math.random().toString() }])} onDeleteGoal={(id: string) => setGoals(goals.filter(g => g.id !== id))} onUpdateGoal={(id: string, amount: number) => setGoals(goals.map(g => g.id === id ? { ...g, currentAmount: amount } : g))} />;
       case 'ai_chat': return <div className="pt-20"><AiAdvisor transactions={lancamentos} currentCalcResult={null} goals={goals} currentTool="manager" /></div>;
       default: return <Dashboard transactions={lancamentos} onDeleteTransaction={deleteLancamento} onOpenForm={() => setActiveModal('transaction')} userMeta={userMeta} usagePercentage={usagePercentage} isPremium={isPro} isLimitReached={isLimitReached} onShowPaywall={() => setActiveModal('paywall')} onOpenSite={handleOpenSite} isPrivacyMode={isPrivacyMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
       {/* HEADER REVERTIDO AO PADRÃO QUE VOCÊ GOSTOU */}
       {currentTool === 'manager' && (
         <header className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur border-b border-slate-800 px-4 h-28 flex items-center justify-center shadow-2xl relative">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-3 mb-1">
                <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-sky-500/20" />
                <h1 className="text-xl font-black text-sky-400 tracking-tight">Finanças Pro Invest</h1>
              </div>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Gerenciador Financeiro</p>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="bg-slate-800 p-3 rounded-xl active:scale-95 transition-transform text-lg text-sky-400">
                    {isPrivacyMode ? '👁️' : '🙈'}
                </button>
            </div>
         </header>
       )}

       <main className="flex-grow container mx-auto px-4 py-6 pb-32">
          {renderContent()}
       </main>

       <MobileBottomNav currentTool={currentTool} onNavigate={setCurrentTool} onOpenMore={() => setActiveModal('menu_mobile')} onAdd={() => setActiveModal('transaction')} />
       <ToastContainer toasts={toasts} removeToast={removeToast} />
       
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

       <PaywallModal open={activeModal === 'paywall'} onClose={() => setActiveModal(null)} onUpgrade={handleOpenSite} />
       <MobileMenu isOpen={activeModal === 'menu_mobile'} onClose={() => setActiveModal(null)} onNavigate={(t) => { setActiveModal(null); setCurrentTool(t); }} onUpgrade={handleOpenSite} isPro={isPro} />
    </div>
  );
}
export default App;