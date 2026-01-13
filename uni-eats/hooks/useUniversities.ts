import { useQuery } from '@tanstack/react-query';
import { mensaApi, University } from '@/services/mensaApi';
import { storage } from '@/utils/storage';
import { network } from '@/utils/network';
import { queryKeys } from '@/utils/queryKeys';

const FALLBACK_UNIVERSITIES: University[] = [
  {
    id: 'ash',
    name: 'Alice Salomon Hochschule Berlin',
    shortName: 'ASH',
    city: 'Berlin',
  },
  {
    id: 'bht',
    name: 'Berliner Hochschule fuer Technik',
    shortName: 'BHT',
    city: 'Berlin',
  },
  {
    id: 'charite',
    name: 'Charite - Universitaetsmedizin Berlin',
    shortName: 'Charite',
    city: 'Berlin',
  },
  {
    id: 'ehb',
    name: 'Evangelische Hochschule Berlin',
    shortName: 'EHB',
    city: 'Berlin',
  },
  {
    id: 'fu',
    name: 'Freie Universitaet Berlin',
    shortName: 'FU',
    city: 'Berlin',
  },
  {
    id: 'hfm',
    name: 'Hochschule fuer Musik Hanns Eisler Berlin',
    shortName: 'HfM',
    city: 'Berlin',
  },
  {
    id: 'hfs',
    name: 'Hochschule fuer Schauspielkunst Ernst Busch',
    shortName: 'HfS',
    city: 'Berlin',
  },
  {
    id: 'htw',
    name: 'Hochschule fuer Technik und Wirtschaft Berlin',
    shortName: 'HTW',
    city: 'Berlin',
  },
  {
    id: 'hu',
    name: 'Humboldt-Universitaet zu Berlin',
    shortName: 'HU',
    city: 'Berlin',
  },
  {
    id: 'hwr',
    name: 'Hochschule fuer Wirtschaft und Recht Berlin',
    shortName: 'HWR',
    city: 'Berlin',
  },
  {
    id: 'khs',
    name: 'Weissensee Kunsthochschule Berlin',
    shortName: 'KHS',
    city: 'Berlin',
  },
  {
    id: 'khsb',
    name: 'Katholische Hochschule fuer Sozialwesen Berlin',
    shortName: 'KHSB',
    city: 'Berlin',
  },
  {
    id: 'tu',
    name: 'Technische Universitaet Berlin',
    shortName: 'TU',
    city: 'Berlin',
  },
];

export type UniversitiesState = {
  data: University[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOffline: boolean;
  isCached: boolean;
};

export function useUniversities(): UniversitiesState {
  const cacheKey = JSON.stringify({ universities: 'all' });

  const query = useQuery({
    queryKey: queryKeys.universities.list(),
    queryFn: async () => {
      const isOnline = await network.isConnected();

      if (!isOnline) {
        const cached = await storage.get<University[]>(cacheKey);
        if (cached && cached.length > 0) {
          return { data: cached, isOffline: true, isCached: true };
        }
        return { data: FALLBACK_UNIVERSITIES, isOffline: true, isCached: false };
      }

      try {
        const data = await mensaApi.getUniversities();
        const resolved = data.length > 0 ? data : FALLBACK_UNIVERSITIES;
        await storage.save(cacheKey, resolved);
        return { data: resolved, isOffline: false, isCached: false };
      } catch (error) {
        const cached = await storage.get<University[]>(cacheKey);
        if (cached && cached.length > 0) {
          return { data: cached, isOffline: false, isCached: true };
        }
        return { data: FALLBACK_UNIVERSITIES, isOffline: false, isCached: false };
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
