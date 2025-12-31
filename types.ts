
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

// Gerenciador Financeiro - Freemium Meta
export interface UserMeta {
  plan: 'free' | 'premium';
  launchLimit: number;
  launchCount: number;
  createdAt: number;
  updatedAt: number;
  emailVerified?: boolean; // Novo campo
  emailVerificationSentAt?: number; // Novo campo
}

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

// Dados de Mercado (API)
export type MarketCategory = 'currency' | 'crypto' | 'index' | 'stock';

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  category: MarketCategory;
  timestamp: number;
  simulated?: boolean; // Indica se o dado é simulado (fallback/rate limit)
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
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

// Mini Game - Updated
export interface GameLog {
  month: number;
  message: string;
  type: 'info' | 'success' | 'danger' | 'warning';
}

export interface GameState {
  month: number;
  balance: number;
  investments: number;
  happiness: number;
  incomeRate: number; // Multiplicador de renda (promoções, cursos aumentam isso)
  logs: GameLog[];
  gameOver: boolean;
  victory: boolean;
  score: number;
  badges: string[];
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'opportunity' | 'setback' | 'neutral';
  choices?: {
    text: string;
    cost?: number;
    effect: (state: GameState) => Partial<GameState>;
  }[];
}

// Conteúdo Educativo
export interface Article {
  id: number;
  title: string;
  desc: string;
  tag: string;
  date: string;
  category: 'ia' | 'carreira' | 'fundamentos';
  fullContent?: React.ReactNode; // Conteúdo completo do artigo
}

// Navegação
export type ToolView = 
  // Públicas
  | 'home' 
  | 'artigos' 
  | 'guias' 
  | 'faq' 
  | 'sobre' 
  | 'demo' 
  | 'login' 
  | 'register' 
  | 'termos-de-uso' 
  | 'politica-privacidade' 
  | 'premium'
  | 'changelog'
  | 'verify-email' // Nova rota
  | 'reset-password' // Nova rota
  // Privadas (Gerais)
  | 'panel' 
  | 'settings' 
  | 'perfil' 
  // Privadas (Ferramentas)
  | 'compound' 
  | 'manager' 
  | 'rent' 
  | 'debt' 
  | 'fire' 
  | 'inflation' 
  | 'dividend' 
  | 'roi' 
  | 'game' 
  | 'education'
  | 'asset_details'; // Nova rota para detalhes do ativo
