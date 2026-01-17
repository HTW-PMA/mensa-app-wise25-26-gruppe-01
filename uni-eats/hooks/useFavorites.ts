import { useState, useEffect, useCallback } from 'react';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { mensaApi, Canteen, Meal } from '@/services/mensaApi';
import { useLocation, calculateDistance } from '@/hooks/useLocation';

interface UseFavoritesResult {
  favoriteCanteens: Canteen[];
  favoriteMeals: Meal[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeFavoriteCanteen: (canteenId: string) => Promise<void>;
  removeFavoriteMeal: (mealId: string, canteenId: string) => Promise<void>;
  clearFavoriteCanteens: () => Promise<void>;
  clearFavoriteMeals: () => Promise<void>;
  favoriteMealKeys: Array<{ mealId: string; canteenId: string }>;
  favoriteCanteenIds: string[];
}

/**
 * Hook zum Laden und Verwalten von Favoriten-Daten
 * Unterstützt Multi-Canteen Favoriten (Array von Mensas)
 */
export function useFavorites(): UseFavoritesResult {
  const {
    favoriteCanteenIds,
    favoriteMeals: favoriteMealKeys,
    isLoading: contextLoading,
    removeFavoriteCanteen: contextRemoveCanteen,
    removeFavoriteMeal: contextRemoveMeal,
    clearFavoriteCanteens: contextClearCanteens,
    clearFavoriteMeals: contextClearMeals,
  } = useFavoritesContext();

  const { location } = useLocation();

  const [favoriteCanteens, setFavoriteCanteens] = useState<Canteen[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavoriteData = useCallback(async (isRefresh = false) => {
    if (contextLoading) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Lade alle favorisierten Mensas (Multi-Canteen Support)
      if (favoriteCanteenIds.length > 0) {
        const canteens = await mensaApi.getCanteens({ loadingtype: 'complete' });
        const favCanteens = canteens.filter(c => favoriteCanteenIds.includes(c.id));

        // Berechne Distanzen wenn Location verfügbar
        if (location) {
          favCanteens.forEach(canteen => {
            if (canteen.address?.geoLocation) {
              const { latitude, longitude } = canteen.address.geoLocation;
              if (latitude && longitude) {
                canteen.distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    latitude,
                    longitude
                );
              }
            }
          });
        }
        setFavoriteCanteens(favCanteens);
      } else {
        setFavoriteCanteens([]);
      }

      // Lade favorisierte Gerichte
      if (favoriteMealKeys.length > 0) {
        // Hole alle Gerichte mit einem einzigen API-Aufruf
        // Wir laden alle Meals für heute und die nächsten Tage in einem Request
        const allMeals: Meal[] = [];

        try {
          // Lade Meals ohne Datumsfilter - die API gibt standardmäßig heutige Meals zurück
          // Für Favoriten reicht das, da wir nur die Metadaten brauchen
          const todayMeals = await mensaApi.getMeals({ loadingtype: 'complete' });
          allMeals.push(...todayMeals);

          // Optional: Lade auch Meals für die nächsten Tage (parallel, max 3 Requests)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayAfter = new Date();
          dayAfter.setDate(dayAfter.getDate() + 2);

          const [tomorrowMeals, dayAfterMeals] = await Promise.all([
            mensaApi.getMeals({ date: tomorrow.toISOString().split('T')[0], loadingtype: 'complete' }).catch(() => []),
            mensaApi.getMeals({ date: dayAfter.toISOString().split('T')[0], loadingtype: 'complete' }).catch(() => []),
          ]);

          allMeals.push(...tomorrowMeals, ...dayAfterMeals);
        } catch {
          // Fallback: keine Gerichte verfügbar
        }

        // Filtere nach mensa-spezifischen Favoriten
        const favoriteKeySet = new Set(
            favoriteMealKeys.map((favorite) => `${favorite.canteenId}::${favorite.mealId}`)
        );
        const favorites = allMeals.filter((meal) => {
          if (!meal.canteenId) return false;
          return favoriteKeySet.has(`${meal.canteenId}::${meal.id}`);
        });

        // Entferne Duplikate basierend auf (canteenId + mealId)
        const uniqueFavorites = favorites.reduce((acc: Meal[], meal) => {
          const key = `${meal.canteenId}::${meal.id}`;
          if (!acc.some((m) => `${m.canteenId}::${m.id}` === key)) {
            acc.push(meal);
          }
          return acc;
        }, []);

        setFavoriteMeals(uniqueFavorites);
      } else {
        setFavoriteMeals([]);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Favoriten konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [favoriteCanteenIds, favoriteMealKeys, location, contextLoading]);

  // Initiale Ladung
  useEffect(() => {
    loadFavoriteData();
  }, [loadFavoriteData]);

  const refresh = async () => {
    await loadFavoriteData(true);
  };

  const removeFavoriteCanteen = async (canteenId: string) => {
    // Optimistic Update: Remove from UI immediately
    setFavoriteCanteens(prev => prev.filter(c => c.id !== canteenId));
    // Remove from storage in background
    await contextRemoveCanteen(canteenId);
  };

  const removeFavoriteMeal = async (mealId: string, canteenId: string) => {
    // Optimistic Update: Remove from UI immediately
    setFavoriteMeals(prev => prev.filter(m => !(m.id === mealId && m.canteenId === canteenId)));
    // Remove from storage in background
    await contextRemoveMeal(mealId, canteenId);
  };

  const clearFavoriteCanteens = async () => {
    // Optimistic Update
    setFavoriteCanteens([]);
    await contextClearCanteens();
  };

  const clearFavoriteMeals = async () => {
    // Optimistic Update
    setFavoriteMeals([]);
    await contextClearMeals();
  };

  return {
    favoriteCanteens,
    favoriteMeals,
    isLoading: isLoading || contextLoading,
    isRefreshing,
    error,
    refresh,
    removeFavoriteCanteen,
    removeFavoriteMeal,
    clearFavoriteCanteens,
    clearFavoriteMeals,
    favoriteMealKeys,
    favoriteCanteenIds,
  };
}