import type { DebtItem } from './debt.types';
import * as math from './debt.math';

export interface DebtProjectionParams {
  debt: DebtItem;
  extraPayment: number;
  scenario: 'sac' | 'price' | 'rotativo';
}

export const projectDebt = (params: DebtProjectionParams) => {
  const { debt, extraPayment, scenario } = params;

  if (scenario === 'sac') {
    return math.buildSacSchedule(
      debt.saldoDevedor,
      debt.taxaMensal,
      debt.parcelasRestantes,
      extraPayment
    );
  }

  if (scenario === 'price') {
    return math.buildPriceSchedule(
      debt.saldoDevedor,
      debt.taxaMensal,
      debt.parcelasRestantes,
      extraPayment
    );
  }

  // Rotativo usa o valor da parcela como pagamento fixo
  return math.buildRotativeSchedule(
    debt.saldoDevedor,
    debt.taxaMensal,
    debt.valorParcela + extraPayment
  );
};
