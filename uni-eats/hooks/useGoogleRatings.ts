import { useState, useEffect } from 'react';
import { googlePlacesApi } from '@/services/googlePlacesApi';
import { storage } from '@/utils/storage';
import type { Canteen } from '@/services/mensaApi';

interface GoogleRatingData {
  rating: number;
  reviewCount: number;
  placeId: string;
}

// Cache-Key für persistente Speicherung
const GOOGLE_RATINGS_CACHE_KEY = 'google_ratings_cache';

// Cache-Dauer: 24 Stunden
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedRatings {
  timestamp: number;
  data: Record<string, GoogleRatingData>;
}

/**
 * Hook zum Abrufen von Google Ratings für Mensen
 * Verwendet Caching um API-Calls zu minimieren
 */
export function useGoogleRatings(canteens: Canteen[]) {
  const [ratings, setRatings] = useState<Record<string, GoogleRatingData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canteens || canteens.length === 0) return;

    const fetchRatings = async () => {
      setLoading(true);

      try {
        // Lade gecachte Ratings
        const cached = await storage.get<CachedRatings>(GOOGLE_RATINGS_CACHE_KEY);
        const now = Date.now();

        // Prüfe ob Cache noch gültig ist
        if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
          setRatings(cached.data);
          setLoading(false);
          return;
        }

        // Hole neue Ratings von Google
        const newRatings: Record<string, GoogleRatingData> = cached?.data ?? {};
        
        // Verarbeite nur Mensen die noch nicht im Cache sind
        for (const canteen of canteens) {
          if (newRatings[canteen.id]) continue;

          const result = await googlePlacesApi.getRatingForCanteen(
            canteen.name,
            canteen.address,
            canteen.address?.geoLocation
          );

          if (result) {
            newRatings[canteen.id] = result;
          }

          // Kurze Pause zwischen API-Calls um Rate-Limits zu vermeiden
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Speichere im Cache
        await storage.save(GOOGLE_RATINGS_CACHE_KEY, {
          timestamp: now,
          data: newRatings,
        });

        setRatings(newRatings);
      } catch (error) {
        console.error('Error fetching Google ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [canteens.length]); // Nur neu laden wenn sich die Anzahl ändert

  /**
   * Erweitert Canteens mit Google Rating Daten
   */
  const enrichCanteensWithRatings = <T extends Canteen>(canteenList: T[]): T[] => {
    return canteenList.map(canteen => {
      const googleData = ratings[canteen.id];
      if (googleData) {
        return {
          ...canteen,
          googleRating: googleData.rating,
          googleReviewCount: googleData.reviewCount,
          googlePlaceId: googleData.placeId,
        };
      }
      return canteen;
    });
  };

  return {
    ratings,
    loading,
    enrichCanteensWithRatings,
  };
}
