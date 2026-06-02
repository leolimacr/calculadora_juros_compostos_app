export interface CreditCard {
  id: string;
  name: string;
  isActive?: boolean;
  closingDay?: number;
  dueDay?: number;
  limit?: number;
}

export interface RecurringBill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  isActive: boolean;
  type: 'fixed' | 'subscription'; // fixed = conta fixa, subscription = assinatura
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod?: 'money' | 'credit';
  cardId?: string;
  installments?: number;        // Total de parcelas (ex: 12)
  currentInstallment?: number; // Parcela atual (ex: 1)
  installmentId?: string;      // ID único para agrupar as parcelas de uma mesma compra
  createdAtMs?: number;        // Momento técnico de criação
  sortKey?: string;            // Chave composta para ordenação e paginação
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
  declaredNoDebts?: boolean;
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