
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import ContentModal from './components/ContentModal';
import AiAdvisor from './components/AiAdvisor';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { CalculationInput, CalculationResult, Transaction, Goal, ToastMessage, ToastType } from './types';
import { calculateCompoundInterest } from './utils/calculations';

// Lazy Loading Components for Performance
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

type ToolView = 'home' | 'compound' | 'manager' | 'rent' | 'debt' | 'fire' | 'inflation' | 'dividend' | 'roi' | 'game' | 'education';

// Loading Skeleton
const LoadingFallback = () => (
  <div className="w-full h-96 bg-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center border border-slate-700">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-500 text-sm font-medium">Carregando ferramenta...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolView>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false); // Renomeado para ser universal
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Privacy & Settings State
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data for Expense Manager with Persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finpro_transactions');
    return saved ? JSON.parse(saved) : [
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

  // Goals State with Persistence
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('finpro_goals');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist Data
  useEffect(() => {
    localStorage.setItem('finpro_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finpro_cat_expense', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('finpro_cat_income', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('finpro_goals', JSON.stringify(goals));
  }, [goals]);

  // Toast System
  const notify = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Reset Data Logic
  const handleResetData = (target: 'all' | 'transactions' | 'goals') => {
    if (confirm("Tem certeza? Esta ação não pode ser desfeita.")) {
        if (target === 'transactions' || target === 'all') {
            setTransactions([]);
        }
        if (target === 'goals' || target === 'all') {
            setGoals([]);
        }
        if (target === 'all') {
            // Reset categories to default
            setExpenseCategories(['🏠 Moradia', '🛒 Supermercado', '🚗 Transporte', '💊 Saúde', '🎬 Lazer', '🧹 Contas', '💳 Dívidas']);
            setIncomeCategories(['💰 Salário', '💸 Freelance', '📈 Dividendos']);
            localStorage.removeItem('finpro_debts'); // Clear debts from tools
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
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Confirmar exclusão permanente?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      notify("Lançamento excluído.", 'info');
    }
  };

  // Goals Handlers
  const handleAddGoal = (goal: Omit<Goal, 'id'>) => {
    setGoals(prev => [...prev, { ...goal, id: Math.random().toString(36).substr(2, 9) }]);
    notify("Nova meta criada! Foco nela.", 'success');
  };

  const handleUpdateGoal = (id: string, amount: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: amount } : g));
    notify("Progresso atualizado!", 'success');
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    notify("Meta removida.", 'info');
  };

  const navigateTo = (tool: ToolView) => {
    setCurrentTool(tool);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const menuItems = [
    { id: 'compound', label: 'Juros Compostos', icon: '📈' },
    { id: 'manager', label: 'Gerenciador Financeiro', icon: '💰' },
    { id: 'rent', label: 'Aluguel vs Financiar', icon: '🏠' },
    { id: 'debt', label: 'Otimizador de Dívidas', icon: '🏔️' },
    { id: 'fire', label: 'Calculadora FIRE', icon: '🔥' },
    { id: 'inflation', label: 'Poder de Compra', icon: '💸' },
    { id: 'dividend', label: 'Simulador Dividendos', icon: '💎', pro: false }, 
    { id: 'roi', label: 'Calculadora ROI', icon: '📊', pro: false },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-[#020617]/95 sticky top-0 z-50 backdrop-blur no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer z-50" onClick={() => navigateTo('home')}>
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/50">FP</div>
              <span className="font-bold text-2xl tracking-tight text-white hidden sm:block">Finanças<span className="text-emerald-500">Pro</span></span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-6">
              <button onClick={() => navigateTo('education')} className="hover:text-emerald-400 transition-colors text-base font-medium">Academia</button>
              <button onClick={() => navigateTo('game')} className="hover:text-emerald-400 transition-colors text-base font-medium">Mini-Game</button>
              
              {/* Privacy Toggle */}
              <button 
                 onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                 className={`p-2.5 rounded-full transition-colors ${isPrivacyMode ? 'text-emerald-500 bg-emerald-900/20' : 'text-slate-400 hover:text-white'}`}
                 title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
              >
                  {isPrivacyMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                  )}
              </button>

              {/* Settings Toggle */}
              <button 
                 onClick={() => setShowSettings(true)}
                 className="p-2.5 text-slate-400 hover:text-white transition-colors"
                 title="Configurações"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>

              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105">Assinar Pro</button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-3">
              <button 
                 onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                 className={`p-2 rounded-full transition-colors ${isPrivacyMode ? 'text-emerald-500 bg-emerald-900/20' : 'text-slate-400'}`}
              >
                  {isPrivacyMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                  )}
              </button>
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
        <div className="fixed inset-0 z-40 bg-[#020617] pt-24 px-4 pb-8 overflow-y-auto lg:hidden animate-in slide-in-from-top-10 duration-200">
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Ferramentas</div>
            {menuItems.map(tool => (
              <button
                key={tool.id}
                onClick={() => navigateTo(tool.id as ToolView)}
                className={`w-full text-left px-6 py-5 rounded-2xl flex items-center gap-4 transition-all ${currentTool === tool.id ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-slate-900/50 text-slate-400 border border-transparent'}`}
              >
                <span className="text-2xl">{tool.icon}</span>
                <span className="font-semibold text-lg">{tool.label}</span>
                {tool.pro && <span className="ml-auto text-xs bg-slate-950 border border-slate-700 text-emerald-500 px-2 py-0.5 rounded">PRO</span>}
              </button>
            ))}
            
            <button 
               onClick={() => setShowSettings(true)}
               className="w-full text-left px-6 py-5 rounded-2xl flex items-center gap-4 bg-slate-900/50 text-slate-400 border border-transparent"
            >
               <span className="text-2xl">⚙️</span>
               <span className="font-semibold text-lg">Configurações</span>
            </button>

            <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
               <button onClick={() => navigateTo('education')} className="w-full text-left px-6 py-4 rounded-2xl bg-slate-900/50 text-slate-300 font-bold text-lg">📚 Academia Financeira</button>
               <button onClick={() => navigateTo('game')} className="w-full text-left px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-900/50 to-slate-900/50 text-emerald-400 font-bold text-lg">🎮 O Sobrevivente</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow flex relative w-full px-4 py-8 gap-12">
        
        {/* Desktop Sidebar (Largura aumentada para 72 - 18rem) */}
        <aside className="hidden lg:block w-72 flex-shrink-0 space-y-3 sticky top-28 h-fit no-print">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Ferramentas</div>
          {menuItems.map(tool => (
            <button
              key={tool.id}
              onClick={() => navigateTo(tool.id as ToolView)}
              className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 transition-all group ${currentTool === tool.id ? 'bg-slate-800 text-emerald-400 shadow-xl border border-slate-700' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{tool.icon}</span>
              <span className="font-semibold text-base">{tool.label}</span>
              {tool.pro && <span className="ml-auto text-[10px] bg-slate-900 border border-slate-700 text-emerald-500 px-1.5 rounded">PRO</span>}
            </button>
          ))}
          
          <div className="mt-10 pt-10 border-t border-slate-800">
             <button onClick={() => navigateTo('game')} className="w-full bg-gradient-to-r from-emerald-900 to-slate-900 border border-emerald-800 p-6 rounded-2xl text-left group relative overflow-hidden shadow-xl hover:shadow-emerald-900/20 transition-all">
                <h4 className="font-bold text-emerald-400 z-10 relative text-lg">O Sobrevivente</h4>
                <p className="text-sm text-slate-400 z-10 relative mt-2 leading-relaxed">Jogue o simulador e teste suas habilidades.</p>
                <div className="absolute inset-0 bg-emerald-600/10 group-hover:bg-emerald-600/20 transition-colors"></div>
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {currentTool === 'home' && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Hero Section Isolada */}
                  <section className="text-center py-20 px-4 mb-12">
                    <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-8 leading-tight tracking-tight">
                      Domine o Jogo<br/>do Dinheiro
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                      Um hub de ferramentas profissionais para quem cansou de perder para a inflação e quer construir patrimônio real.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                      <button 
                        onClick={() => navigateTo('compound')} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-bold px-10 py-5 rounded-2xl shadow-2xl shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 border border-emerald-500/20"
                      >
                        Começar Simulação
                      </button>
                      <button 
                        onClick={() => navigateTo('manager')} 
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold px-10 py-5 rounded-2xl border border-slate-600 transition-all hover:scale-105 active:scale-95 shadow-xl"
                      >
                        💰 Gestão Financeira
                      </button>
                    </div>
                  </section>
                  
                  {/* Cards Section Secundária */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
                    <div 
                      onClick={() => navigateTo('rent')}
                      className="bg-slate-800 p-10 rounded-[2rem] border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
                        <span className="text-5xl mb-8 block group-hover:scale-110 transition-transform duration-300">🏠</span>
                        <h3 className="font-bold text-white text-2xl mb-4">Alugar ou Financiar?</h3>
                        <p className="text-base text-slate-300 leading-relaxed mb-8 font-normal">
                          Não siga o senso comum. Simule matematicamente o custo de oportunidade entre comprar um imóvel ou viver de aluguel investindo a diferença.
                        </p>
                        <div className="flex items-center text-emerald-400 font-bold text-sm uppercase tracking-wider gap-2 opacity-80 group-hover:opacity-100">
                           <span>Fazer Comparativo</span>
                           <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                    </div>

                    <div 
                      onClick={() => navigateTo('debt')}
                      className="bg-slate-800 p-10 rounded-[2rem] border border-slate-700 hover:border-red-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-colors"></div>
                        <span className="text-5xl mb-8 block group-hover:scale-110 transition-transform duration-300">🏔️</span>
                        <h3 className="font-bold text-white text-2xl mb-4">Otimizador de Dívidas</h3>
                        <p className="text-base text-slate-300 leading-relaxed mb-8 font-normal">
                          Utilize o Método Avalanche para eliminar juros abusivos. Nosso algoritmo organiza a ordem ideal de pagamento para você sair do buraco.
                        </p>
                        <div className="flex items-center text-red-400 font-bold text-sm uppercase tracking-wider gap-2 opacity-80 group-hover:opacity-100">
                           <span>Criar Plano</span>
                           <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                    </div>

                    <div 
                      onClick={() => navigateTo('fire')}
                      className="bg-slate-800 p-10 rounded-[2rem] border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors"></div>
                        <span className="text-5xl mb-8 block group-hover:scale-110 transition-transform duration-300">🔥</span>
                        <h3 className="font-bold text-white text-2xl mb-4">Calculadora FIRE</h3>
                        <p className="text-base text-slate-300 leading-relaxed mb-8 font-normal">
                          Financial Independence, Retire Early. Descubra seu "Número Mágico" de patrimônio para viver de renda passiva pelo resto da vida.
                        </p>
                        <div className="flex items-center text-orange-400 font-bold text-sm uppercase tracking-wider gap-2 opacity-80 group-hover:opacity-100">
                           <span>Calcular Liberdade</span>
                           <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {currentTool === 'compound' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <CalculatorForm onCalculate={handleCalculate} />
                  {result ? <ResultsDisplay result={result} isPrivacyMode={isPrivacyMode} /> : <div className="text-center text-slate-600 py-12 bg-slate-800/50 rounded-2xl border border-slate-800">Preencha os dados acima para simular.</div>}
                </div>
              )}

              {currentTool === 'manager' && (
                <Dashboard 
                  transactions={transactions} 
                  onDeleteTransaction={handleDeleteTransaction} 
                  onOpenForm={() => setActiveModal('transaction')}
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                  isPrivacyMode={isPrivacyMode}
                />
              )}

              {currentTool === 'rent' && <div className="animate-in fade-in duration-500"><Tools isPrivacyMode={isPrivacyMode} /></div>}
              {currentTool === 'debt' && <div className="animate-in fade-in duration-500"><DebtTool isPrivacyMode={isPrivacyMode} /></div>}
              {currentTool === 'fire' && <div className="animate-in fade-in duration-500"><FireTool isPrivacyMode={isPrivacyMode} /></div>}
              {currentTool === 'inflation' && <div className="animate-in fade-in duration-500"><InflationTool isPrivacyMode={isPrivacyMode} /></div>}
              {currentTool === 'dividend' && <div className="animate-in fade-in duration-500"><DividendSimulator isPrivacyMode={isPrivacyMode} /></div>}
              {currentTool === 'roi' && <div className="animate-in fade-in duration-500"><RoiCalculator isPrivacyMode={isPrivacyMode} /></div>}
              {currentTool === 'game' && <div className="animate-in fade-in duration-500"><MiniGame isPrivacyMode={isPrivacyMode} /></div>}

              {currentTool === 'education' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-3xl font-bold text-white mb-8">Academia Finanças Pro</h2>
                    <EducationalContent />
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* AI Sidecar removed from layout. Now accessed via Floating Action Button */}

        {/* AI Floating Action Button (Desktop & Mobile) */}
        <button
          onClick={() => setIsAiChatOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-2xl shadow-emerald-900/50 flex items-center justify-center text-3xl animate-in slide-in-from-bottom-10 hover:scale-110 transition-transform active:scale-95 border-2 border-white/10 group no-print"
          aria-label="Abrir Consultor IA"
        >
          <span className="group-hover:animate-pulse">🤖</span>
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617] animate-bounce"></span>
        </button>

      </div>

      {/* Global Modals */}
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

      {/* Settings Modal */}
      <ContentModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        title="Configurações e Dados"
      >
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Gerenciamento de Dados</h3>
                <p className="text-sm text-slate-400">
                    Seus dados são salvos apenas no navegador deste dispositivo (LocalStorage). Nenhum dado é enviado para servidores externos além da análise da IA.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleResetData('transactions')}
                        className="p-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-red-500/50 transition-colors text-left"
                    >
                        <span className="block font-bold text-slate-200 text-sm mb-1">Apagar Lançamentos</span>
                        <span className="block text-xs text-slate-500">Limpa todo o histórico de receitas e despesas.</span>
                    </button>
                    <button 
                         onClick={() => handleResetData('goals')}
                        className="p-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-red-500/50 transition-colors text-left"
                    >
                        <span className="block font-bold text-slate-200 text-sm mb-1">Apagar Metas</span>
                        <span className="block text-xs text-slate-500">Remove todos os objetivos cadastrados.</span>
                    </button>
                    <button 
                         onClick={() => handleResetData('all')}
                        className="md:col-span-2 p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 transition-colors text-left group"
                    >
                        <span className="block font-bold text-red-400 text-sm mb-1 group-hover:text-red-300">🏭 Factory Reset (Apagar Tudo)</span>
                        <span className="block text-xs text-red-300/70">Reseta o aplicativo para o estado inicial. Apaga transações, metas, categorias personalizadas e dívidas.</span>
                    </button>
                </div>
            </div>
            
            <div className="space-y-4">
                 <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Sobre</h3>
                 <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">FP</div>
                     <div>
                         <h4 className="font-bold text-white">Finanças Pro Invest</h4>
                         <p className="text-xs text-slate-400">Versão 1.3.0 (World Class Build - PWA)</p>
                     </div>
                 </div>
            </div>
        </div>
      </ContentModal>

      {/* AI Chat Modal (Universal) */}
      <ContentModal 
        isOpen={isAiChatOpen} 
        onClose={() => setIsAiChatOpen(false)} 
        title="Consultor Virtual IA"
      >
         {/* Ajustado altura para desktop */}
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
