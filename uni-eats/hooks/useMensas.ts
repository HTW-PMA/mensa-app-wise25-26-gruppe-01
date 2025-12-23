import { useQuery } from '@tanstack/react-query';
import { mensaApi, Canteen } from '@/services/mensaApi';
import { storage } from '@/utils/storage';
import { network } from '@/utils/network';
import { queryKeys } from '@/utils/queryKeys';

export type MensasState = {
  data: Canteen[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOffline: boolean;
  isCached: boolean;
};

export function useMensas(filters?: any): MensasState {
  const cacheKey = JSON.stringify({ mensas: 'all', filters });

  const query = useQuery({
    queryKey: queryKeys.mensas.list(filters),
    queryFn: async () => {
      const isOnline = await network.isConnected();

      if (!isOnline) {
        const cached = await storage.get<Canteen[]>(cacheKey);
        if (cached) {
          return { data: cached, isOffline: true, isCached: true };
        }
        throw new Error('OFFLINE_NO_CACHE');
      }

      try {
        const data = await mensaApi.getCanteens(filters);
        await storage.save(cacheKey, data);
        return { data, isOffline: false, isCached: false };
      } catch (error) {
        const cached = await storage.get<Canteen[]>(cacheKey);
        if (cached) {
          return { data: cached, isOffline: false, isCached: true };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10,
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
