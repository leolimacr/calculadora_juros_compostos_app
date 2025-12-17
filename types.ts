
export type PeriodType = 'months' | 'years';
export type RateType = 'monthly' | 'annual';

export interface CalculationInput {
  initialValue: number;
  monthlyValue: number;
  interestRate: number;
  rateType: RateType;
  period: number;
  periodType: PeriodType;
}

export interface MonthlyData {
  month: number;
  interest: number;
  totalInvested: number;
  totalInterest: number;
  totalAccumulated: number;
}

export interface CalculationResult {
  summary: {
    totalFinal: number;
    totalInvested: number;
    totalInterest: number;
  };
  history: MonthlyData[];
}
