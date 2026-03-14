import React, { useState } from 'react';
import { ToolLayout, Input, ToolGate } from './ToolComponents';
import { Zap, TrendingUp, Target, Wallet } from 'lucide-react';

export const DividendsTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated)
    return (
      <ToolGate
        title="Projetor de Dividendos"
        description="Simule sua renda passiva mensal com base nos seus investimentos e crie seu salário vitalício."
        onNavigate={onNavigate}
      />
    );

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

      if (onCalcUpdate)
        onCalcUpdate({
          type: 'DIVIDENDOS',
          label: 'Projetor de Dividendos',
          details: `Renda projetada: R$ ${monthly.toLocaleString('pt-BR')}/mês.`,
        });
    } else {
      const desired = Number(inputs.desiredIncome);
      if (desired <= 0) return;
      const annualNeeded = desired * 12;
      const requiredCap = annualNeeded / (y / 100);
      setResult({ type: 'renda', requiredCapital: requiredCap, monthly: desired, annual: annualNeeded });

      if (onCalcUpdate)
        onCalcUpdate({
          type: 'DIVIDENDOS',
          label: 'Projetor de Dividendos',
          details: `Meta: R$ ${desired.toLocaleString('pt-BR')}/mês.`,
        });
    }
  };

  return (
    <ToolLayout
      title="Projetor de Dividendos"
      icon="📊"
      onBack={onNavigate}
      description="Desenhe sua estratégia de liberdade financeira."
      badge="Premium"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex shadow-sm">
            <button
              onClick={() => {
                setMode('capital');
                setResult(null);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center ${
                mode === 'capital'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Tenho Capital
            </button>
            <button
              onClick={() => {
                setMode('renda');
                setResult(null);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center ${
                mode === 'renda'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4 mr-2" />
              Quero Renda
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Zap className="text-emerald-500 w-5 h-5" />
              Parâmetros
            </h3>

            {mode === 'capital' ? (
              <Input
                label="Patrimônio Investido"
                value={inputs.capital}
                onChange={(v: any) => setInputs({ ...inputs, capital: v })}
                prefix="R$"
                placeholder="100.000"
              />
            ) : (
              <Input
                label="Renda Mensal Desejada"
                value={inputs.desiredIncome}
                onChange={(v: any) => setInputs({ ...inputs, desiredIncome: v })}
                prefix="R$"
                placeholder="5.000"
              />
            )}

            <Input
              label="Dividend Yield Anual (%)"
              value={inputs.yield}
              onChange={(v: any) => setInputs({ ...inputs, yield: v })}
              prefix="%"
              placeholder="8.5"
            />

            <button
              onClick={calculate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-sm mt-4"
            >
              {mode === 'capital' ? 'PROJETAR RENDA' : 'CALCULAR PATRIMÔNIO'}
            </button>
          </div>

          <div className="lg:col-span-7">
            {!result ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-300 bg-slate-50 rounded-3xl p-8 text-center">
                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                <p>Preencha os parâmetros e simule para ver a mágica dos dividendos acontecer.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {mode === 'capital' && (
                  <>
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-6 md:p-8 rounded-3xl border border-emerald-200 shadow-xl">
                      <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                        Renda Passiva Mensal
                      </p>
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 truncate">
                        R${' '}
                        {result.monthly.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Total no Ano
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                          R${' '}
                          {result.annual.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Média por Dia
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                          R${' '}
                          {result.daily.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {mode === 'renda' && (
                  <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-blue-200 shadow-xl h-full flex flex-col justify-center min-h-[300px]">
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2">
                      Patrimônio Necessário
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 truncate">
                      R${' '}
                      {result.requiredCapital.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </h2>
                    <p className="text-slate-600 text-sm md:text-base">
                      Para gerar <strong className="text-slate-900">R$ {result.monthly.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</strong> por mês com um Yield de <strong className="text-slate-900">{inputs.yield}%</strong> ao ano.
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
