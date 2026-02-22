import React, { useState } from 'react';
import { ToolLayout, Input, ToolGate } from './ToolComponents';

export const InflationTool = ({ onNavigate, isAuthenticated }: any) => {
  if (!isAuthenticated) return <ToolGate title="Calculadora de Inflação" description="Veja como a inflação destrói o poder de compra do dinheiro parado e aprenda a se proteger." onNavigate={onNavigate} />;

  const [value, setValue] = useState('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const val = Number(value);
    if (val <= 0) return;
    setResult({ five: val * 0.8, ten: val * 0.64 });
  };

  return (
    <ToolLayout title="Poder de Compra" icon="📉" onBack={onNavigate} description="A inflação corrói o dinheiro parado." badge="Alerta">
      <div className="max-w-2xl mx-auto space-y-6 text-center">
        <Input label="Dinheiro Parado" value={value} onChange={setValue} prefix="R$" placeholder="10.000" />
        <button onClick={calculate} className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold">ANALISAR</button>
        {result && <div className="text-3xl font-black text-red-500 mt-4">Vale apenas R$ {result.five.toLocaleString('pt-BR')} em 5 anos.</div>}
      </div>
    </ToolLayout>
  );
};