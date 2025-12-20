
import React, { useState, useCallback } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import EducationalContent from './components/EducationalContent';
import ContentModal from './components/ContentModal';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { CalculationInput, CalculationResult, Transaction } from './types';
import { calculateCompoundInterest } from './utils/calculations';

type View = 'home' | 'tools-menu' | 'calculator' | 'expense-manager' | 'expense-form';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<'artigos' | 'sobre' | 'passo-a-passo' | null>(null);
  
  // Estado para a Trilha do Investidor
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Estados de Categorias
  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    '🏠 Moradia',
    '🛒 Supermercado',
    '🍕 Lanches',
    '🚗 Transporte',
    '💊 Saúde',
    '🎓 Educação',
    '🎬 Lazer/Entretenimento',
    '👕 Vestuário',
    '📱 Comunicação',
    '🧹 Contas Domésticas',
    '💳 Financeiras',
    '📈 Investimentos/Poupança',
    '🛍️ Compras Variadas',
    '🌐 Diversos'
  ]);

  const [incomeCategories, setIncomeCategories] = useState<string[]>([
    '💰 Salário',
    '📈 Investimentos/Poupança',
    '💸 Freelance',
    '🏷️ Vendas',
    '🌐 Outros'
  ]);

  // Estado do Gerenciador Financeiro
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'income', date: '2023-10-25', description: 'Salário Mensal', category: '💰 Salário', amount: 5000 },
    { id: '2', type: 'expense', date: '2023-10-26', description: 'Supermercado Mensal', category: '🛒 Supermercado', amount: 450.50 },
    { id: '3', type: 'expense', date: '2023-10-27', description: 'Aluguel Casa', category: '🏠 Moradia', amount: 1200 },
  ]);

  const handleCalculate = useCallback((input: CalculationInput) => {
    const calculation = calculateCompoundInterest(input);
    setResult(calculation);
    
    setTimeout(() => {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const handleSaveTransaction = (newT: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newT,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTransactions(prev => [transaction, ...prev]);
    setCurrentView('expense-manager');
  };

  const handleDeleteTransaction = (id: string) => {
    const msg = "Você confirma a exclusão deste item?\n\nAtenção: Esta exclusão é PERMANENTE.";
    if (window.confirm(msg)) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const navigateTo = (view: View) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center space-x-3 group outline-none"
          >
            <div className="bg-emerald-800 text-white p-2 rounded-lg group-hover:bg-emerald-700 transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Finanças Pro<span className="text-emerald-800"> Invest</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.55em] uppercase -mt-0.5 whitespace-nowrap">
                GESTÃO INTELIGENTE
              </span>
            </div>
          </button>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <button onClick={() => navigateTo('home')} className={`hover:text-emerald-800 transition-colors ${currentView === 'home' ? 'text-emerald-800' : ''}`}>Início</button>
            <button onClick={() => navigateTo('tools-menu')} className={`hover:text-emerald-800 transition-colors ${['tools-menu', 'calculator', 'expense-manager', 'expense-form'].includes(currentView) ? 'text-emerald-800' : ''}`}>Ferramentas</button>
            <button onClick={() => setActiveModal('passo-a-passo')} className={`hover:text-emerald-800 transition-colors ${activeModal === 'passo-a-passo' ? 'text-emerald-800' : ''}`}>Comece a Investir</button>
            <button onClick={() => setActiveModal('artigos')} className="hover:text-emerald-800 transition-colors">Conteúdos</button>
            <button onClick={() => setActiveModal('sobre')} className="hover:text-emerald-800 transition-colors">Sobre</button>
          </nav>

          <div className="md:hidden">
            <button onClick={() => navigateTo('tools-menu')} className="bg-emerald-800 text-white px-3 py-1.5 rounded-md text-xs font-bold">Ferramentas</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {currentView === 'home' && (
          <div className="animate-in fade-in duration-500">
            <section className="bg-slate-900 text-white py-20 px-4">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                  Organize suas finanças e <span className="text-emerald-400">invista com clareza</span>.
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                  Ferramentas práticas e conteúdo direto ao ponto para quem quer sair do básico, montar reservas e investir com segurança.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button onClick={() => navigateTo('tools-menu')} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg">
                    Ver Ferramentas
                  </button>
                  <button onClick={() => setActiveModal('passo-a-passo')} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold transition-all">
                    Começar passo a passo
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentView === 'tools-menu' && (
          <div className="max-w-6xl mx-auto px-4 py-16 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Nossas Ferramentas</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Escolha a ferramenta ideal para o seu momento financeiro atual.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Card Calculadora */}
              <button 
                onClick={() => navigateTo('calculator')}
                className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all text-left flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Calculadora de Juros Compostos</h3>
                <p className="text-slate-500 text-sm mb-6 flex-grow">Projete o crescimento do seu patrimônio com aportes mensais e tempo.</p>
                <span className="text-emerald-800 font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Acessar calculadora <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </button>

              {/* Card Gerenciador */}
              <button 
                onClick={() => navigateTo('expense-manager')}
                className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all text-left flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Gerenciador de Despesas e Receitas</h3>
                <p className="text-slate-500 text-sm mb-6 flex-grow">Tenha o controle total do seu fluxo de caixa mensal de forma simples.</p>
                <span className="text-emerald-800 font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Abrir gerenciador <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </button>
            </div>
          </div>
        )}

        {currentView === 'calculator' && (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Calculadora de Juros Compostos</h2>
                <p className="text-slate-600">O poder do tempo trabalhando a seu favor.</p>
              </div>
              <button 
                onClick={() => navigateTo('tools-menu')}
                className="text-emerald-800 font-bold text-sm hover:underline flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Voltar para Ferramentas
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CalculatorForm onCalculate={handleCalculate} />
                {result && <div id="results-section" className="mt-8"><ResultsDisplay result={result} /></div>}
              </div>
              <aside className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-emerald-800 mb-4">O que são Juros Compostos?</h3>
                  <p className="text-sm text-slate-600 leading-relaxed italic">"Juros sobre juros": Onde cada ganho se torna base para o próximo crescimento.</p>
                </div>
              </aside>
            </div>
            <div className="mt-12"><EducationalContent /></div>
          </div>
        )}

        {currentView === 'expense-manager' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <Dashboard 
              transactions={transactions} 
              onDeleteTransaction={handleDeleteTransaction}
              onOpenForm={() => setCurrentView('expense-form')}
            />
          </div>
        )}

        {currentView === 'expense-form' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex justify-end mb-8">
               <button 
                onClick={() => navigateTo('expense-manager')}
                className="bg-emerald-800 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Voltar
              </button>
            </div>
            <TransactionForm 
              onSave={handleSaveTransaction} 
              onCancel={() => setCurrentView('expense-manager')}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onUpdateExpenseCategories={setExpenseCategories}
              onUpdateIncomeCategories={setIncomeCategories}
            />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400 text-xs">© 2025 Finanças Pro Invest - Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
