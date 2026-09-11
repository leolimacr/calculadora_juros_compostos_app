import type { Budget, Transaction } from '../types';
import { buildCategoryKey } from '../utils/budgetUtils';

export type BudgetStatus = 'green' | 'yellow' | 'red';

export interface CategoryBudgetProgress {
  categoryName: string;
  categoryKey: string;
  limit: number;
  spent: number;
  percentage: number;
  status: BudgetStatus;
}

export interface BudgetProgress {
  totalBudget: number;
  totalSpent: number;
  totalPercentage: number;
  totalIncome: number;
  savingsGoal: number;
  categories: CategoryBudgetProgress[];
}

export function getBudgetStatus(percentage: number, alertThreshold: number): BudgetStatus {
  if (percentage > 95) return 'red';
  if (percentage >= alertThreshold) return 'yellow';
  return 'green';
}

export function calcBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  incomeOverride?: number,
): BudgetProgress {
  const monthStr = budget.month;
  const expenseTxs = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    return t.date ? t.date.startsWith(monthStr) : false;
  });

  const spentByKey: Record<string, number> = {};
  expenseTxs.forEach((t) => {
    const key = buildCategoryKey(t.category || '');
    if (!key) return;
    spentByKey[key] = (spentByKey[key] || 0) + (t.amount || 0);
  });

  const categories: CategoryBudgetProgress[] = budget.categories.map((cat) => {
    const spent = spentByKey[cat.categoryKey] || 0;
    const percentage = cat.limit > 0 ? Math.min(100, (spent / cat.limit) * 100) : 0;
    return {
      categoryName: cat.categoryName,
      categoryKey: cat.categoryKey,
      limit: cat.limit,
      spent,
      percentage,
      status: getBudgetStatus(percentage, cat.alertThreshold),
    };
  });

  const totalBudget = budget.categories.reduce((s, c) => s + c.limit, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);

  return {
    totalBudget,
    totalSpent,
    totalPercentage: totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0,
    totalIncome: incomeOverride ?? budget.totalIncome,
    savingsGoal: budget.savingsGoal,
    categories,
  };
}
