
import { CalculationInput, CalculationResult, MonthlyData } from '../types';

export const calculateCompoundInterest = (input: CalculationInput): CalculationResult => {
  const { initialValue, monthlyValue, interestRate, rateType, period, periodType } = input;
  
  // Total months
  const totalMonths = periodType === 'years' ? period * 12 : period;
  
  // Monthly interest rate
  let monthlyRate = 0;
  if (rateType === 'monthly') {
    monthlyRate = interestRate / 100;
  } else {
    // Exact conversion: (1 + i_annual) = (1 + i_monthly)^12
    monthlyRate = Math.pow(1 + interestRate / 100, 1 / 12) - 1;
  }

  const history: MonthlyData[] = [];
  let currentBalance = initialValue;
  let accumulatedInvested = initialValue;
  let accumulatedInterest = 0;

  // Add month 0 (initial state)
  history.push({
    month: 0,
    interest: 0,
    totalInvested: accumulatedInvested,
    totalInterest: 0,
    totalAccumulated: currentBalance
  });

  for (let m = 1; m <= totalMonths; m++) {
    const interestForMonth = currentBalance * monthlyRate;
    currentBalance += interestForMonth + monthlyValue;
    accumulatedInvested += monthlyValue;
    accumulatedInterest += interestForMonth;

    history.push({
      month: m,
      interest: interestForMonth,
      totalInvested: accumulatedInvested,
      totalInterest: accumulatedInterest,
      totalAccumulated: currentBalance
    });
  }

  return {
    summary: {
      totalFinal: currentBalance,
      totalInvested: accumulatedInvested,
      totalInterest: accumulatedInterest
    },
    history
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
