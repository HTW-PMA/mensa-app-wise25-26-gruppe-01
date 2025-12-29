import { StyleSheet, FlatList, Pressable, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SearchBar } from '@/components/SearchBar';
import { useSearch } from '@/hooks/useSearch';
import { POPULAR_SEARCHES, SearchResult } from '@/utils/searchHelpers';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const {
    searchQuery,
    setSearchQuery,
    results,
    isLoading,
    isError,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearch();

  const [refreshing, setRefreshing] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({ light: '#666', dark: '#999' }, 'icon');
  const backgroundColor = useThemeColor({ light: '#f9f9f9', dark: '#0a0a0a' }, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectResult = (result: SearchResult) => {
    addRecentSearch(searchQuery);
    // Hier könnten Navigation oder andere Aktionen folgen
  };

  const handlePopularTagPress = (tag: string) => {
    setSearchQuery(tag);
    addRecentSearch(tag);
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
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

  const renderRecentSearch = ({ item }: { item: string }) => (
    <Pressable
      style={({ pressed }) => [
        styles.recentSearchItem,
        { 
          opacity: pressed ? 0.7 : 1,
          backgroundColor: backgroundColor,
        },
      ]}
      onPress={() => handleRecentSearchPress(item)}
    >
      <View style={[styles.recentSearchIconContainer, { backgroundColor: tintColor + '15' }]}>
        <Ionicons name="search" size={20} color={secondaryTextColor} />
      </View>
      <ThemedText style={styles.recentSearchText}>{item}</ThemedText>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          removeRecentSearch(item);
        }}
        hitSlop={10}
        style={styles.deleteButton}
      >
        <Ionicons name="close" size={20} color={secondaryTextColor} />
      </Pressable>
    </Pressable>
  );

  const renderPopularTag = ({ item }: { item: string }) => (
    <Pressable
      style={({ pressed }) => [
        styles.popularTag,
        {
          opacity: pressed ? 0.8 : 1,
          backgroundColor: backgroundColor === '#f9f9f9' ? '#e8f5e9' : '#1a2e1a',
        },
      ]}
      onPress={() => handlePopularTagPress(item)}
    >
      <ThemedText style={styles.popularTagText}>
        {item}
      </ThemedText>
    </Pressable>
  );

  const showResults = searchQuery.length > 0;
  const showEmpty = showResults && results.length === 0 && !isLoading;
  const showRecentSection = !showResults && recentSearches.length > 0;
  const showPopularSection = !showResults;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          onClear={handleClearSearch}
          placeholder="Search for meals or mensas"
        />
      </SafeAreaView>

      {showResults ? (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color={secondaryTextColor} />
                <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
                  No results found
                </ThemedText>
                <ThemedText
                  style={[styles.emptySubtext, { color: secondaryTextColor }]}
                >
                  Try a different search term
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
              {showRecentSection && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                      Recent Searches
                    </ThemedText>
                    <Pressable onPress={clearRecentSearches} hitSlop={10}>
                      <ThemedText style={[styles.clearAllText, { color: '#4CAF50' }]}>
                        Clear all
                      </ThemedText>
                    </Pressable>
                  </View>
                  <View style={styles.recentSearchesContainer}>
                    {recentSearches.map((search) => (
                      <View key={search}>
                        {renderRecentSearch({ item: search })}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {showPopularSection && (
                <View style={styles.section}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    Popular Searches
                  </ThemedText>
                  <View style={styles.popularTagsContainer}>
                    {POPULAR_SEARCHES.map((tag) => (
                      <View key={tag}>
                        {renderPopularTag({ item: tag })}
                      </View>
                    ))}
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
            Failed to load data. Please try again.
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
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  recentSearchesContainer: {
    paddingHorizontal: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  recentSearchIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
  },
  deleteButton: {
    padding: 4,
  },
  popularTagsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  popularTag: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  popularTagText: {
    fontSize: 15,
    fontWeight: '500',
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
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
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
  },
});
