import { Timestamp } from 'firebase/firestore';

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
  proposito?: string; // [NEXUS] O que esta dívida representa ou como surgiu
}
