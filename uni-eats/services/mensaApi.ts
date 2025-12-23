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

export interface Canteen {
  _id: string;
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
  rating?: number;
  reviewCount?: number;
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
        return data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
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