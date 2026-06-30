import React, { useState, useEffect, useRef } from 'react';
import { ToolLayout, Input, ToolGate } from './ToolComponents';
import { 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  Table, 
  BookOpen, 
  BarChart3,
  Info,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';

interface MonthlyData {
  month: number;
  jurosPeriodo: number;
  totalInvestido: number;
  totalJuros: number;
  totalAcumulado: number;
}

export const CompoundInterestTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  const [inputs, setInputs] = useState({ p: '', m: '', r: '', t: '' });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [result, setResult] = useState<{ total: number; investido: number; juros: number; percentJuros: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'result' | 'table' | 'learn'>('result');
  const [errorMessage, setErrorMessage] = useState('');
  const [showScrollHint, setShowScrollHint] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      setShowScrollHint(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [result]);

  if (!isAuthenticated) {
    return <ToolGate title="Simulador de Riqueza" description="Descubra exatamente quanto tempo falta para você atingir seu primeiro milhão com o poder dos juros compostos." onNavigate={onNavigate} />;
  }

  const calculate = () => {
    setErrorMessage('');
    
    const p = Number(inputs.p) || 0;
    const m = Number(inputs.m) || 0;
    const rAnual = Number(inputs.r) || 0;
    const tAnos = Number(inputs.t) || 0;

    if (p === 0 && m === 0) {
      setErrorMessage('Por favor, adicione um valor inicial ou mensal.');
      return;
    }
    if (rAnual <= 0) {
      setErrorMessage('A taxa de juros deve ser maior que zero.');
      return;
    }
    if (tAnos <= 0) {
      setErrorMessage('O período deve ser maior que zero.');
      return;
    }

    const taxaMensalEfetiva = Math.pow(1 + rAnual / 100, 1 / 12) - 1;
    const nMeses = Math.round(tAnos * 12);

    let totalAcumulado = p;
    let totalInvestido = p;
    let totalJurosAcumulado = 0;
    const data: MonthlyData[] = [];

    for (let mes = 1; mes <= nMeses; mes++) {
      totalAcumulado += m;
      totalInvestido += m;

      const jurosPeriodo = totalAcumulado * taxaMensalEfetiva;
      totalAcumulado += jurosPeriodo;
      totalJurosAcumulado += jurosPeriodo;

      data.push({
        month: mes,
        jurosPeriodo,
        totalInvestido,
        totalJuros: totalJurosAcumulado,
        totalAcumulado,
      });
    }

    const juros = totalAcumulado - totalInvestido;
    const percentJuros = (juros / totalAcumulado) * 100;

    setMonthlyData(data);
    setResult({ total: totalAcumulado, investido: totalInvestido, juros, percentJuros });
    setActiveTab('result');

    if (onCalcUpdate) {
      onCalcUpdate({
        type: 'JUROS_COMPOSTOS',
        label: 'Calculadora de Juros Compostos',
        details: `Simulação de R$ ${totalAcumulado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} em ${tAnos} anos.`
      });
    }
  };

  const handleClear = () => {
    setInputs({ p: '', m: '', r: '', t: '' });
    setMonthlyData([]);
    setResult(null);
    setErrorMessage('');
    setShowScrollHint(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const chartData = monthlyData.map(d => ({
    month: d.month,
    'Valor Investido': d.totalInvestido,
    'Juros Acumulados': d.totalJuros,
  }));

  return (
    <ToolLayout 
      title="Calculadora de Juros Compostos" 
      icon="📈" 
      onBack={onNavigate} 
      description="O poder do tempo transformando centavos em milhões." 
      badge="Efeito Bola de Neve"
    >
      <div className="space-y-8">
        <div className={`transition-all duration-500 ${result ? 'max-w-3xl mx-auto' : 'max-w-2xl mx-auto'}`}>
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
                Simule seu futuro financeiro
              </h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto">
                Pequenas contribuições hoje podem se transformar em um grande patrimônio amanhã. 
                Descubra o poder dos juros compostos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Aporte Inicial" 
                value={inputs.p} 
                onChange={(v: any) => setInputs({ ...inputs, p: v })} 
                prefix="R$" 
                placeholder="0,00" 
              />
              <Input 
                label="Aporte Mensal" 
                value={inputs.m} 
                onChange={(v: any) => setInputs({ ...inputs, m: v })} 
                prefix="R$" 
                placeholder="0,00" 
              />
              <Input 
                label="Taxa Anual (%)" 
                value={inputs.r} 
                onChange={(v: any) => setInputs({ ...inputs, r: v })} 
                prefix="%" 
                placeholder="8,0" 
              />
              <Input 
                label="Tempo (Anos)" 
                value={inputs.t} 
                onChange={(v: any) => setInputs({ ...inputs, t: v })} 
                placeholder="10" 
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={calculate} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap size={18} /> CALCULAR
              </button>
              <button 
                onClick={handleClear} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> LIMPAR
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div ref={resultRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-8 rounded-3xl text-center shadow-2xl">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Patrimônio Estimado</p>
                <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">
                  R$ {formatCurrency(result.total)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <p className="text-slate-500 text-[9px] font-black uppercase mb-1 tracking-widest">Do seu Bolso</p>
                  <p className="text-xl font-black text-slate-800">R$ {formatCurrency(result.investido)}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                  <p className="text-emerald-600 text-[9px] font-black uppercase mb-1 tracking-widest">Lucro em Juros</p>
                  <p className="text-xl font-black text-emerald-600">R$ {formatCurrency(result.juros)}</p>
                </div>
              </div>
            </div>

            {showScrollHint && (
              <div className="flex flex-col items-center justify-center text-slate-500 animate-bounce mt-2">
                <p className="text-xs uppercase tracking-wider mb-1">Role para ver os detalhes</p>
                <ChevronDown size={20} />
              </div>
            )}

            <div className="mt-4">
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  onClick={() => setActiveTab('result')}
                  className={`px-5 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === 'result'
                      ? 'text-emerald-500 border-b-2 border-emerald-500'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BarChart3 size={16} /> Gráfico
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-5 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === 'table'
                      ? 'text-emerald-500 border-b-2 border-emerald-500'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Table size={16} /> Tabela
                </button>
                <button
                  onClick={() => setActiveTab('learn')}
                  className={`px-5 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === 'learn'
                      ? 'text-emerald-500 border-b-2 border-emerald-500'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BookOpen size={16} /> Explicações
                </button>
              </div>

              {activeTab === 'result' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={20} />
                    Evolução do Patrimônio
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.22}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorJuros" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.22}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={(v) => `${v}`}
                        />
                        <YAxis 
                          stroke="#64748b"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem' }}
                          labelStyle={{ color: '#1e293b' }}
                          formatter={(value: any) => [`R$ ${formatCurrency(value)}`, '']}
                          labelFormatter={(label) => `Mês ${label}`}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="Valor Investido" 
                          stackId="1"
                          stroke="#3b82f6" 
                          fill="url(#colorInvestido)"
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Juros Acumulados" 
                          stackId="1"
                          stroke="#10b981" 
                          fill="url(#colorJuros)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    * Áreas empilhadas: valor investido (azul) + juros acumulados (verde) = total acumulado
                  </p>
                </div>
              )}

              {activeTab === 'table' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 overflow-x-auto">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Table className="text-emerald-500" size={20} />
                    Detalhamento Mês a Mês
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-slate-500 font-medium">Mês</th>
                        <th className="text-right py-3 px-2 text-slate-500 font-medium">Juros (R$)</th>
                        <th className="text-right py-3 px-2 text-slate-500 font-medium">Total Investido (R$)</th>
                        <th className="text-right py-3 px-2 text-slate-500 font-medium">Total Juros (R$)</th>
                        <th className="text-right py-3 px-2 text-slate-500 font-medium">Total Acumulado (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row) => (
                        <tr key={row.month} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 text-slate-800">{row.month}</td>
                          <td className="text-right py-2 px-2 text-emerald-600">{formatCurrency(row.jurosPeriodo)}</td>
                          <td className="text-right py-2 px-2 text-blue-600">{formatCurrency(row.totalInvestido)}</td>
                          <td className="text-right py-2 px-2 text-emerald-600">{formatCurrency(row.totalJuros)}</td>
                          <td className="text-right py-2 px-2 text-slate-800 font-medium">{formatCurrency(row.totalAcumulado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'learn' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Info size={18} className="text-emerald-500" />
                      Passo a passo para usar a calculadora
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                      <li>Preencha o valor inicial que você irá investir.</li>
                      <li>Informe o valor que pretende investir por mês.</li>
                      <li>Digite a taxa de juros anual (ex: 8 para 8% a.a.).</li>
                      <li>Defina o período em anos.</li>
                      <li>Clique em "CALCULAR" para ver o resultado.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-500" />
                      O que são juros compostos?
                    </h3>
                    <p className="text-slate-600 text-sm">
                      São os "juros sobre juros". O rendimento é calculado sobre o montante total (capital inicial + juros acumulados), gerando crescimento exponencial. A fórmula é: <span className="font-mono text-emerald-600">M = C · (1 + i)^t</span>, onde M é o montante final, C o capital inicial, i a taxa de juros e t o tempo.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <BarChart3 size={18} className="text-emerald-500" />
                      Diferença entre juros simples e compostos
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-600 mb-2">Juros Simples</h4>
                        <ul className="list-disc list-inside text-slate-600 space-y-1">
                          <li>Incidem apenas sobre o capital inicial</li>
                          <li>Crescimento linear (reta)</li>
                          <li>Ex: R$ 5.000 a 1% a.m. em 12 meses → R$ 5.600</li>
                        </ul>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <h4 className="font-bold text-emerald-600 mb-2">Juros Compostos</h4>
                        <ul className="list-disc list-inside text-slate-600 space-y-1">
                          <li>Incidem sobre o montante acumulado</li>
                          <li>Crescimento exponencial (curva)</li>
                          <li>Ex: R$ 5.000 a 1% a.m. em 12 meses → R$ 5.634,13</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Zap size={18} className="text-emerald-500" />
                      Onde os juros compostos são aplicados?
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Em investimentos (CDB, Tesouro Direto, ações com reinvestimento), empréstimos, financiamentos e contas em atraso. Eles podem trabalhar a seu favor (investindo) ou contra (dívidas).
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                    <h4 className="font-bold text-emerald-600 mb-2">Exemplo prático</h4>
                    <p className="text-slate-600 text-sm">
                      Com aporte inicial de R$ 1.000, R$ 1.000 mensais, 20 anos a 8% a.a., o total investido seria R$ 241.000, mas o montante final ultrapassa R$ 573 mil, sendo R$ 332 mil apenas de juros. Isso é o poder dos juros compostos!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
