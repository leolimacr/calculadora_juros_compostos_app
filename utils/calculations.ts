
import { CalculationInput, CalculationResult, MonthlyData, RentVsFinanceInput, FireInput, DebtItem, RoiInput } from '../types';

// Helper para Modo de Privacidade
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const maskCurrency = (value: number, isPrivacyMode: boolean) => {
  return isPrivacyMode ? '••••••' : formatCurrency(value);
};

// Juros Compostos
export const calculateCompoundInterest = (input: CalculationInput): CalculationResult => {
  const { initialValue, monthlyValue, interestRate, rateType, period, periodType, taxRate = 0, inflationRate = 0 } = input;
  const totalMonths = periodType === 'years' ? period * 12 : period;
  
  let monthlyRate = 0;
  if (rateType === 'monthly') {
    monthlyRate = interestRate / 100;
  } else {
    monthlyRate = Math.pow(1 + interestRate / 100, 1 / 12) - 1;
  }

  // Taxa de inflação mensal
  const monthlyInflation = Math.pow(1 + inflationRate / 100, 1 / 12) - 1;

  const history: MonthlyData[] = [];
  let currentBalance = initialValue;
  let accumulatedInvested = initialValue;
  let accumulatedInterest = 0;
  
  // Para cálculo real
  let realBalance = initialValue; 

  history.push({
    month: 0,
    interest: 0,
    totalInvested: accumulatedInvested,
    totalInterest: 0,
    totalAccumulated: currentBalance,
    totalReal: realBalance
  });

  for (let m = 1; m <= totalMonths; m++) {
    const interestForMonth = currentBalance * monthlyRate;
    currentBalance += interestForMonth + monthlyValue;
    accumulatedInvested += monthlyValue;
    accumulatedInterest += interestForMonth;

    // Cálculo do valor real (descontando inflação acumulada)
    // O dinheiro perde valor a cada mês pela taxa de inflação
    const inflationFactor = Math.pow(1 + monthlyInflation, m);
    realBalance = currentBalance / inflationFactor;

    history.push({
      month: m,
      interest: interestForMonth,
      totalInvested: accumulatedInvested,
      totalInterest: accumulatedInterest,
      totalAccumulated: currentBalance,
      totalReal: realBalance
    });
  }

  // Cálculo do Imposto (Apenas sobre o lucro nominal)
  const totalTax = accumulatedInterest * (taxRate / 100);
  const totalNet = currentBalance - totalTax;
  
  // Poder de compra final líquido (aproximado, aplicando deflator no montante final liquido)
  const finalInflationFactor = Math.pow(1 + monthlyInflation, totalMonths);
  const totalRealNet = totalNet / finalInflationFactor;

  return {
    summary: {
      totalFinal: currentBalance, // Valor Bruto Nominal
      totalInvested: accumulatedInvested,
      totalInterest: accumulatedInterest,
      totalTax: totalTax,
      totalNet: totalNet, // Valor Líquido Nominal
      totalRealNet: totalRealNet // Valor Líquido Real (Poder de Compra)
    },
    history
  };
};

// Simulador de Dividendos (Novo)
export interface DividendInput {
  initialInvestment: number;
  monthlyContribution: number;
  assetPrice: number;
  monthlyYield: number; // %
  years: number;
}

export const calculateDividends = (input: DividendInput) => {
  const { initialInvestment, monthlyContribution, assetPrice, monthlyYield, years } = input;
  const months = years * 12;
  const yieldRate = monthlyYield / 100;

  let totalShares = Math.floor(initialInvestment / assetPrice);
  let walletValue = totalShares * assetPrice; 
  let totalInvested = initialInvestment;
  
  const history = [];
  let magicNumberReached = false;
  let magicNumberMonth = 0;

  for (let m = 1; m <= months; m++) {
    const dividends = totalShares * (assetPrice * yieldRate);
    const availableCash = monthlyContribution + dividends;
    const newShares = Math.floor(availableCash / assetPrice);
    
    if (!magicNumberReached && dividends >= assetPrice) {
      magicNumberReached = true;
      magicNumberMonth = m;
    }

    totalShares += newShares;
    totalInvested += monthlyContribution;
    walletValue = totalShares * assetPrice;

    history.push({
      month: m,
      dividends,
      totalShares,
      walletValue,
      totalInvested,
      sharesFromPocket: Math.floor(monthlyContribution / assetPrice),
      sharesFromDividends: Math.floor(dividends / assetPrice)
    });
  }

  return {
    summary: {
      finalMonthlyIncome: history[history.length - 1].dividends,
      totalShares: totalShares,
      totalValue: walletValue,
      totalInvested: totalInvested,
      magicNumberMonth
    },
    history
  };
};

export const calculateRentVsFinance = (input: RentVsFinanceInput) => {
  const { propertyValue, downPayment, interestRateYear, years, rentValue, investmentRateYear, appreciationRateYear } = input;
  const months = years * 12;
  const loanAmount = propertyValue - downPayment;
  const monthlyRateLoan = Math.pow(1 + interestRateYear / 100, 1 / 12) - 1;
  const monthlyRateInv = Math.pow(1 + investmentRateYear / 100, 1 / 12) - 1;
  
  const pmt = loanAmount * (monthlyRateLoan * Math.pow(1 + monthlyRateLoan, months)) / (Math.pow(1 + monthlyRateLoan, months) - 1);
  const totalPaidFinance = downPayment + (pmt * months);
  const propertyFinalValue = propertyValue * Math.pow(1 + appreciationRateYear / 100, years);
  const netWorthFinance = propertyFinalValue;

  let investmentBalance = downPayment;
  let currentRent = rentValue;
  
  for (let i = 0; i < months; i++) {
    investmentBalance = investmentBalance * (1 + monthlyRateInv);
    const difference = pmt - currentRent; 
    if (difference > 0) {
      investmentBalance += difference;
    }
    if ((i + 1) % 12 === 0) {
      currentRent = currentRent * (1 + (appreciationRateYear/100)); 
    }
  }
  
  return {
    finance: { totalPaid: totalPaidFinance, finalAsset: netWorthFinance, monthlyPayment: pmt },
    rent: { finalAsset: investmentBalance }
  };
};

export const calculateDebtAvalanche = (debts: DebtItem[], extraPayment: number) => {
  const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  let months = 0;
  let currentDebts = sortedDebts.map(d => ({ ...d }));

  while (currentDebts.some(d => d.totalValue > 0) && months < 360) { 
    months++;
    let availableExtra = extraPayment;

    currentDebts.forEach(d => {
      if (d.totalValue > 0) d.totalValue += d.totalValue * (d.interestRate / 100);
    });

    currentDebts.forEach(d => {
      if (d.totalValue > 0) {
        const payment = Math.min(d.totalValue, d.minPayment);
        d.totalValue -= payment;
      }
    });

    for (let d of currentDebts) {
      if (d.totalValue > 0 && availableExtra > 0) {
        const payment = Math.min(d.totalValue, availableExtra);
        d.totalValue -= payment;
        availableExtra -= payment;
      }
    }
  }

  return { monthsToFreedom: months, totalInterestPaid: 0 }; 
};

export const calculateFire = (input: FireInput) => {
  const { monthlyExpenses, safeWithdrawalRate } = input;
  const annualExpenses = monthlyExpenses * 12;
  const fireNumber = annualExpenses / (safeWithdrawalRate / 100);
  return { fireNumber };
};

export const calculateInflationLoss = (amount: number, year: number) => {
  const yearsDiff = new Date().getFullYear() - year;
  const rate = Math.pow(1.058, yearsDiff); 
  const correctedValue = amount * rate;
  return { todayValue: correctedValue, lossPercentage: ((rate - 1) * 100) };
};

export const calculateRoi = (input: RoiInput) => {
  const { initialInvestment, revenue, costs, period } = input;
  const totalCosts = initialInvestment + costs;
  const netProfit = revenue - totalCosts;
  
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  
  const years = period / 12;
  let annualizedRoi = 0;
  if (totalCosts > 0 && revenue > 0 && years > 0) {
    annualizedRoi = (Math.pow(revenue / totalCosts, 1 / years) - 1) * 100;
  }

  return {
    netProfit,
    totalCosts,
    roi,
    annualizedRoi: isFinite(annualizedRoi) ? annualizedRoi : 0
  };
};
