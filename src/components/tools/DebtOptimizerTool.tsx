import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolLayout, Input } from './ToolComponents';
import {
  Lock,
  ArrowRight,
  CalendarClock,
  Receipt,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type DebtSystem = 'sac' | 'price' | 'rotativo';

type InputMode =
  | 'payment'
  | 'rate-term'
  | 'installments-payment'
  | 'guided';

type ScheduleRow = {
  month: number;
  payment: number;
  interest: number;
  amortization: number;
  balance: number;
};

type StructuredResult = {
  valid: boolean;
  firstPayment: number;
  lastPayment: number;
  totalPaid: number;
  totalInterest: number;
  rows: ScheduleRow[];
};

type RotativeResult = {
  valid: boolean;
  months: number | null;
  totalPaid: number | null;
  totalInterest: number | null;
  rows: ScheduleRow[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const buildSacSchedule = (
  principal: number,
  monthlyRatePercent: number,
  months: number,
  extraMonthly: number = 0
): StructuredResult => {
  if (principal <= 0 || monthlyRatePercent < 0 || months <= 0) {
    return { valid: false, firstPayment: 0, lastPayment: 0, totalPaid: 0, totalInterest: 0, rows: [] };
  }

  const rate = monthlyRatePercent / 100;
  const baseAmortization = principal / months;
  const extra = Math.max(extraMonthly, 0);

  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;
  const rows: ScheduleRow[] = [];

  for (let i = 1; i <= months && balance > 0.01; i += 1) {
    const interest = balance * rate;
    const regularAmortization = Math.min(baseAmortization, balance);

    let payment = regularAmortization + interest;
    let amortization = regularAmortization;
    let newBalance = balance - regularAmortization;

    const extraApplied = Math.min(extra, newBalance);
    amortization += extraApplied;
    payment += extraApplied;
    newBalance -= extraApplied;

    totalPaid += payment;
    totalInterest += interest;

    rows.push({
      month: i,
      payment,
      interest,
      amortization,
      balance: Math.max(newBalance, 0),
    });

    balance = Math.max(newBalance, 0);
  }

  return {
    valid: rows.length > 0,
    firstPayment: rows[0]?.payment || 0,
    lastPayment: rows[rows.length - 1]?.payment || 0,
    totalPaid,
    totalInterest,
    rows,
  };
};

const buildPriceSchedule = (
  principal: number,
  monthlyRatePercent: number,
  months: number,
  extraMonthly: number = 0
): StructuredResult => {
  if (principal <= 0 || monthlyRatePercent < 0 || months <= 0) {
    return { valid: false, firstPayment: 0, lastPayment: 0, totalPaid: 0, totalInterest: 0, rows: [] };
  }

  const rate = monthlyRatePercent / 100;
  const extra = Math.max(extraMonthly, 0);

  const fixedPayment =
    rate === 0
      ? principal / months
      : principal * ((rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1));

  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;
  const rows: ScheduleRow[] = [];

  for (let i = 1; i <= months && balance > 0.01; i += 1) {
    const interest = balance * rate;
    let regularAmortization = fixedPayment - interest;
    regularAmortization = Math.min(regularAmortization, balance);

    let payment = regularAmortization + interest;
    let amortization = regularAmortization;
    let newBalance = balance - regularAmortization;

    const extraApplied = Math.min(extra, newBalance);
    amortization += extraApplied;
    payment += extraApplied;
    newBalance -= extraApplied;

    totalPaid += payment;
    totalInterest += interest;

    rows.push({
      month: i,
      payment,
      interest,
      amortization,
      balance: Math.max(newBalance, 0),
    });

    balance = Math.max(newBalance, 0);
  }

  return {
    valid: rows.length > 0,
    firstPayment: rows[0]?.payment || 0,
    lastPayment: rows[rows.length - 1]?.payment || 0,
    totalPaid,
    totalInterest,
    rows,
  };
};

const buildRotativeSchedule = (
  principal: number,
  monthlyRatePercent: number,
  monthlyPayment: number
): RotativeResult => {
  if (principal <= 0 || monthlyRatePercent < 0 || monthlyPayment <= 0) {
    return { valid: false, months: null, totalPaid: null, totalInterest: null, rows: [] };
  }

  const rate = monthlyRatePercent / 100;

  if (rate > 0 && monthlyPayment <= principal * rate) {
    return { valid: false, months: null, totalPaid: null, totalInterest: null, rows: [] };
  }

  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;
  let months = 0;
  const rows: ScheduleRow[] = [];

  while (balance > 0.01 && months < 600) {
    const interest = balance * rate;
    balance += interest;

    const payment = Math.min(monthlyPayment, balance);
    const amortization = payment - interest;
    balance = Math.max(balance - payment, 0);

    months += 1;
    totalPaid += payment;
    totalInterest += interest;

    rows.push({
      month: months,
      payment,
      interest,
      amortization: Math.max(amortization, 0),
      balance,
    });
  }

  if (balance > 0.01) {
    return { valid: false, months: null, totalPaid: null, totalInterest: null, rows: [] };
  }

  return {
    valid: true,
    months,
    totalPaid,
    totalInterest,
    rows,
  };
};

const calculatePricePayment = (
  principal: number,
  rateDecimal: number,
  months: number
) =>
  rateDecimal === 0
    ? principal / months
    : principal * ((rateDecimal * Math.pow(1 + rateDecimal, months)) / (Math.pow(1 + rateDecimal, months) - 1));

const inferSacRateFromPayment = (
  principal: number,
  payment: number,
  months: number
): number | null => {
  if (principal <= 0 || payment <= 0 || months <= 0) return null;

  const amortization = principal / months;

  if (payment < amortization) return null;

  return Math.max(((payment - amortization) / principal) * 100, 0);
};

const inferPriceRateFromPayment = (
  principal: number,
  payment: number,
  months: number
): number | null => {
  if (principal <= 0 || payment <= 0 || months <= 0) return null;

  const zeroRatePayment = principal / months;

  if (payment < zeroRatePayment) return null;
  if (Math.abs(payment - zeroRatePayment) < 0.01) return 0;

  let low = 0;
  let high = 1;

  while (calculatePricePayment(principal, high, months) < payment && high < 10) {
    high *= 2;
  }

  if (calculatePricePayment(principal, high, months) < payment) {
    return null;
  }

  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const estimatedPayment = calculatePricePayment(principal, mid, months);

    if (estimatedPayment > payment) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return ((low + high) / 2) * 100;
};

const SystemButton = ({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-[1.5rem] border p-5 transition-all ${
      active
        ? 'bg-sky-50 border-sky-300 shadow-sm'
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}
  >
    <p
      className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${
        active ? 'text-sky-700' : 'text-slate-900'
      }`}
    >
      {title}
    </p>
    <p className={`text-sm leading-relaxed ${active ? 'text-sky-700/80' : 'text-slate-600'}`}>
      {subtitle}
    </p>
  </button>
);
const InputModeButton = ({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-[1.5rem] border p-5 transition-all h-full ${
      active
        ? 'bg-emerald-50 border-emerald-300 shadow-sm'
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}
  >
    <p
      className={`text-xs font-black uppercase tracking-[0.18em] mb-2 ${
        active ? 'text-emerald-700' : 'text-slate-900'
      }`}
    >
      {title}
    </p>
    <p className={`text-sm leading-relaxed ${active ? 'text-emerald-700/80' : 'text-slate-600'}`}>
      {subtitle}
    </p>
  </button>
);
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{children}</p>
);
const DEBT_SIM_STORAGE_KEY = 'fpi-debt-sim-v1';

export const DebtOptimizerTool = ({ onNavigate, isAuthenticated }: any) => {
  const [inputMode, setInputMode] = useState<InputMode>('payment');
  const [system, setSystem] = useState<DebtSystem>('rotativo');
  const [debtAmount, setDebtAmount] = useState<number | ''>('');
  const [monthlyRate, setMonthlyRate] = useState<number | ''>('');
  const [installments, setInstallments] = useState<number | ''>('');
  const [currentPayment, setCurrentPayment] = useState<number | ''>('');
  const [extraPayment, setExtraPayment] = useState<number | ''>('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [hasRestoredSimulation, setHasRestoredSimulation] = useState(false);
  const skipFirstAutoResetRef = useRef(true);

  const hasDebtAmount =
    debtAmount !== '' &&
    Number(debtAmount) > 0;

  const hasRateValue =
    monthlyRate !== '' &&
    Number(monthlyRate) >= 0;

  const hasInstallmentsValue =
    installments !== '' &&
    Number(installments) > 0;

  const hasCurrentPaymentValue =
    currentPayment !== '' &&
    Number(currentPayment) > 0;

  const inferredStructuredRate = useMemo(() => {
    if (inputMode !== 'installments-payment') return null;
    if (!hasDebtAmount || !hasInstallmentsValue || !hasCurrentPaymentValue) return null;

    const principal = Number(debtAmount);
    const payment = Number(currentPayment);
    const months = Number(installments);

    if (system === 'sac') {
      return inferSacRateFromPayment(principal, payment, months);
    }

    if (system === 'price') {
      return inferPriceRateFromPayment(principal, payment, months);
    }

    return null;
  }, [
    inputMode,
    system,
    debtAmount,
    installments,
    currentPayment,
    hasDebtAmount,
    hasInstallmentsValue,
    hasCurrentPaymentValue,
  ]);

  const effectiveStructuredRate =
    hasRateValue ? Number(monthlyRate) : inferredStructuredRate;

  const hasStructuredData =
    hasDebtAmount &&
    hasInstallmentsValue &&
    effectiveStructuredRate !== null &&
    effectiveStructuredRate >= 0;

  const hasRotativeData =
    hasDebtAmount &&
    hasRateValue &&
    hasCurrentPaymentValue;

  const canCalculate =
    (system === 'sac' || system === 'price') ? hasStructuredData : hasRotativeData;

  useEffect(() => {
    if (!hasRestoredSimulation) return;

    if (skipFirstAutoResetRef.current) {
      skipFirstAutoResetRef.current = false;
      return;
    }

    setHasCalculated(false);
  }, [system, debtAmount, monthlyRate, installments, currentPayment, extraPayment, hasRestoredSimulation]);
  
  useEffect(() => {
    const raw = sessionStorage.getItem(DEBT_SIM_STORAGE_KEY);
    if (!raw) {
      setHasRestoredSimulation(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (parsed.inputMode) setInputMode(parsed.inputMode);
      if (parsed.system) setSystem(parsed.system);
      if (parsed.debtAmount !== undefined) setDebtAmount(parsed.debtAmount);
      if (parsed.monthlyRate !== undefined) setMonthlyRate(parsed.monthlyRate);
      if (parsed.installments !== undefined) setInstallments(parsed.installments);
      if (parsed.currentPayment !== undefined) setCurrentPayment(parsed.currentPayment);
      if (parsed.extraPayment !== undefined) setExtraPayment(parsed.extraPayment);
      if (parsed.hasCalculated !== undefined) setHasCalculated(parsed.hasCalculated);
    } catch (_) {
      sessionStorage.removeItem(DEBT_SIM_STORAGE_KEY);
    } finally {
      setHasRestoredSimulation(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredSimulation) return;

    sessionStorage.setItem(
      DEBT_SIM_STORAGE_KEY,
      JSON.stringify({
        inputMode,
        system,
        debtAmount,
        monthlyRate,
        installments,
        currentPayment,
        extraPayment,
        hasCalculated,
      })
    );
  }, [
    inputMode,
    system,
    debtAmount,
    monthlyRate,
    installments,
    currentPayment,
    extraPayment,
    hasCalculated,
    hasRestoredSimulation,
  ]);
  
  const extra = Number(extraPayment || 0);
  const isPaymentMode = inputMode === 'payment';
  const shouldShowSystemSelector = !isPaymentMode;

  useEffect(() => {
    if (isPaymentMode && system !== 'rotativo') {
      setSystem('rotativo');
    }
  }, [isPaymentMode, system]);

  const inputModeContent = useMemo(() => {
    switch (inputMode) {
      case 'payment':
        return {
          title: 'Você sabe o saldo da dívida e o pagamento mensal',
          description:
            'Esse modo é útil para cartão, cheque especial e outras dívidas em que você sabe quanto ainda deve, quanto costuma pagar por mês e consegue informar a taxa ou pelo menos uma estimativa.',
        };

      case 'rate-term':
        return {
          title: 'Você tem dados mais completos do contrato',
          description:
            'Use este modo se você souber a taxa de juros e o prazo. É o melhor cenário para comparar SAC, Price e outras estruturas de pagamento.',
        };

      case 'installments-payment':
        return {
          title: 'Você sabe o saldo devedor, as parcelas em aberto e o valor da parcela',
          description:
            'Esse modo é útil para empréstimos e financiamentos em andamento. Mesmo sem conhecer a taxa exata, você pode informar o saldo atual, quantas parcelas ainda faltam e quanto paga hoje.',
        };

      case 'guided':
        return {
          title: 'Você tem pouca informação e quer uma estimativa guiada',
          description:
            'Se você não souber a taxa, o sistema de amortização ou os detalhes do contrato, escolha esta opção. A ferramenta vai te conduzir de forma mais simples.',
        };

      default:
        return {
          title: 'Escolha o formato de entrada',
          description:
            'Selecione a opção mais parecida com os dados que você tem em mãos hoje.',
        };
    }
  }, [inputMode]);

  const sacBase = useMemo(() => {
    if (!hasStructuredData || effectiveStructuredRate === null) return null;
    return buildSacSchedule(
      Number(debtAmount),
      effectiveStructuredRate,
      Number(installments),
      0
    );
  }, [debtAmount, installments, hasStructuredData, effectiveStructuredRate]);

  const sacOptimized = useMemo(() => {
    if (!hasStructuredData || effectiveStructuredRate === null) return null;
    return buildSacSchedule(
      Number(debtAmount),
      effectiveStructuredRate,
      Number(installments),
      extra
    );
  }, [debtAmount, installments, extra, hasStructuredData, effectiveStructuredRate]);

  const priceBase = useMemo(() => {
    if (!hasStructuredData || effectiveStructuredRate === null) return null;
    return buildPriceSchedule(
      Number(debtAmount),
      effectiveStructuredRate,
      Number(installments),
      0
    );
  }, [debtAmount, installments, hasStructuredData, effectiveStructuredRate]);

  const priceOptimized = useMemo(() => {
    if (!hasStructuredData || effectiveStructuredRate === null) return null;
    return buildPriceSchedule(
      Number(debtAmount),
      effectiveStructuredRate,
      Number(installments),
      extra
    );
  }, [debtAmount, installments, extra, hasStructuredData, effectiveStructuredRate]);

  const rotativeBase = useMemo(() => {
    if (!hasRotativeData) return null;
    return buildRotativeSchedule(
      Number(debtAmount),
      Number(monthlyRate),
      Number(currentPayment)
    );
  }, [debtAmount, monthlyRate, currentPayment, hasRotativeData]);

  const rotativeOptimized = useMemo(() => {
    if (!hasRotativeData) return null;
    return buildRotativeSchedule(
      Number(debtAmount),
      Number(monthlyRate),
      Number(currentPayment) + extra
    );
  }, [debtAmount, monthlyRate, currentPayment, extra, hasRotativeData]);

  const activeSac = useMemo(() => {
    if (extra > 0 && sacOptimized?.valid) return sacOptimized;
    return sacBase;
  }, [extra, sacBase, sacOptimized]);

  const activePrice = useMemo(() => {
    if (extra > 0 && priceOptimized?.valid) return priceOptimized;
    return priceBase;
  }, [extra, priceBase, priceOptimized]);

  const activeRotative = useMemo(() => {
    if (extra > 0 && rotativeOptimized?.valid) return rotativeOptimized;
    return rotativeBase;
  }, [extra, rotativeBase, rotativeOptimized]);

  const selectedSummary = useMemo(() => {
    if (system === 'sac' && sacBase?.valid) {
      const current = sacBase;
      const optimized = sacOptimized?.valid ? sacOptimized : sacBase;
      const monthsSaved = current.rows.length - optimized.rows.length;
      const moneySaved = current.totalPaid - optimized.totalPaid;

      return {
        title: 'SAC selecionado',
        primary: `${optimized.rows.length} parcelas estimadas`,
        secondary: `Total pago: ${formatCurrency(optimized.totalPaid)}`,
        tertiary:
          extra > 0
            ? `Economia potencial: ${formatCurrency(Math.max(moneySaved, 0))}`
            : `1ª parcela: ${formatCurrency(current.firstPayment)}`,
        insight:
          extra > 0
            ? `Com amortização extra mensal de ${formatCurrency(extra)}, o prazo pode cair ${monthsSaved > 0 ? `${monthsSaved} meses` : 'sem redução relevante no cenário informado'}.`
            : 'No SAC, as parcelas tendem a cair com o tempo porque a amortização é constante.',
        risk: '',
      };
    }

    if (system === 'price' && priceBase?.valid) {
      const current = priceBase;
      const optimized = priceOptimized?.valid ? priceOptimized : priceBase;
      const monthsSaved = current.rows.length - optimized.rows.length;
      const moneySaved = current.totalPaid - optimized.totalPaid;

      return {
        title: 'Price selecionada',
        primary: `${optimized.rows.length} parcelas estimadas`,
        secondary: `Total pago: ${formatCurrency(optimized.totalPaid)}`,
        tertiary:
          extra > 0
            ? `Economia potencial: ${formatCurrency(Math.max(moneySaved, 0))}`
            : `Parcela-base: ${formatCurrency(current.firstPayment)}`,
        insight:
          extra > 0
            ? `Com amortização extra mensal de ${formatCurrency(extra)}, a dívida pode terminar antes e pagar menos juros.`
            : 'Na Price, a parcela tende a ficar estável e o peso dos juros costuma ser maior no começo.',
        risk: '',
      };
    }

    if (system === 'rotativo' && rotativeBase?.valid) {
      const current = rotativeBase;
      const optimized = rotativeOptimized?.valid ? rotativeOptimized : rotativeBase;
      const monthsSaved = (current.months || 0) - (optimized.months || 0);
      const moneySaved = (current.totalPaid || 0) - (optimized.totalPaid || 0);

      return {
        title: 'Rotativo selecionado',
        primary: `${optimized.months} meses`,
        secondary: `Total pago: ${formatCurrency(optimized.totalPaid || 0)}`,
        tertiary:
          extra > 0
            ? `Economia potencial: ${formatCurrency(Math.max(moneySaved, 0))}`
            : `Juros totais: ${formatCurrency(optimized.totalInterest || 0)}`,
        insight:
          extra > 0
            ? `Ao adicionar ${formatCurrency(extra)} por mês, você pode reduzir ${monthsSaved > 0 ? `${monthsSaved} meses` : 'o peso da dívida'}.`
            : 'No rotativo, o saldo remanescente continua gerando juros enquanto não for quitado.',
        risk: '',
      };
    }

    if (system === 'rotativo' && hasRotativeData) {
      return {
        title: 'Rotativo selecionado',
        primary: 'Parcela insuficiente',
        secondary: 'A dívida não reduz',
        tertiary: 'Ajuste o valor pago',
        insight: 'Se o pagamento mensal não cobre os juros do período, a dívida tende a continuar pesada.',
        risk: 'Parcela insuficiente para reverter a bola de neve.',
      };
    }

    return {
      title: 'Preencha os dados',
      primary: 'Simulação indisponível',
      secondary: 'Informe os dados básicos',
      tertiary: 'Escolha o tipo de dívida',
      insight: 'A ferramenta vai orientar você com base no modelo escolhido.',
      risk: '',
    };
  }, [
    system,
    sacBase,
    sacOptimized,
    priceBase,
    priceOptimized,
    rotativeBase,
    rotativeOptimized,
    extra,
    hasRotativeData,
  ]);
  const displayedSummary = hasCalculated && canCalculate
    ? selectedSummary
    : {
        title: 'Aguardando cálculo',
        primary: 'Clique em Calcular',
        secondary: 'Preencha os campos e gere a simulação',
        tertiary: 'O diagnóstico aparecerá aqui',
        insight: 'Os resultados só serão exibidos depois da sua confirmação.',
        risk: '',
      };
  const comparison = useMemo(() => {
    if (!activeSac?.valid || !activePrice?.valid) return null;

    const betterByInterest =
      activeSac.totalInterest < activePrice.totalInterest ? 'SAC' : 'Price';

    return {
      betterByInterest,
      interestGap: Math.abs(activePrice.totalInterest - activeSac.totalInterest),
    };
  }, [activeSac, activePrice]);

  const selectedRows = useMemo(() => {
    if (system === 'sac') return activeSac?.rows?.slice(0, 12) || [];
    if (system === 'price') return activePrice?.rows?.slice(0, 12) || [];
    return activeRotative?.rows?.slice(0, 12) || [];
  }, [system, activeSac, activePrice, activeRotative]);

  const canShowDetailed = useMemo(() => {
    if (!hasCalculated || !canCalculate) return false;
    if (system === 'sac') return !!activeSac?.valid;
    if (system === 'price') return !!activePrice?.valid;
    return !!activeRotative?.valid;
  }, [hasCalculated, canCalculate, system, activeSac, activePrice, activeRotative]);

  const isDetailedLocked = !isAuthenticated && canShowDetailed;

  const showRotativeWarning =
    system === 'rotativo' &&
    hasRotativeData &&
    !activeRotative?.valid;

  const diagnosisCard = useMemo(() => {
    if (!hasCalculated || !canCalculate) {
      return {
        tone: 'slate',
        badge: 'Próximo passo',
        title: 'Preencha os dados e clique em Calcular',
        description: 'Depois disso, a ferramenta traduz os números para um diagnóstico simples e um caminho provável de ação.',
      };
    }

    if (system === 'rotativo' && hasRotativeData && !activeRotative?.valid) {
      return {
        tone: 'rose',
        badge: 'Atenção alta',
        title: 'Sua parcela atual não está vencendo os juros',
        description: 'A prioridade aqui é aumentar o pagamento mensal ou migrar a dívida para uma linha mais barata.',
      };
    }

    if (system === 'rotativo' && activeRotative?.valid) {
      const interestRatio = (activeRotative.totalInterest || 0) / Math.max(Number(debtAmount || 0), 1);

      if (interestRatio >= 1) {
        return {
          tone: 'amber',
          badge: 'Alerta importante',
          title: 'Você pode pagar em juros um valor parecido com a própria dívida',
          description: extra > 0
            ? 'O valor extra melhora o cenário, mas ainda vale buscar renegociação ou troca por crédito mais barato.'
            : 'Mesmo pagando em dia, essa estrutura ainda pesa muito. Simular um valor extra ou renegociar tende a fazer diferença.',
        };
      }

      return {
        tone: extra > 0 ? 'emerald' : 'sky',
        badge: extra > 0 ? 'Estratégia ativa' : 'Melhor próximo passo',
        title: extra > 0
          ? 'O valor extra mensal já está acelerando sua saída'
          : 'Adicionar um valor extra por mês pode encurtar bastante o caminho',
        description: extra > 0
          ? 'Se você conseguir manter esse ritmo, a tendência é reduzir prazo e juros totais.'
          : 'Mesmo um reforço pequeno na parcela pode aliviar o custo total do rotativo.',
      };
    }

    if ((system === 'sac' || system === 'price') && canShowDetailed) {
      return extra > 0
        ? {
            tone: 'emerald',
            badge: 'Estratégia',
            title: 'Sua amortização extra está trabalhando a seu favor',
            description: 'Esse cenário tende a cortar prazo e reduzir juros totais sem mudar a lógica do contrato.',
          }
        : {
            tone: 'sky',
            badge: 'Melhor próximo passo',
            title: 'Vale testar uma amortização extra mensal',
            description: 'Comparar um pequeno valor extra por mês costuma revelar economia relevante com pouco esforço.',
          };
    }

    return {
      tone: 'slate',
      badge: 'Leitura inicial',
      title: 'A ferramenta ainda está preparando seu diagnóstico',
      description: 'Assim que os dados ficarem completos, o plano aparece de forma mais clara.',
    };
  }, [
    hasCalculated,
    canCalculate,
    system,
    hasRotativeData,
    activeRotative,
    debtAmount,
    extra,
    canShowDetailed,
  ]);

  const diagnosisClasses =
    diagnosisCard.tone === 'rose'
      ? 'border-rose-200 bg-rose-50'
      : diagnosisCard.tone === 'amber'
      ? 'border-amber-200 bg-amber-50'
      : diagnosisCard.tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50'
      : diagnosisCard.tone === 'sky'
      ? 'border-sky-200 bg-sky-50'
      : 'border-slate-200 bg-slate-50';

  return (
    <ToolLayout
      title="Otimizador de Dívidas"
      icon="💳"
      onBack={onNavigate}
      description="Compare SAC, Price e dívida rotativa, descubra o modelo que mais parece com o seu contrato e simule sua quitação."
    >
    
      <div className="space-y-10">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <SectionTitle>Quais dados você tem hoje?</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <InputModeButton
              active={inputMode === 'payment'}
              onClick={() => setInputMode('payment')}
              title="Saldo + pagamento mensal"
              subtitle="Para quem sabe quanto deve, quanto paga por mês e consegue informar a taxa ou uma estimativa."
            />

            <InputModeButton
              active={inputMode === 'rate-term'}
              onClick={() => setInputMode('rate-term')}
              title="Valor + taxa + prazo"
              subtitle="Para quem tem os dados mais completos do contrato."
            />

            <InputModeButton
              active={inputMode === 'installments-payment'}
              onClick={() => setInputMode('installments-payment')}
              title="Parcelas em aberto"
              subtitle="Para quem sabe quantas faltam e quanto paga hoje, mesmo sem saber a taxa."
            />

            <InputModeButton
              active={inputMode === 'guided'}
              onClick={() => setInputMode('guided')}
              title="Estimativa guiada"
              subtitle="Para quem tem pouca informação e quer ajuda passo a passo."
            />
          </div>

          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <p className="text-slate-900 font-black text-sm mb-2">{inputModeContent.title}</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              {inputModeContent.description}
            </p>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed">
              Você não precisa ter todos os dados. Escolha a opção mais parecida com o que aparece no seu contrato, no app do banco ou na sua fatura.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <SectionTitle>Qual tipo de dívida se parece com a sua?</SectionTitle>

          {shouldShowSystemSelector ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SystemButton
                  active={system === 'sac'}
                  onClick={() => setSystem('sac')}
                  title="SAC"
                  subtitle="Use quando a parcela começa mais alta e vai caindo com o tempo. É comum em financiamentos onde a amortização é constante."
                />

                <SystemButton
                  active={system === 'price'}
                  onClick={() => setSystem('price')}
                  title="Price"
                  subtitle="Use quando a parcela do contrato tende a ficar fixa ou muito parecida mês a mês. A amortização cresce ao longo do tempo."
                />

                <SystemButton
                  active={system === 'rotativo'}
                  onClick={() => setSystem('rotativo')}
                  title="Rotativo"
                  subtitle="Use para cartão, cheque especial ou dívida sem cronograma fixo, onde os juros incidem sobre o saldo que sobrou."
                />
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-900 font-black text-sm mb-2">Quando escolher SAC</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Se o seu contrato mostra parcelas decrescentes, o SAC costuma ser o melhor encaixe lógico.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-900 font-black text-sm mb-2">Quando escolher Price</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Se a parcela aparece praticamente igual ao longo do contrato, a Price costuma ser a referência mais próxima.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-slate-900 font-black text-sm mb-2">Quando escolher Rotativo</p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Se você paga parte da fatura e o restante vira saldo com juros altos, este é o modo mais útil para seu caso.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-emerald-800 font-black text-sm mb-2">
                Cenário mais compatível com este modo
              </p>
              <p className="text-emerald-700 text-sm leading-relaxed">
                Neste modo, a ferramenta usa <span className="font-black">rotativo</span> como referência principal,
                porque esse é o caso mais comum quando a pessoa sabe o saldo da dívida e quanto consegue pagar por mês.
              </p>
              <p className="text-emerald-700/80 text-xs mt-3 leading-relaxed">
                Para a simulação ficar consistente, informe também a taxa mensal ou uma estimativa próxima.
                Se o seu contrato tiver prazo fechado ou parcelas definidas, escolha outro modo no topo.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        
          <SectionTitle>Dados da dívida</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Saldo total da dívida"
              value={debtAmount}
              onChange={setDebtAmount}
              prefix="R$"
              placeholder="Ex: 12000"
              help="Valor total atual que ainda falta pagar."
            />

            <Input
              label={
                inputMode === 'installments-payment'
                  ? 'Juros ao mês (opcional se você souber)'
                  : inputMode === 'rate-term'
                  ? 'Juros ao mês'
                  : 'Juros ao mês (ou estimativa)'
              }
              value={monthlyRate}
              onChange={setMonthlyRate}
              placeholder="Ex: 8"
              help={
                inputMode === 'installments-payment'
                  ? 'Se você souber a taxa, informe aqui. Se não souber, a ferramenta tenta estimar com base nas parcelas em aberto e no valor da parcela.'
                  : inputMode === 'rate-term'
                  ? 'Taxa mensal aplicada à sua dívida.'
                  : 'Neste modo, a taxa ainda é necessária para a simulação. Se você não souber o número exato, use uma estimativa próxima do contrato, app do banco ou da fatura.'
              }
            />

            {(system === 'sac' || system === 'price') && (
              <>
                <Input
                  label={inputMode === 'installments-payment' ? 'Parcelas em aberto' : 'Número de parcelas'}
                  value={installments}
                  onChange={setInstallments}
                  placeholder="Ex: 48"
                  help="Prazo contratual da dívida ou quantidade de parcelas ainda pendentes."
                />

                {inputMode === 'installments-payment' ? (
                  <Input
                    label="Valor da parcela atual"
                    value={currentPayment}
                    onChange={setCurrentPayment}
                    prefix="R$"
                    placeholder="Ex: 850"
                    help="Valor que você paga atualmente em cada parcela."
                  />
                ) : (
                  <Input
                    label="Amortização extra por mês"
                    value={extraPayment}
                    onChange={setExtraPayment}
                    prefix="R$"
                    placeholder="Ex: 300"
                    help="Valor adicional usado para reduzir o prazo da dívida."
                  />
                )}

                {inputMode === 'installments-payment' && (
                  <Input
                    label="Amortização extra por mês"
                    value={extraPayment}
                    onChange={setExtraPayment}
                    prefix="R$"
                    placeholder="Ex: 300"
                    help="Valor adicional para acelerar a quitação."
                  />
                )}
              </>
            )}
            {(system === 'sac' || system === 'price') &&
            inputMode === 'installments-payment' &&
            monthlyRate === '' &&
            inferredStructuredRate !== null && (
              <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sky-800 text-sm font-black mb-2">
                  Taxa estimada automaticamente
                </p>
                <p className="text-sky-700 text-sm leading-relaxed">
                  Com base no saldo devedor, nas parcelas em aberto e no valor da parcela, a ferramenta estimou juros de aproximadamente{' '}
                  <span className="font-black">
                    {inferredStructuredRate.toFixed(2)}% ao mês
                  </span>
                  {' '}para montar esta simulação.
                </p>
              </div>
            )}
            
            {(system === 'sac' || system === 'price') &&
            inputMode === 'installments-payment' &&
            monthlyRate === '' &&
            installments !== '' &&
            currentPayment !== '' &&
            inferredStructuredRate === null && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-rose-800 text-sm font-black mb-2">
                  Não foi possível estimar a taxa com esses dados
                </p>
                <p className="text-rose-700 text-sm leading-relaxed">
                  Revise saldo devedor, parcelas em aberto e valor da parcela. Se preferir, informe a taxa manualmente.
                </p>
              </div>
            )}

            {system === 'rotativo' && (
              <>
                <Input
                  label={inputMode === 'payment' ? 'Quanto você consegue pagar por mês' : 'Pagamento mensal atual'}
                  value={currentPayment}
                  onChange={setCurrentPayment}
                  prefix="R$"
                  placeholder="Ex: 600"
                  help="Quanto você realmente paga por mês hoje."
                />

                <Input
                  label="Valor extra por mês"
                  value={extraPayment}
                  onChange={setExtraPayment}
                  prefix="R$"
                  placeholder="Ex: 150"
                  help="Quanto você poderia somar ao pagamento mensal."
                />
              </>
            )}
          </div>
          {inputMode !== 'rate-term' && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-amber-800 text-sm font-black mb-2">Não sabe a taxa exata?</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                Tudo bem. Procure no contrato, no app do banco ou na fatura algo como juros ao mês, taxa mensal ou taxa de financiamento.
                Se você não tiver o número exato, use uma estimativa próxima para receber um diagnóstico inicial.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setHasCalculated(true)}
            disabled={!canCalculate}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${
              canCalculate
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Calcular
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
            <SectionTitle>Resultado principal</SectionTitle>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Diagnóstico
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {displayedSummary.primary}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                  <Receipt size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Resumo
                  </p>
                  <p className="text-slate-900 font-black text-lg tracking-tight">
                    {displayedSummary.secondary}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">{displayedSummary.tertiary}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Orientação
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {displayedSummary.insight}
                  </p>
                </div>
              </div>

              {displayedSummary.risk && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-rose-700 text-sm font-bold">{displayedSummary.risk}</p>
                </div>
              )}
              <div className={`rounded-2xl border p-4 ${diagnosisClasses}`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                  {diagnosisCard.badge}
                </p>
                <p className="text-slate-900 font-black text-sm mb-2">
                  {diagnosisCard.title}
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {diagnosisCard.description}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-slate-500 mt-0.5" />
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Esta simulação é educacional e ajuda a entender a mecânica da dívida, mas contratos reais podem incluir encargos extras.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 relative">
            <div className={isDetailedLocked ? 'blur-sm pointer-events-none select-none' : ''}>
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 min-h-[420px] space-y-6 shadow-sm">
                <SectionTitle>Comparativo e tabela</SectionTitle>

                {hasCalculated && (system === 'sac' || system === 'price') && comparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        SAC
                      </p>
                      <p className="text-slate-900 font-black text-xl">
                        {activeSac ? formatCurrency(activeSac.firstPayment) : '--'}
                      </p>
                      <p className="text-slate-600 text-sm mt-2">
                        Juros totais: {activeSac ? formatCurrency(activeSac.totalInterest) : '--'}
                      </p>
                      <p className="text-slate-600 text-sm">
                        Total pago: {activeSac ? formatCurrency(activeSac.totalPaid) : '--'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        Price
                      </p>
                      <p className="text-slate-900 font-black text-xl">
                        {activePrice ? formatCurrency(activePrice.firstPayment) : '--'}
                      </p>
                      <p className="text-slate-600 text-sm mt-2">
                        Juros totais: {activePrice ? formatCurrency(activePrice.totalInterest) : '--'}
                      </p>
                      <p className="text-slate-600 text-sm">
                        Total pago: {activePrice ? formatCurrency(activePrice.totalPaid) : '--'}
                      </p>
                    </div>
                  </div>
                )}

                {hasCalculated && (system === 'sac' || system === 'price') && comparison && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                      <p className="text-emerald-800 text-sm leading-relaxed">
                        No cenário simulado, <span className="font-black">{comparison.betterByInterest}</span> cobra menos juros totais, com diferença aproximada de {formatCurrency(comparison.interestGap)}.
                      </p>
                    </div>
                  </div>
                )}

                {hasCalculated && showRotativeWarning && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-rose-600 mt-0.5" />
                      <p className="text-rose-800 text-sm leading-relaxed">
                        O pagamento mensal informado não cobre adequadamente os juros do período. Nesse ritmo, a dívida tende a continuar pesada.
                      </p>
                    </div>
                  </div>
                )}

                {canShowDetailed && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-slate-500 uppercase text-[10px] tracking-[0.2em]">Mês</th>
                          <th className="text-left px-4 py-3 text-slate-500 uppercase text-[10px] tracking-[0.2em]">Parcela</th>
                          <th className="text-left px-4 py-3 text-slate-500 uppercase text-[10px] tracking-[0.2em]">Juros</th>
                          <th className="text-left px-4 py-3 text-slate-500 uppercase text-[10px] tracking-[0.2em]">Amortização</th>
                          <th className="text-left px-4 py-3 text-slate-500 uppercase text-[10px] tracking-[0.2em]">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRows.map((row) => (
                          <tr key={row.month} className="border-t border-slate-200">
                            <td className="px-4 py-3 text-slate-900 font-bold">{row.month}</td>
                            <td className="px-4 py-3 text-slate-700">{formatCurrency(row.payment)}</td>
                            <td className="px-4 py-3 text-slate-700">{formatCurrency(row.interest)}</td>
                            <td className="px-4 py-3 text-slate-700">{formatCurrency(row.amortization)}</td>
                            <td className="px-4 py-3 text-slate-700">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    Como interpretar
                  </p>

                  <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                    <p>
                      <span className="font-black text-slate-900">SAC:</span> amortização igual em todas as parcelas; por isso a prestação tende a começar maior e cair.
                    </p>
                    <p>
                      <span className="font-black text-slate-900">Price:</span> parcela tende a ficar estável; no começo, uma parte maior dela costuma ser juros.
                    </p>
                    <p>
                      <span className="font-black text-slate-900">Rotativo:</span> não há tabela contratual clássica como SAC/Price; os juros recaem sobre o saldo não pago.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isDetailedLocked && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white/95 border border-slate-200 rounded-[2rem] p-6 text-center shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <Lock size={24} />
                  </div>

                  <h3 className="text-slate-900 text-xl font-black tracking-tight mb-3">
                    Desbloqueie seu plano completo
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Entre para salvar esta simulação, comparar cenários com calma e acompanhar a estratégia que pode reduzir prazo e juros da sua dívida.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        sessionStorage.setItem(
                          DEBT_SIM_STORAGE_KEY,
                          JSON.stringify({
                            inputMode,
                            system,
                            debtAmount,
                            monthlyRate,
                            installments,
                            currentPayment,
                            extraPayment,
                            hasCalculated,
                          })
                        );
                        onNavigate('register');
                      }}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      Criar conta grátis <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={() => {
                        sessionStorage.setItem(
                          DEBT_SIM_STORAGE_KEY,
                          JSON.stringify({
                            inputMode,
                            system,
                            debtAmount,
                            monthlyRate,
                            installments,
                            currentPayment,
                            extraPayment,
                            hasCalculated,
                          })
                        );
                        onNavigate('login');
                      }}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-slate-200 transition-all"
                    >
                      Entrar e continuar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};
