import { DebtItem } from './debt.types';

export const validateDebt = (debt: DebtItem): { isValid: boolean; error?: string } => {
  if (!debt.nome || debt.nome.trim() === '') return { isValid: false, error: 'Nome é obrigatório' };
  if (debt.saldoDevedor <= 0) return { isValid: false, error: 'Saldo devedor deve ser maior que zero' };
  if (debt.parcelasRestantes <= 0) return { isValid: false, error: 'Parcelas devem ser maiores que zero' };
  if (debt.valorParcela <= 0) return { isValid: false, error: 'Valor da parcela deve ser maior que zero' };
  return { isValid: true };
};
