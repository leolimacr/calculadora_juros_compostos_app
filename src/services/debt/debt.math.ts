import { DebtItem } from './debt.types';

export type ScheduleRow = {
  month: number;
  payment: number;
  interest: number;
  amortization: number;
  balance: number;
};

export type StructuredResult = {
  valid: boolean;
  firstPayment: number;
  lastPayment: number;
  totalPaid: number;
  totalInterest: number;
  rows: ScheduleRow[];
};

export type RotativeResult = {
  valid: boolean;
  months: number | null;
  totalPaid: number | null;
  totalInterest: number | null;
  rows: ScheduleRow[];
};

export const buildSacSchedule = (
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

export const buildPriceSchedule = (
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

export const buildRotativeSchedule = (
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

export interface DebtRanking {
  debt: DebtItem;
  score: number;
  breakdown: {
    cost: number;
    urgency: number;
    opportunity: number;
    cashflowImpact: number;
  };
}

export function rankDebts(debts: DebtItem[], heroValue?: number): DebtRanking[] {
  if (debts.length === 0) return [];

  const maxSaldo = Math.max(...debts.map(d => d.saldoDevedor), 1);
  const now = new Date();

  const rankings = debts.map(debt => {
    const cost = Math.min((debt.taxaMensal || 0) / 10, 1) * 100;

    let urgency = 0;
    if (debt.dataVencimento) {
      const dueDate = new Date(debt.dataVencimento);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) {
        urgency = 100;
      } else if (daysUntilDue <= 7) {
        urgency = 80;
      } else {
        urgency = Math.max(0, 100 - daysUntilDue);
      }
    }
    if (debt.parcelasRestantes > 0 && debt.parcelasRestantes <= 3) {
      urgency = Math.max(urgency, 60);
    }
    urgency = Math.min(urgency, 100);

    const opportunity = maxSaldo > 0
      ? Math.max(0, 1 - debt.saldoDevedor / maxSaldo) * 100
      : 0;

    let cashflowImpact = 0;
    if (heroValue !== undefined && heroValue > 0 && debt.valorParcela > 0) {
      cashflowImpact = Math.min(debt.valorParcela / heroValue, 1) * 100;
    }

    const score = cost * 0.45 + urgency * 0.30 + opportunity * 0.15 + cashflowImpact * 0.10;

    return {
      debt,
      score: Math.round(score),
      breakdown: {
        cost: Math.round(cost),
        urgency: Math.round(urgency),
        opportunity: Math.round(opportunity),
        cashflowImpact: Math.round(cashflowImpact),
      },
    };
  });

  return rankings.sort((a, b) => b.score - a.score);
}

export function computeMonthlyImpact(debt: DebtItem): number {
  if (debt.originType === 'rotativo_cartao' && debt.taxaMensal > 0) {
    return debt.saldoDevedor * (debt.taxaMensal / 100);
  }
  if (debt.valorParcela > 0) {
    return debt.valorParcela;
  }
  if (debt.taxaMensal > 0) {
    return debt.saldoDevedor * (debt.taxaMensal / 100);
  }
  return 0;
}
