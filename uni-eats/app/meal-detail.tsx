import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  Pressable, 
  Platform,
  StatusBar
} from 'react-native';
import { useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Meal, type MealAdditive, type MealBadge } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { 
  translateCategory, 
  translateBadge, 
  translateAllergen, 
  translateAdditive,
  translatePriceType 
} from '@/utils/translations';

// Allergen categories with icons and colors
const ALLERGEN_INFO: Record<string, { icon: string; color: string; category: string }> = {
  // Main allergens
  'Gluten': { icon: 'nutrition', color: '#D4A574', category: 'Cereals' },
  'Weizen': { icon: 'nutrition', color: '#D4A574', category: 'Cereals' },
  'Roggen': { icon: 'nutrition', color: '#D4A574', category: 'Cereals' },
  'Gerste': { icon: 'nutrition', color: '#D4A574', category: 'Cereals' },
  'Hafer': { icon: 'nutrition', color: '#D4A574', category: 'Cereals' },
  'Dinkel': { icon: 'nutrition', color: '#D4A574', category: 'Cereals' },
  'Milch': { icon: 'water', color: '#87CEEB', category: 'Dairy' },
  'Laktose': { icon: 'water', color: '#87CEEB', category: 'Dairy' },
  'Ei': { icon: 'ellipse', color: '#FFD93D', category: 'Animal Products' },
  'Eier': { icon: 'ellipse', color: '#FFD93D', category: 'Animal Products' },
  'Fisch': { icon: 'fish', color: '#4A90D9', category: 'Fish & Seafood' },
  'Krebstiere': { icon: 'fish', color: '#E74C3C', category: 'Fish & Seafood' },
  'Weichtiere': { icon: 'fish', color: '#9B59B6', category: 'Fish & Seafood' },
  'Erdnüsse': { icon: 'leaf', color: '#C4A35A', category: 'Nuts & Seeds' },
  'Erdnuss': { icon: 'leaf', color: '#C4A35A', category: 'Nuts & Seeds' },
  'Schalenfrüchte': { icon: 'leaf', color: '#8B4513', category: 'Nuts & Seeds' },
  'Nüsse': { icon: 'leaf', color: '#8B4513', category: 'Nuts & Seeds' },
  'Mandeln': { icon: 'leaf', color: '#8B4513', category: 'Nuts & Seeds' },
  'Haselnüsse': { icon: 'leaf', color: '#8B4513', category: 'Nuts & Seeds' },
  'Walnüsse': { icon: 'leaf', color: '#8B4513', category: 'Nuts & Seeds' },
  'Cashewnüsse': { icon: 'leaf', color: '#8B4513', category: 'Nuts & Seeds' },
  'Pistazien': { icon: 'leaf', color: '#90EE90', category: 'Nuts & Seeds' },
  'Sesam': { icon: 'ellipse', color: '#DEB887', category: 'Nuts & Seeds' },
  'Soja': { icon: 'leaf', color: '#98D8C8', category: 'Legumes' },
  'Sellerie': { icon: 'leaf', color: '#7CB342', category: 'Vegetables' },
  'Senf': { icon: 'flame', color: '#FFB300', category: 'Spices' },
  'Lupine': { icon: 'flower', color: '#BA68C8', category: 'Legumes' },
  'Schwefeldioxid': { icon: 'flask', color: '#78909C', category: 'Additives' },
  'Sulfite': { icon: 'flask', color: '#78909C', category: 'Additives' },
};

/**
 * Generates an image URL for the meal
 */
const getMealImage = (category?: string): string => {
  const cat = category?.toLowerCase() || 'food';
  
  const colorMap: Record<string, string> = {
    'salate': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'suppen': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
    'hauptgerichte': 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop',
    'desserts': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    'beilagen': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  };
  
  return colorMap[cat] || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop';
};

/**
 * Gets the student price from prices
 */
const getStudentPrice = (prices?: { priceType: string; price: number }[]): string => {
  if (!prices || prices.length === 0) return '–';
  const studentPrice = prices.find(p => p.priceType === 'Studierende');
  if (studentPrice) {
    return `€${studentPrice.price.toFixed(2)}`;
  }
  return `€${prices[0].price.toFixed(2)}`;
};

/**
 * All prices formatted
 */
const getAllPrices = (prices?: { priceType: string; price: number }[]): { type: string; price: string }[] => {
  if (!prices || prices.length === 0) return [];
  return prices.map(p => ({
    type: translatePriceType(p.priceType),
    price: `€${p.price.toFixed(2)}`
  }));
};

export default function MealDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    id: string;
    name: string;
    category: string;
    prices: string;
    additives: string;
    badges: string;
    co2Bilanz: string;
    waterBilanz: string;
    canteenName: string;
  }>();
  const insets = useSafeAreaInsets();
  
  // Favoriten-Kontext
  const { isFavoriteMeal, toggleFavoriteMeal } = useFavoritesContext();
  const isFavorite = isFavoriteMeal(params.id);
  
  // Parse die Daten aus den Params
  const meal = useMemo(() => {
    const prices = params.prices ? JSON.parse(params.prices) : [];
    const additives = params.additives ? JSON.parse(params.additives) : [];
    const badges = params.badges ? JSON.parse(params.badges) : [];
    
    return {
      id: params.id,
      name: params.name || 'Gericht',
      category: params.category,
      prices,
      additives,
      badges,
      co2Bilanz: params.co2Bilanz ? parseFloat(params.co2Bilanz) : undefined,
      waterBilanz: params.waterBilanz ? parseFloat(params.waterBilanz) : undefined,
    };
  }, [params]);
  
  const canteenName = params.canteenName || '';
  const imageUrl = useMemo(() => getMealImage(meal.category), [meal.category]);
  const allPrices = useMemo(() => getAllPrices(meal.prices), [meal.prices]);
  const studentPrice = useMemo(() => getStudentPrice(meal.prices), [meal.prices]);
  
  // Allergene und Zusatzstoffe kategorisieren
  const { allergens, additives } = useMemo(() => {
    const allergenList: MealAdditive[] = [];
    const additiveList: MealAdditive[] = [];
    
    meal.additives?.forEach((additive: MealAdditive) => {
      // Prüfe ob es ein bekanntes Allergen ist
      const isAllergen = Object.keys(ALLERGEN_INFO).some(key => 
        additive.text.toLowerCase().includes(key.toLowerCase())
      );
      
      if (isAllergen) {
        allergenList.push(additive);
      } else {
        additiveList.push(additive);
      }
    });
    
    return { allergens: allergenList, additives: additiveList };
  }, [meal.additives]);
  
  // Find allergen info for an additive
  const getAllergenInfo = (text: string) => {
    for (const [key, info] of Object.entries(ALLERGEN_INFO)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return info;
      }
    }
    return { icon: 'alert-circle', color: '#FF9800', category: 'Other' };
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Hero Image mit Overlay */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.heroOverlay} />
        
        {/* Header Buttons */}
        <View style={[styles.headerButtons, { paddingTop: insets.top + 8 }]}>
          <Pressable 
            style={styles.headerButton} 
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </View>
        
        {/* Category Badge */}
        {meal.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{translateCategory(meal.category)}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Name & Canteen */}
        <View style={styles.titleSection}>
          <Text style={styles.mealName}>{meal.name}</Text>
          {canteenName && (
            <View style={styles.canteenRow}>
              <Ionicons name="restaurant-outline" size={16} color="#666" />
              <Text style={styles.canteenName}>{canteenName}</Text>
            </View>
          )}
        </View>
        
        {/* Price Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prices</Text>
          <View style={styles.priceGrid}>
            {allPrices.length > 0 ? (
              allPrices.map((price, index) => (
                <View key={index} style={styles.priceItem}>
                  <Text style={styles.priceType}>{price.type}</Text>
                  <Text style={[
                    styles.priceValue,
                    price.type === 'Students' && styles.priceValueHighlight
                  ]}>
                    {price.price}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No price information available</Text>
            )}
          </View>
        </View>
        
        {/* Badges */}
        {meal.badges && meal.badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Properties</Text>
            <View style={styles.badgeGrid}>
              {meal.badges.map((badge: MealBadge, index: number) => (
                <View key={index} style={styles.propertyBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.light.tint} />
                  <Text style={styles.propertyBadgeText}>{translateBadge(badge.name)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Allergens - Highlighted */}
        {allergens.length > 0 && (
          <View style={[styles.section, styles.allergenSection]}>
            <View style={styles.allergenHeader}>
              <Ionicons name="warning" size={22} color="#FF9800" />
              <Text style={styles.allergenTitle}>Allergens</Text>
            </View>
            <Text style={styles.allergenSubtitle}>
              This dish contains the following allergens:
            </Text>
            <View style={styles.allergenGrid}>
              {allergens.map((allergen, index) => {
                const info = getAllergenInfo(allergen.text);
                return (
                  <View key={index} style={[styles.allergenItem, { borderLeftColor: info.color }]}>
                    <View style={[styles.allergenIconContainer, { backgroundColor: info.color + '20' }]}>
                      <Ionicons name={info.icon as any} size={20} color={info.color} />
                    </View>
                    <View style={styles.allergenTextContainer}>
                      <Text style={styles.allergenName}>{translateAllergen(allergen.text)}</Text>
                      <Text style={styles.allergenCategory}>{info.category}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Additives */}
        {additives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additives</Text>
            <View style={styles.additiveList}>
              {additives.map((additive, index) => (
                <View key={index} style={styles.additiveItem}>
                  <Ionicons name="information-circle-outline" size={18} color="#666" />
                  <Text style={styles.additiveText}>{translateAdditive(additive.text)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* No Allergens/Additives */}
        {allergens.length === 0 && additives.length === 0 && (
          <View style={styles.section}>
            <View style={styles.noAllergensContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.light.tint} />
              <Text style={styles.noAllergensTitle}>No allergens listed</Text>
              <Text style={styles.noAllergensSubtitle}>
                No allergens or additives are listed for this dish.
              </Text>
            </View>
          </View>
        )}
        
        {/* Environmental Impact */}
        {(meal.co2Bilanz || meal.waterBilanz) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environmental Impact</Text>
            <View style={styles.environmentGrid}>
              {meal.co2Bilanz && (
                <View style={styles.environmentItem}>
                  <View style={[styles.environmentIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="leaf" size={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.environmentLabel}>CO₂ Footprint</Text>
                  <Text style={styles.environmentValue}>{meal.co2Bilanz.toFixed(0)}g</Text>
                </View>
              )}
              {meal.waterBilanz && (
                <View style={styles.environmentItem}>
                  <View style={[styles.environmentIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="water" size={24} color="#2196F3" />
                  </View>
                  <Text style={styles.environmentLabel}>Water Footprint</Text>
                  <Text style={styles.environmentValue}>{meal.waterBilanz.toFixed(0)}L</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Bottom Bar with Price */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Student Price</Text>
          <Text style={styles.bottomPrice}>{studentPrice}</Text>
        </View>
        <Pressable 
          style={styles.favoriteButtonLarge}
          onPress={() => toggleFavoriteMeal(params.id)}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#fff" : "#fff"} 
          />
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  // Hero Image
  heroContainer: {
    height: 280,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 14,
    color: '#fff',
  },
  
  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  
  // Title Section
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mealName: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 26,
    color: '#333',
    marginBottom: 8,
  },
  canteenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  canteenName: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 15,
    color: '#666',
  },
  
  // Sections
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  
  // Prices
  priceGrid: {
    gap: 12,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceType: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 15,
    color: '#666',
  },
  priceValue: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: '#333',
  },
  priceValueHighlight: {
    color: Colors.light.tint,
    fontSize: 18,
  },
  noDataText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
  },
  
  // Badges/Properties
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  propertyBadgeText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#333',
  },
  
  // Allergens
  allergenSection: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  allergenTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    color: '#E65100',
  },
  allergenSubtitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  allergenGrid: {
    gap: 12,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    gap: 14,
  },
  allergenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergenTextContainer: {
    flex: 1,
  },
  allergenName: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 15,
    color: '#333',
  },
  allergenCategory: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  
  // Additives
  additiveList: {
    gap: 10,
  },
  additiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  additiveText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  
  // No Allergens
  noAllergensContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAllergensTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: '#333',
    marginTop: 12,
  },
  noAllergensSubtitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Environment
  environmentGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  environmentItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  environmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  environmentLabel: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  environmentValue: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    color: '#333',
  },
  
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    color: '#666',
  },
  bottomPrice: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 24,
    color: Colors.light.tint,
  },
  favoriteButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  favoriteButtonText: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    color: '#fff',
  },
});
