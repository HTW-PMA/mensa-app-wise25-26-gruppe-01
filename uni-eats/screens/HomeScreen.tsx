import {StyleSheet, ScrollView, View, Text, ActivityIndicator, Pressable, RefreshControl, Platform} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { mensaApi, type Canteen, type BusinessHour, type Meal } from '@/services/mensaApi';
import { MensaCard } from '@/components/MensaCard';
import { Colors, Fonts } from '@/constants/theme';
import { useGoogleRatings } from '@/hooks/useGoogleRatings';
import { useLocation, calculateDistance } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

// Erweiterter Canteen-Typ mit zusätzlicher Info ob heute Gerichte verfügbar sind
export interface CanteenWithMeals extends Canteen {
  hasMealsToday?: boolean;
}


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
  const { t } = useTranslation();
  const { favoriteMeals } = useFavoritesContext();
  const [canteens, setCanteens] = useState<CanteenWithMeals[]>([]);
  const [menusToday, setMenusToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Standort Hook
  const { location, loading: locationLoading } = useLocation();

  // Google Ratings Hook
  const { enrichCanteensWithRatings } = useGoogleRatings(canteens);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#333333' }, 'border');

  const loadCanteens = async () => {
    try {
      // Lade Canteens und Menüs parallel
      const [canteenData, menuResponse] = await Promise.all([
        mensaApi.getCanteens({ loadingtype: 'complete' }),
        fetch('https://mensa.gregorflachs.de/api/v1/menue?loadingtype=complete', {
          headers: { 'X-API-KEY': process.env.EXPO_PUBLIC_MENSA_API_KEY || '' }
        }).then(res => res.json()).catch(() => [])
      ]);

      // Erstelle Map mit Canteen-IDs die heute Gerichte haben
      const today = new Date().toISOString().split('T')[0];
      const canteensWithMealsToday = new Set<string>();
      
      const menusRaw = Array.isArray(menuResponse) ? menuResponse : menuResponse?.menue;
      const menus = Array.isArray(menusRaw) ? menusRaw : [];
      const menusForToday = menus.filter((menu: any) => menu.date === today);
      menusForToday.forEach((menu: any) => {
        if (menu.date === today && menu.meals && menu.meals.length > 0) {
          canteensWithMealsToday.add(menu.canteenId);
        }
      });
      setMenusToday(menusForToday);

      // Erweitere Canteens mit hasMealsToday Info
      const enrichedData = canteenData.map(canteen => ({
        ...canteen,
        hasMealsToday: canteensWithMealsToday.has(canteen.id)
      }));

      setCanteens(enrichedData);
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
        // Robuste Prüfung: Stelle sicher dass latitude/longitude valide Zahlen sind
        const rawLat = geoLoc?.latitude;
        const rawLon = geoLoc?.longitude;
        
        const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat ?? '0');
        const lon = typeof rawLon === 'number' ? rawLon : parseFloat(rawLon ?? '0');
        
        if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            lat,
            lon
          );
          return { ...canteen, distance };
        }
        return canteen;
      });
    }
    
    // Sortierung: 1. Offene mit Gerichten zuerst, 2. Nach Distanz
    enriched.sort((a, b) => {
      // Eine Mensa gilt als "closed" wenn sie keine Öffnungszeiten hat ODER keine Gerichte heute
      const aIsClosed = isCanteenClosed(a.businessDays) || a.hasMealsToday === false;
      const bIsClosed = isCanteenClosed(b.businessDays) || b.hasMealsToday === false;
      
      // Offene Mensen mit Gerichten zuerst
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

  const hasFavoriteMealAvailable = useMemo(() => {
    if (favoriteMeals.length === 0) return false;
    if (menusToday.length === 0) return false;

    const favoriteMealKeySet = new Set(
      favoriteMeals.map((favorite) => `${favorite.canteenId}::${favorite.mealId}`)
    );

    return menusToday.some((menu: any) => {
      if (!Array.isArray(menu.meals)) return false;
      return menu.meals.some((meal: any) => {
        const id =
          meal?.id ??
          meal?._id ??
          meal?.ID ??
          meal?.mealId ??
          meal?.mealID;
        const canteenId = menu?.canteenId ?? menu?.canteenID ?? menu?.canteen_id;
        if (!id || !canteenId) return false;
        return favoriteMealKeySet.has(`${String(canteenId)}::${String(id)}`);
      });
    });
  }, [menusToday, favoriteMeals]);

  return (
      <View style={[styles.container, { backgroundColor }]}>

                <View style={[styles.header, { backgroundColor, borderColor }]}>

                  <View style={styles.topBar}>

                                <View style={styles.logoContainer}>

                                  <Image
                                      source={require('@/assets/images/Schriftzug_rmbg.png')}
                                      style={styles.logo}
                                      contentFit="contain"
                                      contentPosition="left"
                                  />
                                </View>

                    <Pressable
                        onPress={() => router.push('/notifications')}
                        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
              <Ionicons name="notifications-outline" size={26} color={iconColor} />
              {hasFavoriteMealAvailable && <View style={styles.notificationBadge} />}
            </Pressable>
          </View>
        </View>

        <ScrollView

            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />
            }
        >
          <Text style={[styles.subtitle, { color: textColor }]}>
            {t('home.mensasNearYou')}
          </Text>

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    marginTop: 50,
    marginBottom:10,
    borderColor: '#f0f0f0',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    width: 200,
    height: 50,
    marginTop: -20,
    marginBottom: -20,
    marginLeft: -8,
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
    fontFamily: Fonts.bold,
    color: '#000',
  },
  subtitle: {
    paddingHorizontal: 20,

    fontFamily: Fonts.bold,
    color: '#333',
    marginTop: 15,
    ...Platform.select({
      ios: {
        marginBottom: 15,
        fontSize: 25,
      },
      android: {
        marginBottom: 1,
        fontSize: 20,
      }
    }),
  },
  scrollContent: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

