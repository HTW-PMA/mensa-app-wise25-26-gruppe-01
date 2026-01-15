import { StyleSheet, FlatList, Pressable, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SearchBar } from '@/components/SearchBar';
import { useSearch } from '@/hooks/useSearch';
import { POPULAR_SEARCHES, SearchResult } from '@/utils/searchHelpers';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useMensas } from '@/hooks/useMensas';
import { useLocation, calculateDistance } from '@/hooks/useLocation';
import { getCanteenLogo } from '@/utils/getCanteenLogo';

const POPULAR_TAG_EMOJIS: Record<string, string> = {
  'search.popularTags.vegan': '\u{1F957}',
  'search.popularTags.pasta': '\u{1F35D}',
  'search.popularTags.salad': '\u{1F957}',
  'search.popularTags.pizza': '\u{1F355}',
  'search.popularTags.soup': '\u{1F372}',
  'search.popularTags.burger': '\u{1F354}',
  'search.popularTags.asian': '\u{1F35C}',
  'search.popularTags.vegetarian': '\u{1F955}',
};

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    searchQuery,
    setSearchQuery,
    results,
    isLoading,
    isError,
    addRecentSearch,
  } = useSearch();
  const { data: mensas } = useMensas();
  const { location } = useLocation();

  const [refreshing, setRefreshing] = useState(false);
  const secondaryTextColor = useThemeColor({ light: '#666', dark: '#999' }, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const dividerColor = useThemeColor({ light: '#e5e5e5', dark: '#2a2a2a' }, 'border');

  const closestMensas = useMemo(() => {
    if (!mensas || mensas.length === 0) return [];
    if (!location) return mensas.slice(0, 2);

    const withDistance = mensas.map((canteen) => {
      const geoLoc = canteen.address?.geoLocation;
      const lat = typeof geoLoc?.latitude === 'number' ? geoLoc.latitude : parseFloat(String(geoLoc?.latitude));
      const lon = typeof geoLoc?.longitude === 'number' ? geoLoc.longitude : parseFloat(String(geoLoc?.longitude));

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

    const sorted = [...withDistance].sort((a, b) => {
      const aDistance = typeof a.distance === 'number' ? a.distance : Number.POSITIVE_INFINITY;
      const bDistance = typeof b.distance === 'number' ? b.distance : Number.POSITIVE_INFINITY;
      return aDistance - bDistance;
    });

    return sorted.slice(0, 2);
  }, [mensas, location]);

  const formatDistanceKm = (distance?: number) => {
    if (typeof distance !== 'number') return t('common.distanceUnavailable');
    return `${distance.toFixed(1)} km`;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectResult = (result: SearchResult) => {
    addRecentSearch(searchQuery);
    
    // Navigate to the appropriate screen based on result type
    if (result.type === 'mensa') {
      router.push(`/mensa-detail?id=${result.id}`);
    } else if (result.type === 'meal') {
      // Navigate to the canteen that has this meal
      // Extract canteenId from the meal data
      const meal = result.data as { canteenId?: string };
      if (meal.canteenId) {
        router.push(`/mensa-detail?id=${meal.canteenId}`);
      }
    }
  };

  const handlePopularTagPress = (tag: string) => {
    setSearchQuery(tag);
    addRecentSearch(tag);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={({ pressed }) => [
        styles.resultItem,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={() => handleSelectResult(item)}
    >
      <View style={styles.resultIcon}>
        <Ionicons
          name={item.type === 'meal' ? 'fast-food' : 'location'}
          size={20}
          color={tintColor}
        />
      </View>
      <View style={styles.resultContent}>
        <ThemedText style={styles.resultTitle}>{item.name}</ThemedText>
        {item.subtitle && (
          <ThemedText style={[styles.resultSubtitle, { color: secondaryTextColor }]}>
            {item.subtitle}
          </ThemedText>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={secondaryTextColor}
      />
    </Pressable>
  );

  const showResults = searchQuery.length > 0;
  const showEmpty = showResults && results.length === 0 && !isLoading;
  const showCurrentSection = !showResults && closestMensas.length > 0;
  const showPopularSection = !showResults;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          onClear={handleClearSearch}
          placeholder={t('search.placeholder')}
        />
      </SafeAreaView>

      {showResults ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.uniqueId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color={secondaryTextColor} />
                <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
                  {t('search.emptyTitle')}
                </ThemedText>
                <ThemedText
                  style={[styles.emptySubtext, { color: secondaryTextColor }]}
                >
                  {t('search.emptySubtitle')}
                </ThemedText>
              </View>
            ) : null
          }
          ListHeaderComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              {showCurrentSection && (
                <View style={styles.section}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    {t('search.currentTitle')}
                  </ThemedText>
                  <View style={styles.listContainer}>
                    {closestMensas.map((canteen, index) => (
                      <Pressable
                        key={canteen.id}
                        style={({ pressed }) => [
                          styles.listRow,
                          { borderBottomColor: dividerColor },
                          index === closestMensas.length - 1 && styles.listRowLast,
                          pressed && styles.listRowPressed,
                        ]}
                        onPress={() => router.push(`/mensa-detail?id=${canteen.id}`)}
                      >
                        <Image
                          source={getCanteenLogo(canteen.name)}
                          style={styles.currentLogo}
                          contentFit="contain"
                        />
                        <View style={styles.currentTextContainer}>
                          <ThemedText style={styles.currentTitle}>{canteen.name}</ThemedText>
                          <ThemedText style={[styles.currentSubtitle, { color: secondaryTextColor }]}>
                            {t('search.closestToYou', { distance: formatDistanceKm(canteen.distance) })}
                          </ThemedText>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {showPopularSection && (
                <View style={styles.section}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    {t('search.popularCategoriesTitle')}
                  </ThemedText>
                  <View style={styles.listContainer}>
                    {POPULAR_SEARCHES.map((tagKey, index) => {
                      const label = t(tagKey);
                      const emoji = POPULAR_TAG_EMOJIS[tagKey] || '\u{1F37D}\u{FE0F}';
                      return (
                        <Pressable
                          key={tagKey}
                          style={({ pressed }) => [
                            styles.listRow,
                            { borderBottomColor: dividerColor },
                            index === POPULAR_SEARCHES.length - 1 && styles.listRowLast,
                            pressed && styles.listRowPressed,
                          ]}
                          onPress={() => handlePopularTagPress(label)}
                        >
                          <ThemedText style={styles.popularEmoji}>{emoji}</ThemedText>
                          <ThemedText style={styles.popularLabel}>{label}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          }
        />
      )}

      {isError && !showResults && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="red" />
          <ThemedText style={styles.errorText}>
            {t('search.loadError')}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listRowPressed: {
    opacity: 0.6,
  },
  currentLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  currentTextContainer: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  currentSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  popularEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  popularLabel: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  resultSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#d32f2f',
    fontFamily: Fonts.regular,
  },
});


