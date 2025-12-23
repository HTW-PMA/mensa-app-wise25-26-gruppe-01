import { useQuery } from '@tanstack/react-query';
import { mensaApi, Meal } from '@/services/mensaApi';
import { storage } from '@/utils/storage';
import { network } from '@/utils/network';
import { queryKeys } from '@/utils/queryKeys';

export type MealsState = {
  data: Meal[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOffline: boolean;
  isCached: boolean;
};

export function useMeals(filters?: { canteenId?: string; date?: string }): MealsState {
  const cacheKey = JSON.stringify({ meals: 'list', filters });

  const query = useQuery({
    queryKey: queryKeys.meals.list(filters),
    queryFn: async () => {
      const isOnline = await network.isConnected();

      if (!isOnline) {
        const cached = await storage.get<Meal[]>(cacheKey);
        if (cached) {
          return { data: cached, isOffline: true, isCached: true };
        }
        throw new Error('OFFLINE_NO_CACHE');
      }

      try {
        const data = await mensaApi.getMeals(filters);
        await storage.save(cacheKey, data);
        return { data, isOffline: false, isCached: false };
      } catch (error) {
        const cached = await storage.get<Meal[]>(cacheKey);
        if (cached) {
          return { data: cached, isOffline: false, isCached: true };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const result = query.data as any;
  const isOfflineNoCache =
    query.error instanceof Error && query.error.message === 'OFFLINE_NO_CACHE';

  return {
    data: result?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError && !isOfflineNoCache,
    error: query.error instanceof Error ? query.error : null,
    isOffline: result?.isOffline ?? false,
    isCached: result?.isCached ?? false,
  };
}
