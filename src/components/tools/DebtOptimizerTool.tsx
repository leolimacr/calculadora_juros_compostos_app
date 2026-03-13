import React, { useMemo, useState } from 'react';
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
        ? 'bg-sky-500/10 border-sky-500/40 shadow-lg shadow-sky-950/20'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}
  >
    <p className="text-xs font-black uppercase tracking-[0.2em] text-white mb-2">{title}</p>
    <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
  </button>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{children}</p>
);

export const DebtOptimizerTool = ({ onNavigate, isAuthenticated }: any) => {
  const [system, setSystem] = useState<DebtSystem>('rotativo');
  const [debtAmount, setDebtAmount] = useState<number | ''>('');
  const [monthlyRate, setMonthlyRate] = useState<number | ''>('');
  const [installments, setInstallments] = useState<number | ''>('');
  const [currentPayment, setCurrentPayment] = useState<number | ''>('');
  const [extraPayment, setExtraPayment] = useState<number | ''>('');

  const hasCommonData =
    debtAmount !== '' &&
    monthlyRate !== '' &&
    Number(debtAmount) > 0 &&
    Number(monthlyRate) >= 0;

  const hasStructuredData =
    hasCommonData &&
    installments !== '' &&
    Number(installments) > 0;

  const hasRotativeData =
    hasCommonData &&
    currentPayment !== '' &&
    Number(currentPayment) > 0;

  const sacBase = useMemo(() => {
    if (!hasStructuredData) return null;
    return buildSacSchedule(
      Number(debtAmount),
      Number(monthlyRate),
      Number(installments),
      0
    );
  }, [debtAmount, monthlyRate, installments, hasStructuredData]);

  const sacOptimized = useMemo(() => {
    if (!hasStructuredData) return null;
    return buildSacSchedule(
      Number(debtAmount),
      Number(monthlyRate),
      Number(installments),
      Number(extraPayment || 0)
    );
  }, [debtAmount, monthlyRate, installments, extraPayment, hasStructuredData]);

  const priceBase = useMemo(() => {
    if (!hasStructuredData) return null;
    return buildPriceSchedule(
      Number(debtAmount),
      Number(monthlyRate),
      Number(installments),
      0
    );
  }, [debtAmount, monthlyRate, installments, hasStructuredData]);

  const priceOptimized = useMemo(() => {
    if (!hasStructuredData) return null;
    return buildPriceSchedule(
      Number(debtAmount),
      Number(monthlyRate),
      Number(installments),
      Number(extraPayment || 0)
    );
  }, [debtAmount, monthlyRate, installments, extraPayment, hasStructuredData]);

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
      Number(currentPayment) + Number(extraPayment || 0)
    );
  }, [debtAmount, monthlyRate, currentPayment, extraPayment, hasRotativeData]);
  
  const selectedSummary = useMemo(() => {
    const extra = Number(extraPayment || 0);

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
    extraPayment,
    hasRotativeData,
  ]);

  const comparison = useMemo(() => {
    if (!sacBase?.valid || !priceBase?.valid) return null;

    const betterByInterest =
      sacBase.totalInterest < priceBase.totalInterest ? 'SAC' : 'Price';

    return {
      betterByInterest,
      interestGap: Math.abs(priceBase.totalInterest - sacBase.totalInterest),
    };
  }, [sacBase, priceBase]);

  const selectedRows = useMemo(() => {
    if (system === 'sac') {
      return (Number(extraPayment || 0) > 0 ? sacOptimized?.rows : sacBase?.rows)?.slice(0, 12) || [];
    }

    if (system === 'price') {
      return (Number(extraPayment || 0) > 0 ? priceOptimized?.rows : priceBase?.rows)?.slice(0, 12) || [];
    }

    return (Number(extraPayment || 0) > 0 ? rotativeOptimized?.rows : rotativeBase?.rows)?.slice(0, 12) || [];
  }, [
    system,
    extraPayment,
    sacBase,
    sacOptimized,
    priceBase,
    priceOptimized,
    rotativeBase,
    rotativeOptimized,
  ]);

  const canShowDetailed =
  (system === 'sac' && !!(Number(extraPayment || 0) > 0 ? sacOptimized?.valid : sacBase?.valid)) ||
  (system === 'price' && !!(Number(extraPayment || 0) > 0 ? priceOptimized?.valid : priceBase?.valid)) ||
  (system === 'rotativo' && !!(Number(extraPayment || 0) > 0 ? rotativeOptimized?.valid : rotativeBase?.valid));

  return (
    <ToolLayout
      title="Otimizador de Dívidas"
      icon="💳"
      onBack={onNavigate}
      description="Compare SAC, Price e dívida rotativa, descubra o modelo que mais parece com o seu contrato e simule sua quitação."
    >
      <div className="space-y-10">
        <div className="bg-slate-950/60 border border-slate-800 rounded-[2rem] p-6">
          <SectionTitle>Como identificar sua dívida</SectionTitle>

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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-white font-black text-sm mb-2">Quando escolher SAC</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Se o seu contrato mostra parcelas decrescentes, o SAC costuma ser o melhor encaixe lógico.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-white font-black text-sm mb-2">Quando escolher Price</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Se a parcela aparece praticamente igual ao longo do contrato, a Price costuma ser a referência mais próxima.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-white font-black text-sm mb-2">Quando escolher Rotativo</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Se você paga parte da fatura e o restante vira saldo com juros altos, este é o modo mais útil para seu caso.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-[2rem] p-6">
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
              label="Juros ao mês"
              value={monthlyRate}
              onChange={setMonthlyRate}
              placeholder="Ex: 8"
              help="Taxa mensal aplicada à sua dívida."
            />
            {(system === 'sac' || system === 'price') && (
              <>
                <Input
                  label="Número de parcelas"
                  value={installments}
                  onChange={setInstallments}
                  placeholder="Ex: 48"
                  help="Prazo contratual da dívida ou financiamento."
                />

                <Input
                  label="Amortização extra por mês"
                  value={extraPayment}
                  onChange={setExtraPayment}
                  prefix="R$"
                  placeholder="Ex: 300"
                  help="Valor adicional usado para reduzir o prazo da dívida."
                />
              </>
            )}

            {system === 'rotativo' && (
              <>
                <Input
                  label="Pagamento mensal atual"
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-slate-950/60 border border-slate-800 rounded-[2rem] p-6">
            <SectionTitle>Resultado principal</SectionTitle>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Diagnóstico
                  </p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    {selectedSummary.primary}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Receipt size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Resumo
                  </p>
                  <p className="text-white font-black text-lg tracking-tight">
                    {selectedSummary.secondary}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">{selectedSummary.tertiary}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Orientação
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedSummary.insight}
                  </p>
                </div>
              </div>

              {selectedSummary.risk && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                  <p className="text-rose-300 text-sm font-bold">{selectedSummary.risk}</p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-slate-400 mt-0.5" />
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Esta simulação é educacional e ajuda a entender a mecânica da dívida, mas contratos reais podem incluir encargos extras.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 relative">
            <div className={!isAuthenticated ? 'blur-sm pointer-events-none select-none' : ''}>
              <div className="bg-slate-950/60 border border-slate-800 rounded-[2rem] p-6 min-h-[420px] space-y-6">
                <SectionTitle>Comparativo e tabela</SectionTitle>

                {(system === 'sac' || system === 'price') && comparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        SAC
                      </p>
                      <p className="text-white font-black text-xl">
                        {(Number(extraPayment || 0) > 0 ? sacOptimized : sacBase)
                          ? formatCurrency((Number(extraPayment || 0) > 0 ? sacOptimized : sacBase)!.firstPayment)
                          : '--'}
                        ...
                        Total pago: {(Number(extraPayment || 0) > 0 ? sacOptimized : sacBase)
                          ? formatCurrency((Number(extraPayment || 0) > 0 ? sacOptimized : sacBase)!.totalPaid)
                          : '--'}
                        ...
                        {(Number(extraPayment || 0) > 0 ? priceOptimized : priceBase)
                          ? formatCurrency((Number(extraPayment || 0) > 0 ? priceOptimized : priceBase)!.firstPayment)
                          : '--'}
                        ...
                        Total pago: {(Number(extraPayment || 0) > 0 ? priceOptimized : priceBase)
                          ? formatCurrency((Number(extraPayment || 0) > 0 ? priceOptimized : priceBase)!.totalPaid)
                          : '--'} 
                      </p>
                    </div>
                  </div>
                )}

                {(system === 'sac' || system === 'price') && comparison && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 mt-0.5" />
                      <p className="text-emerald-100 text-sm leading-relaxed">
                        No cenário simulado, <span className="font-black">{comparison.betterByInterest}</span> cobra menos juros totais, com diferença aproximada de {formatCurrency(comparison.interestGap)}.
                      </p>
                    </div>
                  </div>
                )}
                {system === 'rotativo' && rotativeBase && !rotativeBase.valid && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-rose-400 mt-0.5" />
                      <p className="text-rose-100 text-sm leading-relaxed">
                        O pagamento mensal informado não cobre adequadamente os juros do período. Nesse ritmo, a dívida tende a continuar pesada.
                      </p>
                    </div>
                  </div>
                )}

                {canShowDetailed && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-900">
                        <tr>
                          <th className="text-left px-4 py-3 text-slate-400 uppercase text-[10px] tracking-[0.2em]">Mês</th>
                          <th className="text-left px-4 py-3 text-slate-400 uppercase text-[10px] tracking-[0.2em]">Parcela</th>
                          <th className="text-left px-4 py-3 text-slate-400 uppercase text-[10px] tracking-[0.2em]">Juros</th>
                          <th className="text-left px-4 py-3 text-slate-400 uppercase text-[10px] tracking-[0.2em]">Amortização</th>
                          <th className="text-left px-4 py-3 text-slate-400 uppercase text-[10px] tracking-[0.2em]">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRows.map((row) => (
                          <tr key={row.month} className="border-t border-slate-800">
                            <td className="px-4 py-3 text-white font-bold">{row.month}</td>
                            <td className="px-4 py-3 text-slate-300">{formatCurrency(row.payment)}</td>
                            <td className="px-4 py-3 text-slate-300">{formatCurrency(row.interest)}</td>
                            <td className="px-4 py-3 text-slate-300">{formatCurrency(row.amortization)}</td>
                            <td className="px-4 py-3 text-slate-300">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                    Como interpretar
                  </p>

                  <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                    <p>
                      <span className="font-black text-white">SAC:</span> amortização igual em todas as parcelas; por isso a prestação tende a começar maior e cair.
                    </p>
                    <p>
                      <span className="font-black text-white">Price:</span> parcela tende a ficar estável; no começo, uma parte maior dela costuma ser juros.
                    </p>
                    <p>
                      <span className="font-black text-white">Rotativo:</span> não há tabela contratual clássica como SAC/Price; os juros recaem sobre o saldo não pago.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-950/95 border border-slate-800 rounded-[2rem] p-6 text-center shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                    <Lock size={24} />
                  </div>

                  <h3 className="text-white text-xl font-black tracking-tight mb-3">
                    Desbloqueie o plano detalhado
                  </h3>

                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Crie sua conta para ver toda a tabela, comparar cenários completos e salvar sua simulação.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => onNavigate('register')}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      Criar conta <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={() => onNavigate('login')}
                      className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-slate-700 transition-all"
                    >
                      Já tenho conta
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
