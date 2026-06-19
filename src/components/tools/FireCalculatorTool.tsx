import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout, ToolGate } from './ToolComponents';
import { Target, Wallet, TrendingUp, Clock, Flame, BookOpen, ShieldCheck, PieChart } from 'lucide-react';

const PremiumInput = ({ label, icon: Icon, value, onChange, prefix = "R$" }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-600 flex items-center gap-2 uppercase tracking-wider text-xs">
      <Icon size={14} className="text-orange-500" />
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{prefix}</span>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold text-xl shadow-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300"
        placeholder="0"
      />
    </div>
  </div>
);

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
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.08)] mt-8">
      <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar bg-slate-50/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              {tab.title}
            </button>
          );
        })}
      </div>

      <div className="p-6 md:p-8 min-h-[180px] text-slate-700 leading-relaxed text-sm md:text-base animate-in fade-in duration-300">
        <p>{tabs[activeTab].content}</p>
      </div>
    </div>
  );
};

export const FireCalculatorTool = ({ onNavigate, onCalcUpdate, isAuthenticated }: any) => {
  if (!isAuthenticated) {
    return (
      <ToolGate
        title="Calculadora FIRE"
        description="Descubra o número exato que você precisa acumular para viver de renda para sempre e nunca mais depender de salário."
        onNavigate={onNavigate}
      />
    );
  }

  const [expense, setExpense] = useState<number>(5000);
  const [currentWealth, setCurrentWealth] = useState<number>(0);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(1000);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(0.04);

  const result = useMemo(() => {
    const fireNumber = expense * (12 / withdrawalRate);

    let months = 0;
    let balance = currentWealth;
    const monthlyRate = Math.pow(1 + 0.06, 1 / 12) - 1;

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
    <ToolLayout
      title="Calculadora Fire"
      icon={<Flame size={36} className="text-orange-500" />}
      onBack={onNavigate}
      description="O número exato que compra a sua liberdade."
      badge="Independência Financeira"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <PremiumInput
              label="Compromisso Mensal Desejado na Aposentadoria"
              icon={Target}
              value={expense}
              onChange={setExpense}
            />
            <PremiumInput
              label="Patrimônio Atual Investido"
              icon={Wallet}
              value={currentWealth}
              onChange={setCurrentWealth}
            />
            <PremiumInput
              label="Aporte Mensal (Quanto consegue investir?)"
              icon={TrendingUp}
              value={monthlyInvestment}
              onChange={setMonthlyInvestment}
            />

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="text-sm font-semibold text-slate-600 flex items-center gap-2 uppercase tracking-wider text-xs">
                Perfil de Retirada Segura
              </label>
              <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 overflow-x-auto hide-scrollbar shadow-sm">
                {[
                  { label: 'Conservador (3%)', value: 0.03 },
                  { label: 'Padrão (4%)', value: 0.04 },
                  { label: 'Agressivo (5%)', value: 0.05 }
                ].map(profile => (
                  <button
                    key={profile.value}
                    onClick={() => setWithdrawalRate(profile.value)}
                    className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all ${
                      withdrawalRate === profile.value
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <EducationalTabs />
        </div>

        <div className="w-full lg:w-1/2">
          <div className="sticky top-8 bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-[3rem] p-8 md:p-12 text-center shadow-[0_30px_80px_rgba(249,115,22,0.12)]">
            <div className="mb-10">
              <p className="text-orange-600 text-xs font-black mb-3 tracking-[0.2em] uppercase">
                Seu Número da Liberdade
              </p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter">
                R$ {result.fireNumber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </h2>
            </div>

            <div className="mb-10 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Progresso Atual</span>
                <span className="text-orange-600">{result.percentageDone.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 ease-out"
                  style={{ width: `${result.percentageDone}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-center gap-4">
              <div className="bg-orange-50 p-4 rounded-2xl">
                <Clock className="text-orange-500" size={32} />
              </div>
              <div className="text-left">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">
                  Tempo Estimado Restante
                </p>
                {result.yearsToFire !== null ? (
                  <p className="text-3xl font-black text-slate-900">
                    {result.yearsToFire.toFixed(1)} <span className="text-lg text-slate-400">anos</span>
                  </p>
                ) : (
                  <p className="text-xl font-black text-red-500">Aumente o aporte</p>
                )}
              </div>
            </div>

            <p className="text-slate-400 text-[10px] mt-8 uppercase tracking-wider max-w-[250px] mx-auto leading-relaxed">
              Cálculo baseado em rendimento real projetado de 6% ao ano acima da inflação.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </ToolLayout>
  );
};
