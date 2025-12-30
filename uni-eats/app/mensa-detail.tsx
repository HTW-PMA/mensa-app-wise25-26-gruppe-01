import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  ActivityIndicator, 
  Pressable, 
  RefreshControl,
  Platform,
  StatusBar
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mensaApi, type Canteen, type Meal } from '@/services/mensaApi';
import { MealCard } from '@/components/MealCard';
import { Colors } from '@/constants/theme';
import { formatDistance } from '@/hooks/useLocation';

// Kategorie-Definitionen mit deutschen/englischen Namen
const CATEGORY_MAP: Record<string, string> = {
  'all': 'All',
  'Hauptgerichte': 'Main Dishes',
  'Salate': 'Salads',
  'Suppen': 'Soups',
  'Desserts': 'Desserts',
  'Beilagen': 'Sides',
  'Getränke': 'Drinks',
  'Aktionen': 'Specials',
};

export default function MensaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  // State
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Daten laden
  const loadData = async () => {
    if (!id) return;
    
    try {
      setError(null);
      
      // Parallel laden
      const [canteensData, mealsData] = await Promise.all([
        mensaApi.getCanteens({ loadingtype: 'complete' }),
        mensaApi.getMeals({ canteenId: id, loadingtype: 'complete' }),
      ]);
      
      const foundCanteen = canteensData.find(c => c.id === id);
      setCanteen(foundCanteen || null);
      setMeals(mealsData);
    } catch (err) {
      console.error('Error loading mensa details:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [id]);

  // Kategorien aus Meals extrahieren
  const categories = useMemo(() => {
    const cats = [...new Set(meals.map(m => m.category).filter(Boolean))] as string[];
    return ['all', ...cats];
  }, [meals]);

  // Meals nach Kategorie filtern
  const filteredMeals = useMemo(() => {
    if (selectedCategory === 'all') return meals;
    return meals.filter(m => m.category === selectedCategory);
  }, [meals, selectedCategory]);

  // Rating-Anzeige
  const getRating = (): { rating: string; count: number } => {
    if (canteen?.googleRating) {
      return { 
        rating: canteen.googleRating.toFixed(1), 
        count: canteen.googleReviewCount || 0 
      };
    }
    if (canteen?.rating) {
      return { 
        rating: canteen.rating.toFixed(1), 
        count: canteen.reviewCount || 0 
      };
    }
    // Mock fallback
    const hash = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return { 
      rating: (3.5 + (hash % 15) / 10).toFixed(1), 
      count: 50 + (hash % 200) 
    };
  };

  const { rating, count: reviewCount } = getRating();

  // Kategorie-Titel für Anzeige
  const getCategoryTitle = (cat: string): string => {
    if (cat === 'all') return 'All Dishes';
    return CATEGORY_MAP[cat] || cat;
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Error State
  if (error || !canteen) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#E57373" />
        <Text style={styles.errorText}>{error || 'Mensa not found'}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {canteen.name}
        </Text>
        <View style={styles.headerSpacer} />
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
            style={[styles.heroImage, meals.length === 0 && styles.heroImageClosed]}
            contentFit="cover"
            transition={500}
          />
          {/* Closed Overlay when no meals available */}
          {meals.length === 0 && (
            <View style={styles.closedOverlay}>
              <View style={styles.closedBadge}>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.closedBadgeText}>Closed Today</Text>
              </View>
            </View>
          )}
        </View>

        {/* Mensa Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.mensaName}>{canteen.name}</Text>
          
          <View style={styles.metaRow}>
            {/* Rating */}
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#FFCC00" />
              <Text style={styles.metaText}>
                <Text style={styles.ratingText}>{rating}</Text>
                <Text style={styles.reviewCount}> ({reviewCount})</Text>
              </Text>
            </View>

            <Text style={styles.metaSeparator}>•</Text>

            {/* Distance */}
            <View style={styles.metaItem}>
              <Ionicons name="location-sharp" size={16} color={Colors.light.tint} />
              <Text style={styles.metaText}>
                {canteen.distance !== undefined 
                  ? formatDistance(canteen.distance)
                  : canteen.address?.district || '–'
                }
              </Text>
            </View>

            <Text style={styles.metaSeparator}>•</Text>

            {/* Wait Time */}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>15-25 min</Text>
            </View>
          </View>
        </View>

        {/* Show Closed state or meal list */}
        {meals.length === 0 ? (
          /* Closed State - No meals available today */
          <View style={styles.closedState}>
            <View style={styles.closedIconContainer}>
              <Ionicons name="time-outline" size={64} color="#E57373" />
            </View>
            <Text style={styles.closedTitle}>Closed Today</Text>
            <Text style={styles.closedSubtitle}>
              This canteen has no dishes available for today.
            </Text>
            <Text style={styles.closedHint}>
              Check back tomorrow or try another canteen nearby.
            </Text>
          </View>
        ) : (
          /* Category Filter - only show when meals available */
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
              style={styles.categoryContainer}
            >
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}>
                    {getCategoryTitle(category)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Category Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {getCategoryTitle(selectedCategory)}
              </Text>
              <Text style={styles.sectionCount}>
                {filteredMeals.length} items
              </Text>
            </View>

            {/* Meal List */}
            <View style={styles.mealList}>
              {filteredMeals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No dishes in this category</Text>
                  <Text style={styles.emptySubtext}>
                    Try selecting a different category
                  </Text>
                </View>
              ) : (
                filteredMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onPress={() => {
                      // TODO: Navigate to meal detail
                      console.log('Meal pressed:', meal.name);
                    }}
                  />
                ))
              )}
            </View>
          </>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
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
  
  // Category Filter
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryChip: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.tint,
  },
  categoryText: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 14,
    color: '#fff',
  },
  categoryTextActive: {
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
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 4,
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#999',
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
