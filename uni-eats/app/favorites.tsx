import React from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FavoriteCanteenCard } from '@/components/favorites/FavoriteCanteenCard';
import { FavoriteMealCard } from '@/components/favorites/FavoriteMealCard';
import { useFavorites } from '@/hooks/useFavorites';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    favoriteCanteens,
    favoriteMeals,
    isLoading,
    isRefreshing,
    error,
    refresh,
    removeFavoriteCanteen,
    removeFavoriteMeal,
  } = useFavorites();

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const sectionTitleColor = isDark ? Colors.dark.text : '#333';

  const handleCanteenPress = (canteenId: string) => {
    router.push({
      pathname: '/mensa-detail',
      params: { id: canteenId },
    });
  };

  const handleMealPress = (mealId: string) => {
    // TODO: Navigiere zu Meal-Detail wenn vorhanden
    console.log('Meal pressed:', mealId);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>My Favorites</ThemedText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const hasFavorites = favoriteCanteens.length > 0 || favoriteMeals.length > 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>My Favorites</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.light.tint}
            colors={[Colors.light.tint]}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF5722" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <ThemedText style={styles.retryText}>Erneut versuchen</ThemedText>
            </Pressable>
          </View>
        ) : !hasFavorites ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>Keine Favoriten</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Füge Mensen und Gerichte zu deinen Favoriten hinzu, um sie hier zu sehen.
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Favorite Mensas Section (Multi-Canteen Support) */}
            {favoriteCanteens.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star-outline" size={20} color={sectionTitleColor} />
                  <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                    Favorite Mensas ({favoriteCanteens.length})
                  </ThemedText>
                </View>
                
                <View style={styles.canteensList}>
                  {favoriteCanteens.map((canteen) => (
                    <FavoriteCanteenCard
                      key={canteen.id}
                      canteen={canteen}
                      onPress={() => handleCanteenPress(canteen.id)}
                      onRemove={() => removeFavoriteCanteen(canteen.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Meals Section */}
            {favoriteMeals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="heart-outline" size={20} color={sectionTitleColor} />
                  <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                    Favorite Meals ({favoriteMeals.length})
                  </ThemedText>
                </View>
                
                <View style={styles.mealsList}>
                  {favoriteMeals.map((meal) => (
                    <FavoriteMealCard
                      key={meal.id}
                      meal={meal}
                      onPress={() => handleMealPress(meal.id)}
                      onRemove={() => removeFavoriteMeal(meal.id)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 18
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'GoogleSans-Bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontFamily: 'GoogleSans-Bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'GoogleSans-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'GoogleSans-Bold',
  },
  emptySection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  emptySectionText: {
    fontSize: 14,
    color: '#999',
  },
  canteensList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  mealsList: {
    gap: 0,
  },
});
