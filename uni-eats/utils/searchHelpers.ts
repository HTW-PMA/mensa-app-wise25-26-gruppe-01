import { Meal, Canteen } from '@/services/mensaApi';

export const POPULAR_SEARCHES = [
  'Vegan',
  'Pasta',
  'Salad',
  'Pizza',
  'Soup',
  'Burger',
  'Asian',
  'Vegetarian',
];

export interface SearchResult {
  type: 'meal' | 'mensa';
  id: string;
  name: string;
  subtitle?: string;
  data: Meal | Canteen;
}

/**
 * Filtert Gerichte basierend auf Suchbegriff
 */
export const filterMeals = (meals: Meal[], query: string): Meal[] => {
  if (!query || query.length === 0) return [];
  
  const lowerQuery = query.toLowerCase();
  return meals.filter(meal =>
    meal.name.toLowerCase().includes(lowerQuery) ||
    (meal.category && meal.category.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Filtert Mensas basierend auf Suchbegriff
 */
export const filterCanteens = (canteens: Canteen[], query: string): Canteen[] => {
  if (!query || query.length === 0) return [];
  
  const lowerQuery = query.toLowerCase();
  return canteens.filter(canteen =>
    canteen.name.toLowerCase().includes(lowerQuery) ||
    (canteen.address?.street && canteen.address.street.toLowerCase().includes(lowerQuery)) ||
    (canteen.address?.city && canteen.address.city.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Kombiniert und sortiert Suchergebnisse
 */
export const combineSearchResults = (
  meals: Meal[],
  canteens: Canteen[]
): SearchResult[] => {
  const results: SearchResult[] = [];

  // Meals hinzufügen
  meals.forEach(meal => {
    results.push({
      type: 'meal',
      id: meal.id,
      name: meal.name,
      subtitle: meal.category || `Mensa: ${meal.canteenId}`,
      data: meal,
    });
  });

  // Mensas hinzufügen
  canteens.forEach(canteen => {
    results.push({
      type: 'mensa',
      id: canteen.id,
      name: canteen.name,
      subtitle: canteen.address?.street || canteen.address?.city,
      data: canteen,
    });
  });

  return results;
};

/**
 * Validiert ob ein String ein gültiger Suchbegriff ist
 */
export const isValidSearchQuery = (query: string): boolean => {
  return query.trim().length > 0 && query.length <= 100;
};

/**
 * Debounce Funktion für Suche
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
