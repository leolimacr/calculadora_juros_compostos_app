import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  TrendingUp, Flame, Zap, Info, Target, ArrowUpRight, 
  ShieldCheck, CircleDollarSign, Briefcase, PiggyBank,
  Lock, Globe, Smartphone, UserPlus, LogIn,
  HelpCircle
} from 'lucide-react';

// === COMPONENTE DE BLOQUEIO WEB-ONLY (MOBILE APP) ===
const WebOnlyBlock = ({ title, onBack }: any) => {
  const handleOpenBrowser = async () => {
    await Browser.open({ url: 'https://www.financasproinvest.com.br' });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-8 animate-in fade-in zoom-in-95">
      <div className="w-24 h-24 bg-sky-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-sky-400 border border-sky-500/20 shadow-2xl">
        <Smartphone size={48} className="opacity-50 absolute" />
        <Lock size={32} className="relative z-10" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{title}</h2>
        <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 inline-block">
            Disponível na Versão Web
        </div>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
        Para garantir a melhor precisão nos gráficos e uma experiência analítica completa, esta ferramenta é exclusiva para acesso via desktop ou navegador.
      </p>

      <div className="pt-6 flex flex-col gap-4">
        <button 
            onClick={handleOpenBrowser}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
            <Globe size={18}/> Acessar Versão Completa no Site
        </button>
        <button onClick={() => onBack('home')} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
            Voltar ao Gerenciador
        </button>
      </div>
    </div>
  );
};

// === COMPONENTE DE BLOQUEIO DE LOGIN (GATE) ===
const ToolGate = ({ title, description, onNavigate }: any) => (
  <div className="max-w-4xl mx-auto px-6 py-20 text-center animate-in fade-in slide-in-from-bottom-8">
    <button onClick={() => onNavigate('home')} className="mb-12 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">← Voltar</button>
    
    <div className="bg-slate-900/80 border border-slate-800 p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-400 shadow-xl border border-slate-700">
            <Lock size={32} />
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">{title}</h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-10">{description}</p>

        <div className="flex flex-col md:flex-row justify-center gap-4 max-w-md mx-auto">
            <button 
                onClick={() => onNavigate('register')}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <UserPlus size={18}/> Criar Conta Grátis
            </button>
            <button 
                onClick={() => onNavigate('login')}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <LogIn size={18}/> Já tenho conta
            </button>
        </div>
        
        <p className="mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-widest">Acesso liberado em menos de 1 minuto</p>
    </div>
  </div>
);

const ToolLayout = ({ title, icon, onBack, children, description, badge }: any) => {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) return <WebOnlyBlock title={title} onBack={onBack} />;

  return (
    <div className="max-w-6xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <button onClick={() => onBack('home')} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-sky-400 transition-all font-black uppercase text-[10px] tracking-[0.2em]">
        ← Voltar para o Hub
      </button>
      
      <div className="bg-slate-900/80 border border-slate-800 p-6 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[120px] -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-800/50 pb-8">
          <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-slate-700">{icon}</div>
              <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{title}</h1>
                    {badge && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">{badge}</span>}
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">{description}</p>
              </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, prefix, placeholder, help }: any) => (
  <div className="space-y-3 flex-1">
    <div className="flex items-center gap-2 ml-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
      {help && <div className="group relative text-slate-600"><HelpCircle size={12}/><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700 shadow-xl">{help}</div></div>}
    </div>
    <div className="relative group">
      {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-sky-400 transition-colors">{prefix}</span>}
      <input type="number" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full bg-black/20 border border-slate-700 rounded-2xl p-5 text-white font-black text-lg focus:border-sky-500 outline-none transition-all placeholder:text-slate-700 ${prefix ? 'pl-12' : ''}`} />
    </div>
  </div>
);

// === 1. JUROS COMPOSTOS ===
export const CompoundInterestTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated) return <ToolGate title="Simulador de Riqueza" description="Descubra exatamente quanto tempo falta para você atingir seu primeiro milhão com o poder dos juros compostos." onNavigate={onNavigate} />;

  const [inputs, setInputs] = useState({ p: '', m: '', r: '', t: '' });
  const [result, setResult] = useState<any>(null);
  const calculate = () => {
    const p = Number(inputs.p) || 0; const m = Number(inputs.m) || 0; const rAnual = Number(inputs.r) || 0; const tAnos = Number(inputs.t) || 0;
    if (rAnual <= 0 || tAnos <= 0) { alert("Preencha taxa e tempo."); return; }
    const rMensal = rAnual / 100 / 12; const nMeses = tAnos * 12;
    let dataPoints: any[] = []; let currentBalance = p; let totalInvested = p;
    for (let i = 1; i <= nMeses; i++) {
      currentBalance = (currentBalance * (1 + rMensal)) + m;
      totalInvested += m;
      if (i % 12 === 0 || i === nMeses) dataPoints.push({ year: i / 12, balance: currentBalance, invested: totalInvested });
    }
    setResult({ total: currentBalance, investido: totalInvested, juros: currentBalance - totalInvested, percentJuros: (currentBalance > 0 ? (currentBalance - totalInvested) / currentBalance : 0) * 100, chart: dataPoints });
    if (onCalcUpdate) onCalcUpdate({ type: 'JUROS_COMPOSTOS', label: 'Calculadora de Juros Compostos', details: `Simulação de R$ ${currentBalance.toLocaleString('pt-BR')} em ${tAnos} anos.` });
  };
  return (
    <ToolLayout title="Calculadora de Juros Compostos" icon="📈" onBack={onNavigate} description="O poder do tempo transformando centavos em milhões." badge="Efeito Bola de Neve">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Aporte Inicial" value={inputs.p} onChange={(v: any) => setInputs({...inputs, p: v})} prefix="R$" placeholder="0,00" />
                <Input label="Aporte Mensal" value={inputs.m} onChange={(v: any) => setInputs({...inputs, m: v})} prefix="R$" placeholder="0,00" />
                <Input label="Taxa Anual (%)" value={inputs.r} onChange={(v: any) => setInputs({...inputs, r: v})} prefix="%" placeholder="12" />
                <Input label="Tempo (Anos)" value={inputs.t} onChange={(v: any) => setInputs({...inputs, t: v})} placeholder="20" />
            </div>
            <button onClick={calculate} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"><Zap size={20}/> CALCULAR MEU FUTURO</button>
        </div>
        <div className="lg:col-span-7">{result && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 p-10 rounded-[2.5rem] text-center shadow-2xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Patrimônio Estimado</p>
                    <p className="text-5xl md:text-7xl font-black text-white tracking-tighter">R$ {result.total.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-slate-800"><p className="text-slate-500 text-[9px] font-black uppercase mb-2 tracking-widest">Do seu Bolso</p><p className="text-2xl font-black text-white">R$ {result.investido.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p></div>
                    <div className="bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/20"><p className="text-emerald-500 text-[9px] font-black uppercase mb-2 tracking-widest">Lucro em Juros</p><p className="text-2xl font-black text-emerald-400">R$ {result.juros.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p></div>
                </div>
            </div>
        )}</div>
      </div>
    </ToolLayout>
  );
};

// === 2. CALCULADORA FIRE ===
export const FireCalculatorTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated) return <ToolGate title="Calculadora FIRE" description="Descubra o número exato que você precisa acumular para viver de renda para sempre e nunca mais depender de salário." onNavigate={onNavigate} />;

  const [expense, setExpense] = useState('');
  const [result, setResult] = useState<any>(null);
  const calculate = () => {
    const exp = Number(expense); if (exp <= 0) return;
    setResult({ fire: exp * 300, passive: exp });
    if (onCalcUpdate) onCalcUpdate({ type: 'FIRE', label: 'Calculadora Fire', details: `Meta FIRE: R$ ${(exp*300).toLocaleString('pt-BR')}.` });
  };
  return (
    <ToolLayout title="Calculadora Fire" icon="🔥" onBack={onNavigate} description="O número exato que compra a sua liberdade." badge="Independência Financeira">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row items-end gap-4">
            <Input label="Gasto Mensal Desejado" value={expense} onChange={setExpense} prefix="R$" placeholder="5.000" />
            <button onClick={calculate} className="w-full md:w-auto px-10 bg-orange-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl">CALCULAR</button>
        </div>
        {result && (
            <div className="bg-[#020617] border border-orange-500/30 rounded-[3rem] p-10 md:p-16 text-center animate-in zoom-in-95">
                <p className="text-orange-500 text-xs font-black mb-2 tracking-widest uppercase">Seu Número da Liberdade</p>
                <p className="text-6xl md:text-8xl font-black text-white tracking-tighter">R$ {result.fire.toLocaleString('pt-BR')}</p>
            </div>
        )}
      </div>
    </ToolLayout>
  );
};

// === 3. PROJETOR DE DIVIDENDOS ===
export const DividendsTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
    if (!isAuthenticated) return <ToolGate title="Projetor de Dividendos" description="Simule sua renda passiva mensal com base nos seus investimentos e crie seu salário vitalício." onNavigate={onNavigate} />;

    const [inputs, setInputs] = useState({ capital: '', yield: '' });
    const [result, setResult] = useState<any>(null);
    const calculate = () => {
        const cap = Number(inputs.capital); const y = Number(inputs.yield);
        if (cap <= 0 || y <= 0) return;
        const monthly = (cap * (y / 100)) / 12;
        setResult({ monthly, annual: cap * (y/100), daily: monthly/30 });
        if (onCalcUpdate) onCalcUpdate({ type: 'DIVIDENDOS', label: 'Projetor de Dividendos', details: `Renda projetada: R$ ${monthly.toLocaleString('pt-BR')}/mês.` });
    };
    return (
        <ToolLayout title="Projetor de Dividendos" icon="📊" onBack={onNavigate} description="Visualize sua renda passiva real." badge="Foco em Renda">
            <div className="max-w-4xl mx-auto space-y-8 text-center">
                <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Patrimônio Investido" value={inputs.capital} onChange={(v:any) => setInputs({...inputs, capital: v})} prefix="R$" placeholder="100.000" />
                    <Input label="Dividend Yield Anual (%)" value={inputs.yield} onChange={(v:any) => setInputs({...inputs, yield: v})} prefix="%" placeholder="8.5" />
                </div>
                <button onClick={calculate} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">PROJETAR RENDA</button>
                {result && <div className="text-5xl font-black text-emerald-400 mt-8">R$ {result.monthly.toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mês</div>}
            </div>
        </ToolLayout>
    );
};

// === OUTRAS FERRAMENTAS ===
export const InflationTool = ({ onNavigate, isAuthenticated }: any) => {
    if (!isAuthenticated) return <ToolGate title="Calculadora de Inflação" description="Veja como a inflação destrói o poder de compra do dinheiro parado e aprenda a se proteger." onNavigate={onNavigate} />;

    const [v, setV] = useState(''); const [res, setRes] = useState<any>(null);
    const calculate = () => { const val = Number(v); if (val <= 0) return; setRes({ five: val * 0.8, ten: val * 0.64 }); };
    return (
        <ToolLayout title="Poder de Compra" icon="📉" onBack={onNavigate} description="A inflação corrói o dinheiro parado." badge="Alerta">
            <div className="max-w-2xl mx-auto space-y-6 text-center">
                <Input label="Dinheiro Parado" value={v} onChange={setV} prefix="R$" placeholder="10.000" />
                <button onClick={calculate} className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold">ANALISAR</button>
                {res && <div className="text-3xl font-black text-red-500 mt-4">Vale apenas R$ {res.five.toLocaleString('pt-BR')} em 5 anos.</div>}
            </div>
        </ToolLayout>
    );
};

export const RentVsFinanceTool = ({ onNavigate, isAuthenticated }: any) => {
    if (!isAuthenticated) return <ToolGate title="Imóveis: Alugar vs Comprar" description="A decisão financeira mais importante da sua vida exige matemática, não emoção. Faça a escolha certa." onNavigate={onNavigate} />;
    return <PlaceholderTool title="Imóveis (Alugar vs Comprar)" icon="🏠" onBack={onNavigate} desc="Decisão financeira simplificada." />;
};

export const DebtOptimizerTool = ({ onNavigate, isAuthenticated }: any) => {
    if (!isAuthenticated) return <ToolGate title="Otimizador de Dívidas" description="Crie um plano de batalha matemático para sair do vermelho o mais rápido possível." onNavigate={onNavigate} />;
    return <PlaceholderTool title="Otimizador de Dívidas" icon="💳" onBack={onNavigate} desc="Saia do vermelho rápido." />;
};

const PlaceholderTool = ({ title, icon, onBack, desc }: any) => (
  <ToolLayout title={title} icon={icon} onBack={onBack} description={desc} badge="Em Breve">
    <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
       <div className="p-6 bg-slate-800/50 rounded-full animate-pulse"><Zap size={48} className="text-slate-600" /></div>
       <div className="space-y-2">
         <h3 className="text-xl font-black text-white uppercase tracking-tighter">Engenharia em progresso</h3>
         <p className="text-slate-500 text-sm max-w-xs mx-auto">Estamos calibrando os algoritmos para esta ferramenta.</p>
       </div>
    </div>
  </ToolLayout>
);