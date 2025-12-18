
import React, { useState, useCallback, useEffect } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import EducationalContent from './components/EducationalContent';
import ContentModal from './components/ContentModal';
import { CalculationInput, CalculationResult } from './types';
import { calculateCompoundInterest } from './utils/calculations';

type View = 'home' | 'calculator';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<'artigos' | 'sobre' | 'passo-a-passo' | null>(null);

  // Auto-calculate on load if in calculator view or when switching
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
            className="flex items-center space-x-2 group outline-none"
          >
            <div className="bg-emerald-800 text-white p-2 rounded-lg group-hover:bg-emerald-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Finanças Pro<span className="text-emerald-800"> Invest</span>
            </span>
          </button>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <button onClick={() => navigateTo('home')} className={`hover:text-emerald-800 transition-colors ${currentView === 'home' ? 'text-emerald-800' : ''}`}>Início</button>
            <button onClick={() => navigateTo('calculator')} className={`hover:text-emerald-800 transition-colors ${currentView === 'calculator' ? 'text-emerald-800' : ''}`}>Ferramentas</button>
            <button onClick={() => setActiveModal('passo-a-passo')} className="hover:text-emerald-800 transition-colors">Comece a Investir</button>
            <button onClick={() => setActiveModal('artigos')} className="hover:text-emerald-800 transition-colors">Conteúdos</button>
            <button onClick={() => setActiveModal('sobre')} className="hover:text-emerald-800 transition-colors">Sobre</button>
          </nav>

          {/* Mobile Menu Placeholder (Simplified for brevity) */}
          <div className="md:hidden">
            <button onClick={() => navigateTo('calculator')} className="bg-emerald-800 text-white px-3 py-1.5 rounded-md text-xs font-bold">Calculadora</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {currentView === 'home' ? (
          <div className="animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="bg-slate-900 text-white py-20 px-4">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                  Organize suas finanças e <span className="text-emerald-400">invista com clareza</span>.
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                  Ferramentas práticas e conteúdo direto ao ponto para quem quer sair do básico, montar reservas e investir com segurança, sem complicar.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button 
                    onClick={() => navigateTo('calculator')}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20"
                  >
                    Usar a calculadora de juros compostos
                  </button>
                  <button 
                    onClick={() => setActiveModal('passo-a-passo')}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold transition-all"
                  >
                    Começar pelo passo a passo
                  </button>
                </div>
              </div>
            </section>

            {/* Para quem é */}
            <section className="py-20 px-4 max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Para quem é o Finanças Pro Invest</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  Desenvolvemos este portal para ser o guia definitivo na sua jornada financeira, não importa o seu nível atual.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mb-6">
                    <span className="font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Iniciante em finanças</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Para quem está começando do zero, quer entender para onde vai o dinheiro e como parar de viver no limite.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-md ring-1 ring-emerald-800/10">
                  <div className="w-12 h-12 bg-emerald-800 text-white rounded-full flex items-center justify-center mb-6">
                    <span className="font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Em evolução</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Já consegue economizar algo, mas se sente perdido sobre onde colocar o dinheiro para render mais.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mb-6">
                    <span className="font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Já investe</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Para quem quer otimizar o plano, projetar o futuro com ferramentas precisas e diversificar a carteira.</p>
                </div>
              </div>
            </section>

            {/* Ferramentas */}
            <section className="bg-emerald-900 py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-12 text-center md:text-left">Ferramentas que te ajudam a decidir</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col h-full">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Calculadora de Juros Compostos</h3>
                    <p className="text-slate-500 text-sm mb-6 flex-grow">A ferramenta clássica para visualizar o poder do tempo sobre seus aportes mensais e patrimônio.</p>
                    <button 
                      onClick={() => navigateTo('calculator')}
                      className="w-full bg-emerald-800 text-white py-3 rounded-lg font-bold hover:bg-emerald-900 transition-colors"
                    >
                      Abrir calculadora
                    </button>
                  </div>
                  <div className="bg-white/10 p-8 rounded-2xl border border-white/20 flex flex-col opacity-60">
                    <h3 className="text-xl font-bold text-white mb-2">Reserva de Emergência</h3>
                    <p className="text-emerald-100/70 text-sm mb-6 flex-grow">Quanto você precisa ter guardado para dormir tranquilo e enfrentar imprevistos sem dívidas.</p>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-center py-3">Em Breve</span>
                  </div>
                  <div className="bg-white/10 p-8 rounded-2xl border border-white/20 flex flex-col opacity-60">
                    <h3 className="text-xl font-bold text-white mb-2">Independência Financeira</h3>
                    <p className="text-emerald-100/70 text-sm mb-6 flex-grow">Descubra qual o montante necessário para que seus rendimentos paguem seu custo de vida.</p>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-center py-3">Em Breve</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Aprenda antes de investir */}
            <section className="py-20 px-4 max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center md:text-left">Aprenda antes de investir</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    t: "Organização Financeira",
                    d: "Primeiros passos para entender seu orçamento, cortar o desnecessário e sobrar dinheiro.",
                    c: "Ver conteúdo"
                  },
                  {
                    t: "Reserva de Segurança",
                    d: "O guia completo de como montar o colchão financeiro ideal para sua realidade.",
                    c: "Ver conteúdo"
                  },
                  {
                    t: "O Básico dos Ativos",
                    d: "Fundos, Tesouro Direto, Ações e FIIs: Entenda o que cada um faz de forma simples.",
                    c: "Ver conteúdo"
                  }
                ].map((item, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="bg-slate-200 h-40 rounded-t-2xl mb-4 group-hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-800 transition-colors">{item.t}</h3>
                    <p className="text-slate-500 text-sm mb-4">{item.d}</p>
                    <button className="text-emerald-800 font-bold text-sm hover:underline">{item.c} &rarr;</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Como funciona */}
            <section className="bg-slate-100 py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16">Como o Finanças Pro Invest funciona</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                  <div>
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-sm mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold mb-2">1. Organize</h4>
                    <p className="text-slate-500 text-sm">Entenda sua situação atual, listando gastos e dívidas para tomar o controle.</p>
                  </div>
                  <div>
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-sm mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold mb-2">2. Simule</h4>
                    <p className="text-slate-500 text-sm">Use nossas calculadoras para projetar cenários realistas de crescimento.</p>
                  </div>
                  <div>
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-sm mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold mb-2">3. Invista com clareza</h4>
                    <p className="text-slate-500 text-sm">Aplique seu plano com metas definidas de prazo e aportes mensais.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Calculadora de Juros Compostos</h2>
              <p className="text-slate-600">Simule o crescimento do seu patrimônio ao longo do tempo através do reinvestimento dos lucros.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <CalculatorForm onCalculate={handleCalculate} />
                {result && (
                  <div id="results-section">
                    <ResultsDisplay result={result} />
                  </div>
                )}
              </div>
              
              <aside className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-emerald-800 mb-4">O que são Juros Compostos?</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Diferente dos juros simples, aqui os rendimentos de cada mês são somados ao valor principal, servindo de base para o cálculo do mês seguinte. É o famoso efeito "bola de neve".
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Quanto maior o tempo e o aporte mensal, mais exponencial é o crescimento do seu dinheiro.
                  </p>
                </div>
                
                <div className="bg-emerald-800 text-white p-6 rounded-xl shadow-lg">
                  <h3 className="font-bold mb-4">Pronto para começar?</h3>
                  <p className="text-sm text-emerald-100 mb-6">
                    A simulação é apenas o primeiro passo. Aprenda como sair da teoria e começar a investir de verdade.
                  </p>
                  <button 
                    onClick={() => setActiveModal('passo-a-passo')}
                    className="w-full bg-white text-emerald-800 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors"
                  >
                    Ver Passo a Passo
                  </button>
                </div>
              </aside>
            </div>

            <div className="mt-12">
              <EducationalContent />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ContentModal 
        isOpen={activeModal === 'artigos'} 
        onClose={() => setActiveModal(null)}
        title="Artigo: Educação financeira na prática"
      >
        <p className="font-semibold text-slate-800 text-lg">Educação financeira é entender como o dinheiro entra, sai e cresce na sua vida, de forma organizada e previsível.</p>
        <p>Envolve controlar gastos, planejar objetivos, aprender sobre investimentos e usar o tempo a seu favor por meio dos juros compostos. Quem domina esses conceitos simples tende a se endividar menos, aproveitar melhor a renda e ter mais segurança em momentos de crise.</p>
        <p>O primeiro passo é saber exatamente para onde seu dinheiro está indo. Um controle mensal – em planilha, app ou ferramenta online – ajuda a enxergar gastos invisíveis e cortar excessos sem sofrimento. Em vez de apenas “anotar despesas”, a ideia é dar um propósito para cada real: moradia, alimentação, lazer, reserva de emergência, investimentos e sonhos de médio e longo prazo.</p>
        <p>Depois do controle vem o planejamento. Definir metas claras (quitar dívidas, montar reserva de 6 meses, fazer o primeiro investimento, alcançar independência financeira) transforma decisões do dia a dia em escolhas conscientes, não em impulsos. Um bom plano financeiro considera tempo, valor mensal possível e um retorno realista, usando ferramentas como simuladores de juros compostos para projetar o futuro.</p>
        <p>Por fim, investir passa a ser consequência, não ponto de partida. Antes de pensar em produtos como renda fixa, fundos, ações ou criptomoedas, é essencial ter base organizada: dívidas sob controle, reserva de emergência e disciplina de aportes mensais. A partir daí, a educação financeira ajuda a entender risco, prazo e diversificação, evitando decisões movidas apenas por emoção ou promessas fáceis.</p>
        <p>Educar-se financeiramente não é um evento único, e sim um hábito. Pequenos ajustes contínuos – estudar um pouco por semana, revisar metas, usar ferramentas simples de simulação e registro – criam um efeito composto de conhecimento, semelhante aos próprios juros compostos. Com o tempo, a pessoa deixa de “apagar incêndios” e passa a construir patrimônio de forma estruturada e alinhada com seus valores e objetivos de vida.</p>
      </ContentModal>

            <ContentModal 
        isOpen={activeModal === 'sobre'} 
        onClose={() => setActiveModal(null)}
        title="Sobre o Finanças Pro Invest"
      >
        <p className="font-semibold text-slate-800 text-lg">
          O Finanças Pro Invest é um portal independente dedicado à educação financeira e ao desenvolvimento de ferramentas práticas de simulação.
        </p>
        <p>
          Nosso conteúdo é idealizado por especialistas com sólida trajetória no setor bancário, focados em transformar a complexidade do mercado financeiro em passos simples e executáveis. Acreditamos que a falta de informação clara é o maior custo para o investidor brasileiro, e nascemos para eliminar essa barreira.
        </p>
        <p>
          Com base em <strong>Brumado/BA</strong> e alcance em todo o país, entregamos calculadoras, guias e análises para que você saia do básico e projete seu patrimônio com segurança. 
        </p>
        <p className="border-t border-slate-100 pt-4 mt-4 text-emerald-800 font-bold italic">
          Nossa missão é uma só: Dar clareza para o seu dinheiro trabalhar por você.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Este site tem caráter exclusivamente educacional e não constitui recomendação de investimento individual.
        </p>
      </ContentModal>
