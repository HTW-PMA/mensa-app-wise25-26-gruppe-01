import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, memo, useCallback } from 'react';
import { type Meal } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { translateBadge } from '@/utils/translations';
import { useThemeColor } from '@/hooks/use-theme-color';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
}

/**
 * Holt den Studierendenpreis aus den Preisen
 */
const getStudentPrice = (prices?: Meal['prices']): string => {
  if (!prices || prices.length === 0) return '–';
  const studentPrice = prices.find(p => p.priceType === 'Studierende');
  if (studentPrice) {
    return `€${studentPrice.price.toFixed(2)}`;
  }
  return `€${prices[0].price.toFixed(2)}`;
};

/**
 * Generiert eine Mock-Beschreibung basierend auf dem Meal-Namen
 */
const getMealDescription = (meal: Meal): string => {
  const descriptions: Record<string, string> = {
    'Salat': 'Fresh mixed greens with seasonal vegetables',
    'Suppe': 'Homemade soup with fresh ingredients',
    'Pasta': 'Al dente pasta with homemade sauce',
    'Pizza': 'Stone-baked pizza with fresh toppings',
    'Burger': 'Juicy burger with fresh lettuce and tomato',
    'Bowl': 'Nutritious bowl with quinoa and vegetables',
  };
  
  for (const [key, desc] of Object.entries(descriptions)) {
    if (meal.name.toLowerCase().includes(key.toLowerCase())) {
      return desc;
    }
  }
  return 'Delicious meal prepared fresh daily';
};

/**
 * Berechnet Mock-Kalorien basierend auf dem Meal
 */
const getMealCalories = (meal: Meal): string => {
  // Nutze CO2-Bilanz als Basis für konsistente Werte
  if (meal.co2Bilanz) {
    return `${Math.round(meal.co2Bilanz * 0.8 + 200)} kcal`;
  }
  // Fallback: Hash-basiert
  const hash = meal.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${300 + (hash % 400)} kcal`;
};

/**
 * Generiert eine Bild-URL für das Meal - mit besserer Performance
 */
const getMealImage = (meal: Meal): string => {
  const category = meal.category?.toLowerCase() || 'food';
  
  // Nutze einen Color-basierten Placeholder statt mehrerer Unsplash-Requests
  // Das ist deutlich schneller und spart Bandbreite
  const colorMap: Record<string, string> = {
    'salate': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&h=160&fit=crop',
    'suppen': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=160&h=160&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=160&h=160&fit=crop',
    'hauptgerichte': 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=160&h=160&fit=crop',
    'desserts': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&h=160&fit=crop',
    'beilagen': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&h=160&fit=crop',
  };
  
  return colorMap[category] || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=160&h=160&fit=crop';
};

export const MealCard = memo(function MealCard({ meal, onPress }: MealCardProps) {
  // Theme colors
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({ light: '#333333', dark: '#ffffff' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9ba1a6' }, 'text');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333333' }, 'border');
  const badgeBg = useThemeColor({ light: '#f0f0f0', dark: '#2c2c2e' }, 'background');
  const badgeTextColor = useThemeColor({ light: '#333333', dark: '#e0e0e0' }, 'text');
  const favoriteBg = useThemeColor({ light: '#ffffff', dark: '#2c2c2e' }, 'background');

  // Verwende FavoritesContext für persistente Favoriten
  const { isFavoriteMeal, toggleFavoriteMeal } = useFavoritesContext();
  const isFavorite = isFavoriteMeal(meal.id);
  
  const handleFavoritePress = useCallback((e: any) => {
    e.stopPropagation();
    toggleFavoriteMeal(meal.id);
  }, [meal.id, toggleFavoriteMeal]);
  
  // Memoize alle Werte um unnötige Berechnungen zu vermeiden
  const price = useMemo(() => getStudentPrice(meal.prices), [meal.prices]);
  const description = useMemo(() => getMealDescription(meal), [meal.name]);
  const calories = useMemo(() => getMealCalories(meal), [meal.id, meal.co2Bilanz]);
  const imageUrl = useMemo(() => getMealImage(meal), [meal.category]);
  
  // Badges aus API-Daten
  const badges = useMemo(() => meal.badges?.slice(0, 3).map(b => b.name) || [], [meal.badges]);
  
  // Prüfe ob Allergene vorhanden
  const hasAllergens = useMemo(() => meal.additives && meal.additives.length > 0, [meal.additives]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container, 
        { backgroundColor, borderColor }, 
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      {/* Linke Seite: Text-Inhalt */}
      <View style={styles.contentContainer}>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
          {meal.name}
        </Text>
        
        <Text style={[styles.description, { color: subTextColor }]} numberOfLines={2}>
          {description}
        </Text>
        
        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.map((badge, index) => (
              <View key={index} style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeTextColor }]}>{translateBadge(badge)}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Meta-Zeile: Kalorien + Allergene */}
        <View style={styles.metaRow}>
          <Text style={[styles.calories, { color: subTextColor }]}>{calories}</Text>
          {hasAllergens && (
            <>
              <Text style={[styles.separator, { color: subTextColor }]}>•</Text>
              <Pressable style={styles.allergensLink}>
                <Ionicons name="alert-circle-outline" size={14} color="#FF9800" />
                <Text style={styles.allergensText}>Allergens</Text>
              </Pressable>
            </>
          )}
        </View>
        
        {/* Preis */}
        <Text style={styles.price}>{price}</Text>
      </View>
      
      {/* Rechte Seite: Bild + Favorit */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <Pressable
          style={[styles.favoriteButton, { backgroundColor: favoriteBg }]}
          onPress={handleFavoritePress}
          hitSlop={10}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#4CAF50" : "#999"}
          />
        </Pressable>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
      }
    }),
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    includeFontPadding: false,
  },
  description: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
    includeFontPadding: false,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 11,
    color: '#333',
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  calories: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
    color: '#666',
    includeFontPadding: false,
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
    fontSize: 12,
    includeFontPadding: false,
  },
  allergensLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allergensText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
    color: '#FF9800',
    includeFontPadding: false,
  },
  price: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: Colors.light.tint,
    includeFontPadding: false,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  favoriteButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
