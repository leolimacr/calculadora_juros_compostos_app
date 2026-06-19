import type { DebtItem } from './debt.types';
import type { DebtPersist } from './debt.persist';
import { Timestamp } from 'firebase/firestore';

export const mapDebtFromFirestore = (docId: string, data: any): DebtItem => {
  const persistData = data as DebtPersist;
  return {
    id: docId,
    nome: persistData.nome,
    tipo: persistData.tipo,
    saldoDevedor: persistData.saldoDevedor,
    taxaMensal: persistData.taxaMensal,
    parcelasRestantes: persistData.parcelasRestantes,
    valorParcela: persistData.valorParcela,
    dataVencimento: persistData.dataVencimento || null,
    createdAt: persistData.createdAt instanceof Timestamp ? persistData.createdAt.toDate() : new Date(persistData.createdAt),
  };
};

export const mapDebtToFirestore = (debt: Omit<DebtItem, 'id'>): DebtPersist => {
  return {
    nome: debt.nome,
    tipo: debt.tipo,
    saldoDevedor: debt.saldoDevedor,
    taxaMensal: debt.taxaMensal,
    parcelasRestantes: debt.parcelasRestantes,
    valorParcela: debt.valorParcela,
    dataVencimento: debt.dataVencimento,
    createdAt: debt.createdAt || new Date(),
  };
};
