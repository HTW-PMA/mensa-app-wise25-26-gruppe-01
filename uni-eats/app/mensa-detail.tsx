import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  ActivityIndicator, 
  Pressable, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mensaApi, type Canteen, type Meal, type BusinessHour } from '@/services/mensaApi';
import { MealCard } from '@/components/MealCard';
import { Colors } from '@/constants/theme';
import { useLocation, calculateDistance, formatDistance } from '@/hooks/useLocation';
import { useGoogleRatings } from '@/hooks/useGoogleRatings';

const formatLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MensaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  // Standort Hook für Live-Distanz
  const { location } = useLocation();
  
  // State
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingCanteen, setLoadingCanteen] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDateKey(new Date()));
  const [today, setToday] = useState<Date>(() => new Date());
  const [canteenError, setCanteenError] = useState<string | null>(null);
  const [mealsError, setMealsError] = useState<string | null>(null);

  // Google Ratings Hook - lädt Ratings im Hintergrund während Meals angezeigt werden
  const { enrichCanteensWithRatings } = useGoogleRatings(canteen ? [canteen] : []);
  
  // Anreichere Canteen mit Google Ratings
  const enrichedCanteen = useMemo(() => {
    if (!canteen) return null;
    const enriched = enrichCanteensWithRatings([canteen])[0] || canteen;
    return enriched;
  }, [canteen, enrichCanteensWithRatings]);

  const todayKey = useMemo(() => formatLocalDateKey(today), [today]);

  const weekDates = useMemo(() => {
    const baseDate = new Date(today);
    baseDate.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + index);
      return {
        key: formatLocalDateKey(date),
        weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        date,
      };
    });
  }, [today]);

  const selectedDateInfo = useMemo(
    () => weekDates.find((day) => day.key === selectedDate),
    [weekDates, selectedDate]
  );

  const isSelectedToday = selectedDate === todayKey;
  const mealsCountLabel = mealsError
    ? '–'
    : loadingMeals
      ? 'Loading'
      : `${meals.length} items`;

  // Daten laden
  const loadCanteen = useCallback(async () => {
    if (!id) return;
    
    const startTime = Date.now();
    const logStep = (step: string) => {
      const elapsed = Date.now() - startTime;
      console.log(`⏱️  MensaDetail [${elapsed}ms]: ${step}`);
    };

    try {
      logStep('START loading canteen');
      setCanteenError(null);
      setLoadingCanteen(true);

      logStep('Calling getCanteen...');
      const canteenData = await mensaApi.getCanteen(id);
      logStep(`Canteen loaded: ${canteenData?.name || 'NOT FOUND'} | canteenData: ${JSON.stringify(canteenData)}`);

      if (!canteenData) {
        setCanteenError('Mensa not found');
        setCanteen(null);
      } else {
        console.log('📢 Setting canteen:', canteenData);
        setCanteen(canteenData);
      }
    } catch (err) {
      console.error('Error loading canteen:', err);
      logStep('ERROR occurred');
      setCanteenError('Fehler beim Laden der Mensa');
      setCanteen(null);
    } finally {
      setLoadingCanteen(false);
    }
  }, [id]);

  const loadMeals = useCallback(
    async (dateKey: string) => {
      if (!id) return;

      const startTime = Date.now();
      const logStep = (step: string) => {
        const elapsed = Date.now() - startTime;
        console.log(`⏱️  MensaDetail [${elapsed}ms]: ${step}`);
      };

      try {
        logStep(`START loading meals for ${dateKey}`);
        setMealsError(null);
        setLoadingMeals(true);

        logStep('Calling getMeals...');
        const mealsData = await mensaApi.getMeals({
          canteenId: id,
          loadingtype: 'complete',
          date: dateKey,
        });
        logStep(`Meals loaded: ${mealsData.length} items`);

        setMeals(mealsData);
      } catch (err) {
        console.error('Error loading meals:', err);
        logStep('ERROR occurred');
        setMeals([]);
        setMealsError('Fehler beim Laden der Gerichte');
      } finally {
        setLoadingMeals(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadCanteen();
  }, [id, loadCanteen]);

  useEffect(() => {
    loadMeals(selectedDate);
  }, [loadMeals, selectedDate]);

  useEffect(() => {
    if (!weekDates.some((day) => day.key === selectedDate)) {
      setSelectedDate(todayKey);
    }
  }, [todayKey, weekDates, selectedDate]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => setToday(new Date()), timeout);
    return () => clearTimeout(timer);
  }, [today]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadCanteen(), loadMeals(selectedDate)]).finally(() => {
      setRefreshing(false);
    });
  }, [loadCanteen, loadMeals, selectedDate]);

  // Rating-Anzeige
  const getRating = (): { rating: string; count: number } => {
    console.log('🔍 getRating called, enrichedCanteen:', enrichedCanteen);
    if (!enrichedCanteen) {
      console.log('⚠️  enrichedCanteen is null, returning fallback');
      return { rating: '–', count: 0 };
    }
    if (enrichedCanteen?.googleRating) {
      console.log('✅ Using googleRating:', enrichedCanteen.googleRating);
      return { 
        rating: enrichedCanteen.googleRating.toFixed(1), 
        count: enrichedCanteen.googleReviewCount || 0 
      };
    }
    if (enrichedCanteen?.rating) {
      console.log('✅ Using rating:', enrichedCanteen.rating);
      return { 
        rating: enrichedCanteen.rating.toFixed(1), 
        count: enrichedCanteen.reviewCount || 0 
      };
    }
    console.log('⚠️  No rating found, returning fallback');
    return { rating: '–', count: 0 };
  };

  const { rating, count: reviewCount } = getRating();

  // Berechne Distanz basierend auf Live-Standort
  const getDistance = (): string => {
    if (!location || !enrichedCanteen?.address?.geoLocation) {
      return enrichedCanteen?.address?.district || '–';
    }
    const geoLoc = enrichedCanteen.address.geoLocation;
    if (!geoLoc.latitude || !geoLoc.longitude) {
      return enrichedCanteen.address?.district || '–';
    }
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      geoLoc.latitude,
      geoLoc.longitude
    );
    return formatDistance(distance);
  };

  // Öffnungszeiten für heute ermitteln
  const getTodayOpeningHours = (): string => {
    if (!enrichedCanteen?.businessDays || enrichedCanteen.businessDays.length === 0) {
      return 'Keine Zeiten';
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
    
    const todayVariants = weekdayMap[new Date().getDay()];
    const todayEntry = enrichedCanteen.businessDays.find(day => 
      todayVariants.includes(day.day ?? '')
    );
    
    if (!todayEntry || !todayEntry.businessHours || todayEntry.businessHours.length === 0) {
      return 'Closed';
    }
    
    // Priorität: Mittagstisch > Mensa > erste verfügbare
    const priority = ['Mittagstisch', 'Mensa', 'Backshop'];
    let selectedHour: BusinessHour | undefined;
    for (const type of priority) {
      selectedHour = todayEntry.businessHours.find((h: BusinessHour) => h.businessHourType === type);
      if (selectedHour) break;
    }
    const hour = selectedHour || todayEntry.businessHours[0];
    
    if (!hour.openAt || !hour.closeAt) {
      return 'Closed';
    }
    return `${hour.openAt}–${hour.closeAt}`;
  };

  // Loading State
  if (loadingCanteen && !canteen) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Error State
  if (!loadingCanteen && !canteen) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#E57373" />
        <Text style={styles.errorText}>{canteenError || 'Mensa not found'}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header - UniEats Logo centered with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/Schriftzug_rmbg.png')}
            style={styles.headerLogo}
            contentFit="contain"
            contentPosition="center"
          />
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.light.tint} 
          />
        }
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?q=80&w=800&auto=format&fit=crop' }}
            style={[
              styles.heroImage,
              !loadingMeals && !mealsError && meals.length === 0 && styles.heroImageClosed
            ]}
            contentFit="cover"
            transition={500}
          />
          {/* Closed Overlay when no meals available (nicht während loading) */}
          {!loadingMeals && !mealsError && meals.length === 0 && (
            <View style={styles.closedOverlay}>
              <View style={styles.closedBadge}>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.closedBadgeText}>{isSelectedToday ? 'Closed Today' : 'Closed'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Mensa Info - IMMER anzeigen */}
        <View style={styles.infoContainer}>
          <Text style={styles.mensaName}>{enrichedCanteen?.name || 'Loading...'}</Text>
          
          <View style={styles.metaRow}>
            {/* Rating */}
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#FFCC00" />
              <Text style={styles.metaText}>
                <Text style={styles.ratingText}>{rating}</Text>
                <Text style={styles.reviewCount}> ({reviewCount})</Text>
              </Text>
            </View>

            {enrichedCanteen && (
              <>
                <Text style={styles.metaSeparator}>•</Text>

                {/* Distance - Live location based */}
                <View style={styles.metaItem}>
                  <Ionicons name="location-sharp" size={16} color={Colors.light.tint} />
                  <Text style={styles.metaText}>{getDistance()}</Text>
                </View>

                <Text style={styles.metaSeparator}>•</Text>

                {/* Opening Hours */}
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>{getTodayOpeningHours()}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Date Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datePickerScroll}
          style={styles.datePickerContainer}
        >
          {weekDates.map((day) => {
            const isSelected = day.key === selectedDate;
            return (
            <Pressable
              key={day.key}
              onPress={() => setSelectedDate(day.key)}
              style={[
                styles.dateChip,
                isSelected && styles.dateChipActive
              ]}
            >
              <Text style={[
                styles.dateChipDay,
                isSelected && styles.dateChipTextActive
              ]}>
                {day.weekday}
              </Text>
              <Text style={[
                styles.dateChipDate,
                isSelected && styles.dateChipTextActive
              ]}>
                {day.label}
              </Text>
            </Pressable>
          )})}
        </ScrollView>

        {/* Date Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isSelectedToday
              ? 'Today'
              : selectedDateInfo
                ? `${selectedDateInfo.weekday}, ${selectedDateInfo.label}`
                : 'Dishes'}
          </Text>
          <Text style={styles.sectionCount}>
            {mealsCountLabel}
          </Text>
        </View>

        {/* Show Closed state or meal list */}
        {loadingMeals ? (
          /* Loading State */
          <View style={styles.closedState}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.closedTitle}>Loading Dishes...</Text>
          </View>
        ) : mealsError ? (
          <View style={styles.closedState}>
            <Ionicons name="alert-circle-outline" size={48} color="#E57373" />
            <Text style={styles.closedTitle}>Could not load dishes</Text>
            <Text style={styles.closedSubtitle}>{mealsError}</Text>
          </View>
        ) : meals.length === 0 ? (
          /* Closed State - No meals available today */
          <View style={styles.closedState}>
            <View style={styles.closedIconContainer}>
              <Ionicons name="time-outline" size={64} color="#E57373" />
            </View>
            <Text style={styles.closedTitle}>{isSelectedToday ? 'Closed Today' : 'Closed'}</Text>
            <Text style={styles.closedSubtitle}>
              This canteen has no dishes available for this day.
            </Text>
            <Text style={styles.closedHint}>
              Try another date or check a different canteen nearby.
            </Text>
          </View>
        ) : (
          /* Meal List */
          <View style={styles.mealList}>
            {meals.map((meal, index) => (
              <MealCard
                key={`${meal.id}-${index}`}
                meal={meal}
                onPress={() => {
                  // Navigate to meal detail with all meal data
                  router.push({
                    pathname: '/meal-detail',
                    params: {
                      id: meal.id,
                      name: meal.name,
                      category: meal.category || '',
                      prices: JSON.stringify(meal.prices || []),
                      additives: JSON.stringify(meal.additives || []),
                      badges: JSON.stringify(meal.badges || []),
                      co2Bilanz: meal.co2Bilanz?.toString() || '',
                      waterBilanz: meal.waterBilanz?.toString() || '',
                      canteenName: enrichedCanteen?.name || '',
                    },
                  });
                }}
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
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'GoogleSans-Regular',
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontFamily: 'GoogleSans-Regular',
    fontSize: 16,
    color: '#E57373',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 14,
    color: '#fff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    width: 44,
  },
  logoContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    height: '100%',
    width: 120,
  },
  backButtonSpacer: {
    width: 40,
    position: 'absolute',
    right: 16,
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Hero Image
  heroContainer: {
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  
  // Mensa Info
  infoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mensaName: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 22,
    color: '#333',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
  },
  ratingText: {
    fontFamily: 'GoogleSans-Bold',
    color: '#333',
  },
  reviewCount: {
    color: Colors.light.tint,
  },
  metaSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
    fontSize: 14,
  },
  
  // Date Picker
  datePickerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dateChip: {
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 64,
  },
  dateChipActive: {
    backgroundColor: Colors.light.tint,
  },
  dateChipDay: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 12,
    color: '#f5f5f5',
  },
  dateChipDate: {
    marginTop: 2,
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
    color: '#e0e0e0',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    color: '#333',
  },
  sectionCount: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
  },
  
  // Meal List
  mealList: {
    paddingHorizontal: 16,
  },
  
  // Closed State
  heroImageClosed: {
    opacity: 0.5,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E57373',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closedBadgeText: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
  },
  closedState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  closedIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  closedTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 22,
    color: '#E57373',
    marginBottom: 8,
  },
  closedSubtitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  closedHint: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
