import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout, ToolGate } from './ToolComponents';
import { Target, Wallet, TrendingUp, Clock, Flame, BookOpen, ShieldCheck, PieChart } from 'lucide-react';

// 1. COMPONENTE EXTRAÍDO PARA FORA (Isso resolve o bug do foco)
const PremiumInput = ({ label, icon: Icon, value, onChange, prefix = "R$" }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider text-xs">
      <Icon size={14} className="text-orange-500" />
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{prefix}</span>
      <input 
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-xl focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-700"
        placeholder="0"
      />
    </div>
  </div>
);

// 2. NOVO COMPONENTE: Abas Educativas
const EducationalTabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      title: 'O que é FIRE?',
      icon: Flame,
      content: 'FIRE significa "Financial Independence, Retire Early" (Independência Financeira, Aposentadoria Antecipada). É um movimento focado em acumular patrimônio suficiente para que os rendimentos dos seus investimentos cubram todos os seus custos de vida, permitindo que você trabalhe apenas por opção, e não por necessidade.'
    },
    {
      id: 1,
      title: 'Como Funciona?',
      icon: BookOpen,
      content: 'A calculadora usa a famosa "Regra dos 4%". Estudos históricos (como o Estudo Trinity) mostram que, se você tiver um portfólio bem diversificado, pode sacar 4% dele ao ano (ajustado pela inflação) de forma segura, sem que o dinheiro acabe em um período de 30 anos ou mais. Para achar seu número, basta multiplicar seu custo anual por 25 (ou mensal por 300).'
    },
    {
      id: 2,
      title: 'Por que Importa?',
      icon: ShieldCheck,
      content: 'Depender exclusivamente do governo (INSS) ou de uma única fonte de renda ativa é o maior risco que você pode correr no século 21. Atingir seu número FIRE significa comprar de volta o seu tempo, ter segurança absoluta para sua família e ter o poder de escolha sobre onde, como e com quem você quer viver.'
    },
    {
      id: 3,
      title: 'Perfis de Retirada',
      icon: PieChart,
      content: 'O perfil Conservador (3%) exige um patrimônio maior, mas oferece segurança quase à prova de balas contra crises severas. O Padrão (4%) é a regra de ouro do mercado. O Agressivo (5%) exige menos dinheiro acumulado e permite que você se aposente mais rápido, mas pode exigir ajustes nos gastos durante anos de crise econômica.'
    }
  ];

  return (
    <div className="bg-[#020617] border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl mt-8">
      {/* Navegação das Abas */}
      <div className="flex overflow-x-auto border-b border-slate-800 hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive 
                  ? 'border-orange-500 text-orange-500 bg-orange-500/5' 
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={16} />
              {tab.title}
            </button>
          );
        })}
      </div>
      
      {/* Conteúdo da Aba */}
      <div className="p-6 md:p-8 min-h-[180px] text-slate-300 leading-relaxed text-sm md:text-base animate-in fade-in duration-300">
        <p>{tabs[activeTab].content}</p>
      </div>
    </div>
  );
};

// 3. COMPONENTE PRINCIPAL
export const FireCalculatorTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated) return <ToolGate title="Calculadora FIRE" description="Descubra o número exato que você precisa acumular para viver de renda para sempre e nunca mais depender de salário." onNavigate={onNavigate} />;

  // Estados
  const [expense, setExpense] = useState<number>(5000);
  const [currentWealth, setCurrentWealth] = useState<number>(0);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(1000);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(0.04);

  // Motor de Cálculo
  const result = useMemo(() => {
    const fireNumber = expense * (12 / withdrawalRate);
    
    let months = 0;
    let balance = currentWealth;
    const monthlyRate = Math.pow(1 + 0.06, 1 / 12) - 1; // 6% a.a. real
    
    if (balance < fireNumber && monthlyInvestment > 0) {
      while (balance < fireNumber && months < 1200) {
        balance = balance * (1 + monthlyRate) + monthlyInvestment;
        months++;
      }
    }

    const yearsToFire = balance >= fireNumber ? (months / 12) : null;

    return {
      fireNumber,
      yearsToFire,
      percentageDone: Math.min((currentWealth / fireNumber) * 100, 100)
    };
  }, [expense, currentWealth, monthlyInvestment, withdrawalRate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCalcUpdate && result.fireNumber > 0) {
        onCalcUpdate({ 
          type: 'FIRE', 
          label: 'Calculadora Fire', 
          details: `Meta: R$ ${result.fireNumber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} | Faltam: ${result.yearsToFire ? result.yearsToFire.toFixed(1) + ' anos' : '∞'}` 
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [result, onCalcUpdate]);

  return (
    <ToolLayout title="Calculadora Fire" icon="🔥" onBack={onNavigate} description="O número exato que compra a sua liberdade." badge="Independência Financeira">
      
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* LADO ESQUERDO: Controles e Educação */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Cartão de Inputs */}
          <div className="bg-[#020617] border border-slate-800 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-xl">
            <PremiumInput label="Gasto Mensal Desejado na Aposentadoria" icon={Target} value={expense} onChange={setExpense} />
            <PremiumInput label="Patrimônio Atual Investido" icon={Wallet} value={currentWealth} onChange={setCurrentWealth} />
            <PremiumInput label="Aporte Mensal (Quanto consegue investir?)" icon={TrendingUp} value={monthlyInvestment} onChange={setMonthlyInvestment} />

            {/* Seletor de Perfil */}
            <div className="space-y-3 pt-4 border-t border-slate-800/50">
              <label className="text-sm font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider text-xs">
                Perfil de Retirada Segura
              </label>
              <div className="flex gap-2 p-1 bg-[#0f172a] rounded-2xl border border-slate-800 overflow-x-auto hide-scrollbar">
                {[
                  { label: 'Conservador (3%)', value: 0.03 },
                  { label: 'Padrão (4%)', value: 0.04 },
                  { label: 'Agressivo (5%)', value: 0.05 }
                ].map(profile => (
                  <button
                    key={profile.value}
                    onClick={() => setWithdrawalRate(profile.value)}
                    className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all ${withdrawalRate === profile.value ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Abas Educativas (Aparecem logo abaixo dos inputs) */}
          <EducationalTabs />
        </div>

        {/* LADO DIREITO: Dashboard de Resultados (Sticky) */}
        <div className="w-full lg:w-1/2">
          <div className="sticky top-8 bg-gradient-to-br from-[#020617] to-[#0f172a] border border-orange-500/30 rounded-[3rem] p-8 md:p-12 text-center shadow-2xl shadow-orange-900/20">
            
            <div className="mb-10">
              <p className="text-orange-500 text-xs font-black mb-3 tracking-[0.2em] uppercase">Seu Número da Liberdade</p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter">
                R$ {result.fireNumber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </h2>
            </div>

            <div className="mb-10 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Progresso Atual</span>
                <span className="text-orange-400">{result.percentageDone.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-orange-600 to-yellow-400 transition-all duration-1000 ease-out"
                  style={{ width: `${result.percentageDone}%` }}
                />
              </div>
            </div>

            <div className="bg-[#020617]/50 rounded-3xl p-6 border border-slate-800 flex items-center justify-center gap-4">
              <div className="bg-orange-500/10 p-4 rounded-2xl">
                <Clock className="text-orange-500" size={32} />
              </div>
              <div className="text-left">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Tempo Estimado Restante</p>
                {result.yearsToFire !== null ? (
                  <p className="text-3xl font-black text-white">
                    {result.yearsToFire.toFixed(1)} <span className="text-lg text-slate-500">anos</span>
                  </p>
                ) : (
                  <p className="text-xl font-black text-red-400">Aumente o aporte</p>
                )}
              </div>
            </div>

            <p className="text-slate-500 text-[10px] mt-8 uppercase tracking-wider max-w-[250px] mx-auto leading-relaxed">
              Cálculo baseado em rendimento real projetado de 6% ao ano acima da inflação.
            </p>

          </div>
        </div>

      </div>

      {/* CSS extra para esconder a scrollbar nativa em componentes com scroll horizontal (mobile) */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </ToolLayout>
  );
};