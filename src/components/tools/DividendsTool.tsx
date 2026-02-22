import React, { useState } from 'react';
import { ToolLayout, Input, ToolGate } from './ToolComponents';
import { Zap } from 'lucide-react';

export const DividendsTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated) return <ToolGate title="Projetor de Dividendos" description="Simule sua renda passiva mensal com base nos seus investimentos e crie seu salário vitalício." onNavigate={onNavigate} />;

  const [inputs, setInputs] = useState({ capital: '', yield: '' });
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const cap = Number(inputs.capital);
    const y = Number(inputs.yield);
    if (cap <= 0 || y <= 0) return;
    const monthly = (cap * (y / 100)) / 12;
    setResult({ monthly, annual: cap * (y / 100), daily: monthly / 30 });
    if (onCalcUpdate) onCalcUpdate({ type: 'DIVIDENDOS', label: 'Projetor de Dividendos', details: `Renda projetada: R$ ${monthly.toLocaleString('pt-BR')}/mês.` });
  };

  return (
    <ToolLayout title="Projetor de Dividendos" icon="📊" onBack={onNavigate} description="Visualize sua renda passiva real." badge="Foco em Renda">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Patrimônio Investido" value={inputs.capital} onChange={(v: any) => setInputs({ ...inputs, capital: v })} prefix="R$" placeholder="100.000" />
          <Input label="Dividend Yield Anual (%)" value={inputs.yield} onChange={(v: any) => setInputs({ ...inputs, yield: v })} prefix="%" placeholder="8.5" />
        </div>
        <button onClick={calculate} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">PROJETAR RENDA</button>
        {result && <div className="text-5xl font-black text-emerald-400 mt-8">R$ {result.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>}
      </div>
    </ToolLayout>
  );
};