/**
 * Google Places API Service für Mensa-Ratings
 * Holt echte Bewertungen von Google Maps für Mensen
 */

const getGoogleApiKey = (): string => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn(
      '⚠️ Google Maps API Key nicht gefunden!\n' +
      '   Ratings werden als Mock-Daten angezeigt.'
    );
    return '';
  }
  
  return apiKey;
};

export interface PlaceDetails {
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
  name?: string;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
}

// Cache für Google Places Daten (vermeidet unnötige API-Calls)
const placesCache: Map<string, PlaceDetails> = new Map();

class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = getGoogleApiKey();
  }

  /**
   * Sucht nach einem Ort basierend auf Name und Koordinaten
   */
  async findPlace(
    name: string,
    latitude?: number,
    longitude?: number
  ): Promise<PlaceSearchResult | null> {
    if (!this.apiKey) return null;

    try {
      // Text-Suche mit Standort-Bias für bessere Ergebnisse
      const query = encodeURIComponent(`${name} Berlin Mensa`);
      let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${this.apiKey}`;
      
      if (latitude && longitude) {
        url += `&locationbias=point:${latitude},${longitude}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        const place = data.candidates[0];
        return {
          placeId: place.place_id,
          name: place.name,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
        };
      }

      return null;
    } catch (error) {
      console.error('Google Places findPlace error:', error);
      return null;
    }
  }

  /**
   * Holt detaillierte Informationen zu einem Ort
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) return null;

    // Check cache first
    if (placesCache.has(placeId)) {
      return placesCache.get(placeId)!;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,rating,user_ratings_total&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result: PlaceDetails = {
          placeId: data.result.place_id,
          name: data.result.name,
          rating: data.result.rating,
          userRatingsTotal: data.result.user_ratings_total,
        };

        // Cache the result
        placesCache.set(placeId, result);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Google Places getDetails error:', error);
      return null;
    }
  }

  /**
   * Holt Rating für eine Mensa basierend auf Name und Adresse
   * Gibt null zurück wenn nicht gefunden
   */
  async getRatingForCanteen(
    name: string,
    address?: { street?: string; city?: string; district?: string },
    geoLocation?: { latitude?: number; longitude?: number }
  ): Promise<{ rating: number; reviewCount: number; placeId: string } | null> {
    if (!this.apiKey) return null;

    try {
      // Suche nach dem Ort
      const searchResult = await this.findPlace(
        name,
        geoLocation?.latitude,
        geoLocation?.longitude
      );

      if (searchResult && searchResult.rating) {
        return {
          rating: searchResult.rating,
          reviewCount: searchResult.userRatingsTotal ?? 0,
          placeId: searchResult.placeId,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting rating for canteen:', error);
      return null;
    }
  }

  /**
   * Nearby Search für Mensen in einem Bereich
   */
  async searchNearbyCanteens(
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000
  ): Promise<PlaceSearchResult[]> {
    if (!this.apiKey) return [];

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&keyword=mensa+canteen&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        return data.results.map((place: any) => ({
          placeId: place.place_id,
          name: place.name,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
        }));
      }

      return [];
    } catch (error) {
      console.error('Google Places nearbySearch error:', error);
      return [];
    }
  }

  /**
   * Löscht den Cache (z.B. bei App-Neustart)
   */
  clearCache(): void {
    placesCache.clear();
  }
}

export const googlePlacesApi = new GooglePlacesService();
