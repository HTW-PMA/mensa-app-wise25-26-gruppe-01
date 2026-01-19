import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, memo, useCallback } from 'react';
import { type Meal } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useProfile } from '@/contexts/ProfileContext';
import { translateBadge } from '@/utils/translations';
import { selectPriceForStatus } from '@/utils/priceHelpers';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
}

/**
 * Generate a mock description based on the meal name.
 */
const getMealDescriptionKey = (meal: Meal): string => {
  const descriptions: Record<string, string> = {
    Salat: 'meal.description.salat',
    Suppe: 'meal.description.soup',
    Pasta: 'meal.description.pasta',
    Pizza: 'meal.description.pizza',
    Burger: 'meal.description.burger',
    Bowl: 'meal.description.bowl',
    Curry: 'meal.description.curry',
    Brownie: 'meal.description.brownie',
  };

  for (const [key, descKey] of Object.entries(descriptions)) {
    if (meal.name.toLowerCase().includes(key.toLowerCase())) {
      return descKey;
    }
  }
  return 'meal.description.default';
};

/**
 * Calculate mock calories based on the meal.
 */
const getMealCalories = (meal: Meal): number => {
  if (meal.co2Bilanz) {
    return Math.round(meal.co2Bilanz * 0.8 + 200);
  }
  const hash = meal.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 300 + (hash % 400);
};

/**
 * Generate a meal image URL.
 */
const getMealImage = (meal: Meal): string => {
  const searchText = `${meal.name} ${meal.category || ''}`.toLowerCase();

  const imageMap: Record<string, string> = {
    // 1. Shapes / categories
    suppe: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=160&h=160&fit=crop',
    stew: 'https://images.unsplash.com/photo-1591386767153-987783380885?w=160&h=160&fit=crop',
    eintopf: 'https://images.unsplash.com/photo-1608500218987-0f2b3be34b47?w=160&h=160&fit=crop',
    salat: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&h=160&fit=crop',
    bowl: 'https://images.unsplash.com/photo-1602881917445-0b1ba001addf?w=160&h=160&fit=crop',
    kuchen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&h=160&fit=crop',
    pudding: 'https://images.unsplash.com/photo-1734671223988-20df071ab200?w=160&h=160&fit=crop',
    joghurt: 'https://images.unsplash.com/photo-1564149503905-7fef56abc1f2?w=160&h=160&fit=crop',
    smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=160&h=160&fit=crop',

    // 2. Main dishes
    pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop',
    burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&h=160&fit=crop',
    pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=160&h=160&fit=crop',
    spaghetti: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=160&h=160&fit=crop',
    tortellini: 'https://images.unsplash.com/photo-1628885405379-5d58de03edb0?w=160&h=160&fit=crop',
    lasagne: 'https://plus.unsplash.com/premium_photo-1671559021023-3da68c12aeed?w=160&h=160&fit=crop',
    gnocchi: 'https://images.unsplash.com/photo-1710532767837-bddfa38b5736?w=160&h=160&fit=crop',
    pommes: 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=160&h=160&fit=crop',
    fries: 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=160&h=160&fit=crop',
    dessert: 'https://plus.unsplash.com/premium_photo-1678715022988-417bbb94e3df?w=160&h=160&fit=crop',

    // 3. Ingredients / dishes
    schnitzel: 'https://images.unsplash.com/photo-1560611588-163f295eb145?w=160&h=160&fit=crop',
    steak: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=160&h=160&fit=crop',
    wurst: 'https://images.unsplash.com/photo-1695089028198-80245e2f5d06?w=160&h=160&fit=crop',
    curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=160&h=160&fit=crop',
    wok: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
    reis: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
    fisch: 'https://plus.unsplash.com/premium_photo-1683707120330-603d9963cb02?w=160&h=160&fit=crop',
    braten: 'https://images.unsplash.com/photo-1581073766947-e8f3ef5393a4?w=160&h=160&fit=crop',
    gulasch: 'https://plus.unsplash.com/premium_photo-1669687759693-52ba5f9fa7a8?w=160&h=160&fit=crop',
    falafel: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb8?w=160&h=160&fit=crop',
    grill: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=160&h=160&fit=crop',
    auflauf: 'https://images.unsplash.com/photo-1645453014403-4ad5170a386c?w=160&h=160&fit=crop',
    pfanne: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
  };

  for (const [key, url] of Object.entries(imageMap)) {
    if (searchText.includes(key)) {
      return url;
    }
  }

  if (searchText.includes('vegan') || searchText.includes('vegetarisch')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=160&h=160&fit=crop';
  }

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&h=160&fit=crop';
};

export const MealCard = memo(function MealCard({ meal, onPress }: MealCardProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({ light: '#333333', dark: '#ffffff' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9ba1a6' }, 'text');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333333' }, 'border');
  const badgeBg = useThemeColor({ light: '#f0f0f0', dark: '#2c2c2e' }, 'background');
  const badgeTextColor = useThemeColor({ light: '#333333', dark: '#e0e0e0' }, 'text');
  const favoriteBg = useThemeColor({ light: '#ffffff', dark: '#2c2c2e' }, 'background');

  const { isFavoriteMeal, toggleFavoriteMeal } = useFavoritesContext();
  const canFavorite = Boolean(meal.canteenId);
  const isFavorite = canFavorite ? isFavoriteMeal(meal.id, meal.canteenId as string) : false;

  const handleFavoritePress = useCallback((e: any) => {
    e.stopPropagation();
    if (!meal.canteenId) return;
    toggleFavoriteMeal(meal.id, meal.canteenId);
  }, [meal.id, meal.canteenId, toggleFavoriteMeal]);

  const selectedPrice = useMemo(
    () => selectPriceForStatus(meal.prices, profile?.status),
    [meal.prices, profile?.status]
  );
  const price =
    selectedPrice.price !== null
      ? t('common.priceFormat', { value: selectedPrice.price.toFixed(2) })
      : t('common.priceUnavailable');
  const description = t(getMealDescriptionKey(meal));
  const calories = t('common.calories', { value: getMealCalories(meal) });
  const imageUrl = useMemo(() => getMealImage(meal), [meal.category, meal.name]);
  const separator = t('common.separator');

  const badges = useMemo(() => meal.badges?.slice(0, 3).map((badge) => badge.name) || [], [meal.badges]);
  const hasAllergens = useMemo(() => meal.additives && meal.additives.length > 0, [meal.additives]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
          {meal.name}
        </Text>

        <Text style={[styles.description, { color: subTextColor }]} numberOfLines={2}>
          {description}
        </Text>

        {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.map((badge, index) => (
              <View key={index} style={[styles.badge, { backgroundColor: badgeBg }]}> 
                <Text style={[styles.badgeText, { color: badgeTextColor }]}>{translateBadge(badge)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={[styles.calories, { color: subTextColor }]}>{calories}</Text>
          {hasAllergens && (
            <View style={styles.allergensContainer}>
              <Text style={[styles.separator, { color: subTextColor }]}>{separator}</Text>
              <Pressable style={styles.allergensLink}><Ionicons name="alert-circle-outline" size={14} color="#FF9800" /><Text style={styles.allergensText}>{t('common.allergens')}</Text></Pressable>
            </View>
          )}
        </View>

        <Text style={styles.price}>{price}</Text>
      </View>

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
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#4CAF50' : '#999'}
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
  allergensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
