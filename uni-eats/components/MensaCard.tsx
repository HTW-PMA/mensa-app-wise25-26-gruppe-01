import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type Canteen, type BusinessHour } from '@/services/mensaApi';
import { Colors, Fonts } from '@/constants/theme';
import { formatDistance } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/use-theme-color';

// Erweiterter Canteen-Typ mit zusätzlicher Info ob heute Gerichte verfügbar sind
interface CanteenWithMeals extends Canteen {
  hasMealsToday?: boolean;
}

interface MensaCardProps {
  canteen: CanteenWithMeals;
  onPress: () => void;
}

/**
 * Formatiert die Öffnungszeiten für die Anzeige
 * Priorität: Mittagstisch > Mensa > Backshop > erste verfügbare
 */
const formatHours = (hours?: BusinessHour[]): string | null => {
  if (!hours || hours.length === 0) return null;
  
  // Prioritätenliste: Mittagstisch ist am relevantesten für Mensa-Besucher
  const priority = ['Mittagstisch', 'Mensa', 'Backshop'];
  
  let selectedHour: BusinessHour | undefined;
  for (const type of priority) {
    selectedHour = hours.find(h => h.businessHourType === type);
    if (selectedHour) break;
  }
  
  // Fallback: erste verfügbare Öffnungszeit
  const hour = selectedHour || hours[0];
  const { openAt, closeAt } = hour;
  if (!openAt || !closeAt) return null;
  return `${openAt}–${closeAt}`;
};

/**
 * Ermittelt die heutigen Öffnungszeiten basierend auf dem Wochentag
 * Unterstützt beide Formate: Abkürzungen (Mo, Di...) und volle Namen (Montag, Dienstag...)
 */
const getTodayBusinessHours = (businessDays?: Canteen['businessDays']): { hours: string; isClosed: boolean } => {
  if (!businessDays || businessDays.length === 0) {
    return { hours: 'Keine Zeiten verfügbar', isClosed: true };
  }
  
  // Mapping: JS getDay() Index -> [Abkürzung, Voller Name]
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
  
  // Suche nach heutigem Tag (beide Formate)
  const todayEntry = businessDays.find(day => 
    todayVariants.includes(day.day ?? '')
  );
  
  if (todayEntry) {
    const hours = formatHours(todayEntry.businessHours);
    if (hours) {
      return { hours, isClosed: false };
    }
    // Heute existiert im Plan, aber keine Öffnungszeiten = geschlossen
    return { hours: 'Heute geschlossen', isClosed: true };
  }
  
  // Fallback: Zeige ersten Tag mit Öffnungszeiten
  for (const day of businessDays) {
    const hours = formatHours(day.businessHours);
    if (hours) {
      return { hours: `${day.day}: ${hours}`, isClosed: true };
    }
  }
  
  return { hours: 'Keine Zeiten verfügbar', isClosed: true };
};

export function MensaCard({ canteen, onPress }: MensaCardProps) {
  // Bookmark status (currently resets when the app is closed and reopened)
  const [isFavorite, setIsFavorite] = useState(false);

  // Rating und Review-Anzahl aus API-Daten (mit Mock-Fallback)
  // Generiere konsistenten Mock-Wert basierend auf Mensa-ID für Demos
  const getMockRating = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 3.5 + (hash % 15) / 10; // Ergibt Werte zwischen 3.5 und 4.9
  };
  const getMockReviewCount = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (hash % 200); // Ergibt Werte zwischen 50 und 249
  };

  // Nutze Google Places Rating falls verfügbar, sonst API-Rating, sonst Mock
  const hasRealRating = canteen.rating !== undefined && canteen.rating !== null;
  const hasGoogleRating = canteen.googleRating !== undefined && canteen.googleRating !== null;
  const displayRating = hasGoogleRating 
    ? canteen.googleRating!
    : hasRealRating 
      ? canteen.rating!
      : getMockRating(canteen.id);
  const rating = Math.min(displayRating, 5.0).toFixed(1); // Maximal 5.0 Sterne
  
  const reviewCount = canteen.googleReviewCount && canteen.googleReviewCount > 0
    ? canteen.googleReviewCount
    : canteen.reviewCount && canteen.reviewCount > 0 
      ? canteen.reviewCount 
      : getMockReviewCount(canteen.id);

  // Öffnungszeiten für heute
  const { hours: openingHours, isClosed: isClosedByHours } = getTodayBusinessHours(canteen.businessDays);
  
  // Eine Mensa ist "closed" wenn sie keine Öffnungszeiten hat ODER keine Gerichte heute
  const isClosed = isClosedByHours || canteen.hasMealsToday === false;

  // Distanz anzeigen wenn verfügbar, sonst Bezirk/Stadt
  const distanceText = canteen.distance !== undefined 
    ? formatDistance(canteen.distance)
    : null;
  const locationFallback =
    canteen.address?.district ||
    canteen.address?.city ||
    canteen.address?.street ||
    '–';
  
  // Temporary tags for design examples (to be integrated with the Menu API later)
  const badges = ['Fast Service', 'Vegan'];

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
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.cardContent, { backgroundColor, borderColor }]}>

        <View style={styles.imageContainer}>
          {/* Replace with actual image later */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
            style={[styles.image, isClosed && styles.imageGrayed]}
            contentFit="cover"
            transition={500}
          />
          {/* Closed overlay when mensa is closed */}
          {isClosed && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedOverlayText}>Closed</Text>
            </View>
          )}
          {/* Badge display on the image - hide when closed */}
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
              onPress={(e) => {
                e.stopPropagation(); // Prevent card clicks and toggle only hearts
                setIsFavorite(!isFavorite);
              }}
              hitSlop={10}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? Colors.light.tint : iconColor}
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

            <Text style={styles.separator}>•</Text>

            <View style={styles.infoItem}>
              <Ionicons name="location-sharp" size={16} color={distanceText ? Colors.light.tint : subTextColor} />
              <Text style={[styles.infoText, { color: subTextColor }, distanceText && styles.distanceText]} numberOfLines={1}>
                {distanceText || locationFallback}
              </Text>
            </View>
          </View>

          {/* Show opening hours only when open */}
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
      includeFontPadding: false
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
  