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
import { useProfile } from '@/contexts/ProfileContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { 
  translateCategory, 
  translateBadge, 
  translateAllergen, 
  translateAdditive,
  translatePriceType 
} from '@/utils/translations';
import { getPriceTypeKeyForStatus, selectPriceForStatus } from '@/utils/priceHelpers';
import { useTranslation } from '@/hooks/useTranslation';

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

const ALLERGEN_CATEGORY_KEYS: Record<string, string> = {
  Cereals: 'allergenCategories.cereals',
  Dairy: 'allergenCategories.dairy',
  'Animal Products': 'allergenCategories.animalProducts',
  'Fish & Seafood': 'allergenCategories.fishSeafood',
  'Nuts & Seeds': 'allergenCategories.nutsSeeds',
  Legumes: 'allergenCategories.legumes',
  Vegetables: 'allergenCategories.vegetables',
  Spices: 'allergenCategories.spices',
  Additives: 'allergenCategories.additives',
  Other: 'allergenCategories.other',
};

/**
 * Generiert eine Bild-URL für das Meal basierend auf Name und Kategorie.
 * Priorisiert:
 * 1. Eindeutige Formen/Kategorien (Suppe, Salat, Dessert...)
 * 2. Klare Hauptgerichte (Pizza, Burger...)
 * 3. Spezifische Zutaten (Schnitzel, Curry...)
 */
const getMealImage = (name: string, category?: string): string => {
  // Suche in Name UND Kategorie für bessere Treffer (Partial Match)
  const searchText = `${name} ${category || ''}`.toLowerCase();
  
  // Die Reihenfolge ist wichtig! Zuerst nach eindeutigen Kategorien suchen (z.B. Suppe),
  // damit "Curry-Suppe" als Suppe erkannt wird und nicht als Curry.
  const imageMap: Record<string, string> = {
    // 1. Eindeutige Formen/Kategorien (höchste Priorität)
    'suppe': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=160&h=160&fit=crop',
    'stew': 'https://images.unsplash.com/photo-1591386767153-987783380885?w=160&h=160&fit=crop',
    'eintopf': 'https://images.unsplash.com/photo-1608500218987-0f2b3be34b47?w=160&h=160&fit=crop',
    'salat': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&h=160&fit=crop',
    'bowl': 'https://images.unsplash.com/photo-1602881917445-0b1ba001addf?w=160&h=160&fit=crop',
    'kuchen': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&h=160&fit=crop',
    'pudding': 'https://images.unsplash.com/photo-1734671223988-20df071ab200?w=160&h=160&fit=crop',
    'joghurt': 'https://images.unsplash.com/photo-1564149503905-7fef56abc1f2?w=160&h=160&fit=crop',
    'smoothie': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=160&h=160&fit=crop',

    // 2. Klare Hauptgerichte
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&h=160&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=160&h=160&fit=crop',
    'spaghetti': 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=160&h=160&fit=crop',
    'tortellini': 'https://images.unsplash.com/photo-1628885405379-5d58de03edb0?w=160&h=160&fit=crop',
    'lasagne': 'https://plus.unsplash.com/premium_photo-1671559021023-3da68c12aeed?w=160&h=160&fit=crop',
    'gnocchi': 'https://images.unsplash.com/photo-1710532767837-bddfa38b5736?w=160&h=160&fit=crop',
    'pommes': 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=160&h=160&fit=crop',
    'fries': 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=160&h=160&fit=crop',
    'dessert': 'https://plus.unsplash.com/premium_photo-1678715022988-417bbb94e3df?w=160&h=160&fit=crop',

    // 3. Spezifische Zutaten & Gerichte (wird nur geprüft, wenn oben nichts gefunden)
    'schnitzel': 'https://images.unsplash.com/photo-1560611588-163f295eb145?w=160&h=160&fit=crop',
    'steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=160&h=160&fit=crop',
    'wurst': 'https://images.unsplash.com/photo-1695089028198-80245e2f5d06?w=160&h=160&fit=crop',
    'curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=160&h=160&fit=crop',
    'wok': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
    'reis': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
    'fisch': 'https://plus.unsplash.com/premium_photo-1683707120330-603d9963cb02?w=160&h=160&fit=crop',
    'braten': 'https://images.unsplash.com/photo-1581073766947-e8f3ef5393a4?w=160&h=160&fit=crop',
    'gulasch': 'https://plus.unsplash.com/premium_photo-1669687759693-52ba5f9fa7a8?w=160&h=160&fit=crop',
    'falafel': 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb8?w=160&h=160&fit=crop',
    'grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=160&h=160&fit=crop',
    'auflauf': 'https://images.unsplash.com/photo-1645453014403-4ad5170a386c?w=160&h=160&fit=crop',
    'pfanne': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
  };
  
  for (const [key, url] of Object.entries(imageMap)) {
    if (searchText.includes(key)) {
      return url;
    }
  }
  
  // 4. Fallback basierend auf allgemeinen Kategorien
  if (searchText.includes('vegan') || searchText.includes('vegetarisch')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop';
  }
  
  // Default Fallback
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop';
};

/**
 * Gets the student price from prices
 */
/**
 * All prices formatted
 */
const getAllPrices = (prices?: { priceType: string; price: number }[]): { type: string; value: number; rawType: string }[] => {
  if (!prices || prices.length === 0) return [];
  return prices.map(p => ({
    type: translatePriceType(p.priceType),
    value: p.price,
    rawType: p.priceType,
  }));
};

export default function MealDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { profile } = useProfile();
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
    canteenId?: string;
  }>();
  const insets = useSafeAreaInsets();
  
  // Theme Colors
  const backgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#000000' }, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
  const textColor = useThemeColor({ light: '#333333', dark: '#FFFFFF' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');
  const borderColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'border');
  const allergenBg = useThemeColor({ light: '#FFF8E1', dark: '#2C1A05' }, 'background');
  const allergenBorder = useThemeColor({ light: '#FFE082', dark: '#4D3300' }, 'border');
  const allergenTitleColor = useThemeColor({ light: '#E65100', dark: '#FFB347' }, 'text');
  const envItemBg = useThemeColor({ light: '#FAFAFA', dark: '#2C2C2E' }, 'background');

  // Favoriten-Kontext
  const { isFavoriteMeal, toggleFavoriteMeal } = useFavoritesContext();
  const canteenId = params.canteenId ?? '';
  const isFavorite = canteenId ? isFavoriteMeal(params.id, canteenId) : false;
  
  // Parse die Daten aus den Params
  const meal = useMemo(() => {
    const prices = params.prices ? JSON.parse(params.prices) : [];
    const additives = params.additives ? JSON.parse(params.additives) : [];
    const badges = params.badges ? JSON.parse(params.badges) : [];
    
    return {
      id: params.id,
      name: params.name || t('mealDetail.fallbackName'),
      category: params.category,
      prices,
      additives,
      badges,
      co2Bilanz: params.co2Bilanz ? parseFloat(params.co2Bilanz) : undefined,
      waterBilanz: params.waterBilanz ? parseFloat(params.waterBilanz) : undefined,
    };
  }, [params, t]);
  
  const canteenName = params.canteenName || '';
  const imageUrl = useMemo(() => getMealImage(meal.name, meal.category), [meal.name, meal.category]);
  const allPrices = useMemo(() => getAllPrices(meal.prices), [meal.prices, locale]);
  const selectedPrice = useMemo(
    () => selectPriceForStatus(meal.prices, profile?.status),
    [meal.prices, profile?.status]
  );
  const selectedPriceText = useMemo(
    () =>
      selectedPrice.price !== null
        ? t('common.priceFormat', { value: selectedPrice.price.toFixed(2) })
        : t('common.priceUnavailable'),
    [selectedPrice.price, t]
  );
  const priceTypeLabel = t(getPriceTypeKeyForStatus(profile?.status));
  
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
    <View style={[styles.container, { backgroundColor }]}>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Name & Canteen */}
        <View style={styles.titleSection}>
          <Text style={[styles.mealName, { color: textColor }]}>{meal.name}</Text>
          {canteenName && (
            <View style={styles.canteenRow}>
              <Ionicons name="restaurant-outline" size={16} color={subTextColor} />
              <Text style={[styles.canteenName, { color: subTextColor }]}>{canteenName}</Text>
            </View>
          )}
        </View>
        
        {/* Price Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('mealDetail.pricesTitle')}</Text>
          <View style={styles.priceGrid}>
            {allPrices.length > 0 ? (
              allPrices.map((price, index) => (
                <View key={index} style={[styles.priceItem, { borderBottomColor: borderColor }]}>
                  <Text style={[styles.priceType, { color: subTextColor }]}>{price.type}</Text>
                  <Text style={[
                    styles.priceValue,
                    { color: textColor },
                    selectedPrice.priceType === price.rawType && styles.priceValueHighlight
                  ]}>
                    {t('common.priceFormat', { value: price.value.toFixed(2) })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noDataText, { color: subTextColor }]}>{t('mealDetail.noPrices')}</Text>
            )}
          </View>
        </View>
        
        {/* Badges */}
        {meal.badges && meal.badges.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('mealDetail.propertiesTitle')}</Text>
            <View style={styles.badgeGrid}>
              {meal.badges.map((badge: MealBadge, index: number) => (
                <View key={index} style={[styles.propertyBadge, { backgroundColor: Colors.light.tint + '15' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.light.tint} />
                  <Text style={[styles.propertyBadgeText, { color: textColor }]}>{translateBadge(badge.name)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Allergens - Highlighted */}
        {allergens.length > 0 && (
          <View style={[styles.section, { backgroundColor: allergenBg, borderColor: allergenBorder, borderWidth: 1 }]}>
            <View style={styles.allergenHeader}>
              <Ionicons name="warning" size={22} color="#FF9800" />
              <Text style={[styles.allergenTitle, { color: allergenTitleColor }]}>{t('mealDetail.allergensTitle')}</Text>
            </View>
            <Text style={[styles.allergenSubtitle, { color: subTextColor }]}>
              {t('mealDetail.allergensSubtitle')}
            </Text>
            <View style={styles.allergenGrid}>
              {allergens.map((allergen, index) => {
                const info = getAllergenInfo(allergen.text);
                const categoryKey = ALLERGEN_CATEGORY_KEYS[info.category] ?? 'allergenCategories.other';
                return (
                  <View key={index} style={[styles.allergenItem, { backgroundColor: cardBackgroundColor, borderLeftColor: info.color }]}>
                    <View style={[styles.allergenIconContainer, { backgroundColor: info.color + '20' }]}>
                      <Ionicons name={info.icon as any} size={20} color={info.color} />
                    </View>
                    <View style={styles.allergenTextContainer}>
                      <Text style={[styles.allergenName, { color: textColor }]}>{translateAllergen(allergen.text)}</Text>
                      <Text style={[styles.allergenCategory, { color: subTextColor }]}>{t(categoryKey)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Additives */}
        {additives.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('mealDetail.additivesTitle')}</Text>
            <View style={styles.additiveList}>
              {additives.map((additive, index) => (
                <View key={index} style={[styles.additiveItem, { borderBottomColor: borderColor }]}>
                  <Ionicons name="information-circle-outline" size={18} color={subTextColor} />
                  <Text style={[styles.additiveText, { color: subTextColor }]}>{translateAdditive(additive.text)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* No Allergens/Additives */}
        {allergens.length === 0 && additives.length === 0 && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <View style={styles.noAllergensContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.light.tint} />
              <Text style={[styles.noAllergensTitle, { color: textColor }]}>{t('mealDetail.noAllergensTitle')}</Text>
              <Text style={[styles.noAllergensSubtitle, { color: subTextColor }]}>
                {t('mealDetail.noAllergensSubtitle')}
              </Text>
            </View>
          </View>
        )}
        
        {/* Environmental Impact */}
        {(meal.co2Bilanz || meal.waterBilanz) && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('mealDetail.environmentTitle')}</Text>
            <View style={styles.environmentGrid}>
              {meal.co2Bilanz && (
                <View style={[styles.environmentItem, { backgroundColor: envItemBg }]}>
                  <View style={[styles.environmentIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="leaf" size={24} color="#4CAF50" />
                  </View>
                  <Text style={[styles.environmentLabel, { color: subTextColor }]}>{t('mealDetail.co2Footprint')}</Text>
                  <Text style={[styles.environmentValue, { color: textColor }]}>{meal.co2Bilanz.toFixed(0)}g</Text>
                </View>
              )}
              {meal.waterBilanz && (
                <View style={[styles.environmentItem, { backgroundColor: envItemBg }]}>
                  <View style={[styles.environmentIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="water" size={24} color="#2196F3" />
                  </View>
                  <Text style={[styles.environmentLabel, { color: subTextColor }]}>{t('mealDetail.waterFootprint')}</Text>
                  <Text style={[styles.environmentValue, { color: textColor }]}>{meal.waterBilanz.toFixed(0)}L</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Bottom Bar with Price */}
      <View style={[styles.bottomBar, { backgroundColor: cardBackgroundColor, borderTopColor: borderColor, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomPriceContainer}>
          <Text style={[styles.bottomPriceLabel, { color: subTextColor }]}>
            {t('mealDetail.priceLabel', { type: priceTypeLabel })}
          </Text>
          <Text style={styles.bottomPrice}>{selectedPriceText}</Text>
        </View>
        <Pressable 
          style={styles.favoriteButtonLarge}
          onPress={() => {
            if (canteenId) {
              toggleFavoriteMeal(params.id, canteenId);
            }
          }}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? t('mealDetail.saved') : t('mealDetail.save')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    includeFontPadding: false,
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
    marginBottom: 8,
    includeFontPadding: false,
  },
  canteenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  canteenName: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 15,
    includeFontPadding: false,
  },
  
  // Sections
  section: {
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
    marginBottom: 16,
    includeFontPadding: false,
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
  },
  priceType: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 15,
    includeFontPadding: false,
  },
  priceValue: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    includeFontPadding: false,
  },
  priceValueHighlight: {
    color: Colors.light.tint,
    fontSize: 18,
  },
  noDataText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
    includeFontPadding: false,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  propertyBadgeText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    includeFontPadding: false,
  },
  
  // Allergens
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  allergenTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    includeFontPadding: false,
  },
  allergenSubtitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    marginBottom: 16,
    includeFontPadding: false,
  },
  allergenGrid: {
    gap: 12,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    includeFontPadding: false,
  },
  allergenCategory: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    marginTop: 2,
    includeFontPadding: false,
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
  },
  additiveText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    flex: 1,
    includeFontPadding: false,
  },
  
  // No Allergens
  noAllergensContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAllergensTitle: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 16,
    marginTop: 12,
    includeFontPadding: false,
  },
  noAllergensSubtitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    includeFontPadding: false,
  },
  
  // Environment
  environmentGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  environmentItem: {
    flex: 1,
    alignItems: 'center',
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
    marginBottom: 4,
    includeFontPadding: false,
  },
  environmentValue: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    includeFontPadding: false,
  },
  
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    
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
    includeFontPadding: false,
  },
  bottomPrice: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 24,
    color: Colors.light.tint,
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
});

