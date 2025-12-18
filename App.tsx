import React, { useState, useCallback } from 'react';
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

          <div className="md:hidden">
            <button onClick={() => navigateTo('calculator')} className="bg-emerald-800 text-white px-3 py-1.5 rounded-md text-xs font-bold">Calculadora</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {currentView === 'home' ? (
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
                  <button onClick={() => navigateTo('calculator')} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg">
                    Usar a calculadora
                  </button>
                  <button onClick={() => setActiveModal('passo-a-passo')} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold transition-all">
                    Começar passo a passo
                  </button>
                </div>
              </div>
            </section>

            <section className="py-20 px-4 max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Para quem é o Finanças Pro Invest</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-3">1. Iniciante</h3>
                  <p className="text-slate-500 text-sm">Para quem está começando do zero e quer organizar o orçamento.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-md ring-1 ring-emerald-800/10">
                  <h3 className="text-xl font-bold mb-3">2. Em evolução</h3>
                  <p className="text-slate-500 text-sm">Já economiza e quer fazer o dinheiro render mais.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-3">3. Investidor</h3>
                  <p className="text-slate-500 text-sm">Quer otimizar a carteira e usar ferramentas precisas.</p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Calculadora de Juros Compostos</h2>
              <p className="text-slate-600">O poder do tempo trabalhando a seu favor.</p>
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
      </main>

      {/* Modals */}
      <ContentModal 
        isOpen={activeModal === 'artigos'} 
        onClose={() => setActiveModal(null)} 
        title="Conteúdos: Hub de Conhecimento Finanças Pro"
      >
        <div className="space-y-6">
          <section className="bg-slate-50 p-4 rounded-xl border-l-4 border-emerald-800 shadow-sm text-left">
            <h4 className="text-emerald-800 font-bold text-lg mb-2 flex items-center">
              <span className="mr-2">🧠</span> Mente Próspera
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Educação financeira começa na mentalidade. Aprenda a enxergar o dinheiro como uma ferramenta de liberdade, não apenas como papel para pagar boletos. Antes de escolher um produto, entenda qual o seu objetivo real com aquele dinheiro.
            </p>
          </section>

          <section className="bg-slate-50 p-4 rounded-xl border-l-4 border-emerald-800 shadow-sm text-left">
            <h4 className="text-emerald-800 font-bold text-lg mb-2 flex items-center">
              <span className="mr-2">📈</span> Renda Fixa: A Base Segura
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Saiba como proteger seu patrimônio com <strong>Tesouro Selic, CDBs e LCIs</strong>. Entenda que a renda fixa não é "parada", ela é o motor que garante que você não perca poder de compra para a inflação enquanto dorme tranquilo.
            </p>
          </section>

          <section className="bg-slate-50 p-4 rounded-xl border-l-4 border-emerald-800 shadow-sm text-left">
            <h4 className="text-emerald-800 font-bold text-lg mb-2 flex items-center">
              <span className="mr-2">🏢</span> Renda Variável (Ações e FIIs)
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Descubra como se tornar sócio das maiores empresas do país e receber aluguéis mensais através de Fundos Imobiliários. Aprenda que o risco não é o inimigo, e sim a falta de conhecimento e diversificação.
            </p>
          </section>

          <section className="bg-slate-50 p-4 rounded-xl border-l-4 border-emerald-800 shadow-sm text-left">
            <h4 className="text-emerald-800 font-bold text-lg mb-2 flex items-center">
              <span className="mr-2">🌅</span> Planejando a Aposentadoria
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Não dependa apenas do governo. Use o poder dos juros compostos para criar uma previdência própria. Projetar o futuro hoje é o que garante a sua liberdade geográfica e financeira amanhã.
            </p>
          </section>

          <section className="text-left">
            <h4 className="text-emerald-800 font-bold text-lg mb-3 flex items-center">
              <span className="mr-2">📖</span> Dicionário Pro (Glossário)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Liquidez</span>
                <span className="text-[11px] text-slate-500">A velocidade com que você transforma o investimento em dinheiro na mão.</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">CDI</span>
                <span className="text-[11px] text-slate-500">O termômetro dos juros. É quanto o mercado paga para quem empresta dinheiro.</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Dividendos</span>
                <span className="text-[11px] text-slate-500">Parte do lucro que as empresas depositam direto na sua conta por ser sócio.</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">IPCA</span>
                <span className="text-[11px] text-slate-500">A inflação oficial. Seu investimento deve sempre render acima dessa taxa.</span>
              </div>
            </div>
          </section>

          <div className="bg-emerald-900 text-white p-4 rounded-xl text-center shadow-lg">
            <p className="text-sm font-bold">💡 Dica Extra:</p>
            <p className="text-xs text-emerald-100 mt-1 italic">"Investir em conhecimento rende sempre os melhores juros."</p>
          </div>
        </div>
      </ContentModal>

      <ContentModal isOpen={activeModal === 'sobre'} onClose={() => setActiveModal(null)} title="Sobre o Projeto">
        <p className="font-semibold text-slate-800">Portal independente dedicado à educação financeira.</p>
        <p className="mt-4">Idealizado por especialistas com sólida trajetória no setor bancário. Nossa base fica em <strong>Brumado/BA</strong>.</p>
        <p className="mt-4 text-emerald-800 font-bold italic">Nossa missão: Dar clareza para o seu dinheiro trabalhar por você.</p>
      </ContentModal>

      <ContentModal isOpen={activeModal === 'passo-a-passo'} onClose={() => setActiveModal(null)} title="Trilha do Investidor">
        <div className="space-y-4">
          <div className="flex gap-4 p-3 bg-white border rounded-lg">
            <div className="bg-emerald-800 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold">1</div>
            <p className="text-sm"><strong>Faxina Financeira:</strong> Organize dívidas e entenda seus gastos.</p>
          </div>
          <div className="flex gap-4 p-3 bg-white border rounded-lg">
            <div className="bg-emerald-800 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold">2</div>
            <p className="text-sm"><strong>Reserva:</strong> Monte seu colchão de 6 a 12 meses de segurança.</p>
          </div>
        </div>
      </ContentModal>

      <footer className="bg-white border-t border-slate-200 py-12 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} Finanças Pro Invest. Conteúdo educacional.</p>
          <p className="text-xs text-slate-300">financasproinvest.com.br</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

