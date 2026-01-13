import { Meal, Canteen } from '@/services/mensaApi';
import { t } from '@/utils/i18n';

export const POPULAR_SEARCHES = [
  'search.popularTags.vegan',
  'search.popularTags.pasta',
  'search.popularTags.salad',
  'search.popularTags.pizza',
  'search.popularTags.soup',
  'search.popularTags.burger',
  'search.popularTags.asian',
  'search.popularTags.vegetarian',
];

export interface SearchResult {
  type: 'meal' | 'mensa';
  id: string;
  uniqueId: string; // Eindeutiger Key für FlatList (kombiniert id + canteenId für Meals)
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
 * @param meals - Gefilterte Meals
 * @param canteens - Gefilterte Canteens (für Mensa-Suchergebnisse)
 * @param allCanteens - Alle verfügbaren Canteens (für Mensa-Namen-Lookup bei Meals)
 */
export const combineSearchResults = (
  meals: Meal[],
  canteens: Canteen[],
  allCanteens?: Canteen[]
): SearchResult[] => {
  const results: SearchResult[] = [];
  const separator = ` ${t('common.separator')} `;

  // Erstelle eine Map für schnellen Canteen-Name Lookup
  const canteenMap = new Map<string, string>();
  (allCanteens || canteens).forEach(c => {
    canteenMap.set(c.id, c.name);
  });

  // Meals hinzufügen - eindeutige ID aus meal.id + canteenId
  meals.forEach(meal => {
    const canteenName = meal.canteenId ? canteenMap.get(meal.canteenId) : undefined;
    const subtitleParts: string[] = [];
    
    if (canteenName) {
      subtitleParts.push(canteenName);
    }
    if (meal.category) {
      subtitleParts.push(meal.category);
    }
    
    results.push({
      type: 'meal',
      id: meal.id,
      uniqueId: `meal-${meal.id}-${meal.canteenId || 'unknown'}`,
      name: meal.name,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(separator) : undefined,
      data: meal,
    });
  });

  // Mensas hinzufügen
  canteens.forEach(canteen => {
    results.push({
      type: 'mensa',
      id: canteen.id,
      uniqueId: `mensa-${canteen.id}`,
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

