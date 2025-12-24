import React, { useState } from 'react';
import { CalculationInput, RateType, PeriodType } from '../types';

interface CalculatorFormProps {
  onCalculate: (data: CalculationInput) => void;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate }) => {
  const [formData, setFormData] = useState<CalculationInput>({
    initialValue: 5000,
    monthlyValue: 500,
    interestRate: 10,
    rateType: 'annual',
    period: 10,
    periodType: 'years',
    taxRate: 0,
    inflationRate: 4.5 // Padrão Brasil
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const InputGroup = ({ label, icon, children, tooltip }: { label: string, icon: string, children: React.ReactNode, tooltip?: string }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          {label}
        </label>
        {tooltip && (
          <div className="group relative cursor-help">
            <span className="text-slate-500 text-[10px]">?</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 z-10">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-800 flex items-center justify-center text-2xl border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-900/20">
            📈
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Simulador Pro</h2>
            <p className="text-sm text-slate-400">Juros Compostos com Precisão</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           Sistema Online
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          <InputGroup label="Valor Inicial" icon="💰" tooltip="Quanto você tem hoje para começar?">
            <div className="relative">
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                className="w-full pl-16 pr-4 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all hover:border-slate-500"
                value={formData.initialValue}
                onChange={(e) => setFormData({ ...formData, initialValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </InputGroup>

          <InputGroup label="Aporte Mensal" icon="📅" tooltip="Quanto você vai investir todos os meses?">
            <div className="relative">
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                className="w-full pl-16 pr-4 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all hover:border-slate-500"
                value={formData.monthlyValue}
                onChange={(e) => setFormData({ ...formData, monthlyValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </InputGroup>

          <InputGroup label="Taxa de Juros" icon="Percent" tooltip="Rentabilidade esperada dos seus investimentos.">
            <div className="flex">
              <div className="relative flex-grow">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-50">📊</span>
                 <input
                  type="number"
                  step="0.01"
                  className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-600 border-r-0 rounded-l-xl text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <select
                className="bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-r-xl px-4 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-slate-600 transition-colors uppercase tracking-wide w-32"
                value={formData.rateType}
                onChange={(e) => setFormData({ ...formData, rateType: e.target.value as RateType })}
              >
                <option value="monthly">Ao Mês</option>
                <option value="annual">Ao Ano</option>
              </select>
            </div>
          </InputGroup>

          <InputGroup label="Tempo" icon="Clock" tooltip="Por quanto tempo você deixará o dinheiro rendendo?">
             <div className="flex">
              <div className="relative flex-grow">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-50">⏳</span>
                <input
                  type="number"
                  className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-600 border-r-0 rounded-l-xl text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <select
                className="bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-r-xl px-4 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-slate-600 transition-colors uppercase tracking-wide w-32"
                value={formData.periodType}
                onChange={(e) => setFormData({ ...formData, periodType: e.target.value as PeriodType })}
              >
                <option value="months">Meses</option>
                <option value="years">Anos</option>
              </select>
            </div>
          </InputGroup>
        </div>

        {/* Advanced Toggle */}
        <div className="border-t border-slate-700 pt-4">
           <button 
             type="button"
             onClick={() => setShowAdvanced(!showAdvanced)}
             className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
           >
             <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
             Configurações Avançadas (Imposto & Inflação)
           </button>

           {showAdvanced && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 animate-in slide-in-from-top-2 fade-in">
               <InputGroup label="Imposto sobre Lucro" icon="⚖️" tooltip="Desconto de IR no resgate (Ex: 15% ações, 22.5% renda fixa curto prazo)">
                  <div className="relative">
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">%</span>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="0 (Isento)"
                      className="w-full pl-16 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all hover:border-slate-500"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </InputGroup>
                
                <InputGroup label="Inflação Média Anual" icon="💸" tooltip="Para calcular o Ganho Real (Poder de Compra). Brasil média ~4.5%">
                  <div className="relative">
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">%</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4.5"
                      className="w-full pl-16 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all hover:border-slate-500"
                      value={formData.inflationRate}
                      onChange={(e) => setFormData({ ...formData, inflationRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </InputGroup>
             </div>
           )}
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-lg font-bold py-5 rounded-xl shadow-xl shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 group border border-emerald-400/20"
        >
          <span>Calcular Futuro</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default CalculatorForm;