const API_BASE_URL = 'https://mensa.gregorflachs.de';
const API_KEY = 'YChEnDcDSdQutvSfWoIGqDc9IGBU0OJFldo9QuGOpllpiuUQYzZfoNCo5cQseyK1WRBIpa3IcbznxYuoN94EW1tGcFJ1nZ30aO4hLTV7wILc2o/imAPP7l17KqYLFrjcmYsKkOHi9gET3L9IqT+vSJgDllk9u1f3b4XU7AxQ8GAn24RFl6Khmmk3cdMtBQ2hP/S37BHNqLJngvBr73wrbCALl70HlagYJjDmt5wnjynwgaluLEBxuPgmtqOEizKHz/t5tw67ArxUS3nw5OcySX7XpdpltUxhiyospXfjEmDd+quWGnSECR6DG5cZdYHtteADdxE0dTOt7XwHoHs4ow==';

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
          'X-API-KEY': API_KEY,
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
          'X-API-KEY': API_KEY,
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
          'X-API-KEY': API_KEY,
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
          'X-API-KEY': API_KEY,
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