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
