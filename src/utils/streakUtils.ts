import type { Transaction } from '../types';

/**
 * Calcula quantos dias consecutivos (incluindo hoje) o usuário registrou ao menos uma movimentação.
 */
export function getConsecutiveDays(transactions: Transaction[]): number {
  if (!transactions || transactions.length === 0) return 0;

  const dates = new Set(transactions.map((t) => t.date.split('T')[0]));

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (!dates.has(todayStr)) return 0;

  let streak = 0;
  const current = new Date(today);

  while (dates.has(current.toISOString().split('T')[0])) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

/**
 * Mensagem analítica de consistência de registro (sem gamificação).
 */
export function getStreakMilestoneMessage(streak: number): string {
  if (streak >= 30) return `${streak} dias de registro contínuo. Seu sistema tem base sólida para calibrar sua folga do mês.`;
  if (streak >= 14) return `${streak} dias consecutivos. Padrão estável — dados suficientes para análise de comando.`;
  if (streak >= 7) return `${streak} dias de consistência. Continue registrando para refinar projeções.`;
  if (streak > 1) return `${streak} dias seguidos de registro.`;
  return 'Registre movimentações para o sistema interpretar sua estrutura financeira.';
}
