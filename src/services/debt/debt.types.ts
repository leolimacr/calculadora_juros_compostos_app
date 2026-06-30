import { Timestamp } from 'firebase/firestore';

export type DebtOriginType = 'rotativo_cartao' | 'manual';

export interface DebtItem {
  id?: string;
  nome: string;
  tipo: string;
  saldoDevedor: number;
  taxaMensal: number;
  parcelasRestantes: number;
  valorParcela: number;
  dataVencimento: string | null;
  createdAt?: Date;
  proposito?: string;
  originType?: DebtOriginType;
  originCardId?: string;
  originInvoiceId?: string;
  originInvoicePeriodEnd?: string;
  lastInterestAppliedAt?: string;
}
