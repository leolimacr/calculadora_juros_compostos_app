import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Goal} from '../services/goalService';
import { createGoal, updateGoal, deleteGoal, fetchGoals } from '../services/goalService';
import { queryKeys } from '../core/query/queryKeys';

export const useGoals = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const key = queryKeys.goals.byUser(userId || 'anonymous');

  const { data: goals = [], isLoading: loading, error, isFetching } = useQuery<Goal[], Error>({
    queryKey: key,
    queryFn: () => userId ? fetchGoals(userId) : Promise.resolve([]),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const isSyncing = isFetching && !loading;

  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('Usuário não autenticado');
    const newGoal = await createGoal(userId, goalData);
    queryClient.invalidateQueries({ queryKey: key });
    return newGoal;
  };

  const editGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!userId) throw new Error('Usuário não autenticado');
    await updateGoal(userId, goalId, updates);
    queryClient.invalidateQueries({ queryKey: key });
  };

  const removeGoal = async (goalId: string) => {
    if (!userId) throw new Error('Usuário não autenticado');
    await deleteGoal(userId, goalId);
    queryClient.invalidateQueries({ queryKey: key });
  };

  return {
    goals,
    loading,
    isSyncing,
    error: error?.message || null,
    addGoal,
    editGoal,
    removeGoal,
  };
};
