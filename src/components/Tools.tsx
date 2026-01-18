
import React, { useState, useEffect } from 'react';
import { calculateRentVsFinance, calculateDebtAvalanche, calculateFire, calculateInflationLoss, formatCurrency, maskCurrency } from '../utils/calculations';
import { DebtItem } from '../types';
import Breadcrumb from './Breadcrumb';
import Paywall from './Paywall'; // Import Paywall
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess'; // Import Hook

interface ToolProps {
  toolType?: string;
  isPrivacyMode?: boolean;
  onNavigate: (path: string) => void; // Atualizado de navigateToHome para onNavigate genérico
}

// Componente de Input Reutilizável
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

// Loading State
const ToolLoading = () => (
  <div className="w-full h-64 bg-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center">
    <div className="text-slate-500 text-sm font-medium">Verificando acesso...</div>
  </div>
);

// =======================
// RENT VS FINANCE
// =======================
export const RentVsFinanceTool: React.FC<ToolProps> = ({ isPrivacyMode = false, onNavigate }) => {
  const { isPro, loadingSubscription } = useSubscriptionAccess();
  
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

  if (loadingSubscription) return <ToolLoading />;

  if (!isPro) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Alugar vs Financiar' }]} />
        <Paywall 
          source="rent_vs_finance" 
          title="Decisão Imobiliária Inteligente"
          description="Compare matematicamente se vale a pena financiar um imóvel ou viver de aluguel e investir a diferença."
          highlights={["Comparativo de Patrimônio Final", "Análise de Juros Pagos", "Cenários Personalizáveis"]}
          onUpgrade={() => onNavigate('upgrade')}
        />
      </div>
    );
  }

  const calculate = () => setResult(calculateRentVsFinance(input));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Alugar vs Financiar' }]} />
      
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
          <span className="text-4xl">🏡</span>
          <div>
            <h3 className="text-2xl font-bold text-white">Viver de Aluguel vs. Financiar</h3>
            <p className="text-slate-400 text-sm">Simulação matemática para decidir seu futuro imobiliário.</p>
          </div>
        </div>
        
        {/* ... Resto do componente mantido igual ... */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
             <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">1. O Imóvel</h4>
             <ToolInput label="Valor de Venda" prefix="R$" value={input.propertyValue} onChange={(e: any) => setInput({...input, propertyValue: +e.target.value})} />
             <ToolInput label="Valorização Anual" suffix="% a.a." value={input.appreciationRateYear} onChange={(e: any) => setInput({...input, appreciationRateYear: +e.target.value})} />
             <ToolInput label="Tempo" suffix="Anos" value={input.years} onChange={(e: any) => setInput({...input, years: +e.target.value})} />
          </div>
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
             <h4 className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">2. Financiar</h4>
             <ToolInput label="Entrada" prefix="R$" value={input.downPayment} onChange={(e: any) => setInput({...input, downPayment: +e.target.value})} />
             <ToolInput label="Juros (CET)" suffix="% a.a." value={input.interestRateYear} onChange={(e: any) => setInput({...input, interestRateYear: +e.target.value})} />
          </div>
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
             <h4 className="text-indigo-400 font-bold text-sm uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">3. Alugar</h4>
             <ToolInput label="Aluguel Mensal" prefix="R$" value={input.rentValue} onChange={(e: any) => setInput({...input, rentValue: +e.target.value})} />
             <ToolInput label="Rentabilidade Invest." suffix="% a.a." value={input.investmentRateYear} onChange={(e: any) => setInput({...input, investmentRateYear: +e.target.value})} />
          </div>
        </div>
        
        <button onClick={calculate} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg mt-8 mb-8 text-lg">Calcular Melhor Decisão</button>
        
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="font-bold text-orange-400 mb-4 text-lg border-b border-slate-600 pb-2">Opção 1: Financiar</h4>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Patrimônio Final</span><span className="text-white font-bold">{maskCurrency(result.finance.finalAsset, isPrivacyMode)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Total Pago</span><span className="text-red-400 font-medium">{maskCurrency(result.finance.totalPaid, isPrivacyMode)}</span></div>
              </div>
            </div>
            <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
              <h4 className="font-bold text-emerald-400 mb-4 text-lg border-b border-slate-600 pb-2">Opção 2: Alugar e Investir</h4>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Patrimônio Final</span><span className="text-white font-bold text-xl">{maskCurrency(result.rent.finalAsset, isPrivacyMode)}</span></div>
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
export const DebtOptimizerTool: React.FC<ToolProps> = ({ isPrivacyMode = false, onNavigate }) => {
  const { isPro, loadingSubscription } = useSubscriptionAccess();
  
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = localStorage.getItem('finpro_debts');
    return saved ? JSON.parse(saved) : [];
  });
  const [newDebt, setNewDebt] = useState({ name: '', totalValue: 0, interestRate: 0, minPayment: 0 });
  const [extraPayment, setExtraPayment] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { localStorage.setItem('finpro_debts', JSON.stringify(debts)); }, [debts]);

  const addDebt = () => {
    if (!newDebt.name || newDebt.totalValue <= 0) return;
    setDebts([...debts, { ...newDebt, id: Math.random().toString() }]);
    setNewDebt({ name: '', totalValue: 0, interestRate: 0, minPayment: 0 });
  };

  if (loadingSubscription) return <ToolLoading />;

  if (!isPro) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Otimizador de Dívidas' }]} />
        <Paywall 
          source="debt_optimizer" 
          title="Saia do Vermelho com Estratégia"
          description="Utilize o Método Avalanche para quitar suas dívidas pagando o mínimo possível de juros."
          highlights={["Plano de Pagamento Otimizado", "Calculadora de Economia de Juros", "Organização de Passivos"]}
          onUpgrade={() => onNavigate('upgrade')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Otimizador de Dívidas' }]} />
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ... Conteúdo do DebtOptimizer (mantido) ... */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
          <span className="text-4xl">🏔️</span>
          <div><h3 className="text-2xl font-bold text-white">Método Avalanche</h3><p className="text-slate-400 text-sm">A forma matematicamente mais eficiente de sair das dívidas.</p></div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 mb-8 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase">Adicionar Dívida</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Nome" className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
            <input placeholder="Valor Total" type="number" className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white" value={newDebt.totalValue || ''} onChange={e => setNewDebt({...newDebt, totalValue: +e.target.value})} />
            <input placeholder="Juros % a.m." type="number" className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white" value={newDebt.interestRate || ''} onChange={e => setNewDebt({...newDebt, interestRate: +e.target.value})} />
            <button onClick={addDebt} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg p-2">Adicionar</button>
          </div>
        </div>
        {debts.length > 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              {debts.map(d => (
                <div key={d.id} className="flex justify-between bg-slate-700 p-4 rounded-xl border border-slate-600">
                  <div><span className="font-bold text-white block">{d.name}</span><span className="text-xs text-red-300">{d.interestRate}% a.m.</span></div>
                  <div className="flex items-center gap-4"><span className="text-slate-200">{maskCurrency(d.totalValue, isPrivacyMode)}</span><button onClick={() => setDebts(debts.filter(x => x.id !== d.id))} className="text-red-400">✕</button></div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-700">
              <ToolInput label="Valor Extra Mensal" prefix="R$" value={extraPayment} onChange={(e: any) => setExtraPayment(+e.target.value)} />
              <button onClick={() => setResult(calculateDebtAvalanche(debts, extraPayment))} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg">Gerar Plano</button>
            </div>
          </div>
        )}
        {result && (
          <div className="mt-8 p-6 bg-slate-900 rounded-2xl border border-emerald-500/30 text-center">
            <h4 className="text-emerald-400 font-bold text-2xl">Liberdade em {result.monthsToFreedom} meses!</h4>
          </div>
        )}
      </div>
    </div>
  );
};

// =======================
// FIRE CALCULATOR
// =======================
export const FireCalculatorTool: React.FC<ToolProps> = ({ isPrivacyMode = false, onNavigate }) => {
  const { loadingSubscription } = useSubscriptionAccess();
  const [expenses, setExpenses] = useState(5000);
  const [result, setResult] = useState<number>(0);

  if (loadingSubscription) return <ToolLoading />;

  // Calculadora FIRE é gratuita, removido check de plano

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Calculadora FIRE' }]} />
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10"><span className="text-6xl block mb-4">🔥</span><h3 className="text-3xl font-bold text-white">Calculadora FIRE</h3></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-600">
                    <label className="block text-sm font-bold text-slate-300 mb-6 text-center uppercase">Custo de vida mensal desejado</label>
                    <div className="relative max-w-sm mx-auto"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xl">R$</span><input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-3xl text-white font-bold text-center" value={expenses} onChange={e => setExpenses(+e.target.value)} /></div>
                </div>
                <button onClick={() => setResult(calculateFire({monthlyExpenses: expenses, currentNetWorth: 0, monthlyContribution: 0, annualReturn: 0, inflation: 0, safeWithdrawalRate: 4}).fireNumber)} className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xl font-bold py-5 rounded-xl shadow-lg">Calcular</button>
            </div>
            <div className={`transition-all duration-500 ${result > 0 ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
                <div className="text-center p-8 bg-slate-700 rounded-2xl border border-orange-500/30 shadow-2xl">
                    <p className="text-slate-400 mb-4 font-medium uppercase">Patrimônio Necessário</p>
                    <p className="text-5xl font-black text-white">{result > 0 ? maskCurrency(result, isPrivacyMode) : "R$ ---"}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// =======================
// INFLATION TOOL
// =======================
export const InflationTool: React.FC<ToolProps> = ({ isPrivacyMode = false, onNavigate }) => {
  const { loadingSubscription } = useSubscriptionAccess();
  const [val, setVal] = useState(100);
  const [year, setYear] = useState(2010);
  const [res, setRes] = useState<any>(null);

  if (loadingSubscription) return <ToolLoading />;

  // Inflation Tool é gratuito
  
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', action: () => onNavigate('panel') }, { label: 'Poder de Compra' }]} />
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
          <span className="text-4xl">💸</span>
          <div><h3 className="text-2xl font-bold text-white">Calculadora de Poder de Compra</h3><p className="text-slate-400 text-sm">Descubra a inflação acumulada.</p></div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            <div className="space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <ToolInput label="Valor Antigo" prefix="R$" value={val} onChange={(e: any) => setVal(+e.target.value)} />
                    <ToolInput label="Ano de Referência" prefix="📅" value={year} onChange={(e: any) => setYear(+e.target.value)} />
                </div>
                <button onClick={() => setRes(calculateInflationLoss(val, year))} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 rounded-xl shadow-lg">Atualizar pelo IPCA</button>
            </div>
            <div className={`flex items-center justify-center ${!res ? 'opacity-50' : ''}`}>
                {res ? (
                    <div className="text-center w-full bg-slate-700/30 p-8 rounded-2xl border border-slate-600 animate-in zoom-in">
                        <p className="text-slate-400 text-sm mb-4 uppercase">Equivalente Hoje:</p>
                        <p className="text-5xl font-black text-white mb-6">{maskCurrency(res.todayValue, isPrivacyMode)}</p>
                    </div>
                ) : <div className="text-center text-slate-500">Preencha os dados.</div>}
            </div>
        </div>
      </div>
    </div>
  );
};