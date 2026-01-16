import React from 'react';
import { StyleSheet, Pressable, View, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { type Meal } from '@/services/mensaApi';
import { useProfile } from '@/contexts/ProfileContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors } from '@/constants/theme';
import { selectPriceForStatus } from '@/utils/priceHelpers';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FavoriteMealCardProps {
  meal: Meal;
  canteenName?: string;
  onPress?: () => void;
  onRemove?: () => void;
}

/**
 * Generiert eine Mock-Beschreibung basierend auf dem Meal-Namen
 */
const getMealDescriptionKey = (meal: Meal): string => {
  const descriptions: Record<string, string> = {
    'Salat': 'meal.description.salat',
    'Suppe': 'meal.description.soup',
    'Pasta': 'meal.description.pasta',
    'Pizza': 'meal.description.pizza',
    'Burger': 'meal.description.burger',
    'Bowl': 'meal.description.bowl',
    'Curry': 'meal.description.curry',
    'Brownie': 'meal.description.brownie',
  };

  for (const [key, descKey] of Object.entries(descriptions)) {
    if (meal.name.toLowerCase().includes(key.toLowerCase())) {
      return descKey;
    }
  }
  return 'meal.description.default';
};

/**
 * Berechnet Mock-Kalorien basierend auf dem Meal
 */
const getMealCalories = (meal: Meal): number => {
  if (meal.co2Bilanz) {
    return Math.round(meal.co2Bilanz * 0.8 + 200);
  }
  const hash = meal.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 300 + (hash % 400);
};

/**
 * Generiert eine Bild-URL für das Meal - mit statischen URLs für bessere Performance
 */
const getMealImage = (meal: Meal): string => {
  const category = meal.category?.toLowerCase() || 'food';
  
  // Statische Unsplash-URLs für schnellere Ladezeiten und Zuverlässigkeit
  const colorMap: Record<string, string> = {
    'salate': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop',
    'suppen': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=120&h=120&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=120&h=120&fit=crop',
    'hauptgerichte': 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=120&h=120&fit=crop',
    'desserts': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&h=120&fit=crop',
    'beilagen': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop',
  };
  
  return colorMap[category] || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&h=120&fit=crop';
};

/**
 * Badge-Typen für Styling
 */
type BadgeType = 'vegan' | 'vegetarian' | 'popular' | 'spicy' | 'dessert' | 'default';

const getBadgeType = (name: string): BadgeType => {
  const lower = name.toLowerCase();
  if (lower.includes('vegan')) return 'vegan';
  if (lower.includes('vegetarisch') || lower.includes('vegetarian')) return 'vegetarian';
  if (lower.includes('popular') || lower.includes('beliebt')) return 'popular';
  if (lower.includes('scharf') || lower.includes('spicy')) return 'spicy';
  if (lower.includes('dessert') || lower.includes('süß')) return 'dessert';
  return 'default';
};

export function FavoriteMealCard({ meal, canteenName, onPress, onRemove }: FavoriteMealCardProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  
  // Theme colors
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({ light: '#333333', dark: '#ffffff' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9ba1a6' }, 'text');
  const extraSubTextColor = useThemeColor({ light: '#888888', dark: '#8e8e93' }, 'text');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#2c2c2e' }, 'border');
  const badgeBg = useThemeColor({ light: '#f5f5f5', dark: '#2c2c2e' }, 'background');
  const imageBg = useThemeColor({ light: '#f0f0f0', dark: '#2c2c2e' }, 'background');

  const resolvedCanteenName = canteenName ?? t('common.notAvailable');
  const selectedPrice = selectPriceForStatus(meal.prices, profile?.status);
  const price =
    selectedPrice.price !== null
      ? t('common.priceFormat', { value: selectedPrice.price.toFixed(2) })
      : t('common.priceUnavailable');
  const description = t(getMealDescriptionKey(meal));
  const calories = t('common.calories', { value: getMealCalories(meal) });
  const imageUrl = getMealImage(meal);
  
  // Badges aus API-Daten
  const badges = meal.badges?.slice(0, 2).map(b => ({
    name: b.name,
    type: getBadgeType(b.name),
  })) || [];

  const getBadgeStyle = (type: BadgeType) => {
    switch (type) {
      case 'vegan':
      case 'vegetarian':
        return { borderColor: Colors.light.tint, backgroundColor: 'transparent', textColor: Colors.light.tint };
      case 'popular':
        return { borderColor: borderColor, backgroundColor: badgeBg, textColor: textColor };
      case 'spicy':
        return { borderColor: '#FF5722', backgroundColor: 'transparent', textColor: '#FF5722' };
      case 'dessert':
        return { borderColor: '#9C27B0', backgroundColor: 'transparent', textColor: '#9C27B0' };
      default:
        return { borderColor: borderColor, backgroundColor: badgeBg, textColor: textColor };
    }
  };

  const renderRightActions = () => {
    if (!onRemove) return null;
    
    return (
      <Pressable style={styles.deleteAction} onPress={onRemove}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </Pressable>
    );
  };

  const CardContent = (
    <Pressable
      style={({ pressed }) => [
        styles.container, 
        { backgroundColor, borderColor },
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      {/* Bild links */}
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { backgroundColor: imageBg }]}
        contentFit="cover"
        transition={300}
      />
      
      {/* Mittlerer Inhalt */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
          {meal.name}
        </Text>

        <Text style={[styles.canteenName, { color: extraSubTextColor }]} numberOfLines={1}>
          {resolvedCanteenName}
        </Text>

        <Text style={[styles.description, { color: subTextColor }]} numberOfLines={1}>
          {description}
        </Text>
        
        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.map((badge, index) => {
              const badgeStyle = getBadgeStyle(badge.type);
              return (
                <View 
                  key={index} 
                  style={[
                    styles.badge, 
                    { 
                      borderColor: badgeStyle.borderColor,
                      backgroundColor: badgeStyle.backgroundColor,
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.badgeText,
                      { color: badgeStyle.textColor }
                    ]}
                  >
                    {badge.name}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      
      {/* Rechte Seite: Preis & Kalorien */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{price}</Text>
        <Text style={[styles.calories, { color: extraSubTextColor }]}>{calories}</Text>
      </View>
    </Pressable>
  );

  // Wenn onRemove vorhanden ist, wrap mit Swipeable
  if (onRemove) {
    return (
      <Swipeable renderRightActions={renderRightActions}>
        {CardContent}
      </Swipeable>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    
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
    }),
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    marginBottom: 6,
  },
  canteenName: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 11,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  price: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: '#02AA20', // Always UniEats Green for price
    marginBottom: 2,
  },
  calories: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
  },
  deleteAction: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 12,
  },
});

