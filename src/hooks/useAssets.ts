import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { queryKeys } from '../core/query/queryKeys';
import type { ActiveAsset } from '../types';

const fetchAssets = async (userId: string): Promise<ActiveAsset[]> => {
  const snapshot = await getDocs(query(collection(firestore, `users/${userId}/ativos`)));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActiveAsset));
};

export const useAssets = (userId: string | undefined) => {
  const key = queryKeys.wealth.assetsByUser(userId || 'anonymous');

  const { data: assets = [], isLoading: loading, error, isFetching } = useQuery<ActiveAsset[], Error>({
    queryKey: key,
    queryFn: () => userId ? fetchAssets(userId) : Promise.resolve([]),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return { 
    assets, 
    loading, 
    isSyncing: isFetching && !loading,
    error: error?.message || null 
  };
};