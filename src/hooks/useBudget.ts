import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Budget, CategoryBudget } from '../types';
import * as budgetService from '../services/budgetService';
import { getCurrentBudgetId } from '../utils/budgetUtils';

export function useBudget(userId?: string) {
  const queryClient = useQueryClient();
  const budgetId = getCurrentBudgetId();
  const key = ['budget', userId, budgetId] as const;

  const { data: budget, isLoading, isFetching } = useQuery<Budget | null>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<Budget | null>(key);
      return Promise.resolve(currentData ?? null);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const setBudgetMutation = useMutation({
    mutationFn: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) =>
      budgetService.setBudget(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const updateCategoriesMutation = useMutation({
    mutationFn: ({ categories }: { categories: CategoryBudget[] }) =>
      budgetService.updateBudgetCategories(userId!, budgetId, categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    budget,
    isLoading: isLoading && !budget,
    isSyncing: isFetching && !isLoading,
    setBudget: setBudgetMutation.mutateAsync,
    isSettingBudget: setBudgetMutation.isPending,
    updateCategories: updateCategoriesMutation.mutateAsync,
    isUpdatingCategories: updateCategoriesMutation.isPending,
  };
}
