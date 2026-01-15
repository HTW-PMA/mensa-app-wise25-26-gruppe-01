import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type Canteen, type BusinessHour } from '@/services/mensaApi';
import { Colors, Fonts } from '@/constants/theme';
import { formatDistance } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCanteenLogo } from '@/utils/getCanteenLogo';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useTranslation } from '@/hooks/useTranslation';

// Extended Canteen type with info about meals today
interface CanteenWithMeals extends Canteen {
  hasMealsToday?: boolean;
}

interface MensaCardProps {
  canteen: CanteenWithMeals;
  onPress: () => void;
}

/**
 * Format opening hours for display.
 * Priority: lunch counter > mensa > bakery > first available.
 */
const formatHours = (hours?: BusinessHour[]): string | null => {
  if (!hours || hours.length === 0) return null;

  const priority = ['Mittagstisch', 'Mensa', 'Backshop'];

  let selectedHour: BusinessHour | undefined;
  for (const type of priority) {
    selectedHour = hours.find((entry) => entry.businessHourType === type);
    if (selectedHour) break;
  }

  const hour = selectedHour || hours[0];
  const { openAt, closeAt } = hour;
  if (!openAt || !closeAt) return null;
  return `${openAt} - ${closeAt}`;
};

/**
 * Get business hours for today.
 */
const getTodayBusinessHours = (
  businessDays: Canteen['businessDays'] | undefined,
  t: (key: string, options?: Record<string, any>) => string
): { hours: string; isClosed: boolean } => {
  if (!businessDays || businessDays.length === 0) {
    return { hours: t('mensaCard.noHours'), isClosed: true };
  }

  const weekdayMap: Record<number, string[]> = {
    0: ['So', 'Sonntag'],
    1: ['Mo', 'Montag'],
    2: ['Di', 'Dienstag'],
    3: ['Mi', 'Mittwoch'],
    4: ['Do', 'Donnerstag'],
    5: ['Fr', 'Freitag'],
    6: ['Sa', 'Samstag'],
  };

  const todayIndex = new Date().getDay();
  const todayVariants = weekdayMap[todayIndex];

  const todayEntry = businessDays.find((day) => todayVariants.includes(day.day ?? ''));

  if (todayEntry) {
    const hours = formatHours(todayEntry.businessHours);
    if (hours) {
      return { hours, isClosed: false };
    }
    return { hours: t('mensaCard.todayClosed'), isClosed: true };
  }

  for (const day of businessDays) {
    const hours = formatHours(day.businessHours);
    if (hours) {
      return {
        hours: t('mensaCard.hoursFallback', {
          day: day.day ?? t('common.notAvailable'),
          hours,
        }),
        isClosed: true,
      };
    }
  }

  return { hours: t('mensaCard.noHours'), isClosed: true };
};

export function MensaCard({ canteen, onPress }: MensaCardProps) {
  const { t } = useTranslation();
  const { isFavoriteCanteen, toggleFavoriteCanteen } = useFavoritesContext();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const canteenIsFavorited = isFavoriteCanteen(canteen.id);

  const getMockRating = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 3.5 + (hash % 15) / 10;
  };
  const getMockReviewCount = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (hash % 200);
  };

  const handleToggleFavorite = async () => {
    try {
      setIsTogglingFavorite(true);
      await toggleFavoriteCanteen(canteen.id);
    } catch (error) {
      console.error('Error toggling favorite canteen:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const hasRealRating = canteen.rating !== undefined && canteen.rating !== null;
  const hasGoogleRating = canteen.googleRating !== undefined && canteen.googleRating !== null;
  const displayRating = hasGoogleRating
    ? canteen.googleRating!
    : hasRealRating
      ? canteen.rating!
      : getMockRating(canteen.id);
  const rating = Math.min(displayRating, 5.0).toFixed(1);

  const reviewCount = canteen.googleReviewCount && canteen.googleReviewCount > 0
    ? canteen.googleReviewCount
    : canteen.reviewCount && canteen.reviewCount > 0
      ? canteen.reviewCount
      : getMockReviewCount(canteen.id);

  const { hours: openingHours, isClosed: isClosedByHours } = getTodayBusinessHours(canteen.businessDays, t);

  const isClosed = isClosedByHours || canteen.hasMealsToday === false;

  const distanceText = canteen.distance !== undefined
    ? formatDistance(canteen.distance)
    : null;
  const locationFallback =
    canteen.address?.district ||
    canteen.address?.city ||
    canteen.address?.street ||
    t('common.notAvailable');

  const badges = [t('mensaCard.badges.fastService'), t('mensaCard.badges.vegan')];
  const separator = t('common.separator');

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const subTextColor = useThemeColor({ light: '#666', dark: '#9BA1A6' }, 'icon');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({ light: '#f0f0f0', dark: '#333' }, 'border');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.cardContent, { backgroundColor, borderColor }]}>
        <View style={styles.imageContainer}>
          <Image
            source={getCanteenLogo(canteen.name)}
            style={[styles.image, isClosed && styles.imageGrayed]}
            contentFit="contain"
            transition={300}
          />
          {isClosed && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedOverlayText}>{t('mensaCard.closed')}</Text>
            </View>
          )}
          {!isClosed && (
            <View style={styles.badgeOverlay}>
              {badges.slice(0, 2).map((badge, index) => (
                <View key={index} style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
              {canteen.name}
            </Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                handleToggleFavorite();
              }}
              hitSlop={10}
              disabled={isTogglingFavorite}
            >
              <Ionicons
                name={canteenIsFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={canteenIsFavorited ? Colors.light.tint : iconColor}
                style={{ opacity: canteenIsFavorited ? 1 : 0.6 }}
              />
            </Pressable>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={16} color="#FFCC00" />
              <Text style={styles.infoText}>
                <Text style={[styles.ratingText, { color: textColor }]}>{rating}</Text> ({reviewCount})
              </Text>
            </View>

            <Text style={styles.separator}>{separator}</Text>

            <View style={styles.infoItem}>
              <Ionicons name="location-sharp" size={16} color={distanceText ? Colors.light.tint : subTextColor} />
              <Text style={[styles.infoText, { color: subTextColor }, distanceText && styles.distanceText]} numberOfLines={1}>
                {distanceText || locationFallback}
              </Text>
            </View>
          </View>

          {!isClosed && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color="#4CAF50" />
                <Text style={[styles.infoText, { color: subTextColor }]}>
                  {openingHours}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 15,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
      }
    }),
  },
  cardContent: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 150,
    width: '100%',
    backgroundColor: '#eee',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGrayed: {
    opacity: 0.4,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  badgeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Fonts.bold,
    includeFontPadding: false,
  },
  contentContainer: {
    padding: 12,
    paddingVertical: 14,
    gap: 6,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    flex: 1,
    marginRight: 8,
    lineHeight: 26,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
    fontSize: 12,
    includeFontPadding: false,
  },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    includeFontPadding: false,
  },
  closedText: {
    color: '#E57373',
  },
  distanceText: {
    fontFamily: Fonts.bold,
    color: Colors.light.tint,
  },
  ratingText: {
    fontFamily: Fonts.bold,
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
});
