
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
  const [activeStep, setActiveStep] = useState<1 | 2 | null>(null);
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Finanças Pro<span className="text-emerald-800"> Invest</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-emerald-800 transition-colors ${
                currentView === 'home' ? 'text-emerald-800' : ''
              }`}
            >
              Início
            </button>
            <button
              onClick={() => navigateTo('calculator')}
              className={`hover:text-emerald-800 transition-colors ${
                currentView === 'calculator' ? 'text-emerald-800' : ''
              }`}
            >
              Ferramentas
            </button>
            <button
              onClick={() => setActiveModal('passo-a-passo')}
              className="hover:text-emerald-800 transition-colors"
            >
              Comece a Investir
            </button>
            <button
              onClick={() => setActiveModal('artigos')}
              className="hover:text-emerald-800 transition-colors"
            >
              Conteúdos
            </button>
            <button
              onClick={() => setActiveModal('sobre')}
              className="hover:text-emerald-800 transition-colors"
            >
              Sobre
            </button>
          </nav>

          <div className="md:hidden">
            <button
              onClick={() => navigateTo('calculator')}
              className="bg-emerald-800 text-white px-3 py-1.5 rounded-md text-xs font-bold"
            >
              Calculadora
            </button>
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
                  Organize suas finanças e{' '}
                  <span className="text-emerald-400">invista com clareza</span>.
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                  Ferramentas práticas e conteúdo direto ao ponto para quem quer sair do básico,
                  montar reservas e investir com segurança.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => navigateTo('calculator')}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg"
                  >
                    Usar a calculadora
                  </button>
                  <button
                    onClick={() => setActiveModal('passo-a-passo')}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold transition-all"
                  >
                    Começar passo a passo
                  </button>
                </div>
              </div>
            </section>

            <section className="py-20 px-4 max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Para quem é o Finanças Pro Invest
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-3">1. Iniciante</h3>
                  <p className="text-slate-500 text-sm">
                    Para quem está começando do zero e quer organizar o orçamento.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-md ring-1 ring-emerald-800/10">
                  <h3 className="text-xl font-bold mb-3">2. Em evolução</h3>
                  <p className="text-slate-500 text-sm">
                    Já economiza e quer fazer o dinheiro render mais.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-3">3. Investidor</h3>
                  <p className="text-slate-500 text-sm">
                    Quer otimizar a carteira e usar ferramentas precisas.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                Calculadora de Juros Compostos
              </h2>
              <p className="text-slate-600">O poder do tempo trabalhando a seu favor.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CalculatorForm onCalculate={handleCalculate} />
                {result && (
                  <div id="results-section" className="mt-8">
                    <ResultsDisplay result={result} />
                  </div>
                )}
              </div>
              <aside className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-emerald-800 mb-4">O que são Juros Compostos?</h3>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "Juros sobre juros": onde cada ganho se torna base para o próximo crescimento.
                  </p>
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
        title="Conteúdos: Hub de Conhecimento Finanças Pro"
      >
        <div className="space-y-4 text-left">
          <p className="text-slate-500 text-sm mb-6 italic text-center">
            Clique nos tópicos abaixo para explorar o conteúdo completo.
          </p>

          {/* Tópico 1 - Mente Próspera */}
          <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧠</span>
                <span className="font-bold text-slate-800 text-lg">Mente Próspera</span>
              </div>
              <span className="text-emerald-800 group-open:rotate-180 transition-transform font-bold">
                ▼
              </span>
            </summary>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-600 text-sm leading-relaxed space-y-3">
              <p>
                A educação financeira começa no controle dos seus impulsos. Uma{' '}
                <strong>mente próspera</strong> entende que o dinheiro é tempo transformado em
                moeda.
              </p>
              <p>
                Para mudar sua realidade, você deve focar em comprar <strong>Ativos</strong>{' '}
                (coisas que põem dinheiro no seu bolso) e evitar <strong>Passivos</strong> (coisas
                que tiram dinheiro do seu bolso). O segredo é a disciplina de poupar primeiro e
                gastar o que sobrar, invertendo a lógica da maioria das pessoas.
              </p>
            </div>
          </details>

          {/* Tópico 2 - Renda Fixa */}
          <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📈</span>
                <span className="font-bold text-slate-800 text-lg">Renda Fixa: A Base Segura</span>
              </div>
              <span className="text-emerald-800 group-open:rotate-180 transition-transform font-bold">
                ▼
              </span>
            </summary>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-600 text-sm leading-relaxed space-y-3">
              <p>
                Investir em Renda Fixa é como emprestar dinheiro para alguém (Governo ou Banco) em
                troca de uma remuneração (juros).
              </p>
              <p>
                Os principais títulos são: <strong>Tesouro Selic</strong> (ideal para reserva de
                emergência), <strong>CDBs</strong> (títulos de bancos) e <strong>LCI/LCA</strong>{' '}
                (isentos de imposto de renda). É o motor que protege seu poder de compra contra a
                inflação com segurança garantida pelo FGC ou pelo próprio Governo Federal.
              </p>
            </div>
          </details>

          {/* Tópico 3 - Renda Variável */}
          <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏢</span>
                <span className="font-bold text-slate-800 text-lg">
                  Renda Variável (Ações e FIIs)
                </span>
              </div>
              <span className="text-emerald-800 group-open:rotate-180 transition-transform font-bold">
                ▼
              </span>
            </summary>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-600 text-sm leading-relaxed space-y-3">
              <p>
                A Renda Variável permite que você se torne sócio de grandes negócios ou dono de
                pedaços de shoppings e galpões logísticos (através dos{' '}
                <strong>FIIs - Fundos Imobiliários</strong>).
              </p>
              <p>
                Diferente da renda fixa, aqui os rendimentos variam, mas o potencial de ganho no
                longo prazo é muito maior. O foco do investidor profissional deve ser no recebimento
                de <strong>Dividendos</strong>, que é a sua parte no lucro das empresas, depositada
                diretamente na sua conta.
              </p>
            </div>
          </details>

          {/* Tópico 4 - Planejamento */}
          <details className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌅</span>
                <span className="font-bold text-slate-800 text-lg">Independência Financeira</span>
              </div>
              <span className="text-emerald-800 group-open:rotate-180 transition-transform font-bold">
                ▼
              </span>
            </summary>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-600 text-sm leading-relaxed space-y-3">
              <p>
                A independência financeira não acontece por sorte, mas por cálculo. É o momento em
                que seus investimentos geram renda suficiente para pagar todos os seus custos de
                vida.
              </p>
              <p>
                Use o simulador de juros compostos deste site para descobrir quanto você precisa
                aportar mensalmente. Lembre-se: o <strong>Tempo</strong> é o fator mais importante.
                Quanto mais cedo você plantar, mais rápido a sombra do patrimônio será sua.
              </p>
            </div>
          </details>

          <div className="bg-emerald-900 text-white p-6 rounded-2xl text-center shadow-lg mt-6">
            <p className="text-lg font-bold mb-2">🚀 Seu futuro começa hoje.</p>
            <p className="text-xs text-emerald-100 italic">
              "O conhecimento é o único ativo que nunca para de render dividendos."
            </p>
          </div>
        </div>
      </ContentModal>

      <ContentModal
        isOpen={activeModal === 'sobre'}
        onClose={() => setActiveModal(null)}
        title="Sobre o Projeto"
      >
        <p className="font-semibold text-slate-800">
          Portal independente dedicado à educação financeira.
        </p>
        <p className="mt-4">
          Idealizado por especialistas com sólida trajetória no setor bancário. Nossa base fica em{' '}
          <strong>Brumado/BA</strong>.
        </p>
        <p className="mt-4 text-emerald-800 font-bold italic">
          Nossa missão: Dar clareza para o seu dinheiro trabalhar por você.
        </p>
      </ContentModal>

      <ContentModal
        isOpen={activeModal === 'passo-a-passo'}
        onClose={() => {
          setActiveModal(null);
          setActiveStep(null); // fecha a aba quando fechar o modal
        }}
        title="Trilha do Investidor"
      >
        <div className="space-y-4 text-sm text-slate-800">
          {/* Abas */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setActiveStep(activeStep === 1 ? null : 1)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                activeStep === 1
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="bg-white/10 border border-white/40 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                1
              </span>
              <span className="font-semibold">Faxina Financeira</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(activeStep === 2 ? null : 2)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                activeStep === 2
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="bg-white/10 border border-white/40 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                2
              </span>
              <span className="font-semibold">Reserva de Emergência</span>
            </button>
          </div>

          {/* Conteúdo da etapa 1 */}
          {activeStep === 1 && (
            <div className="flex gap-4 p-3 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg shadow-sm">
              <div className="bg-emerald-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold mb-1">Faxina Financeira</p>
                <p className="mb-1">
                  Antes de começar a investir, o primeiro passo é organizar a casa. Aqui você olha
                  para todas as suas contas, dívidas e gastos com honestidade, sem culpa, como quem
                  faz uma verdadeira faxina financeira.
                </p>
                <p className="mb-1">
                  Você reúne tudo em um só lugar: cartão de crédito, empréstimos, financiamentos,
                  boletos atrasados e gastos mensais. A partir daí, passa a enxergar quais dívidas
                  têm juros mais altos, onde está vazando dinheiro e o que pode ser renegociado ou
                  cortado.
                </p>
                <p>
                  O objetivo é reduzir o peso das dívidas, liberar espaço no orçamento e ganhar
                  controle. Quando a faxina financeira é bem feita, você sente alívio, para de viver
                  apagando incêndios e começa a ter dinheiro sobrando todo mês para construir
                  patrimônio de verdade.
                </p>
              </div>
            </div>
          )}

          {/* Conteúdo da etapa 2 */}
          {activeStep === 2 && (
            <div className="flex gap-4 p-3 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg shadow-sm">
              <div className="bg-emerald-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold mb-1">Reserva de Emergência</p>
                <p className="mb-1">
                  Com a casa em ordem, chega a hora de criar o seu colchão de segurança. A reserva
                  de emergência é o dinheiro que vai te proteger quando acontecer algo fora do
                  roteiro: perda de emprego, problema de saúde, conserto do carro ou imprevistos com
                  a família.
                </p>
                <p className="mb-1">
                  Você calcula quanto custa manter sua vida por um mês e multiplica por um período
                  entre 6 e 12 meses, dependendo da sua estabilidade de renda. Esse valor é
                  direcionado para aplicações seguras e com resgate rápido, como Tesouro Selic ou
                  CDB com liquidez diária.
                </p>
                <p>
                  Quando essa reserva ganha corpo, investir deixa de ser motivo de medo e vira um
                  projeto tranquilo de longo prazo. Você não depende mais do cartão ou do cheque
                  especial para lidar com imprevistos e pode investir sabendo que, se a vida te
                  surpreender, você está preparado.
                </p>
              </div>
            </div>
          )}
        </div>
      </ContentModal>
