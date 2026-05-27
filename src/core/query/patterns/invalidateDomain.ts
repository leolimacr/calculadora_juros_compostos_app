import { queryClient } from '../queryClient';
import { QueryKey } from '@tanstack/react-query';

export const invalidateDomain = async (queryKey: QueryKey) => {
  await queryClient.invalidateQueries({ queryKey });
};
