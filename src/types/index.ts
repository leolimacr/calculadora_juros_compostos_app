export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  userId?: string;
}

export interface FinancialProfile {
  monthlyIncome: number;
  emergencyReserveTarget: number;
  emergencyReserveCurrent: number;
}

export interface UserMeta {
  plan: string;
  nickname?: string;
  launchLimit: number;
  launchCount: number;
  onboardingCompleted?: boolean;
  onboardingPersona?: 'dividas' | 'patrimonio' | 'geral';
  financialProfile?: FinancialProfile;
  subscription?: { active: boolean };
}

export * from './market';