import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type Canteen, type BusinessHour } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';

interface MensaCardProps {
  canteen: Canteen;
  onPress: () => void;
}

/**
 * Formatiert die Öffnungszeiten für die Anzeige
 * Priorität: Mittagstisch > Mensa > Backshop > erste verfügbare
 */
const formatHours = (hours?: BusinessHour[]): string => {
  if (!hours || hours.length === 0) return '–';
  
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
  if (!openAt || !closeAt) return '–';
  return `${openAt}–${closeAt}`;
};

/**
 * Ermittelt die heutigen Öffnungszeiten basierend auf dem Wochentag
 * Unterstützt beide Formate: Abkürzungen (Mo, Di...) und volle Namen (Montag, Dienstag...)
 */
const getTodayBusinessHours = (businessDays?: Canteen['businessDays']): string => {
  if (!businessDays || businessDays.length === 0) return '–';
  
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
  
  const todayVariants = weekdayMap[new Date().getDay()];
  
  // Suche nach heutigem Tag (beide Formate)
  const todayEntry = businessDays.find(day => 
    todayVariants.includes(day.day ?? '')
  );
  
  if (todayEntry) {
    return formatHours(todayEntry.businessHours);
  }
  
  // Fallback: Zeige ersten verfügbaren Tag
  return formatHours(businessDays[0]?.businessHours);
};

export function MensaCard({ canteen, onPress }: MensaCardProps) {
  // Bookmark status (currently resets when the app is closed and reopened)
  const [isFavorite, setIsFavorite] = useState(false);

  // Rating und Review-Anzahl aus API-Daten (mit Mock-Fallback)
  // Generiere konsistenten Mock-Wert basierend auf Mensa-ID für Demos
  const getMockRating = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 3.5 + (hash % 20) / 10; // Ergibt Werte zwischen 3.5 und 5.4
  };
  const getMockReviewCount = (id: string): number => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 50 + (hash % 200); // Ergibt Werte zwischen 50 und 249
  };

  const hasRealRating = canteen.rating !== undefined && canteen.rating !== null;
  const rating = hasRealRating 
    ? canteen.rating!.toFixed(1) 
    : getMockRating(canteen.id).toFixed(1);
  const reviewCount = canteen.reviewCount && canteen.reviewCount > 0 
    ? canteen.reviewCount 
    : getMockReviewCount(canteen.id);

  // Öffnungszeiten für heute
  const openingHours = getTodayBusinessHours(canteen.businessDays);

  // Standort-Info: Bezirk > Stadt > Straße (bis echte Distanzberechnung implementiert ist)
  const locationInfo =
    canteen.address?.district ||
    canteen.address?.city ||
    canteen.address?.street ||
    '–';
  
  // Temporary tags for design examples (to be integrated with the Menu API later)
  const badges = ['Fast Service', 'Vegan'];

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>

        <View style={styles.imageContainer}>
          {/* Replace with actual image later */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
            style={styles.image}
            contentFit="cover"
            transition={500}
          />
          {/* Badge display on the image */}
          <View style={styles.badgeOverlay}>
            {badges.slice(0, 2).map((badge, index) => (
              <View key={index} style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>


        <View style={styles.contentContainer}>

          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
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
                color={isFavorite ? Colors.light.tint : "#333"}
              />
            </Pressable>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={16} color="#FFCC00" />
              <Text style={styles.infoText}>
                <Text style={styles.ratingText}>{rating}</Text> ({reviewCount})
              </Text>
            </View>

            <Text style={styles.separator}>•</Text>

            <View style={styles.infoItem}>
              <Ionicons name="location-sharp" size={16} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}> {locationInfo} </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{openingHours}</Text>
            </View>
          </View>

        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
    fontFamily: 'GoogleSans-Bold',
    includeFontPadding: false,
  },
  contentContainer: {
    padding: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 20,
    color: Colors.light.text,
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
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    includeFontPadding: false
  },
  ratingText: {
    fontFamily: 'GoogleSans-Bold',
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
});