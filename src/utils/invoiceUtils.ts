import { CreditCard, Transaction } from '../types';

export function getCurrentInvoice(
  card: CreditCard,
  transactions: Transaction[]
): { total: number; periodStart: string; periodEnd: string; dueDate: string } | null {
  if (!card.closingDay || !card.dueDay) return null;

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let startYear, startMonth, startDay;
  let endYear, endMonth, endDay;
  let dueYear, dueMonth, dueDay;

  if (currentDay > card.closingDay) {
    // Período: 16/05 a 15/06 (se hoje > 15/05)
    startYear = currentYear;
    startMonth = currentMonth;
    startDay = card.closingDay + 1;

    endYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    endMonth = (currentMonth + 1) % 12;
    endDay = card.closingDay;

    // Vencimento é no mês do fim do período? Geralmente sim.
    // Usando a lógica do prompt: dueDate baseado no período.
    dueYear = endYear;
    dueMonth = endMonth;
    dueDay = card.dueDay;
    
    // Se o dia de vencimento for menor que o de fechamento, o vencimento costuma ser no mês seguinte ao fechamento.
    // Mas vamos manter simples conforme o prompt ou ajustar se necessário.
    // Prompt diz: "Calcule a data de vencimento (dueDate) com base em dueDay e no período."
    if (dueDay < endDay) {
      dueMonth = (dueMonth + 1) % 12;
      if (dueMonth === 0) dueYear++;
    }
  } else {
    // Período: 16/04 a 15/05 (se hoje <= 15/05)
    startYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    startMonth = (currentMonth - 1 + 12) % 12;
    startDay = card.closingDay + 1;

    endYear = currentYear;
    endMonth = currentMonth;
    endDay = card.closingDay;

    dueYear = endYear;
    dueMonth = endMonth;
    dueDay = card.dueDay;

    if (dueDay < endDay) {
      dueMonth = (dueMonth + 1) % 12;
      if (dueMonth === 0) dueYear++;
    }
  }

  const periodStart = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const periodEnd = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  const dueDate = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

  const cardTransactions = transactions.filter(t => 
    t.cardId === card.id && 
    t.type === 'expense' &&
    t.date >= periodStart &&
    t.date <= periodEnd
  );

  const total = cardTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return { total, periodStart, periodEnd, dueDate };
}
