import { Transaction } from '../types';

/**
 * Calcula quantos dias consecutivos (incluindo hoje) o usuário lançou ao menos uma transação.
 * @param transactions Lista de transações do usuário
 * @returns Número de dias consecutivos
 */
export function getConsecutiveDays(transactions: Transaction[]): number {
  if (!transactions || transactions.length === 0) return 0;

  // Extrai apenas as datas únicas (YYYY-MM-DD)
  const dates = new Set(transactions.map(t => t.date.split('T')[0]));
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Se não tem transação hoje, a ofensiva é 0
  if (!dates.has(todayStr)) {
    return 0;
  }

  let streak = 0;
  let current = new Date(today);

  while (dates.has(current.toISOString().split('T')[0])) {
    streak++;
    // Retrocede um dia
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

/**
 * Retorna a mensagem de marco baseada no streak.
 * @param streak Número de dias consecutivos
 * @returns Mensagem formatada
 */
export function getStreakMilestoneMessage(streak: number): string {
  if (streak >= 30) return "🔥 30 dias. Um mês inteiro de consistência. Isso é raro.";
  if (streak >= 21) return "🔥 21 dias. Você criou um hábito saudável.";
  if (streak >= 14) return "🔥 14 dias. Duas semanas de controle. Seu eu do futuro agradece.";
  if (streak >= 7) return "🔥 7 dias de ofensiva. A disciplina começa a criar raízes.";
  if (streak > 1) return `🔥 ${streak} dias seguidos. Continue assim!`;
  return "Registre seus gastos hoje e comece sua jornada de evolução.";
}
