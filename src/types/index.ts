export interface FinancialProfile {
  monthlyIncome: number;
  emergencyReserveTarget: number;
  emergencyReserveCurrent: number;
}

export interface UserMeta {
  plan: string;
  launchLimit: number;
  launchCount: number;
  financialProfile?: FinancialProfile;
}