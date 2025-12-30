const API_BASE_URL = 'https://mensa.gregorflachs.de';

const getApiKey = (): string => {
  const apiKey = process.env.EXPO_PUBLIC_MENSA_API_KEY;
  
  if (!apiKey) {
    console.error(
      '❌ FEHLER: API Key nicht gefunden!\n' +
      '   Bitte erstelle eine .env Datei im uni-eats Verzeichnis mit:\n' +
      '   EXPO_PUBLIC_MENSA_API_KEY=dein_api_key\n' +
      '   Dann starte Expo neu mit: npx expo start --clear'
    );
    return '';
  }
  
  return apiKey;
};

// Öffnungszeiten eines Tages
export interface BusinessHour {
  openAt?: string;
  closeAt?: string;
  businessHourType?: string;
}

// Geschäftstag mit Öffnungszeiten
export interface BusinessDay {
  day?: string;
  businessHours?: BusinessHour[];  // API uses CamelCase
  businesshours?: BusinessHour[];  // Legacy fallback
}

// Kontaktinformationen
export interface ContactInfo {
  phone?: string;
  email?: string;
}

// Detail-Bewertung einer Review
export interface DetailRating {
  rating?: number;
  name?: string;
}

// Review einer Mensa
export interface CanteenReview {
  ID?: string;
  canteenID?: string;
  userID?: string;
  averageRating?: number;
  detailRatings?: DetailRating[];
  comment?: string;
  lastUpdated?: string;
  createdAt?: string;
}

export interface Canteen {
  _id?: string;
  ID?: string;
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    zipcode?: string;
    district?: string;
    geoLocation?: {
      latitude?: number;
      longitude?: number;
    };
  };
  contactInfo?: ContactInfo;
  businessDays?: BusinessDay[];
  url?: string;
  lastUpdated?: string;
  rating?: number;
  reviewCount?: number;
  canteenReviews?: CanteenReview[];
  // Google Places Rating Data
  googleRating?: number;
  googleReviewCount?: number;
  googlePlaceId?: string;
  // Berechnete Distanz zum Benutzer (in km)
  distance?: number;
}

export interface Meal {
  id: string;
  name: string;
  canteenId: string;
  category?: string;
  price?: number;
  rating?: number;
  date?: string;
}

export interface Additive {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Badge {
  id: string;
  name: string;
  icon?: string;
}

class MensaApiService {
  async getCanteens(filters?: {
    lat?: number;
    lon?: number;
    distance?: number;
    name?: string;
    loadingtype?: 'lazy' | 'complete';
  }): Promise<Canteen[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.loadingtype) params.append('loadingtype', filters.loadingtype);

      const url = `${API_BASE_URL}/api/v1/canteen${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🔍 Fetching:', url);

      const response = await fetch(url, {
        headers: {
          'X-API-KEY': getApiKey(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Response:', Array.isArray(data) ? `Array[${data.length}]` : typeof data);

      // Handle different response formats
      if (Array.isArray(data)) {
        return data.map((item: any) => {
          // Normalisiere Geo-Feld: geolocation -> geoLocation (API nutzt lowercase)
          const geoLocation =
            item?.address?.geoLocation ??
            item?.address?.geolocation ??
            item?.address?.GeoLocation;

          // Rating aus Reviews extrahieren oder Fallback auf direktes rating
          const reviews = item?.canteenReviewData ?? [];
          const avgRating = reviews.length > 0
            ? reviews.reduce((sum: number, r: any) => sum + (r.averageRating ?? 0), 0) / reviews.length
            : item?.rating;
          const reviewCount = reviews.length > 0 ? reviews.length : (item?.reviewCount ?? 0);

          return {
            ...item,
            id: item._id || item.id || item.ID,
            address: item.address
              ? {
                  ...item.address,
                  geoLocation,
                }
              : undefined,
            rating: avgRating,
            reviewCount,
            canteenReviews: reviews,
            canteenReviewData: reviews,
            businessDays: item.businessDays ?? [],
          } as Canteen;
        });
      }
      return [];
    } catch (error) {
      console.error('💥 API Error:', error);
      return [];
    }
  }

  async getMeals(filters?: {
    canteenId?: string;
    date?: string;
    loadingtype?: 'lazy' | 'complete';
  }): Promise<Meal[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.canteenId) params.append('canteenid', filters.canteenId);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.loadingtype) params.append('loadingtype', filters.loadingtype);

      const response = await fetch(`${API_BASE_URL}/api/v1/meal?${params.toString()}`, {
        headers: {
          'X-API-KEY': getApiKey(),
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.meals && Array.isArray(data.meals)) {
        return data.meals;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  }

  async getAdditives(): Promise<Additive[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/additive`, {
        headers: {
          'X-API-KEY': getApiKey(),
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.additives && Array.isArray(data.additives)) {
        return data.additives;
      }

      return [];
    } catch (error) {
      console.error('Error fetching additives:', error);
      throw error;
    }
  }

  async getBadges(): Promise<Badge[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/badge`, {
        headers: {
          'X-API-KEY': getApiKey(),
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.badges && Array.isArray(data.badges)) {
        return data.badges;
      }

      return [];
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  }
}

export const mensaApi = new MensaApiService();