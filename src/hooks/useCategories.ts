import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { queryKeys } from '../core/query/queryKeys';
import { Category } from '../types';
import { createCategoriesRealtimeBridge } from '../services/category.realtime';

export const useCategories = (userId?: string) => {
  const queryClient = useQueryClient();
  const key = queryKeys.categories.byUser(userId || 'anonymous');

  useEffect(() => {
    if (!userId) return;
    const bridge = createCategoriesRealtimeBridge(userId);
    const unsubscribe = bridge.subscribe(() => {});
    return unsubscribe;
  }, [userId, key]);

  const { data: categories = [], isLoading: loading, error } = useQuery<Category[], Error>({
    queryKey: key,
    queryFn: () => Promise.resolve([]),
    enabled: !!userId,
  });

  const saveCategory = async (category: Omit<Category, 'userId'>) => {
    if (!userId) return;
    const categoriesRef = doc(firestore, 'categories', userId);
    const newCategory = { ...category, userId };
    let newList;
    if (category.id) {
      newList = categories.map(c => c.id === category.id ? newCategory : c);
    } else {
      newCategory.id = crypto.randomUUID();
      newList = [...categories, newCategory];
    }
    await setDoc(categoriesRef, { list: newList }, { merge: true });
    queryClient.invalidateQueries({ queryKey: key });
  };

  const deleteCategory = async (categoryId: string, usageCount: number) => {
    if (!userId) return;
    
    if (usageCount > 0) {
      alert(`⚠️ Não é possível excluir esta categoria pois ela está em uso.`);
      return;
    }
    
    const categoriesRef = doc(firestore, 'categories', userId);
    const newList = categories.filter(c => c.id !== categoryId);
    await setDoc(categoriesRef, { list: newList }, { merge: true });
    queryClient.invalidateQueries({ queryKey: key });
  };

  return {
    categories,
    loading,
    error: error?.message || null,
    saveCategory,
    deleteCategory,
  };
};
