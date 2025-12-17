
import React, { useState, useCallback } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import EducationalContent from './components/EducationalContent';
import { CalculationInput, CalculationResult } from './types';
import { calculateCompoundInterest } from './utils/calculations';

const App: React.FC = () => {
  const [result, setResult] = useState<CalculationResult | null>(null);

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
            <div className="bg-red-800 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Finanças<span className="text-red-800">Pro</span>
            </h1>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-red-800 transition-colors">Ferramentas</a>
            <a href="#" className="hover:text-red-800 transition-colors">Artigos</a>
            <a href="#" className="hover:text-red-800 transition-colors">Sobre</a>
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-500 text-sm mb-4">
            © {new Date().getFullYear()} FinançasPro Simulator. Todos os direitos reservados.
          </p>
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
