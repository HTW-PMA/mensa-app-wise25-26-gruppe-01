const API_BASE_URL = 'https://mensa.gregorflachs.de';

// Fallback-Koordinaten für Mensen mit fehlenden geoLocation-Daten
// Nutzt Substring-Matching für Flexibilität
const CANTEEN_FALLBACK_COORDINATES: Array<{ 
  namePattern: string; 
  coordinates: { latitude: number; longitude: number } 
}> = [
  { namePattern: 'HTW Wilhelminenhof', coordinates: { latitude: 52.45868, longitude: 13.52883 } },
  { namePattern: 'Alt Friedrichsfelde', coordinates: { latitude: 52.48915, longitude: 13.46788 } },
  { namePattern: 'Oase Adlershof', coordinates: { latitude: 52.45730, longitude: 13.57615 } },
  { namePattern: 'ASH Berlin', coordinates: { latitude: 52.51965, longitude: 13.40535 } },
];

const getFallbackCoordinates = (canteenName: string): { latitude: number; longitude: number } | null => {
  for (const { namePattern, coordinates } of CANTEEN_FALLBACK_COORDINATES) {
    if (canteenName.includes(namePattern)) {
      return coordinates;
    }
  }
  return null;
};

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

export interface MealPrice {
  priceType: string;
  price: number;
}

export interface MealAdditive {
  id: string;
  referenceid?: string;
  text: string;
}

export interface MealBadge {
  id: string;
  name: string;
  description?: string;
}

export interface Meal {
  id: string;
  name: string;
  canteenId?: string;
  category?: string;
  prices?: MealPrice[];
  additives?: MealAdditive[];
  badges?: MealBadge[];
  mealReviews?: any[];
  rating?: number;
  date?: string;
  co2Bilanz?: number;
  waterBilanz?: number;
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
          let geoLocation =
            item?.address?.geoLocation ??
            item?.address?.geolocation ??
            item?.address?.GeoLocation;

          // Fallback: Verwende hintergelegte Koordinaten wenn geoLocation fehlt oder unvollständig
          if (!geoLocation || !geoLocation.latitude || !geoLocation.longitude) {
            const fallbackCoords = getFallbackCoordinates(item?.name || '');
            if (fallbackCoords) {
              geoLocation = fallbackCoords;
              console.log(`📍 Using fallback coordinates for: ${item?.name}`);
            }
          }

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
      params.append('loadingtype', filters?.loadingtype || 'complete');

      // Step 1: Get menus with meal assignments per canteen and date
      const menuResponse = await fetch(`${API_BASE_URL}/api/v1/menue?${params.toString()}`, {
        headers: {
          'X-API-KEY': getApiKey(),
        },
      });

      if (!menuResponse.ok) {
        throw new Error(`API Error: ${menuResponse.status}`);
      }

      const menuData = await menuResponse.json();
      
      // The menue endpoint returns { menue: [ { date, canteenId, meals: [...] }, ... ] }
      let menus: any[] = [];
      if (menuData.menue && Array.isArray(menuData.menue)) {
        menus = menuData.menue;
      } else if (Array.isArray(menuData)) {
        menus = menuData;
      }

      // Filter by canteenId if provided
      if (filters?.canteenId) {
        menus = menus.filter((menu: any) => menu.canteenId === filters.canteenId);
      }

      // Filter by date if provided (use today's date if not specified)
      if (filters?.date) {
        menus = menus.filter((menu: any) => menu.date === filters.date);
      } else {
        // Default to today's date
        const today = new Date().toISOString().split('T')[0];
        menus = menus.filter((menu: any) => menu.date === today);
      }

      // Collect all meal IDs from filtered menus
      const mealIdsFromMenu = new Set<string>();
      const mealCanteenMap = new Map<string, { canteenId: string; date: string }>();
      
      for (const menu of menus) {
        if (menu.meals && Array.isArray(menu.meals)) {
          for (const meal of menu.meals) {
            const mealId = meal.id || meal._id;
            if (mealId) {
              mealIdsFromMenu.add(mealId);
              mealCanteenMap.set(mealId, { canteenId: menu.canteenId, date: menu.date });
            }
          }
        }
      }

      if (mealIdsFromMenu.size === 0) {
        return [];
      }

      // Step 2: Get full meal details from /meal endpoint
      const mealResponse = await fetch(`${API_BASE_URL}/api/v1/meal?loadingtype=complete`, {
        headers: {
          'X-API-KEY': getApiKey(),
        },
      });

      if (!mealResponse.ok) {
        throw new Error(`API Error: ${mealResponse.status}`);
      }

      const mealData = await mealResponse.json();
      
      // Extract meals array
      let allMealsRaw: any[] = [];
      if (mealData.meals && Array.isArray(mealData.meals)) {
        allMealsRaw = mealData.meals;
      } else if (Array.isArray(mealData)) {
        allMealsRaw = mealData;
      }

      // Filter to only meals that are in our menu and add canteen info
      const meals: Meal[] = [];
      for (const meal of allMealsRaw) {
        const mealId = meal.id || meal._id;
        if (mealIdsFromMenu.has(mealId)) {
          const menuInfo = mealCanteenMap.get(mealId);
          meals.push({
            id: mealId,
            name: meal.name,
            canteenId: menuInfo?.canteenId,
            category: meal.category,
            prices: meal.prices,
            additives: meal.additives,
            badges: meal.badges,
            mealReviews: meal.mealReviews,
            date: menuInfo?.date,
            co2Bilanz: meal.co2Bilanz,
            waterBilanz: meal.waterBilanz,
          });
        }
      }

      return meals;
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