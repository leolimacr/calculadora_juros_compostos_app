import React, { useState, useRef } from 'react';
import { ToolLayout, ToolGate } from './ToolComponents';
import {
  Target,
  Wallet,
  TrendingUp,
  Clock,
  Flame,
  ShieldCheck,
  PieChart,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── Helpers de Formatação ──────────────────────────────────────────────────

const fmtMoney = (n: number) =>
  'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

const formatMoneyInput = (value: number | '') => {
  if (value === '' || value === null || Number.isNaN(Number(value))) return '';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseMoneyDigits = (raw: string): number | '' => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits) / 100;
};

// ─── Campo de Moeda Seguro (Sem interceptação do scroll do mouse) ────────────

interface MoneyInputProps {
  label: string;
  icon: React.ElementType;
  value: number | '';
  onChange: (v: number | '') => void;
  hint?: string;
  placeholder?: string;
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  label,
  icon: Icon,
  value,
  onChange,
  hint,
  placeholder = '0,00',
}) => {
  const [focused, setFocused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const display = formatMoneyInput(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Icon size={14} className="text-orange-500 shrink-0" />
          {label}
        </label>
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="w-4 h-4 rounded-full border border-slate-300 text-[10px] font-black text-slate-400 bg-white hover:text-orange-600 hover:border-orange-400 transition-colors flex items-center justify-center"
            title="Mais informações"
          >
            ?
          </button>
        )}
      </div>

      {showHint && hint && (
        <p className="text-xs text-slate-600 bg-orange-50/80 border border-orange-100 rounded-xl p-3 leading-relaxed">
          {hint}
        </p>
      )}

      <div
        className={`relative flex items-center rounded-2xl border transition-all ${
          focused
            ? 'border-orange-500 ring-2 ring-orange-100 bg-white shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <span
          className={`absolute left-4 font-bold text-sm pointer-events-none transition-colors ${
            focused ? 'text-orange-500' : 'text-slate-400'
          }`}
        >
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(parseMoneyDigits(e.target.value))}
          className="w-full bg-transparent py-4 pl-12 pr-4 text-slate-900 font-black text-lg outline-none placeholder:text-slate-300"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

// ─── Seletor de Perfil de Retirada ──────────────────────────────────────────

interface WithdrawalSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const WithdrawalSelector: React.FC<WithdrawalSelectorProps> = ({ value, onChange }) => {
  const profiles = [
    { label: 'Conservador · 3%', value: 0.03, desc: 'Máxima proteção contra crises' },
    { label: 'Padrão · 4%', value: 0.04, desc: 'A regra de ouro (Trinity)' },
    { label: 'Dinâmico · 5%', value: 0.05, desc: 'Aposentadoria mais rápida' },
  ];

  return (
    <div className="space-y-2 pt-2">
      <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
        <PieChart size={14} className="text-orange-500" />
        Regra de Retirada Anual Segura
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {profiles.map((p) => {
          const isSelected = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-50/50 text-orange-900 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <p className="text-xs font-black">{p.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Seletor de Rentabilidade com Gate Pro ───────────────────────────────────

interface RateSelectorProps {
  value: number;
  onChange: (v: number) => void;
  isPro: boolean;
}

const RateSelector: React.FC<RateSelectorProps> = ({ value, onChange, isPro }) => {
  const presets = [
    { label: 'Conservador · 5% a.a.', value: 5 },
    { label: 'Moderado · 6% a.a.', value: 6 },
    { label: 'Crescimento · 8% a.a.', value: 8 },
  ];

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp size={14} className="text-orange-500" />
          Rendimento Real Projetado (Acima da Inflação)
        </label>
        {!isPro && (
          <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <Lock size={9} /> Pro
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {presets.map((p) => {
          const isSelected = value === p.value;
          return (
            <button
              key={p.value}
              type="button"
              disabled={!isPro && p.value !== 6}
              onClick={() => isPro && onChange(p.value)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500 text-white font-black shadow-sm'
                  : isPro
                  ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                  : p.value === 6
                  ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold'
                  : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-xs">
                {!isPro && p.value !== 6 && <Lock size={10} />}
                <span>{p.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      {!isPro && (
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Padrão fixado em 6% a.a. acima da inflação. Para calibrar cenários personalizados, assine o plano Pro.
        </p>
      )}
    </div>
  );
};

// ─── Seção Educativa (Acordeão) ──────────────────────────────────────────────

const TABS = [
  {
    id: 0,
    title: 'O que é o movimento FIRE?',
    icon: Flame,
    content:
      'FIRE significa "Financial Independence, Retire Early" (Independência Financeira, Aposentadoria Antecipada). O objetivo não é parar de trabalhar para ficar ocioso, mas sim acumular patrimônio suficiente para que os rendimentos cubram todos os seus custos de vida, permitindo que você trabalhe exclusivamente por escolha, com total autonomia sobre seu tempo.',
  },
  {
    id: 1,
    title: 'Como funciona a Regra dos 4%?',
    icon: BookOpen,
    content:
      'Criada pelo renomado Estudo Trinity, a regra demonstra que uma carteira diversificada em renda fixa e ações pode sustentar retiradas anuais de 4% (corrigidas pela inflação) por décadas sem esgotar o principal. Para descobrir sua meta: multiplique seu gasto anual por 25 (ou seu custo mensal por 300).',
  },
  {
    id: 2,
    title: 'Por que a soberania financeira importa?',
    icon: ShieldCheck,
    content:
      'Depender unicamente de salário mensal ou da previdência pública é um risco estrutural. Atingir seu Número da Liberdade devolve o controle da sua vida, protege sua família contra qualquer imprevisto e garante poder real de escolha.',
  },
  {
    id: 3,
    title: 'Qual taxa de retirada escolher?',
    icon: PieChart,
    content:
      '3% (Conservador): ideal para horizontes muito longos (40+ anos) ou cenários de maior cautela. 4% (Padrão): a referência global mais testada e equilibrada. 5% (Dinâmico): alcança a independência mais rápido, porém exige flexibilidade para reduzir despesas em períodos de crise.',
  },
];

const EducationalAccordeon: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mt-8 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Info size={14} className="text-slate-400" />
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
          Fundamentos da Metodologia FIRE
        </p>
      </div>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isOpen = open === tab.id;
        return (
          <div
            key={tab.id}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : tab.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-black text-slate-800">
                <Icon size={16} className="text-orange-500" />
                {tab.title}
              </span>
              {isOpen ? (
                <ChevronUp size={16} className="text-slate-400" />
              ) : (
                <ChevronDown size={16} className="text-slate-400" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {tab.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Tooltip do Gráfico ─────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 shadow-xl text-left border border-slate-800 pointer-events-none">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        {d.year === 0 ? 'Ponto Inicial (Hoje)' : `Ano ${d.year}`}
      </p>
      <p className="text-base font-black text-emerald-400 mt-0.5">
        {fmtMoney(d.patrimonio)}
      </p>
    </div>
  );
};

// ─── Componente Principal ───────────────────────────────────────────────────

interface FireCalculatorToolProps {
  onNavigate: (route: string) => void;
  onCalcUpdate?: (data: { type: string; label: string; details: string }) => void;
  isAuthenticated: boolean;
  isPro?: boolean;
  isPremium?: boolean;
}

interface CalculatedState {
  fireNumber: number;
  yearsToFire: number | null;
  percentageDone: number;
  alreadyFire: boolean;
  minMonthly: number | null;
  trajectory: { year: number; patrimonio: number }[];
  fireYear: number | null;
  arrivalAge: number | null;
  monthlyExpense: number;
  monthlyInvestment: number;
  currentWealth: number;
  withdrawalRate: number;
  returnRate: number;
}

export const FireCalculatorTool: React.FC<FireCalculatorToolProps> = ({
  onNavigate,
  onCalcUpdate,
  isAuthenticated,
  isPro = false,
  isPremium = false,
}) => {
  // Estado dos Inputs (não recalcula sozinho ao digitar)
  const [expense, setExpense] = useState<number | ''>(5000);
  const [currentWealth, setCurrentWealth] = useState<number | ''>(0);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number | ''>(1000);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(0.04);
  const [returnRate, setReturnRate] = useState<number>(6);
  const [currentAge, setCurrentAge] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Estado do Resultado (só preenchido após clicar no botão Calcular)
  const [result, setResult] = useState<CalculatedState | null>(null);

  // Referência para rolar até o resultado de forma suave
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // ── Função de Cálculo Executada Somente sob Demanda ───────────────────────
  const handleCalculate = () => {
    setFormError('');

    const exp = Number(expense) || 0;
    const wealth = Number(currentWealth) || 0;
    const monthly = Number(monthlyInvestment) || 0;
    const rate = isPro ? returnRate : 6;
    const ageNum = currentAge !== '' ? parseInt(currentAge, 10) : null;

    if (exp <= 0) {
      setFormError('Informe o custo mensal que você deseja ter na sua independência.');
      return;
    }

    const fireNumber = exp * (12 / withdrawalRate);
    const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
    const alreadyFire = wealth >= fireNumber;

    let months = 0;
    let balance = wealth;

    if (!alreadyFire && monthly > 0 && monthlyRate > 0) {
      while (balance < fireNumber && months < 1200) {
        balance = balance * (1 + monthlyRate) + monthly;
        months++;
      }
    }

    const yearsToFire = alreadyFire ? 0 : balance >= fireNumber ? months / 12 : null;
    const percentageDone = Math.min((wealth / fireNumber) * 100, 100);

    // Sugestão de aporte mínimo para 30 anos caso o atual não alcance
    let minMonthly: number | null = null;
    if (!alreadyFire && (monthly === 0 || yearsToFire === null) && monthlyRate > 0) {
      const targetMonths = 360;
      const r = monthlyRate;
      const fv = fireNumber;
      const pv = wealth;
      minMonthly = Math.ceil(
        (fv - pv * Math.pow(1 + r, targetMonths)) /
          ((Math.pow(1 + r, targetMonths) - 1) / r)
      );
    }

    // Trajetória patrimonial para o gráfico
    const trajectory: { year: number; patrimonio: number }[] = [];
    const maxMonths = alreadyFire ? 12 : Math.min((months || 360) + 24, 600);
    let runningBal = wealth;

    for (let mo = 0; mo <= maxMonths; mo += 6) {
      trajectory.push({
        year: Math.round((mo / 12) * 10) / 10,
        patrimonio: Math.round(runningBal),
      });
      for (let i = 0; i < 6; i++) {
        runningBal = runningBal * (1 + monthlyRate) + monthly;
      }
    }

    const fireYear =
      yearsToFire !== null && yearsToFire > 0
        ? Math.round(yearsToFire * 10) / 10
        : null;

    const arrivalAge =
      ageNum !== null && ageNum > 0 && yearsToFire !== null
        ? Math.round(ageNum + yearsToFire)
        : null;

    const newResult: CalculatedState = {
      fireNumber,
      yearsToFire,
      percentageDone,
      alreadyFire,
      minMonthly,
      trajectory,
      fireYear,
      arrivalAge,
      monthlyExpense: exp,
      monthlyInvestment: monthly,
      currentWealth: wealth,
      withdrawalRate,
      returnRate: rate,
    };

    setResult(newResult);

    if (onCalcUpdate) {
      onCalcUpdate({
        type: 'FIRE',
        label: 'Calculadora FIRE',
        details: `Meta: ${fmtMoney(fireNumber)} | Faltam: ${
          yearsToFire !== null ? yearsToFire.toFixed(1) + ' anos' : 'Rever aportes'
        }`,
      });
    }

    // Rola suavemente até o painel de resultados
    setTimeout(() => {
      resultsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);
  };

  const handleReset = () => {
    setExpense(5000);
    setCurrentWealth(0);
    setMonthlyInvestment(1000);
    setWithdrawalRate(0.04);
    setReturnRate(6);
    setCurrentAge('');
    setFormError('');
    setResult(null);
  };

  if (!isAuthenticated) {
    return (
      <ToolGate
        title="Calculadora FIRE"
        description="Descubra o número exato que você precisa acumular para viver de renda — com rigor matemático e segurança."
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <ToolLayout
      title="Calculadora FIRE"
      icon={<Flame size={36} className="text-orange-500" />}
      onBack={onNavigate}
      description="Descubra o patrimônio exato que financia sua liberdade definitiva."
      badge="Independência Financeira"
    >
      <div className="max-w-4xl mx-auto space-y-10">
        {/* ── Formulário Principal de Entrada ──────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sparkles className="text-orange-500" size={22} />
              Defina seus parâmetros
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Preencha com tranquilidade. Os cálculos serão realizados ao clicar no botão abaixo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoneyInput
              label="Quanto você quer gastar por mês quando for livre?"
              icon={Target}
              value={expense}
              onChange={setExpense}
              hint="O custo de vida desejado para cobrir todas as despesas pessoais, lazer, saúde e moradia."
            />

            <MoneyInput
              label="Quanto você já tem investido hoje?"
              icon={Wallet}
              value={currentWealth}
              onChange={setCurrentWealth}
              hint="O patrimônio líquido investido com liquidez ou rendimentos financeiros."
            />

            <MoneyInput
              label="Quanto você consegue investir por mês?"
              icon={TrendingUp}
              value={monthlyInvestment}
              onChange={setMonthlyInvestment}
              hint="O valor mensal que você consegue poupar e direcionar para seus investimentos."
            />

            {/* Idade atual com input seguro (sem captura do scroll do mouse) */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-orange-500 shrink-0" />
                Sua idade atual (opcional)
              </label>
              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 32"
                  className="w-full bg-transparent py-4 px-4 text-slate-900 font-black text-lg outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <WithdrawalSelector value={withdrawalRate} onChange={setWithdrawalRate} />
          <RateSelector value={returnRate} onChange={setReturnRate} isPro={isPro || isPremium} />

          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              {formError}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleCalculate}
              className="w-full sm:flex-1 py-4 px-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Flame size={18} />
              {result ? 'Recalcular Minha Liberdade' : 'Calcular Minha Liberdade'}
            </button>

            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-4 px-6 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* ── Bloco de Resultados (Exibido após o clique em Calcular) ───── */}
        {result && (
          <div
            ref={resultsSectionRef}
            className="space-y-8 animate-in fade-in duration-300"
          >
            {/* Card Principal: Número da Liberdade */}
            <div className="bg-gradient-to-br from-white to-orange-50/50 border border-orange-200/80 rounded-[2.5rem] p-7 md:p-10 shadow-sm text-center">
              <span className="text-[10px] font-black text-orange-600 bg-orange-100/70 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">
                Seu Número da Liberdade
              </span>

              <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                {fmtMoney(result.fireNumber)}
              </h3>

              <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto mt-2 font-medium">
                Com esse patrimônio investido, você retira{' '}
                <strong className="text-slate-900">{fmtMoney(result.monthlyExpense)}/mês</strong>{' '}
                completamente livres, preservando seu capital ano a ano.
              </p>

              {/* Barra de Progresso */}
              <div className="mt-8 max-w-lg mx-auto space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Progresso do seu patrimônio</span>
                  <span className="text-orange-600 font-black">
                    {result.percentageDone.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${result.percentageDone}%` }}
                  />
                </div>
                {!result.alreadyFire && (
                  <p className="text-[11px] text-slate-500 text-right">
                    Faltam {fmtMoney(result.fireNumber - result.currentWealth)} para a meta
                  </p>
                )}
              </div>

              {/* Status e Tempo de Espera */}
              <div className="mt-8 max-w-lg mx-auto">
                {result.alreadyFire ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
                    <p className="text-lg font-black text-emerald-800">
                      Você já conquistou seu Número FIRE!
                    </p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Seu patrimônio atual já cobre {result.percentageDone.toFixed(0)}% do seu custo de vida
                      desejado com total segurança matemática.
                    </p>
                  </div>
                ) : result.yearsToFire !== null ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center gap-5 shadow-sm">
                    <div className="bg-orange-50 p-4 rounded-2xl text-orange-500 shrink-0">
                      <Clock size={28} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                        Tempo Estimado com Seus Aportes
                      </p>
                      <p className="text-3xl font-black text-slate-900">
                        {result.yearsToFire.toFixed(1)}{' '}
                        <span className="text-base text-slate-500 font-bold">anos</span>
                      </p>
                      {result.arrivalAge !== null && (
                        <p className="text-xs font-black text-orange-600 mt-0.5">
                          Você alcançará sua liberdade aos {result.arrivalAge} anos
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-left space-y-2">
                    <p className="text-sm font-black text-amber-800 flex items-center gap-2">
                      <span>💡</span> Aporte atual insuficiente para fechar em prazo hábil
                    </p>
                    {result.minMonthly !== null && result.minMonthly > 0 && (
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Para atingir a liberdade em até 30 anos com a taxa selecionada, seu aporte mensal
                        precisaria ser de aproximadamente{' '}
                        <strong className="font-black text-amber-900">
                          {fmtMoney(result.minMonthly)}/mês
                        </strong>
                        .
                      </p>
                    )}
                    <p className="text-[10px] text-amber-600">
                      Dica: você também pode calibrar o custo mensal desejado para um valor mais enxuto na fase inicial.
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Salvar como Meta */}
              {!result.alreadyFire && (
                <div className="mt-8 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => onNavigate('metas')}
                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Salvar no Meu Painel de Metas</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Gráfico de Projeção Patrimonial */}
            {result.trajectory.length > 1 && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp size={18} className="text-orange-500" />
                      Curva de Acúmulo de Patrimônio
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Evolução projetada com aportes contínuos e reinvestimento de juros
                    </p>
                  </div>

                  {result.fireYear !== null && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                      Independência no Ano {result.fireYear}
                    </span>
                  )}
                </div>

                {/* Container do Gráfico com toque vertical nativo liberado */}
                <div className="w-full h-64 md:h-72" style={{ touchAction: 'pan-y' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={result.trajectory}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fireChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="year"
                        tickFormatter={(v) => (v === 0 ? 'Hoje' : `${v}a`)}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(1)}M`
                            : v >= 1_000
                            ? `${(v / 1_000).toFixed(0)}k`
                            : `${v}`
                        }
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        y={result.fireNumber}
                        stroke="#f97316"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                        label={{
                          value: 'Meta FIRE',
                          position: 'top',
                          fontSize: 10,
                          fill: '#ea580c',
                          fontWeight: 800,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="patrimonio"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        fill="url(#fireChartGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  <span>Projeção com taxa real de {result.returnRate}% a.a.</span>
                  <span>Linha tracejada laranja: Meta calculada</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Acordeão com Explicações da Metodologia ──────────────────── */}
        <EducationalAccordeon />
      </div>
    </ToolLayout>
  );
};

export default FireCalculatorTool;
