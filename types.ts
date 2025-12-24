
export type PeriodType = 'months' | 'years';
export type RateType = 'monthly' | 'annual';

export interface CalculationInput {
  initialValue: number;
  monthlyValue: number;
  interestRate: number;
  rateType: RateType;
  period: number;
  periodType: PeriodType;
  taxRate: number; // Taxa de imposto sobre lucro
  inflationRate: number; // Nova taxa de inflação anual estimada
}

export interface MonthlyData {
  month: number;
  interest: number;
  totalInvested: number;
  totalInterest: number;
  totalAccumulated: number;
  totalReal: number; // Valor ajustado pela inflação
}

export interface CalculationResult {
  summary: {
    totalFinal: number;
    totalInvested: number;
    totalInterest: number;
    totalTax: number;
    totalNet: number;
    totalRealNet: number; // Poder de compra real final
  };
  history: MonthlyData[];
}

// Gerenciador Financeiro
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export type FilterPeriod = 'tudo' | 'hoje' | 'mes' | 'ano';

// Metas Financeiras
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
}

// AI Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  sources?: { uri: string; title: string }[];
}

// Notificações (Toast)
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Novas Ferramentas

export interface RentVsFinanceInput {
  propertyValue: number;
  downPayment: number;
  interestRateYear: number;
  years: number;
  rentValue: number;
  investmentRateYear: number;
  appreciationRateYear: number;
}

export interface DebtItem {
  id: string;
  name: string;
  totalValue: number;
  interestRate: number;
  minPayment: number;
}

export interface FireInput {
  monthlyExpenses: number;
  currentNetWorth: number;
  monthlyContribution: number;
  annualReturn: number;
  inflation: number;
  safeWithdrawalRate: number;
}

export interface RoiInput {
  initialInvestment: number;
  revenue: number;
  costs: number;
  period: number;
}

// Mini Game
export interface GameState {
  month: number;
  balance: number;
  investments: number;
  happiness: number;
  logs: string[];
  gameOver: boolean;
  victory: boolean;
}

export interface GameEvent {
  id: string;
  text: string;
  impactMoney: number;
  impactHappiness: number;
  options?: {
    text: string;
    money: number;
    happiness: number;
  }[];
}
