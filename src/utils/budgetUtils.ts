export function buildCategoryKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function buildBudgetId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getCurrentBudgetId(): string {
  const now = new Date();
  return buildBudgetId(now.getFullYear(), now.getMonth() + 1);
}
