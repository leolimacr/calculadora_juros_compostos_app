import React, { useState } from 'react';
import { ToolLayout, Input, ToolGate } from './ToolComponents';
import { Zap, TrendingUp, Target, Wallet } from 'lucide-react';

export const DividendsTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated) return <ToolGate title="Projetor de Dividendos" description="Simule sua renda passiva mensal com base nos seus investimentos e crie seu salário vitalício." onNavigate={onNavigate} />;

  // Adicionamos o estado de 'mode' para controlar as abas
  const [mode, setMode] = useState<'capital' | 'renda'>('capital');
  const [inputs, setInputs] = useState({ capital: '', yield: '', desiredIncome: '' });
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const y = Number(inputs.yield);
    if (y <= 0) return;

    if (mode === 'capital') {
      const cap = Number(inputs.capital);
      if (cap <= 0) return;
      const monthly = (cap * (y / 100)) / 12;
      setResult({ type: 'capital', monthly, annual: cap * (y / 100), daily: monthly / 30 });
      
      if (onCalcUpdate) onCalcUpdate({ type: 'DIVIDENDOS', label: 'Projetor de Dividendos', details: `Renda projetada: R$ ${monthly.toLocaleString('pt-BR')}/mês.` });
    } else {
      const desired = Number(inputs.desiredIncome);
      if (desired <= 0) return;
      const annualNeeded = desired * 12;
      const requiredCap = annualNeeded / (y / 100);
      setResult({ type: 'renda', requiredCapital: requiredCap, monthly: desired, annual: annualNeeded });
      
      if (onCalcUpdate) onCalcUpdate({ type: 'DIVIDENDOS', label: 'Projetor de Dividendos', details: `Meta: R$ ${desired.toLocaleString('pt-BR')}/mês.` });
    }
  };

  return (
    <ToolLayout title="Projetor de Dividendos" icon="📊" onBack={onNavigate} description="Desenhe sua estratégia de liberdade financeira." badge="Premium">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Seletor de Modo (Abas) */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 inline-flex">
            <button 
              onClick={() => { setMode('capital'); setResult(null); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center ${mode === 'capital' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Tenho Capital
            </button>
            <button 
              onClick={() => { setMode('renda'); setResult(null); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center ${mode === 'renda' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Target className="w-4 h-4 mr-2" />
              Quero Renda
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Configuração */}
          <div className="lg:col-span-5 space-y-6 bg-slate-800/30 p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Zap className="text-emerald-400 w-5 h-5" />
              Parâmetros
            </h3>
            
            {mode === 'capital' ? (
              <Input label="Patrimônio Investido" value={inputs.capital} onChange={(v: any) => setInputs({ ...inputs, capital: v })} prefix="R$" placeholder="100.000" />
            ) : (
              <Input label="Renda Mensal Desejada" value={inputs.desiredIncome} onChange={(v: any) => setInputs({ ...inputs, desiredIncome: v })} prefix="R$" placeholder="5.000" />
            )}
            
            <Input label="Dividend Yield Anual (%)" value={inputs.yield} onChange={(v: any) => setInputs({ ...inputs, yield: v })} prefix="%" placeholder="8.5" />
            
            <button onClick={calculate} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-lg shadow-emerald-900/20 mt-4">
              {mode === 'capital' ? 'PROJETAR RENDA' : 'CALCULAR PATRIMÔNIO'}
            </button>
          </div>

          {/* Coluna Direita: Resultados */}
          <div className="lg:col-span-7">
            {!result ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-3xl p-8 text-center">
                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                <p>Preencha os parâmetros e simule para ver a mágica dos dividendos acontecer.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Cards para o modo Tenho Capital */}
                {mode === 'capital' && (
                  <>
                    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800/40 p-6 md:p-8 rounded-3xl border border-emerald-800/30 shadow-xl">
                      <p className="text-sm font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Renda Passiva Mensal</p>
                      <h2 className="text-4xl md:text-5xl font-black text-white truncate">R$ {result.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/40 p-5 md:p-6 rounded-3xl border border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total no Ano</p>
                        <p className="text-xl md:text-2xl font-bold text-slate-100 truncate">R$ {result.annual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 md:p-6 rounded-3xl border border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Média por Dia</p>
                        <p className="text-xl md:text-2xl font-bold text-slate-100 truncate">R$ {result.daily.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Card para o modo Quero Renda */}
                {mode === 'renda' && (
                  <div className="bg-gradient-to-br from-blue-900/40 to-slate-800/40 p-8 rounded-3xl border border-blue-800/30 shadow-xl h-full flex flex-col justify-center min-h-[300px]">
                    <p className="text-sm font-semibold text-blue-400/80 uppercase tracking-wider mb-2">Patrimônio Necessário</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 truncate">R$ {result.requiredCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <p className="text-slate-400 text-sm md:text-base">
                      Para gerar <strong className="text-white">R$ {result.monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> por mês com um Yield de <strong className="text-white">{inputs.yield}%</strong> ao ano.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
