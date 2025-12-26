
import React, { useState, useEffect } from 'react';
import { calculateRentVsFinance, calculateDebtAvalanche, calculateFire, calculateInflationLoss, formatCurrency, maskCurrency } from '../utils/calculations';
import { DebtItem } from '../types';
import Breadcrumb from './Breadcrumb';

interface ToolProps {
  toolType?: string;
  isPrivacyMode?: boolean;
  navigateToHome?: () => void;
}

// Componente de Input Reutilizável com Hint e Tipografia Ajustada
const ToolInput = ({ label, value, onChange, type = "number", prefix = "", suffix = "", hint = "" }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative group">
      {prefix && <span className="absolute left-4 top-3.5 text-emerald-500 font-bold text-sm">{prefix}</span>}
      <input
        type={type}
        className={`w-full bg-slate-900 border border-slate-600 rounded-xl py-3 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all group-hover:border-slate-500 ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'}`}
        value={value}
        onChange={onChange}
      />
      {suffix && <span className="absolute right-4 top-3.5 text-slate-500 font-bold text-sm">{suffix}</span>}
    </div>
    {hint && <p className="text-[10px] text-slate-500 mt-1.5 ml-1">{hint}</p>}
  </div>
);

// =======================
// RENT VS FINANCE
// =======================
export const RentVsFinanceTool: React.FC<ToolProps> = ({ isPrivacyMode = false, navigateToHome }) => {
  const [input, setInput] = useState({
    propertyValue: 500000,
    downPayment: 100000,
    interestRateYear: 10.5,
    years: 30,
    rentValue: 2500,
    investmentRateYear: 11,
    appreciationRateYear: 4,
  });
  const [result, setResult] = useState<any>(null);

  const calculate = () => setResult(calculateRentVsFinance(input));

  return (
    <div className="space-y-6">
      {navigateToHome && <Breadcrumb items={[{ label: 'Home', action: navigateToHome }, { label: 'Alugar vs Financiar' }]} />}
      
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
          <span className="text-4xl">🏡</span>
          <div>
            <h3 className="text-2xl font-bold text-white">Viver de Aluguel vs. Financiar</h3>
            <p className="text-slate-400 text-sm">Simulação matemática para decidir seu futuro imobiliário.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Coluna 1: Dados do Imóvel */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
             <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">1. O Imóvel</h4>
             <ToolInput 
               label="Valor de Venda do Imóvel" 
               prefix="R$" 
               value={input.propertyValue} 
               onChange={(e: any) => setInput({...input, propertyValue: +e.target.value})} 
               hint="Preço atual de mercado se fosse comprar hoje"
             />
             <ToolInput 
               label="Valorização Anual Esperada" 
               suffix="% a.a." 
               value={input.appreciationRateYear} 
               onChange={(e: any) => setInput({...input, appreciationRateYear: +e.target.value})} 
               hint="Quanto o imóvel valoriza por ano (Média histórica ~4%)"
             />
             <ToolInput 
               label="Tempo de Análise" 
               suffix="Anos" 
               value={input.years} 
               onChange={(e: any) => setInput({...input, years: +e.target.value})} 
               hint="Duração do financiamento ou moradia"
             />
          </div>

          {/* Coluna 2: Cenário Financiamento */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
             <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">2. Cenário: Financiar</h4>
             <ToolInput 
               label="Valor da Entrada" 
               prefix="R$" 
               value={input.downPayment} 
               onChange={(e: any) => setInput({...input, downPayment: +e.target.value})} 
               hint="Recurso próprio disponível agora"
             />
             <ToolInput 
               label="Taxa de Juros do Financiamento" 
               suffix="% a.a." 
               value={input.interestRateYear} 
               onChange={(e: any) => setInput({...input, interestRateYear: +e.target.value})} 
               hint="Custo Efetivo Total (CET) do banco"
             />
          </div>

          {/* Coluna 3: Cenário Aluguel */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
             <h4 className="text-indigo-400 font-bold text-sm uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">3. Cenário: Alugar</h4>
             <ToolInput 
               label="Aluguel Mensal Estimado" 
               prefix="R$" 
               value={input.rentValue} 
               onChange={(e: any) => setInput({...input, rentValue: +e.target.value})} 
               hint="Quanto custa alugar este mesmo imóvel"
             />
             <ToolInput 
               label="Rentabilidade dos Investimentos" 
               suffix="% a.a." 
               value={input.investmentRateYear} 
               onChange={(e: any) => setInput({...input, investmentRateYear: +e.target.value})} 
               hint="Ganho anual se investir a entrada (Ex: Selic/CDI)"
             />
          </div>

        </div>
        
        <button onClick={calculate} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.01] mt-8 mb-8 text-lg">
          Calcular Melhor Decisão Financeira
        </button>
        
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600 flex flex-col relative overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🏦</div>
              <h4 className="font-bold text-orange-400 mb-4 text-lg border-b border-slate-600 pb-2">Opção 1: Financiar</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-400">Patrimônio Final (Imóvel)</span>
                  <span className="text-xl font-bold text-white">{maskCurrency(result.finance.finalAsset, isPrivacyMode)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-400">Total Pago ao Banco</span>
                  <span className="text-sm font-medium text-red-400">{maskCurrency(result.finance.totalPaid, isPrivacyMode)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-400">Parcela Inicial</span>
                  <span className="text-sm font-medium text-slate-200">{maskCurrency(result.finance.monthlyPayment, isPrivacyMode)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600 flex flex-col relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">📈</div>
              <h4 className="font-bold text-emerald-400 mb-4 text-lg border-b border-slate-600 pb-2">Opção 2: Alugar e Investir</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-400">Patrimônio Final (Investimentos)</span>
                  <span className="text-2xl font-black text-white">{maskCurrency(result.rent.finalAsset, isPrivacyMode)}</span>
                </div>
                <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    Esta opção vence se você investir rigorosamente a diferença entre a parcela e o aluguel, mais a entrada inicial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =======================
// DEBT OPTIMIZER
// =======================
export const DebtOptimizerTool: React.FC<ToolProps> = ({ isPrivacyMode = false, navigateToHome }) => {
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = localStorage.getItem('finpro_debts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newDebt, setNewDebt] = useState({ name: '', totalValue: 0, interestRate: 0, minPayment: 0 });
  const [extraPayment, setExtraPayment] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('finpro_debts', JSON.stringify(debts));
  }, [debts]);

  const addDebt = () => {
    if (!newDebt.name || newDebt.totalValue <= 0) return;
    setDebts([...debts, { ...newDebt, id: Math.random().toString() }]);
    setNewDebt({ name: '', totalValue: 0, interestRate: 0, minPayment: 0 });
  };

  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {navigateToHome && <Breadcrumb items={[{ label: 'Home', action: navigateToHome }, { label: 'Otimizador de Dívidas' }]} />}
      
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
          <span className="text-4xl">🏔️</span>
          <div>
            <h3 className="text-2xl font-bold text-white">Método Avalanche</h3>
            <p className="text-slate-400 text-sm">A forma matematicamente mais eficiente de sair das dívidas.</p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 mb-8 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Adicionar Dívida</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Nome (Ex: Cartão)" className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
            <input placeholder="Valor Total" type="number" className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" value={newDebt.totalValue || ''} onChange={e => setNewDebt({...newDebt, totalValue: +e.target.value})} />
            <input placeholder="Juros % a.m." type="number" className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" value={newDebt.interestRate || ''} onChange={e => setNewDebt({...newDebt, interestRate: +e.target.value})} />
            <button onClick={addDebt} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg p-2 transition-colors flex items-center justify-center gap-2">
              <span>+</span> Adicionar
            </button>
          </div>
        </div>

        {debts.length > 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              {debts.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{d.name}</span>
                    <span className="text-xs text-red-300">Juros: {d.interestRate}% a.m.</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-slate-200">{maskCurrency(d.totalValue, isPrivacyMode)}</span>
                    <button onClick={() => removeDebt(d.id)} className="text-slate-500 hover:text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-700">
              <ToolInput label="Valor Extra Disponível para Quitar (Mensal)" prefix="R$" value={extraPayment} onChange={(e: any) => setExtraPayment(+e.target.value)} />
              <button onClick={() => setResult(calculateDebtAvalanche(debts, extraPayment))} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/30 transition-all hover:scale-[1.01]">
                Gerar Plano de Liberdade
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-slate-900 rounded-2xl border border-emerald-500/30 text-center animate-in zoom-in">
            <h4 className="text-emerald-400 font-bold text-2xl mb-2">Liberdade em {result.monthsToFreedom} meses!</h4>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Seguindo o método Avalanche (focando na dívida mais cara primeiro), você pagará o mínimo de juros possível e sairá do buraco muito mais rápido.
            </p>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4">Como Funciona o Método Avalanche</h3>
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2"><span>1.</span> Ordena dívidas por taxa de juros (maior primeiro)</li>
              <li className="flex gap-2"><span>2.</span> Pague o mínimo em todas as dívidas</li>
              <li className="flex gap-2"><span>3.</span> Invista extra na dívida com maior taxa</li>
              <li className="flex gap-2"><span>4.</span> Quando eliminar, passa para a próxima</li>
            </ol>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-4">Economia Estimada</h3>
            <p className="text-3xl font-bold text-emerald-400">
              {result ? maskCurrency(result.totalInterestPaid || 0, isPrivacyMode) : "R$ 0,00"}
            </p>
            <p className="text-xs text-slate-400 mt-2">Será atualizado ao calcular o plano</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-400 mb-4">💡 Dicas Importantes</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>- Automatize os pagamentos mensais</li>
              <li>- Evite contrair novas dívidas no período</li>
              <li>- Tente renegociar taxas com credores</li>
              <li>- Use qualquer renda extra para abater</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// =======================
// FIRE CALCULATOR (Layout Wide)
// =======================
export const FireCalculatorTool: React.FC<ToolProps> = ({ isPrivacyMode = false, navigateToHome }) => {
  const [expenses, setExpenses] = useState(5000);
  const [result, setResult] = useState<number>(0);

  return (
    <div className="space-y-6">
      {navigateToHome && <Breadcrumb items={[{ label: 'Home', action: navigateToHome }, { label: 'Calculadora FIRE' }]} />}
      
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <span className="text-6xl block mb-4">🔥</span>
          <h3 className="text-3xl font-bold text-white mb-2">Calculadora FIRE</h3>
          <p className="text-slate-400 text-sm">Financial Independence, Retire Early (Regra dos 4%)</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
            {/* Input Section */}
            <div className="space-y-8">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-600">
                    <label className="block text-sm font-bold text-slate-300 mb-6 text-center uppercase tracking-widest">
                        Qual seu custo de vida mensal desejado?
                    </label>
                    <div className="relative max-w-sm mx-auto">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xl">R$</span>
                        <input 
                            type="number" 
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-3xl text-white font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                            value={expenses} 
                            onChange={e => setExpenses(+e.target.value)} 
                        />
                    </div>
                </div>

                <button 
                    onClick={() => setResult(calculateFire({monthlyExpenses: expenses, currentNetWorth: 0, monthlyContribution: 0, annualReturn: 0, inflation: 0, safeWithdrawalRate: 4}).fireNumber)} 
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xl font-bold py-5 rounded-xl shadow-lg shadow-orange-900/30 transition-all hover:scale-[1.01]"
                >
                    Calcular Meu Número Mágico
                </button>
            </div>

            {/* Result Section (Side by side on big screens) */}
            <div className={`transition-all duration-500 ${result > 0 ? 'opacity-100 translate-x-0' : 'opacity-50 blur-sm grayscale'}`}>
                <div className="text-center p-8 bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl border border-orange-500/30 shadow-2xl h-full flex flex-col justify-center">
                    <p className="text-slate-400 mb-4 font-medium uppercase tracking-widest text-sm">Patrimônio Necessário</p>
                    <p className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
                        {result > 0 ? maskCurrency(result, isPrivacyMode) : "R$ ---"}
                    </p>
                    
                    <div className="flex justify-center items-center gap-2">
                    <div className="inline-block bg-slate-900/50 px-6 py-3 rounded-lg border border-slate-600">
                        <p className="text-sm text-slate-400">
                        Baseado na retirada segura de <span className="text-orange-400 font-bold">4% ao ano</span>.
                        </p>
                    </div>
                    
                    <div className="group relative cursor-help">
                        <div className="w-6 h-6 rounded-full border border-slate-500 text-slate-500 flex items-center justify-center text-sm font-bold hover:border-orange-400 hover:text-orange-400 transition-colors bg-slate-900">?</div>
                        <div className="absolute bottom-full right-0 mb-3 w-80 p-4 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-left leading-relaxed">
                            Para chegar a este valor, multiplicamos seu custo mensal por 12 e dividimos por 0,04, o que equivale a acumular cerca de 25 vezes seu gasto anual. Estudos históricos indicam que esse montante costuma permitir saques sustentáveis de 4% ao ano na aposentadoria. Esta é uma estimativa educacional, não uma recomendação de investimento.
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// =======================
// INFLATION TOOL (Layout Wide)
// =======================
export const InflationTool: React.FC<ToolProps> = ({ isPrivacyMode = false, navigateToHome }) => {
  const [val, setVal] = useState(100);
  const [year, setYear] = useState(2010);
  const [res, setRes] = useState<any>(null);

  return (
    <div className="space-y-6">
      {navigateToHome && <Breadcrumb items={[{ label: 'Home', action: navigateToHome }, { label: 'Poder de Compra' }]} />}
      
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
          <span className="text-4xl">💸</span>
          <div>
            <h3 className="text-2xl font-bold text-white">Calculadora de Poder de Compra</h3>
            <p className="text-slate-400 text-sm">Descubra quanto seu dinheiro perdeu de valor ao longo do tempo.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {/* Controls */}
            <div className="space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <ToolInput label="Valor Antigo" prefix="R$" value={val} onChange={(e: any) => setVal(+e.target.value)} />
                    <ToolInput label="Ano de Referência" prefix="📅" value={year} onChange={(e: any) => setYear(+e.target.value)} />
                </div>

                <button 
                    onClick={() => setRes(calculateInflationLoss(val, year))} 
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:scale-[1.01]"
                >
                    Atualizar pelo IPCA (Estimado)
                </button>
            </div>
            
            {/* Results */}
            <div className={`flex items-center justify-center ${!res ? 'opacity-50' : ''}`}>
                {res ? (
                    <div className="text-center w-full bg-slate-700/30 p-8 rounded-2xl border border-slate-600 animate-in zoom-in">
                        <p className="text-slate-400 text-sm mb-4 uppercase tracking-widest">Para comprar o mesmo hoje, você precisaria de:</p>
                        <p className="text-5xl font-black text-white mb-6">{maskCurrency(res.todayValue, isPrivacyMode)}</p>
                        
                        <div className="inline-flex items-center gap-2 bg-red-900/30 px-4 py-2 rounded-lg border border-red-500/30">
                            <span className="text-red-400 font-bold">Invisível:</span>
                            <span className="text-slate-300 text-sm">Seu dinheiro perdeu <strong>{res.lossPercentage.toFixed(0)}%</strong> do poder de compra.</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <span className="text-6xl block mb-4 opacity-20">📊</span>
                        <p>Preencha os dados ao lado para simular.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
