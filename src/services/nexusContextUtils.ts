import { UserContext } from './nexusInsightEngine';
import { DebtItem } from './debt/debt.types';

export function extractUpcomingBill(ctx: UserContext, debts?: DebtItem[]): UserContext['upcomingCreditCardBill'] {
  // 1. Se o contexto já veio preenchido (ex: de um cálculo externo), usa ele.
  if (ctx.upcomingCreditCardBill) return ctx.upcomingCreditCardBill;

  if (!debts) return undefined;

  // 2. Filtra por tipo de cartão e presença de vencimento
  const cardDebts = debts.filter(d => 
    (d.tipo === 'Cartão rotativo' || d.tipo === 'Cartão de crédito') && 
    d.dataVencimento
  );

  if (cardDebts.length === 0) return undefined;

  // 3. Ordene por vencimento mais próximo
  const sorted = [...cardDebts].sort((a, b) => a.dataVencimento!.localeCompare(b.dataVencimento!));
  const nearest = sorted[0];

  // 4. Calcule diffDays
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nearest.dataVencimento!);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

  // 5. Se 0 <= diffDays <= 5, retorna os dados
  if (diffDays >= 0 && diffDays <= 5) {
    return {
      daysToClose: diffDays,
      estimatedValue: nearest.valorParcela || nearest.saldoDevedor
    };
  }

  return undefined;
}
