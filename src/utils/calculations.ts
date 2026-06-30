import type { FinancialProfile } from '../types';

export type SovereignMode = 'rotina' | 'comando';

export interface SovereignMetrics {
  monthBalance: number;
  accumulatedBalance: number;
  projectedBalance: number;
  protectionBuffer: number;
  colchaoShortfall: number;
  reserveShortfall: number;
  protectionShortfall: number;
  sovereignFreeBalance: number;
  freedomDeficit: number;
}

export interface SovereignSnapshot extends SovereignMetrics {
  mode: SovereignMode;
  heroLabel: string;
  heroValue: number;
  leewayDays: number;
  freedomVelocity: number;
  income: number;
  expenses: number;
  accumulatedIncome: number;
  accumulatedExpenses: number;
  obligationsDeduction: number;
  totalCreditUsed?: number;
  totalDebtBalance?: number;
}

export interface SovereignBucketsBreakdown {
  marcoZero: number;
  reserve: number;
  livre: number;
  comprometido: number;
  freedomDeficit: number;
  structureInvaded: boolean;
  freedomVelocity: number;
  colchaoShortfall: number;
  reserveShortfall: number;
}

export function deriveSovereignBuckets(
  snapshot: Pick<SovereignSnapshot, 'sovereignFreeBalance' | 'obligationsDeduction' | 'freedomDeficit' | 'freedomVelocity' | 'colchaoShortfall' | 'reserveShortfall'>,
  marcoZero: number,
  reserveCurrent: number
): SovereignBucketsBreakdown {
  return {
    marcoZero,
    reserve: reserveCurrent,
    livre: Math.max(0, snapshot.sovereignFreeBalance),
    comprometido: snapshot.obligationsDeduction,
    freedomDeficit: snapshot.freedomDeficit,
    structureInvaded: snapshot.sovereignFreeBalance < 0,
    freedomVelocity: snapshot.freedomVelocity,
    colchaoShortfall: snapshot.colchaoShortfall,
    reserveShortfall: snapshot.reserveShortfall,
  };
}

export interface MonthFlow {
  income: number;
  expenses: number;
  realBalance: number;
  virtualImpact: number;
}

type TxLike = {
  type: string;
  amount: number;
  paymentMethod?: string;
  date: string;
  isVirtual?: boolean;
};

export function aggregateMonthFlow(
  transactions: TxLike[],
  year?: number,
  month?: number
): MonthFlow {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  let income = 0;
  let expenses = 0;
  let realBalance = 0;
  let virtualImpact = 0;

  transactions.forEach((t) => {
    if (!t.date) return;
    const [ty, tm] = t.date.split('-').map(Number);
    if (ty !== y || tm !== m) return;

    const val = Number(t.amount) || 0;
    const isCredit = t.paymentMethod === 'credit';

    if (t.type === 'income') {
      income += val;
      realBalance += val;
    } else {
      expenses += val;
      if (t.isVirtual) {
        virtualImpact += val;
      } else if (!isCredit) {
        realBalance -= val;
      }
    }
  });

  return { income, expenses, realBalance, virtualImpact };
}

export function aggregateAllTimeFlow(transactions: TxLike[]): MonthFlow {
  let income = 0;
  let expenses = 0;
  let realBalance = 0;
  let virtualImpact = 0;

  transactions.forEach((t) => {
    const val = Number(t.amount) || 0;
    const isCredit = t.paymentMethod === 'credit';

    if (t.type === 'income') {
      income += val;
      realBalance += val;
    } else {
      expenses += val;
      if (t.isVirtual) {
        virtualImpact += val;
      } else if (!isCredit) {
        realBalance -= val;
      }
    }
  });

  return { income, expenses, realBalance, virtualImpact };
}

export function getProtectionBuffer(financialProfile?: FinancialProfile): number {
  return (financialProfile?.marcoZero || 0) + (financialProfile?.emergencyReserveCurrent || 0);
}

export function getColchaoShortfall(fp?: FinancialProfile): number {
  return Math.max(0, (fp?.colchaoInicialTarget || 0) - (fp?.marcoZero || 0));
}

export function getReserveShortfall(fp?: FinancialProfile): number {
  return Math.max(0, (fp?.emergencyReserveTarget || 0) - (fp?.emergencyReserveCurrent || 0));
}

export function getTotalShortfall(fp?: FinancialProfile): number {
  return getColchaoShortfall(fp) + getReserveShortfall(fp);
}

export function computeSovereignMetrics(
  monthBalance: number,
  virtualImpact: number,
  pendingBills: number,
  accumulatedBalance: number,
  financialProfile?: FinancialProfile
): SovereignMetrics {
  const colchaoShortfall = getColchaoShortfall(financialProfile);
  const reserveShortfall = getReserveShortfall(financialProfile);
  const protectionShortfall = colchaoShortfall + reserveShortfall;
  const protectionBuffer = getProtectionBuffer(financialProfile);
  const projectedBalance = monthBalance - virtualImpact - pendingBills;
  const sovereignFreeBalance = accumulatedBalance - virtualImpact - pendingBills - protectionShortfall;
  const freedomDeficit = sovereignFreeBalance < 0 ? Math.abs(sovereignFreeBalance) : 0;

  return {
    monthBalance,
    accumulatedBalance,
    projectedBalance,
    protectionBuffer,
    colchaoShortfall,
    reserveShortfall,
    protectionShortfall,
    sovereignFreeBalance,
    freedomDeficit,
  };
}

export interface BuildSovereignSnapshotParams {
  monthBalance: number;
  accumulatedBalance: number;
  accumulatedIncome: number;
  accumulatedExpenses: number;
  virtualImpact?: number;
  pendingBills?: number;
  financialProfile?: FinancialProfile;
  commandMode: boolean;
  monthlyExpenses?: number;
  monthlyAport?: number;
  income?: number;
  expenses?: number;
  rotativoDebtBalance?: number;
}

export function buildSovereignSnapshot(params: BuildSovereignSnapshotParams): SovereignSnapshot {
  const virtualImpact = (params.virtualImpact ?? 0) + (params.rotativoDebtBalance ?? 0);
  const pendingBills = params.pendingBills ?? 0;
  const income = params.income ?? 0;
  const expenses = params.expenses ?? params.monthlyExpenses ?? 0;

  const metrics = computeSovereignMetrics(
    params.monthBalance,
    virtualImpact,
    pendingBills,
    params.accumulatedBalance,
    params.financialProfile
  );

  const mode: SovereignMode = params.commandMode ? 'comando' : 'rotina';
  const heroValue = mode === 'comando' ? metrics.sovereignFreeBalance : params.monthBalance;

  const dailyCost = expenses / 30;
  const leewayDays = calculateLeewayDays(metrics.sovereignFreeBalance, dailyCost);
  const freedomVelocity = calculateFreedomVelocity(
    params.monthlyAport ?? Math.max(0, income - expenses),
    expenses
  );

  const heroLabel = mode === 'comando' ? 'Disponibilidade Real' : 'Dinheiro do Mês';

  return {
    ...metrics,
    mode,
    heroLabel,
    heroValue,
    leewayDays,
    freedomVelocity,
    income,
    expenses,
    accumulatedIncome: params.accumulatedIncome,
    accumulatedExpenses: params.accumulatedExpenses,
    obligationsDeduction: virtualImpact + pendingBills,
  };
}

export interface LaunchImpactPreview {
  delta: number;
  percent: number;
  targetLabel: string;
  newValue: number;
}

export function computeLaunchImpact(
  snapshot: SovereignSnapshot,
  draftAmount: number,
  draftType: 'income' | 'expense',
  paymentMethod: 'money' | 'credit' = 'money'
): LaunchImpactPreview | null {
  if (draftAmount <= 0) return null;

  let balanceDelta = 0;
  if (draftType === 'income') {
    balanceDelta = draftAmount;
  } else if (paymentMethod !== 'credit') {
    balanceDelta = -draftAmount;
  } else {
    return null;
  }

  const heroAfter = snapshot.heroValue + balanceDelta;

  const baseValue = snapshot.heroValue;
  const newValue = heroAfter;
  const delta = newValue - baseValue;
  const percent =
    baseValue !== 0
      ? (delta / Math.abs(baseValue)) * 100
      : delta !== 0
        ? delta > 0
          ? 100
          : -100
        : 0;
  const targetLabel = snapshot.heroLabel.toLowerCase();

  return {
    delta,
    percent,
    targetLabel,
    newValue,
  };
}


export const calculateLeewayDays = (
  sovereignBalance: number,
  dailyCost: number
): number => {
  if (dailyCost <= 0) return 0;
  const days = Math.floor(sovereignBalance / dailyCost);
  return days > 0 ? days : 0;
};

export const calculateFreedomVelocity = (
  monthlyAport: number,
  monthlyFixedCost: number
): number => {
  if (monthlyFixedCost <= 0) return 0;
  const velocity = (monthlyAport / monthlyFixedCost) * 30;
  return parseFloat(velocity.toFixed(1));
};

export const calculateCompoundInterest = () => ({ total: 0 });

export const maskCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};
