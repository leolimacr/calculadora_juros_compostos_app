
import React, { useState, useCallback } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import EducationalContent from './components/EducationalContent';
import ContentModal from './components/ContentModal';
import { CalculationInput, CalculationResult } from './types';
import { calculateCompoundInterest } from './utils/calculations';

const App: React.FC = () => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [activeModal, setActiveModal] = useState<'artigos' | 'sobre' | null>(null);

  const handleCalculate = useCallback((input: CalculationInput) => {
    const calculation = calculateCompoundInterest(input);
    setResult(calculation);
    
    // Smooth scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar / Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-4 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-800 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Finanças<span className="text-emerald-800">Pro</span>
            </h1>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
            <button 
              onClick={() => setActiveModal('artigos')}
              className="hover:text-emerald-800 transition-colors outline-none"
            >
              Artigos
            </button>
            <button 
              onClick={() => setActiveModal('sobre')}
              className="hover:text-emerald-800 transition-colors outline-none"
            >
              Sobre
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center md:text-left max-w-2xl">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 sm:text-4xl">
            Sua independência financeira começa com o primeiro aporte.
          </h2>
          <p className="text-lg text-slate-600">
            Utilize nossa calculadora profissional de juros compostos para projetar o crescimento do seu patrimônio e entender como o tempo trabalha ao seu favor.
          </p>
        </div>

        {/* Main Tool Grid */}
        <div className="grid grid-cols-1 gap-8">
          <section>
            <CalculatorForm onCalculate={handleCalculate} />
          </section>

          {result && (
            <section id="results-section">
              <ResultsDisplay result={result} />
            </section>
          )}

          {/* Educational Section */}
          <section>
            <EducationalContent />
          </section>
        </div>
      </main>

      {/* Modais de Conteúdo */}
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
        title="Sobre o FinançasPro"
      >
        <p className="font-semibold text-slate-800 text-lg">O FinançasPro nasceu com um objetivo simples: transformar conceitos financeiros complexos em ferramentas práticas.</p>
        <p>A proposta deste site é ajudar você a entender como o dinheiro funciona, planejar seus objetivos e usar os juros compostos a seu favor de maneira clara e descomplicada.</p>
        <p>Por trás do FinançasPro está alguém com experiência real no sistema financeiro e na vida de quem lida com boletos, compromissos e sonhos ao mesmo tempo. Depois de anos trabalhando em banco e estudando tecnologia, apps e automação, surgiu a ideia de criar calculadoras, simuladores e modelos que aproximam a educação financeira da rotina das pessoas comuns, sem economês e sem promessas irreais.</p>
        <p>Aqui, cada ferramenta e cada conteúdo foram pensados para que você consiga dar o próximo passo: organizar gastos, planejar aportes, simular cenários e tomar decisões com mais segurança. O objetivo não é dizer o que você “deve fazer”, mas oferecer clareza para que você escolha o caminho que faz sentido para a sua realidade. Se este site conseguir te ajudar a dormir mais tranquilo com suas finanças, a missão do FinançasPro está cumprida.</p>
      </ContentModal>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-500 text-sm mb-4">
            © {new Date().getFullYear()} FinançasPro Simulator. Todos os direitos reservados.
          </p>
          <div className="flex justify-center space-x-4 text-xs font-medium text-emerald-700 mb-6">
            <button onClick={() => setActiveModal('artigos')} className="hover:underline">Educação Financeira</button>
            <button onClick={() => setActiveModal('sobre')} className="hover:underline">Nossa Missão</button>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Atenção: Simuladores financeiros são ferramentas de projeção e não garantem resultados futuros. 
            Sempre consulte um assessor financeiro antes de tomar decisões de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
