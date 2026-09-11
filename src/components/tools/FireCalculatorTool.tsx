import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ToolLayout, ToolGate } from './ToolComponents';
import {
  Target, Wallet, TrendingUp, Clock, Flame, ShieldCheck, PieChart,
  ChevronDown, ChevronUp, Lock, Zap, CheckCircle2, ArrowRight,
  BookOpen, Info
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

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

// ─── MoneyInput ──────────────────────────────────────────────────────────────

interface MoneyInputProps {
  label: string;
  icon: React.ElementType;
  value: number | '';
  onChange: (v: number | '') => void;
  hint?: string;
}

const MoneyInput: React.FC<MoneyInputProps> = ({ label, icon: Icon, value, onChange, hint }) => {
  const [focused, setFocused] = useState(false);
  const display = formatMoneyInput(value);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
          <Icon size={12} className="text-orange-400" />
          {label}
        </label>
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint(v => !v)}
            className="w-4 h-4 rounded-full border border-slate-300 text-[9px] font-black text-slate-400 bg-white hover:text-orange-500 hover:border-orange-300 transition-all flex items-center justify-center"
          >
            ?
          </button>
        )}
      </div>
      {showHint && hint && (
        <p className="text-[10px] text-slate-500 leading-relaxed bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">{hint}</p>
      )}
      <div className={`relative flex items-center rounded-2xl border transition-all ${focused ? 'border-orange-400 ring-2 ring-orange-100 bg-white' : 'border-slate-200 bg-white'}`}>
        <span className={`absolute left-4 font-bold text-sm transition-colors ${focused ? 'text-orange-500' : 'text-slate-400'}`}>R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(parseMoneyDigits(e.target.value))}
          className="w-full bg-transparent py-4 pl-12 pr-4 text-slate-900 font-black text-lg outline-none placeholder:text-slate-300"
          placeholder="0,00"
        />
      </div>
    </div>
  );
};

// ─── Rate Selector ───────────────────────────────────────────────────────────

interface RateSelectorProps {
  value: number;
  onChange: (v: number) => void;
  isPro: boolean;
}

const RateSelector: React.FC<RateSelectorProps> = ({ value, onChange, isPro }) => {
  const presets = [
    { label: 'Conservador · 5%', value: 5 },
    { label: 'Moderado · 6%', value: 6 },
    { label: 'Crescimento · 8%', value: 8 },
  ];

  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
          <TrendingUp size={12} className="text-orange-400" />
          Retorno real anual projetado
        </label>
        {!isPro && (
          <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            <Lock size={9} />Pro
          </span>
        )}
      </div>

      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
        {presets.map(p => (
          <button
            key={p.value}
            disabled={!isPro}
            onClick={() => isPro && onChange(p.value)}
            className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all ${
              value === p.value
                ? 'bg-orange-500 text-white shadow-sm'
                : isPro
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-white'
                  : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            {isPro ? p.label : (p.value === 6 ? p.label : <Lock size={10} className="mx-auto" />)}
          </button>
        ))}
      </div>

      {!isPro && (
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Fixado em 6% a.a. (acima da inflação). Personalize com o plano Pro.
        </p>
      )}
    </div>
  );
};

// ─── Withdrawal Rate ─────────────────────────────────────────────────────────

interface WithdrawalSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const WithdrawalSelector: React.FC<WithdrawalSelectorProps> = ({ value, onChange }) => {
  const profiles = [
    { label: 'Conservador · 3%', value: 0.03 },
    { label: 'Padrão · 4%', value: 0.04 },
    { label: 'Dinâmico · 5%', value: 0.05 },
  ];

  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
        <PieChart size={12} className="text-orange-400" />
        Taxa de retirada anual segura
      </label>
      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
        {profiles.map(p => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all ${
              value === p.value
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Educational Accordeon ────────────────────────────────────────────────────

const TABS = [
  {
    id: 0,
    title: 'O que é FIRE?',
    icon: Flame,
    content:
      'FIRE significa "Financial Independence, Retire Early" — Independência Financeira, Aposentadoria Antecipada. O objetivo é acumular patrimônio suficiente para que os rendimentos cubram todos os seus custos de vida, permitindo que você trabalhe por escolha, não por necessidade.',
  },
  {
    id: 1,
    title: 'A Regra dos 4%',
    icon: BookOpen,
    content:
      'Estudos históricos (Estudo Trinity) mostram que um portfólio diversificado pode sustentar saques anuais de 4% por 30 anos ou mais, sem que o dinheiro acabe. Para calcular seu Número FIRE: gasto mensal × 12 ÷ 0,04. Ou simplesmente: gasto mensal × 300.',
  },
  {
    id: 2,
    title: 'Por que importa?',
    icon: ShieldCheck,
    content:
      'Depender exclusivamente de salário ou INSS é o maior risco financeiro do século 21. Atingir seu Número FIRE significa comprar seu tempo de volta — ter segurança real para sua família e o poder de decidir onde, como e com quem viver.',
  },
  {
    id: 3,
    title: 'Perfis de retirada',
    icon: PieChart,
    content:
      'Conservador (3%): exige mais patrimônio, mas é quase imune a crises severas. Padrão (4%): a regra de ouro do mercado. Dinâmico (5%): menos patrimônio acumulado, mas pode exigir ajustes nos gastos em anos difíceis.',
  },
];

const EducationalAccordeon: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mt-6 space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-3">
        <Info size={10} />
        Entender o método
      </p>
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isOpen = open === tab.id;
        return (
          <div key={tab.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button
              onClick={() => setOpen(isOpen ? null : tab.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            >
              <span className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
                <Icon size={14} className="text-orange-400" />
                {tab.title}
              </span>
              {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {tab.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Count-up hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (Math.abs(diff) < 1) { setDisplay(target); prev.current = target; return; }
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + diff * ease));
      if (t < 1) raf.current = requestAnimationFrame(animate);
      else { prev.current = target; setDisplay(target); }
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

// ─── Trajectory Chart ────────────────────────────────────────────────────────

interface TrajectoryPoint { year: number; patrimonio: number; }

interface TrajectoryChartProps {
  data: TrajectoryPoint[];
  fireNumber: number;
  fireYear: number | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as TrajectoryPoint;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-lg text-left">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
        {d.year === 0 ? 'Hoje' : `Ano ${d.year}`}
      </p>
      <p className="text-base font-black text-slate-900">{fmtMoney(d.patrimonio)}</p>
    </div>
  );
};

const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ data, fireNumber, fireYear }) => {
  const yMax = Math.max(fireNumber * 1.1, data[data.length - 1]?.patrimonio ?? fireNumber);

  return (
    <div className="w-full h-64 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="year"
            tickFormatter={v => v === 0 ? 'Hoje' : `${v}a`}
            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : `${v}`}
            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[0, yMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={fireNumber}
            stroke="#f97316"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: 'FIRE', position: 'right', fontSize: 9, fill: '#f97316', fontWeight: 700 }}
          />
          {fireYear !== null && (
            <ReferenceLine
              x={fireYear}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}
          <Area
            type="monotone"
            dataKey="patrimonio"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#fireGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface FireCalculatorToolProps {
  onNavigate: (route: string) => void;
  onCalcUpdate?: (data: { type: string; label: string; details: string }) => void;
  isAuthenticated: boolean;
  isPro?: boolean;
  isPremium?: boolean;
}

export const FireCalculatorTool: React.FC<FireCalculatorToolProps> = ({
  onNavigate,
  onCalcUpdate,
  isAuthenticated,
  isPro = false,
  isPremium = false,
}) => {
  const [expense, setExpense] = useState<number | ''>(5000);
  const [currentWealth, setCurrentWealth] = useState<number | ''>(0);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number | ''>(1000);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(0.04);
  const [returnRate, setReturnRate] = useState<number>(6); // % a.a. (Pro gate)
  const [currentAge, setCurrentAge] = useState<number | ''>('');

  // ── Derived values ─────────────────────────────────────────────────────────
  const result = useMemo(() => {
    const exp = Number(expense) || 0;
    const wealth = Number(currentWealth) || 0;
    const monthly = Number(monthlyInvestment) || 0;
    const rate = isPro ? returnRate : 6;

    const fireNumber = exp > 0 ? exp * (12 / withdrawalRate) : 0;
    const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;

    const alreadyFire = wealth >= fireNumber && fireNumber > 0;

    let months = 0;
    let balance = wealth;

    if (!alreadyFire && monthly > 0 && fireNumber > 0) {
      while (balance < fireNumber && months < 1200) {
        balance = balance * (1 + monthlyRate) + monthly;
        months++;
      }
    }

    const yearsToFire = alreadyFire ? 0 : (balance >= fireNumber ? months / 12 : null);
    const percentageDone = fireNumber > 0 ? Math.min((wealth / fireNumber) * 100, 100) : 0;

    // Minimum monthly investment to reach FIRE in 30 years
    let minMonthly: number | null = null;
    if (!alreadyFire && monthly === 0 && fireNumber > 0 && monthlyRate > 0) {
      const n = 360;
      const r = monthlyRate;
      const fv = fireNumber;
      const pv = wealth;
      minMonthly = Math.ceil((fv - pv * Math.pow(1 + r, n)) / ((Math.pow(1 + r, n) - 1) / r));
    } else if (!alreadyFire && yearsToFire === null && fireNumber > 0 && monthlyRate > 0) {
      const n = 360;
      const r = monthlyRate;
      const fv = fireNumber;
      const pv = wealth;
      minMonthly = Math.ceil((fv - pv * Math.pow(1 + r, n)) / ((Math.pow(1 + r, n) - 1) / r));
    }

    // Trajectory for chart (sampled every 6 months)
    const trajectory: { year: number; patrimonio: number }[] = [];
    const maxMonths = alreadyFire ? 12 : Math.min((months || 360) + 24, 720);
    let bal = wealth;
    const mr = monthlyRate;
    const m = monthly;
    for (let mo = 0; mo <= maxMonths; mo += 6) {
      trajectory.push({ year: Math.round((mo / 12) * 10) / 10, patrimonio: Math.round(bal) });
      for (let i = 0; i < 6; i++) {
        bal = bal * (1 + mr) + m;
      }
    }
    // Ensure fireNumber endpoint included
    if (!alreadyFire && months < 1200 && months > 0) {
      const lastYear = Math.round((months / 12) * 10) / 10;
      if (!trajectory.find(p => p.year === lastYear)) {
        trajectory.push({ year: lastYear, patrimonio: Math.round(fireNumber) });
        trajectory.sort((a, b) => a.year - b.year);
      }
    }

    const fireYear = yearsToFire !== null && yearsToFire > 0 ? Math.round(yearsToFire * 10) / 10 : null;

    const arrivalAge =
      typeof currentAge === 'number' && currentAge > 0 && yearsToFire !== null
        ? Math.round(currentAge + yearsToFire)
        : null;

    return {
      fireNumber,
      yearsToFire,
      percentageDone,
      alreadyFire,
      minMonthly,
      trajectory,
      fireYear,
      arrivalAge,
      monthlyIncome: exp,
    };
  }, [expense, currentWealth, monthlyInvestment, withdrawalRate, returnRate, isPro, currentAge]);

  // ── onCalcUpdate bridge ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCalcUpdate && result.fireNumber > 0) {
        onCalcUpdate({
          type: 'FIRE',
          label: 'Calculadora FIRE',
          details: `Meta: ${fmtMoney(result.fireNumber)} | Faltam: ${result.yearsToFire !== null ? result.yearsToFire.toFixed(1) + ' anos' : '∞'}`,
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [result, onCalcUpdate]);

  // ── Animated FIRE number ───────────────────────────────────────────────────
  const animatedFireNumber = useCountUp(result.fireNumber);

  // ── Result panel helpers ───────────────────────────────────────────────────
  const missingAmount = result.fireNumber - (Number(currentWealth) || 0);

  const handleSaveGoal = useCallback(() => {
    onNavigate('metas');
  }, [onNavigate]);

  // ── Gate ───────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <ToolGate
        title="Calculadora FIRE"
        description="Descubra o número exato que você precisa acumular para viver de renda — e quanto tempo você vai levar para chegar lá."
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <ToolLayout
      title="Calculadora FIRE"
      icon={<Flame size={36} className="text-orange-500" />}
      onBack={onNavigate}
      description="Seu número da liberdade — calculado com precisão."
      badge="Independência Financeira"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">

        {/* ── Left column — Inputs ──────────────────────────────────────── */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 space-y-5 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">

            <MoneyInput
              label="Quanto você quer gastar por mês quando for livre?"
              icon={Target}
              value={expense}
              onChange={setExpense}
              hint="Pense no estilo de vida que você quer ter — moradia, lazer, saúde, viagens. Sem apertar."
            />

            <MoneyInput
              label="Quanto você já tem investido hoje?"
              icon={Wallet}
              value={currentWealth}
              onChange={setCurrentWealth}
              hint="Some todos os seus investimentos: renda fixa, ações, FIIs, previdência. Exclua imóveis que você mora."
            />

            <MoneyInput
              label="Quanto você consegue investir por mês?"
              icon={TrendingUp}
              value={monthlyInvestment}
              onChange={setMonthlyInvestment}
              hint="Seja realista. Um valor consistente e sustentável vale mais do que metas impossíveis."
            />

            {/* Age field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Clock size={12} className="text-orange-400" />
                Sua idade atual (opcional)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={currentAge}
                onChange={e => setCurrentAge(e.target.value === '' ? '' : Math.max(0, Math.min(99, Number(e.target.value))))}
                placeholder="Ex: 32"
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 font-black text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300"
              />
            </div>

            <WithdrawalSelector value={withdrawalRate} onChange={setWithdrawalRate} />
            <RateSelector value={returnRate} onChange={setReturnRate} isPro={isPro || isPremium} />
          </div>

          <EducationalAccordeon />
        </div>

        {/* ── Right column — Result + Chart ─────────────────────────────── */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">

          {/* Result panel */}
          <div className="bg-gradient-to-br from-white to-orange-50/60 border border-orange-100 rounded-[2.5rem] p-7 md:p-10 shadow-[0_20px_60px_rgba(249,115,22,0.10)]">

            {/* FIRE Number */}
            <div className="mb-8 text-center">
              <p className="text-orange-500 text-[9px] font-black tracking-[0.25em] uppercase mb-2">
                Seu Número da Liberdade
              </p>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter tabular-nums">
                {result.fireNumber > 0 ? fmtMoney(animatedFireNumber) : '—'}
              </h2>
              {result.fireNumber > 0 && (
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  Gera {fmtMoney(Number(expense) || 0)}/mês com retirada de {(withdrawalRate * 100).toFixed(0)}% ao ano
                </p>
              )}
            </div>

            {/* Progress bar */}
            {result.fireNumber > 0 && (
              <div className="mb-7 space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Progresso atual</span>
                  <span className="text-orange-500">{result.percentageDone.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${result.percentageDone}%` }}
                  />
                </div>
                {missingAmount > 0 && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    Faltam {fmtMoney(missingAmount)} para a liberdade
                  </p>
                )}
              </div>
            )}

            {/* Time / already FIRE */}
            {result.alreadyFire ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
                <p className="text-lg font-black text-emerald-700">Você já atingiu seu Número FIRE</p>
                <p className="text-sm text-emerald-600 leading-relaxed">
                  Seu patrimônio cobre {result.percentageDone.toFixed(0)}% da sua meta. Parabéns — você chegou lá.
                </p>
              </div>
            ) : result.yearsToFire !== null ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="bg-orange-50 p-3.5 rounded-xl shrink-0">
                  <Clock size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-0.5">
                    Tempo estimado restante
                  </p>
                  <p className="text-3xl font-black text-slate-900 tabular-nums">
                    {result.yearsToFire.toFixed(1)}{' '}
                    <span className="text-base text-slate-500 font-bold">anos</span>
                  </p>
                  {result.arrivalAge !== null && (
                    <p className="text-xs text-orange-500 font-bold mt-0.5">
                      Você chegará com {result.arrivalAge} anos
                    </p>
                  )}
                </div>
              </div>
            ) : result.fireNumber > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
                <p className="text-sm font-black text-amber-700">Aporte insuficiente para a meta</p>
                {result.minMonthly !== null && result.minMonthly > 0 && (
                  <p className="text-sm text-amber-600 leading-relaxed">
                    Para chegar em 30 anos, você precisaria de{' '}
                    <span className="font-black">{fmtMoney(result.minMonthly)}/mês</span>.
                  </p>
                )}
                <p className="text-[10px] text-amber-500">
                  Ajuste o aporte ou reveja o gasto mensal desejado.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Preencha o gasto mensal desejado para calcular seu Número FIRE.
                </p>
              </div>
            )}

            {/* Save as goal CTA */}
            {result.fireNumber > 0 && !result.alreadyFire && (
              <button
                onClick={handleSaveGoal}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <ArrowRight size={14} />
                Salvar como Meta de Liberdade
              </button>
            )}

            {/* Return rate disclosure */}
            {result.fireNumber > 0 && (
              <p className="text-slate-400 text-[9px] mt-5 text-center uppercase tracking-wider leading-relaxed">
                Retorno real projetado: {isPro || isPremium ? returnRate : 6}% a.a. acima da inflação.
                Baseado na Regra dos {(withdrawalRate * 100).toFixed(0)}% (Estudo Trinity).
              </p>
            )}
          </div>

          {/* Trajectory Chart */}
          {result.fireNumber > 0 && result.trajectory.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Trajetória do patrimônio
                </p>
                {result.fireYear !== null && (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    FIRE no ano {result.fireYear}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mb-4">
                Linha laranja tracejada = seu Número FIRE · Verde = ponto de cruzamento
              </p>
              <TrajectoryChart
                data={result.trajectory}
                fireNumber={result.fireNumber}
                fireYear={result.fireYear}
              />

              {/* Pro upsell for multiple scenarios */}
              {!isPremium && (
                <div className="mt-5 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="bg-orange-50 p-2.5 rounded-xl shrink-0">
                    <Zap size={16} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-700">Múltiplos cenários simultâneos</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Compare conservador, padrão e agressivo no mesmo gráfico — Premium.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="shrink-0 text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-all"
                  >
                    Ver planos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </ToolLayout>
  );
};

export default FireCalculatorTool;
