
import React, { useState } from 'react';
import { CalculationInput, RateType, PeriodType } from '../types';

interface CalculatorFormProps {
  onCalculate: (data: CalculationInput) => void;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculate }) => {
  const [formData, setFormData] = useState<CalculationInput>({
    initialValue: 1000,
    monthlyValue: 100,
    interestRate: 10,
    rateType: 'annual',
    period: 5,
    periodType: 'years'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const handleClear = () => {
    setFormData({
      initialValue: 0,
      monthlyValue: 0,
      interestRate: 0,
      rateType: 'annual',
      period: 0,
      periodType: 'years'
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-emerald-800 mb-6 text-center md:text-left">Simulador de Juros Compostos</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valor Inicial */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor inicial</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                style={{ colorScheme: 'light' }}
                value={formData.initialValue || ''}
                onChange={(e) => setFormData({ ...formData, initialValue: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Valor Mensal */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor mensal</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                style={{ colorScheme: 'light' }}
                value={formData.monthlyValue || ''}
                onChange={(e) => setFormData({ ...formData, monthlyValue: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Taxa de Juros */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Taxa de juros</label>
            <div className="flex">
              <div className="relative flex-grow">
                <span className="absolute left-3 top-2.5 text-slate-400 font-medium">%</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-l-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  style={{ colorScheme: 'light' }}
                  value={formData.interestRate || ''}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <select
                className="border border-l-0 border-slate-300 rounded-r-lg px-4 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer outline-none min-w-[90px]"
                value={formData.rateType}
                onChange={(e) => setFormData({ ...formData, rateType: e.target.value as RateType })}
              >
                <option value="monthly">mensal</option>
                <option value="annual">anual</option>
              </select>
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
            <div className="flex">
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-l-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                style={{ colorScheme: 'light' }}
                value={formData.period || ''}
                onChange={(e) => setFormData({ ...formData, period: parseFloat(e.target.value) || 0 })}
              />
              <select
                className="border border-l-0 border-slate-300 rounded-r-lg px-4 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer outline-none min-w-[90px]"
                value={formData.periodType}
                onChange={(e) => setFormData({ ...formData, periodType: e.target.value as PeriodType })}
              >
                <option value="months">meses</option>
                <option value="years">ano(s)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row items-center justify-between pt-4 gap-4">
          <div className="flex gap-6">
            <button
              type="button"
              className="text-emerald-700 text-sm font-semibold hover:text-emerald-900 transition-colors"
              onClick={() => alert("Simulação de retiradas em desenvolvimento...")}
            >
              Simular retiradas mensais
            </button>
            <button
              type="button"
              className="text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
              onClick={handleClear}
            >
              Limpar
            </button>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-emerald-800 text-white px-10 py-3 rounded-lg font-bold hover:bg-emerald-900 transition-colors shadow-md active:scale-95"
          >
            Calcular
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalculatorForm;
