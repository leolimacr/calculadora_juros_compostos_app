import type { Timestamp } from 'firebase/firestore';

export interface DebtPersist {
  nome: string;
  tipo: string;
  saldoDevedor: number;
  taxaMensal: number;
  parcelasRestantes: number;
  valorParcela: number;
  dataVencimento?: string | null;
  createdAt: Timestamp | Date;
  originType?: string;
  originCardId?: string;
  originInvoiceId?: string;
  originInvoicePeriodEnd?: string;
  lastInterestAppliedAt?: string;
}
