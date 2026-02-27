import { useState, useEffect } from 'react';
import { Goal, fetchGoals, createGoal, updateGoal, deleteGoal } from '../services/goalService';
import { Timestamp } from 'firebase/firestore';

export const useGoals = (userId: string | undefined) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const loadGoals = async () => {
      try {
        setLoading(true);
        const data = await fetchGoals(userId);
        setGoals(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar metas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [userId]);

  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('Usuário não autenticado');
    try {
      const newGoal = await createGoal(userId, goalData);
      setGoals(prev => [newGoal as Goal, ...prev]);
      return newGoal;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const editGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!userId) throw new Error('Usuário não autenticado');
    try {
      await updateGoal(userId, goalId, updates);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates, updatedAt: Timestamp.now() } : g));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const removeGoal = async (goalId: string) => {
    if (!userId) throw new Error('Usuário não autenticado');
    try {
      await deleteGoal(userId, goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    goals,
    loading,
    error,
    addGoal,
    editGoal,
    removeGoal,
  };
};