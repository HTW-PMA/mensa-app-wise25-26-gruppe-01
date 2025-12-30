import { StyleSheet, ScrollView, View, Text, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { mensaApi, type Canteen, type BusinessHour } from '@/services/mensaApi';
import { MensaCard } from '@/components/MensaCard';
import { Colors } from '@/constants/theme';
import { useGoogleRatings } from '@/hooks/useGoogleRatings';
import { useLocation, calculateDistance } from '@/hooks/useLocation';

// Filter List Definition
const FILTERS = ['All', 'Vegetarian', 'Vegan', 'Halal', 'Glutenfrei'];

/**
 * Prüft ob eine Mensa heute geschlossen ist
 */
const isCanteenClosed = (businessDays?: Canteen['businessDays']): boolean => {
  if (!businessDays || businessDays.length === 0) return true;
  
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
  const todayEntry = businessDays.find(day => 
    todayVariants.includes(day.day ?? '')
  );
  
  if (!todayEntry) return true;
  
  const hours = todayEntry.businessHours;
  if (!hours || hours.length === 0) return true;
  
  // Prüfe ob mindestens eine Öffnungszeit vorhanden ist
  return !hours.some((h: BusinessHour) => h.openAt && h.closeAt);
};

export function HomeScreen() {
  const router = useRouter();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Standort Hook
  const { location, loading: locationLoading } = useLocation();

  // Google Ratings Hook
  const { enrichCanteensWithRatings } = useGoogleRatings(canteens);

  const [activeFilter, setActiveFilter] = useState('All');

  const loadCanteens = async () => {
    try {
      const data = await mensaApi.getCanteens({ loadingtype: 'complete' });
      setCanteens(data);
    } catch (err) {
      console.error('Error loading canteens', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCanteens();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCanteens();
  }, []);

  // Erweitere Canteens mit Google Ratings und Distanzen, dann sortiere
  const enrichedCanteens = useMemo(() => {
    let enriched = enrichCanteensWithRatings(canteens);
    
    // Distanz berechnen wenn Standort verfügbar
    if (location) {
      enriched = enriched.map(canteen => {
        const geoLoc = canteen.address?.geoLocation;
        if (geoLoc?.latitude && geoLoc?.longitude) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            geoLoc.latitude,
            geoLoc.longitude
          );
          return { ...canteen, distance };
        }
        return canteen;
      });
    }
    
    // Sortierung: 1. Offene zuerst, 2. Nach Distanz
    enriched.sort((a, b) => {
      const aIsClosed = isCanteenClosed(a.businessDays);
      const bIsClosed = isCanteenClosed(b.businessDays);
      
      // Offene Mensen zuerst
      if (aIsClosed !== bIsClosed) {
        return aIsClosed ? 1 : -1;
      }
      
      // Innerhalb der Gruppe nach Distanz sortieren
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
    
    return enriched;
  }, [canteens, enrichCanteensWithRatings, location]);

  return (
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.topBar}>

            <Image
                source={require('@/assets/images/Schriftzug.png')}
                style={styles.logo}
                contentFit="cover"
            />

            <Pressable
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            >
              <Ionicons name="notifications-outline" size={26} color="#333" />
              <View style={styles.notificationBadge} />
            </Pressable>
          </View>

          {/* Filter */}
          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((filter) => (
                <Pressable
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    style={[
                      styles.filterItem,
                      activeFilter === filter && styles.filterItemActive
                    ]}
                >
                  <Text style={[
                    styles.filterText,
                    activeFilter === filter && styles.filterTextActive
                  ]}>
                    {filter}
                  </Text>
                </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView

            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />
            }
        >
          <Text style={styles.subtitle}>📍 Mensas near you</Text>

          {loading && !refreshing ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
              </View>
          ) : (
              <View style={styles.listContainer}>
                {enrichedCanteens.map((canteen) => (
                    <MensaCard
                        key={canteen.id}
                        canteen={canteen}
                        onPress={() => router.push(`/mensa-detail?id=${canteen.id}`)}
                    />
                ))}
              </View>
          )}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  logo: {
    width: 100,
    height: 30,
  },
  notificationBadge: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 4,
  },
  greeting: {
    paddingHorizontal: 20,
    fontSize: 22,
    fontFamily: 'GoogleSans-Bold',
    color: '#000',
  },
  subtitle: {
    paddingHorizontal: 20,
    fontSize: 20,
    fontFamily: 'GoogleSans-Bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 1,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterItemActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterText: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 14,
    color: '#666',
    lineHeight: 30,
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});