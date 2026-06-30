import React, { useState, useMemo } from 'react';
import {
  X, Plus, ChevronDown, ChevronUp, PiggyBank, TrendingUp
} from 'lucide-react';
import type { Category, Transaction, CategoryBudget } from '../../../types';
import { buildCategoryKey, getCurrentBudgetId } from '../../../utils/budgetUtils';
import { useBudget } from '../../../hooks/useBudget';

interface BudgetSetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  categories: Category[];
  transactions: Transaction[];
  monthlyIncome: number;
  onSaved: () => void;
}

const MAX_VISIBLE = 10;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLast3MonthsKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

const BudgetSetupSheet: React.FC<BudgetSetupSheetProps> = ({
  isOpen, onClose, userId, categories, transactions, monthlyIncome, onSaved,
}) => {
  const { setBudget, isSettingBudget } = useBudget(userId);
  const budgetId = getCurrentBudgetId();

  const currentMonth = getCurrentMonthKey();
  const last3 = getLast3MonthsKeys();

  const [totalIncome, setTotalIncome] = useState(String(monthlyIncome || 0));
  const [savingsGoal, setSavingsGoal] = useState('0');
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const [categoryEnabled, setCategoryEnabled] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategoryLimit, setCustomCategoryLimit] = useState('');

  const expenseCategoryNames = useMemo(() => {
    const fromDb = categories
      .filter((c) => c.type === 'expense')
      .map((c) => c.name);
    const fromTx = transactions
      .filter((t) => t.type === 'expense' && t.category)
      .map((t) => t.category);
    return Array.from(new Set([...fromDb, ...fromTx])).sort();
  }, [categories, transactions]);

  const categorySpendingCurrent = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && t.date?.startsWith(currentMonth))
      .forEach((t) => {
        const cat = t.category || 'Sem categoria';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
      });
    return map;
  }, [transactions, currentMonth]);

  const categorySpendingRecent = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && last3.some((m) => t.date?.startsWith(m)))
      .forEach((t) => {
        const cat = t.category || 'Sem categoria';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
      });
    return map;
  }, [transactions, last3]);

  const categoriesWithSpending = useMemo(() => {
    return expenseCategoryNames
      .filter((name) => categorySpendingRecent[name] > 0)
      .sort((a, b) => (categorySpendingRecent[b] || 0) - (categorySpendingRecent[a] || 0));
  }, [expenseCategoryNames, categorySpendingRecent]);

  const categoriesWithoutSpending = useMemo(() => {
    return expenseCategoryNames
      .filter((name) => !categorySpendingRecent[name])
      .sort();
  }, [expenseCategoryNames, categorySpendingRecent]);

  const visibleCategories = useMemo(() => {
    const withSpending = categoriesWithSpending;
    if (showAll) {
      return [...withSpending, ...categoriesWithoutSpending];
    }
    return withSpending.slice(0, MAX_VISIBLE);
  }, [categoriesWithSpending, categoriesWithoutSpending, showAll]);

  const remainingHiddenCategories = useMemo(() => {
    if (showAll) return 0;
    return categoriesWithSpending.length + categoriesWithoutSpending.length - visibleCategories.length;
  }, [categoriesWithSpending, categoriesWithoutSpending, visibleCategories.length, showAll]);

  React.useEffect(() => {
    if (!isOpen) return;
    setTotalIncome(String(monthlyIncome || 0));
    setSavingsGoal('0');

    const enabled: Record<string, boolean> = {};
    const limits: Record<string, string> = {};
    categoriesWithSpending.forEach((name) => {
      enabled[name] = true;
      const spent = categorySpendingCurrent[name] || categorySpendingRecent[name] || 0;
      limits[name] = spent > 0 ? String(Math.ceil(spent)) : '';
    });
    setCategoryEnabled(enabled);
    setCategoryLimits(limits);
    setShowAll(false);
    setSelectedCategory('');
    setCustomCategoryLimit('');
  }, [isOpen, monthlyIncome, categoriesWithSpending, categorySpendingCurrent, categorySpendingRecent]);

  const isCategorySelected = (name: string) => categoryEnabled[name];
  const categoryLimitValue = (name: string) => categoryLimits[name] || '';

  const toggleCategory = (name: string) => {
    setCategoryEnabled((prev) => ({ ...prev, [name]: !prev[name] }));
    if (!categoryEnabled[name] && !categoryLimits[name]) {
      const spent = categorySpendingCurrent[name] || categorySpendingRecent[name] || 0;
      setCategoryLimits((prev) => ({
        ...prev,
        [name]: spent > 0 ? String(Math.ceil(spent)) : '',
      }));
    }
  };

  const setLimit = (name: string, value: string) => {
    setCategoryLimits((prev) => ({ ...prev, [name]: value }));
  };

  const addCustomCategory = () => {
    if (!selectedCategory || !customCategoryLimit) return;
    setCategoryEnabled((prev) => ({ ...prev, [selectedCategory]: true }));
    setCategoryLimits((prev) => ({ ...prev, [selectedCategory]: customCategoryLimit }));
    setSelectedCategory('');
    setCustomCategoryLimit('');
  };

  const handleSave = async () => {
    const parsedIncome = Number(totalIncome) || 0;
    const parsedSavings = Number(savingsGoal) || 0;

    const budgetCategories: CategoryBudget[] = Object.entries(categoryEnabled)
      .filter(([, enabled]) => enabled)
      .map(([name]) => ({
        categoryName: name,
        categoryKey: buildCategoryKey(name),
        limit: Math.max(0, Number(categoryLimits[name]) || 0),
        alertThreshold: 0.8,
        rollover: false,
      }));

    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.limit, 0);

    await setBudget({
      userId,
      month: budgetId,
      totalIncome: parsedIncome,
      totalBudget,
      categories: budgetCategories,
      savingsGoal: parsedSavings,
    });

    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg mx-4 my-8 bg-surface-primary border border-surface-elevated rounded-4xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3 bg-surface-primary rounded-t-4xl border-b border-surface-elevated/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-secondary/10 rounded-xl text-brand-secondary">
              <PiggyBank size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-ultra-wide">
                Orçamento do Mês
              </h2>
              <p className="text-xxs text-text-muted font-bold uppercase tracking-widest">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-surface-secondary border border-surface-elevated text-text-muted hover:text-text-primary transition-all active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xxs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Renda prevista
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">R$</span>
                <input
                  type="number"
                  value={totalIncome}
                  onChange={(e) => setTotalIncome(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-surface-secondary border border-surface-elevated text-sm font-bold text-text-primary outline-none focus:border-brand-primary/50 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xxs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Meta de poupança
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">R$</span>
                <input
                  type="number"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-surface-secondary border border-surface-elevated text-sm font-bold text-text-primary outline-none focus:border-brand-primary/50 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xxs font-black text-text-muted uppercase tracking-widest">
                Limites por categoria
              </label>
              <span className="text-[10px] font-bold text-text-muted">
                {Object.values(categoryEnabled).filter(Boolean).length} selecionada(s)
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {visibleCategories.map((name) => {
                const enabled = isCategorySelected(name);
                const limit = categoryLimitValue(name);
                const spent = categorySpendingCurrent[name];

                return (
                  <div
                    key={buildCategoryKey(name)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      enabled
                        ? 'bg-brand-primary/5 border-brand-primary/20'
                        : 'bg-surface-secondary border-surface-elevated opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleCategory(name)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        enabled
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'border-text-muted bg-transparent'
                      }`}
                    >
                      {enabled && <Check size={12} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{name}</p>
                      {spent > 0 && (
                        <p className="text-[10px] font-medium text-text-muted">
                          Gasto atual: R$ {spent.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {enabled && (
                      <div className="relative w-24 flex-shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">R$</span>
                        <input
                          type="number"
                          value={limit}
                          onChange={(e) => setLimit(name, e.target.value)}
                          className="w-full pl-7 pr-2.5 py-2 rounded-xl bg-white border border-surface-elevated text-xs font-bold text-text-primary outline-none focus:border-brand-primary/50 transition-colors text-right"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {remainingHiddenCategories > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 rounded-2xl bg-surface-secondary border border-surface-elevated text-xxs font-black text-text-muted uppercase tracking-widest hover:text-text-primary transition-all"
              >
                <ChevronDown size={14} />
                Mostrar +{remainingHiddenCategories} categorias
              </button>
            )}

            {showAll && categoriesWithoutSpending.length > 0 && (
              <div className="mt-3 p-3 bg-surface-secondary rounded-2xl border border-surface-elevated">
                <label className="text-xxs font-black text-text-muted uppercase tracking-widest mb-2 block">
                  Adicionar categoria
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-surface-elevated text-xs font-bold text-text-primary outline-none"
                  >
                    <option value="">Selecione...</option>
                    {categoriesWithoutSpending
                      .filter((name) => !categoryEnabled[name])
                      .map((name) => (
                        <option key={buildCategoryKey(name)} value={name}>
                          {name}
                        </option>
                      ))}
                  </select>
                  <div className="relative w-20 flex-shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">R$</span>
                    <input
                      type="number"
                      value={customCategoryLimit}
                      onChange={(e) => setCustomCategoryLimit(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 rounded-xl bg-white border border-surface-elevated text-xs font-bold text-text-primary outline-none text-right"
                      placeholder="0"
                    />
                  </div>
                  <button
                    onClick={addCustomCategory}
                    disabled={!selectedCategory || !customCategoryLimit}
                    className="p-2 rounded-xl bg-brand-primary text-text-onBrand disabled:opacity-40 transition-all active:scale-95"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {showAll && (
            <button
              onClick={() => setShowAll(false)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-2xl bg-surface-secondary border border-surface-elevated text-xxs font-black text-text-muted uppercase tracking-widest hover:text-text-primary transition-all"
            >
              <ChevronUp size={14} />
              Mostrar menos
            </button>
          )}
        </div>

        <div className="sticky bottom-0 p-5 pt-3 bg-surface-primary rounded-b-4xl border-t border-surface-elevated/50">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xxs font-black text-text-muted uppercase tracking-widest">
              Total do orçamento
            </span>
            <span className="text-sm font-black text-text-primary">
              R$ {Object.entries(categoryLimits)
                .filter(([name]) => categoryEnabled[name])
                .reduce((sum, [, limit]) => sum + (Number(limit) || 0), 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSettingBudget || Object.values(categoryEnabled).filter(Boolean).length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-3xl font-black text-xxs uppercase tracking-ultra-wide bg-brand-primary text-text-onBrand hover:bg-brand-primary/90 disabled:opacity-40 transition-all active:scale-95 shadow-brand-glow"
          >
            {isSettingBudget ? (
              <>
                <TrendingUp size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check size={16} />
                Criar Orçamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function Check({ size, strokeWidth }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default BudgetSetupSheet;
