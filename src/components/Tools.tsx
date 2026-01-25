import React, { useState } from 'react';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

const ToolLayout = ({ title, icon, onBack, children }: any) => (
  <div className="max-w-4xl mx-auto px-4">
    <button onClick={() => onBack('home')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold uppercase text-xs">
      ← Voltar para o Início
    </button>
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <span className="text-5xl">{icon}</span>
        <h1 className="text-3xl font-black text-white">{title}</h1>
      </div>
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, prefix }: any) => (
  <div className="space-y-2 flex-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{prefix}</span>}
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className={`w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold focus:border-sky-500 outline-none ${prefix ? 'pl-10' : ''}`} />
    </div>
  </div>
);

export const FireCalculatorTool = ({ onNavigate }: any) => {
  const [expense, setExpense] = useState(5000);
  const result = expense * 300; // Regra dos 4% (25 anos de gastos ou gasto / 0.0033)
  return (
    <ToolLayout title="Calculadora FIRE" icon="🔥" onBack={onNavigate}>
      <p className="text-slate-400 mb-8">Descubra o valor necessário para viver de renda passiva.</p>
      <Input label="Gasto Mensal Desejado" value={expense} onChange={setExpense} prefix="R$" />
      <div className="mt-10 bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl text-center">
        <p className="text-emerald-400 text-sm font-bold uppercase mb-2">Seu Número FIRE</p>
        <p className="text-5xl font-black text-white">R$ {result.toLocaleString('pt-BR')}</p>
        <p className="text-slate-400 text-xs mt-4">Com este patrimônio investido a uma taxa real de 4% a.a., você mantém seu padrão de vida para sempre.</p>
      </div>
    </ToolLayout>
  );
};

export const CompoundInterestTool = ({ onNavigate }: any) => {
  const [val, setVal] = useState({ p: 1000, m: 500, r: 10, t: 10 });
  const calculate = () => {
    const r = val.r / 100 / 12;
    const n = val.t * 12;
    return val.p * Math.pow(1 + r, n) + val.m * ((Math.pow(1 + r, n) - 1) / r);
  };
  return (
    <ToolLayout title="Juros Compostos" icon="📈" onBack={onNavigate}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Valor Inicial" value={val.p} onChange={v => setVal({...val, p: v})} prefix="R$" />
        <Input label="Aporte Mensal" value={val.m} onChange={v => setVal({...val, m: v})} prefix="R$" />
        <Input label="Taxa Anual (%)" value={val.r} onChange={v => setVal({...val, r: v})} />
        <Input label="Tempo (Anos)" value={val.t} onChange={v => setVal({...val, t: v})} />
      </div>
      <div className="mt-10 bg-sky-500/10 border border-sky-500/20 p-8 rounded-3xl text-center">
        <p className="text-sky-400 text-sm font-bold uppercase mb-2">Resultado Estimado</p>
        <p className="text-5xl font-black text-white">R$ {calculate().toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
      </div>
    </ToolLayout>
  );
};

export const InflationTool = ({ onNavigate }: any) => {
  const [v, setV] = useState(1000);
  return (
    <ToolLayout title="Poder de Compra" icon="📉" onBack={onNavigate}>
      <Input label="Valor do Dinheiro Parado" value={v} onChange={setV} prefix="R$" />
      <div className="mt-8 space-y-4">
        <div className="flex justify-between p-4 bg-slate-800 rounded-xl"><span className="text-slate-400">Em 5 anos (IPCA 4.5%)</span><span className="text-red-400 font-bold">R$ {(v * 0.8).toFixed(2)}</span></div>
        <div className="flex justify-between p-4 bg-slate-800 rounded-xl"><span className="text-slate-400">Em 10 anos (IPCA 4.5%)</span><span className="text-red-400 font-bold">R$ {(v * 0.64).toFixed(2)}</span></div>
      </div>
    </ToolLayout>
  );
};

export const RentVsFinanceTool = ({ onNavigate }: any) => <ToolLayout title="Alugar vs Comprar" icon="🏠" onBack={onNavigate}><div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest">Ferramenta em Desenvolvimento</div></ToolLayout>;
export const DebtOptimizerTool = ({ onNavigate }: any) => <ToolLayout title="Dívidas" icon="💳" onBack={onNavigate}><div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest">Ferramenta em Desenvolvimento</div></ToolLayout>;
export const DividendsTool = ({ onNavigate }: any) => <ToolLayout title="Dividendos" icon="📊" onBack={onNavigate}><div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest">Ferramenta em Desenvolvimento</div></ToolLayout>;
