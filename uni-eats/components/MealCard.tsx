import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type Meal } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';

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
 * Generiert eine Bild-URL für das Meal
 */
const getMealImage = (meal: Meal): string => {
  const category = meal.category?.toLowerCase() || 'food';
  const searchTerms = {
    'salate': 'salad,fresh',
    'suppen': 'soup,bowl',
    'pasta': 'pasta,italian',
    'hauptgerichte': 'main,dish,dinner',
    'desserts': 'dessert,sweet',
    'beilagen': 'sides,vegetables',
  };
  
  const term = searchTerms[category as keyof typeof searchTerms] || 'food,meal';
  return `https://source.unsplash.com/featured/160x160/?${term}`;
};

export function MealCard({ meal, onPress }: MealCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const price = getStudentPrice(meal.prices);
  const description = getMealDescription(meal);
  const calories = getMealCalories(meal);
  const imageUrl = getMealImage(meal);
  
  // Badges aus API-Daten
  const badges = meal.badges?.slice(0, 3).map(b => b.name) || [];
  
  // Prüfe ob Allergene vorhanden
  const hasAllergens = meal.additives && meal.additives.length > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Linke Seite: Text-Inhalt */}
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {meal.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        
        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Meta-Zeile: Kalorien + Allergene */}
        <View style={styles.metaRow}>
          <Text style={styles.calories}>{calories}</Text>
          {hasAllergens && (
            <>
              <Text style={styles.separator}>•</Text>
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
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
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
}

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
  },
  description: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
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
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
    fontSize: 12,
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
  },
  price: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: Colors.light.tint,
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
