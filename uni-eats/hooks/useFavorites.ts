import { useState, useEffect, useCallback } from 'react';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { mensaApi, Canteen, Meal } from '@/services/mensaApi';
import { useLocation, calculateDistance } from '@/hooks/useLocation';

interface UseFavoritesResult {
  favoriteCanteen: Canteen | null;
  favoriteMeals: Meal[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeFavoriteCanteen: () => Promise<void>;
  removeFavoriteMeal: (mealId: string) => Promise<void>;
  favoriteMealIds: string[];
  favoriteCanteenId: string | null;
}

/**
 * Hook zum Laden und Verwalten von Favoriten-Daten
 */
export function useFavorites(): UseFavoritesResult {
  const { 
    favoriteCanteenId, 
    favoriteMealIds, 
    isLoading: contextLoading,
    removeFavoriteCanteen: contextRemoveCanteen,
    removeFavoriteMeal: contextRemoveMeal,
  } = useFavoritesContext();
  
  const { location } = useLocation();
  
  const [favoriteCanteen, setFavoriteCanteen] = useState<Canteen | null>(null);
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
      // Lade favorisierte Mensa
      if (favoriteCanteenId) {
        const canteens = await mensaApi.getCanteens({ loadingtype: 'complete' });
        const canteen = canteens.find(c => c.id === favoriteCanteenId);
        
        if (canteen) {
          // Berechne Distanz wenn Location verfügbar
          if (location && canteen.address?.geoLocation) {
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
          setFavoriteCanteen(canteen);
        } else {
          setFavoriteCanteen(null);
        }
      } else {
        setFavoriteCanteen(null);
      }

      // Lade favorisierte Gerichte
      if (favoriteMealIds.length > 0) {
        // Hole alle Gerichte und filtere nach IDs
        // Da wir keine direkte Meal-by-ID API haben, laden wir Gerichte aus verschiedenen Quellen
        const allMeals: Meal[] = [];
        
        try {
          // Versuche Gerichte von verschiedenen Daten zu laden
          const dates = getDateRange(7); // Letzte 7 Tage + nächste 7 Tage
          
          for (const date of dates) {
            try {
              const mealsForDate = await mensaApi.getMeals({ date, loadingtype: 'complete' });
              allMeals.push(...mealsForDate);
            } catch {
              // Ignoriere Fehler für einzelne Tage
            }
          }
        } catch {
          // Fallback: keine Gerichte verfügbar
        }

        // Filtere nach favorisierten IDs
        const favorites = allMeals.filter(meal => favoriteMealIds.includes(meal.id));
        
        // Entferne Duplikate basierend auf ID
        const uniqueFavorites = favorites.reduce((acc: Meal[], meal) => {
          if (!acc.some(m => m.id === meal.id)) {
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
  }, [favoriteCanteenId, favoriteMealIds, location, contextLoading]);

  // Initiale Ladung
  useEffect(() => {
    loadFavoriteData();
  }, [loadFavoriteData]);

  const refresh = async () => {
    await loadFavoriteData(true);
  };

  const removeFavoriteCanteen = async () => {
    await contextRemoveCanteen();
    setFavoriteCanteen(null);
  };

  const removeFavoriteMeal = async (mealId: string) => {
    await contextRemoveMeal(mealId);
    setFavoriteMeals(prev => prev.filter(m => m.id !== mealId));
  };

  return {
    favoriteCanteen,
    favoriteMeals,
    isLoading: isLoading || contextLoading,
    isRefreshing,
    error,
    refresh,
    removeFavoriteCanteen,
    removeFavoriteMeal,
    favoriteMealIds,
    favoriteCanteenId,
  };
}

/**
 * Generiert einen Bereich von Daten (heute +/- n Tage)
 */
function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = -days; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}
