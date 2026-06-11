export interface CreditCard {
  id: string;
  name: string;
  isActive?: boolean;
  closingDay?: number;
  dueDay?: number;
  limit?: number;
  proposito?: string; // [NEXUS] Finalidade emocional ou estratégica
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
  proposito?: string; // [NEXUS] Por que essa conta existe?
}

export interface ActiveAsset {
  id?: string;
  name: string;
  category: string;
  currentValue: number;
  proposito?: string; // [NEXUS] Meta ou motivo do investimento
}

export interface PassiveAsset {
  id?: string;
  description: string;
  category: string;
  currentValue: number;
  observations?: string;
  proposito?: string; // [NEXUS] O que esse bem representa?
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