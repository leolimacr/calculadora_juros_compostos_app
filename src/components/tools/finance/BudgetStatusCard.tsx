import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Edit3, PiggyBank, TrendingUp } from 'lucide-react';
import type { Budget, Transaction } from '../../../types';
import { calcBudgetProgress, type BudgetProgress } from '../../../services/budgetMath';

interface BudgetStatusCardProps {
  budget: Budget;
  transactions: Transaction[];
  onEdit: () => void;
}

const MAX_VISIBLE_CATEGORIES = 5;

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-300'}`} />;
}

const BudgetStatusCard: React.FC<BudgetStatusCardProps> = ({ budget, transactions, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const progress: BudgetProgress = useMemo(
    () => calcBudgetProgress(budget, transactions),
    [budget, transactions],
  );

  const exceededCategories = progress.categories.filter((c) => c.status === 'red');
  const visibleCategories = showAllCategories
    ? progress.categories
    : progress.categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCount = progress.categories.length - MAX_VISIBLE_CATEGORIES;

  const budgetBorder = progress.totalPercentage > 95
    ? 'border-l-4 border-l-status-danger/40'
    : exceededCategories.length > 0
      ? 'border-l-4 border-l-brand-accent/40'
      : '';

  return (
    <div className={`bg-surface-primary border border-slate-200 rounded-panel p-5 shadow-panel ${budgetBorder}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary flex-shrink-0">
            <PiggyBank size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-text-primary uppercase tracking-ultra-wide">
              Orçamento do Mês
            </p>
            <p className="text-xxs text-text-muted font-medium">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all"
            title="Editar orçamento"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`p-2 rounded-xl transition-all ${
              expanded
                ? 'bg-surface-elevated text-text-secondary'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Total progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xxs font-bold text-text-muted uppercase tracking-ultra-wide">
            Total gasto
          </span>
          <span className="text-xs font-black text-text-primary">
            R$ {progress.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-text-muted font-medium">
              {' / '}R$ {progress.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
        <div className="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress.totalPercentage > 95
                ? 'bg-red-500'
                : progress.totalPercentage >= 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, progress.totalPercentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xxs font-bold uppercase tracking-ultra-wide text-text-muted">
            {progress.totalPercentage.toFixed(0)}%
          </span>
          {exceededCategories.length > 0 && (
            <span className="text-xxs font-bold text-red-600 uppercase tracking-ultra-wide">
              {exceededCategories.length} categoria{exceededCategories.length > 1 ? 's' : ''} acima do limite
            </span>
          )}
        </div>
      </div>

      {/* Expanded: per-category */}
      {expanded && (
        <div className="border-t border-surface-elevated mt-4 pt-4 space-y-3">
          <p className="text-xxs font-black text-text-primary uppercase tracking-ultra-wide mb-2">
            Por categoria
          </p>
          {visibleCategories.map((cat) => (
            <div key={cat.categoryKey} className="space-y-1 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusDot status={cat.status} />
                  <span className="text-xs font-bold text-text-primary truncate">
                    {cat.categoryName}
                  </span>
                </div>
                <span className="text-xxs font-bold text-text-muted flex-shrink-0 ml-2">
                  R$ {cat.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="font-medium">
                    {' / '}R$ {cat.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cat.status === 'red'
                      ? 'bg-red-500'
                      : cat.status === 'yellow'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xxs font-bold uppercase tracking-ultra-wide text-text-muted">
                  {cat.percentage.toFixed(0)}%
                </span>
                {cat.status === 'red' && (
                  <span className="text-xxs font-bold text-red-600 uppercase tracking-ultra-wide">
                    Estouro
                  </span>
                )}
              </div>
            </div>
          ))}

          {progress.categories.length === 0 && (
            <p className="text-xxs text-text-muted italic">
              Nenhuma categoria configurada.
            </p>
          )}

          {progress.categories.length > MAX_VISIBLE_CATEGORIES && !showAllCategories && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-2xl text-xxs font-black uppercase tracking-ultra-wide border border-dashed border-surface-elevated text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-all mt-2"
            >
              Mostrar +{hiddenCount} categoria{hiddenCount > 1 ? 's' : ''}
            </button>
          )}

          {/* Savings goal */}
          {progress.savingsGoal > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-elevated">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-brand-primary" />
                <span className="text-xxs font-black text-text-primary uppercase tracking-ultra-wide">
                  Meta de poupança
                </span>
              </div>
              <p className="text-xs font-black text-action-primaryDark mt-1">
                R$ {progress.savingsGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Total income */}
          {progress.totalIncome > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-surface-elevated mt-3">
              <span className="text-xxs font-bold text-text-muted uppercase tracking-ultra-wide">
                Renda prevista
              </span>
              <span className="text-xs font-black text-emerald-700">
                R$ {progress.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetStatusCard;
