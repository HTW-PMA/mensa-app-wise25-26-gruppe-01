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
import { type Canteen, type Meal, type BusinessHour } from '@/services/mensaApi';
import { MealCard } from '@/components/MealCard';
import { Colors } from '@/constants/theme';
import { useLocation, calculateDistance, formatDistance } from '@/hooks/useLocation';
import { useGoogleRatings } from '@/hooks/useGoogleRatings';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useMensas } from '@/hooks/useMensas';
import { useMeals } from '@/hooks/useMeals';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';

const formatLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const getNextWeekday = (date: Date): Date => {
  const next = normalizeDate(date);
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

export default function MensaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  // Theme Colors
  const backgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#000000' }, 'background');
  const contentBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#151718' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#2C2C2E' }, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const dateChipBg = useThemeColor({ light: '#333333', dark: '#2C2C2E' }, 'background');
  const dateChipText = useThemeColor({ light: '#f5f5f5', dark: '#E0E0E0' }, 'text');

  // Standort Hook für Live-Distanz
  const { location } = useLocation();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatLocalDateKey(getNextWeekday(new Date()))
  );
  const [today, setToday] = useState<Date>(() => new Date());

  // Use Hooks for Data (Offline Support)
  // 1. Get Canteen from cached list
  const { data: allCanteens, isLoading: loadingCanteens } = useMensas({ loadingtype: 'complete' });
  const canteen = useMemo(() => 
    allCanteens?.find(c => c.id === id) || null
  , [allCanteens, id]);

  // 2. Get Meals for selected date (cached)

  // 2. Get Meals for selected date (cached)
  const { 
    data: meals, 
    isLoading: loadingMeals, 
    isError: mealsErrorState,
    error: mealsErrorObj 
  } = useMeals({ 
    canteenId: id,
    date: selectedDate 
  });

  const mealsError = mealsErrorState ? (mealsErrorObj?.message || t('mensaDetail.mealsLoadError')) : null;

  // Google Ratings Hook - lädt Ratings im Hintergrund während Meals angezeigt werden
  const { enrichCanteensWithRatings } = useGoogleRatings(canteen ? [canteen] : []);

  // Anreichere Canteen mit Google Ratings
  const enrichedCanteen = useMemo(() => {
    if (!canteen) return null;
    const enriched = enrichCanteensWithRatings([canteen])[0] || canteen;
    return enriched;
  }, [canteen, enrichCanteensWithRatings]);

  const todayKey = useMemo(() => formatLocalDateKey(today), [today]);
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-GB';

  const weekDates = useMemo(() => {
    const dates = [];
    let current = getNextWeekday(today);
    for (let index = 0; index < 5; index += 1) {
      const date = new Date(current);
      dates.push({
        key: formatLocalDateKey(date),
        weekday: date.toLocaleDateString(dateLocale, { weekday: 'short' }),
        label: date.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }),
        date,
      });
      current.setDate(current.getDate() + 1);
      while (isWeekend(current)) {
        current.setDate(current.getDate() + 1);
      }
    }
    return dates;
  }, [today, dateLocale]);

  const selectedDateInfo = useMemo(
      () => weekDates.find((day) => day.key === selectedDate),
      [weekDates, selectedDate]
  );

  const isSelectedToday = selectedDate === todayKey;
    const mealsCountLabel = mealsError
      ? t('common.notAvailable')
      : loadingMeals
          ? t('common.loading')
          : t('mensaDetail.itemsCount', { count: meals?.length || 0 });

  useEffect(() => {
    if (!weekDates.some((day) => day.key === selectedDate) && weekDates[0]) {
      setSelectedDate(weekDates[0].key);
    }
  }, [weekDates, selectedDate]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => setToday(new Date()), timeout);
    return () => clearTimeout(timer);
  }, [today]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.mensas.list({ loadingtype: 'complete' }) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.list({ canteenId: id, date: selectedDate }) })
    ]);
    setRefreshing(false);
  }, [queryClient, id, selectedDate]);

  // Rating-Anzeige
  const getRating = (): { rating: string; count: number } => {
    if (!enrichedCanteen) {
      return { rating: t('common.notAvailable'), count: 0 };
    }
    if (enrichedCanteen?.googleRating) {
      return {
        rating: enrichedCanteen.googleRating.toFixed(1),
        count: enrichedCanteen.googleReviewCount || 0
      };
    }
    if (enrichedCanteen?.rating) {
      return {
        rating: enrichedCanteen.rating.toFixed(1),
        count: enrichedCanteen.reviewCount || 0
      };
    }
    return { rating: t('common.notAvailable'), count: 0 };
  };

  const { rating, count: reviewCount } = getRating();

  // Berechne Distanz basierend auf Live-Standort
  const getDistance = (): string => {
    if (!location || !enrichedCanteen?.address?.geoLocation) {
      return enrichedCanteen?.address?.district || t('common.notAvailable');
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
      return t('mensaDetail.noHours');
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
      return t('mensaDetail.closed');
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
      return t('mensaDetail.closed');
    }
    return t('mensaDetail.hoursFormat', { open: hour.openAt, close: hour.closeAt });
  };

  // Loading State
  if (loadingCanteens && !canteen) {
    return (
        <View style={[styles.centerContainer, { backgroundColor, paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={[styles.loadingText, { color: subTextColor }]}>{t('common.loading')}</Text>
        </View>
    );
  }

  // Error State
  if (!loadingCanteens && !canteen) {
    return (
        <View style={[styles.centerContainer, { backgroundColor, paddingTop: insets.top }]}>
          <Ionicons name="alert-circle-outline" size={48} color="#E57373" />
          <Text style={[styles.errorText, { color: textColor }]}>{canteenError || t('mensaDetail.notFound')}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>{t('common.goBack')}</Text>
          </Pressable>
        </View>
    );
  }

  return (
      <View style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

        {/* Sticky Header - UniEats Logo centered with Back Button */}
        <View style={[styles.header, { backgroundColor: contentBackgroundColor, borderColor: borderColor, paddingTop: insets.top + 8 }]}>
          <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={10}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <View style={styles.logoContainer}>
            <Image
                source={require('@/assets/images/Schriftzug_rmbg.png')}
                style={styles.headerLogo}
                contentFit="contain"
                contentPosition="center"
            />
          </View>
          {/* Empty view to balance the header and keep logo centered */}
          <View style={styles.backButton} />
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
                  !loadingMeals && !mealsError && (!meals || meals.length === 0) && styles.heroImageClosed
                ]}
                contentFit="cover"
                transition={500}
            />
            {/* Closed Overlay when no meals available (nicht während loading) */}
            {!loadingMeals && !mealsError && (!meals || meals.length === 0) && (
                <View style={styles.closedOverlay}>
                  <View style={styles.closedBadge}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.closedBadgeText}>
                      {isSelectedToday ? t('mensaDetail.closedToday') : t('mensaDetail.closed')}
                    </Text>
                  </View>
                </View>
            )}
          </View>

          {/* Mensa Info - IMMER anzeigen */}
          <View style={[styles.infoContainer, { backgroundColor: contentBackgroundColor, borderBottomColor: borderColor }]}>
            <Text style={[styles.mensaName, { color: textColor }]}>{enrichedCanteen?.name || t('common.loading')}</Text>

            <View style={styles.metaRow}>
              {/* Rating */}
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color="#FFCC00" />
                <Text style={[styles.metaText, { color: subTextColor }]}>
                  <Text style={[styles.ratingText, { color: textColor }]}>{rating}</Text>
                  <Text style={styles.reviewCount}> ({reviewCount})</Text>
                </Text>
              </View>

              {enrichedCanteen && (
                  <>
                    <Text style={[styles.metaSeparator, { color: borderColor }]}>•</Text>

                    {/* Distance - Live location based */}
                    <View style={styles.metaItem}>
                      <Ionicons name="location-sharp" size={16} color={Colors.light.tint} />
                      <Text style={[styles.metaText, { color: subTextColor }]}>{getDistance()}</Text>
                    </View>

                    <Text style={[styles.metaSeparator, { color: borderColor }]}>•</Text>

                    {/* Opening Hours */}
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={iconColor} />
                      <Text style={[styles.metaText, { color: subTextColor }]}>{getTodayOpeningHours()}</Text>
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
              style={[styles.datePickerContainer, { backgroundColor: contentBackgroundColor, borderBottomColor: borderColor }]}
          >
            {weekDates.map((day) => {
              const isSelected = day.key === selectedDate;
              return (
                  <Pressable
                      key={day.key}
                      onPress={() => setSelectedDate(day.key)}
                      style={[
                        styles.dateChip,
                        { backgroundColor: isSelected ? Colors.light.tint : dateChipBg },
                        isSelected && styles.dateChipActive
                      ]}
                  >
                    <Text style={[
                      styles.dateChipDay,
                      { color: isSelected ? '#fff' : dateChipText },
                      isSelected && styles.dateChipTextActive
                    ]}>
                      {day.weekday}
                    </Text>
                    <Text style={[
                      styles.dateChipDate,
                      { color: isSelected ? '#e0e0e0' : subTextColor },
                      isSelected && styles.dateChipTextActive
                    ]}>
                      {day.label}
                    </Text>
                  </Pressable>
              )})}
          </ScrollView>

          {/* Date Title */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {isSelectedToday
                  ? t('mensaDetail.today')
                  : selectedDateInfo
                      ? `${selectedDateInfo.weekday}, ${selectedDateInfo.label}`
                      : t('mensaDetail.dishes')}
            </Text>
            <Text style={[styles.sectionCount, { color: subTextColor }]}>
              {mealsCountLabel}
            </Text>
          </View>

          {/* Show Closed state or meal list */}
          {loadingMeals ? (
              /* Loading State */
              <View style={styles.closedState}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={[styles.closedTitle, { color: subTextColor }]}>{t('mensaDetail.loadingDishes')}</Text>
              </View>
          ) : mealsError ? (
              <View style={styles.closedState}>
                <Ionicons name="alert-circle-outline" size={48} color="#E57373" />
                <Text style={[styles.closedTitle, { color: textColor }]}>{t('mensaDetail.dishesLoadError')}</Text>
                <Text style={[styles.closedSubtitle, { color: subTextColor }]}>{mealsError}</Text>
              </View>
          ) : !meals || meals.length === 0 ? (
              /* Closed State - No meals available today */
              <View style={styles.closedState}>
                <View style={[styles.closedIconContainer, { backgroundColor: colorScheme === 'dark' ? '#331010' : '#FFEBEE' }]}>
                  <Ionicons name="time-outline" size={64} color="#E57373" />
                </View>
                <Text style={[styles.closedTitle, { color: textColor }]}>
                  {isSelectedToday ? t('mensaDetail.closedToday') : t('mensaDetail.closed')}
                </Text>
                <Text style={[styles.closedSubtitle, { color: subTextColor }]}>
                  {t('mensaDetail.noDishes')}
                </Text>
                <Text style={[styles.closedHint, { color: subTextColor }]}>
                  {t('mensaDetail.tryAnotherDate')}
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
                              canteenId: enrichedCanteen?.id || id || '',
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
    includeFontPadding: false,
  },
  errorText: {
    marginTop: 12,
    fontFamily: 'GoogleSans-Regular',
    fontSize: 16,
    color: '#E57373',
    textAlign: 'center',
    includeFontPadding: false,
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
    includeFontPadding: false,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
  },
  backButton: {
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
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  ratingText: {
    fontFamily: 'GoogleSans-Bold',
    color: '#333',
    includeFontPadding: false,
  },
  reviewCount: {
    color: Colors.light.tint,
    includeFontPadding: false,
  },
  metaSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
    fontSize: 14,
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  dateChipDate: {
    marginTop: 2,
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
    color: '#e0e0e0',
    includeFontPadding: false,
  },
  dateChipTextActive: {
    color: '#fff',
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  sectionCount: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
    includeFontPadding: false,
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
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  closedSubtitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    includeFontPadding: false,
  },
  closedHint: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    includeFontPadding: false,
  },
});


