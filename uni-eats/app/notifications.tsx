import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FavoriteMealCard } from '@/components/favorites/FavoriteMealCard';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useMeals } from '@/hooks/useMeals';
import { useMensas } from '@/hooks/useMensas';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { favoriteMeals } = useFavoritesContext();
  const { data: meals, isLoading, isError, error } = useMeals();
  const { data: mensas } = useMensas({ loadingtype: 'lazy' });
  const textColor = useThemeColor({}, 'text');

  const canteenNameById = new Map((mensas ?? []).map((canteen) => [canteen.id, canteen.name]));
  const favoriteMealKeySet = new Set(
    favoriteMeals.map((favorite) => `${favorite.canteenId}::${favorite.mealId}`)
  );
  const favoriteMealsToday =
    meals?.filter((meal) => {
      if (!meal.canteenId) return false;
      return favoriteMealKeySet.has(`${meal.canteenId}::${meal.id}`);
    }) ?? [];

  const handleMealPress = (meal: any) => {
    const canteenName = meal.canteenId ? canteenNameById.get(meal.canteenId) : '';
    router.push({
      pathname: '/meal-detail',
      params: {
        id: meal.id,
        name: meal.name,
        category: meal.category ?? '',
        prices: JSON.stringify(meal.prices ?? []),
        additives: JSON.stringify(meal.additives ?? []),
        badges: JSON.stringify(meal.badges ?? []),
        co2Bilanz: meal.co2Bilanz?.toString() ?? '',
        waterBilanz: meal.waterBilanz?.toString() ?? '',
        canteenName: canteenName ?? '',
        canteenId: meal.canteenId ?? '',
      },
    });
  };

  const hasFavoritesToday = favoriteMealsToday.length > 0;
  const showEmptyState = !isLoading && !hasFavoritesToday;
  return (
    <>
      <Stack.Screen options={{ title: t('notifications.title') }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.goBack')}
            >
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </Pressable>
            <ThemedText type="title" style={styles.title}>
              {t('notifications.title')}
            </ThemedText>
          </View>
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.stateText}>{t('common.loading')}</ThemedText>
            </View>
          ) : isError ? (
            <View style={styles.stateContainer}>
              <ThemedText style={styles.stateText}>
                {error?.message ?? t('common.unexpectedError')}
              </ThemedText>
            </View>
          ) : showEmptyState ? (
            <View style={styles.stateContainer}>
              <ThemedText style={styles.stateTitle}>{t('notifications.emptyTitle')}</ThemedText>
              <ThemedText style={styles.stateText}>{t('notifications.emptySubtitle')}</ThemedText>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <ThemedText style={styles.sectionTitle}>{t('notifications.availableTitle')}</ThemedText>
              <View style={styles.mealsList}>
                {favoriteMealsToday.map((meal) => (
                  <FavoriteMealCard
                    key={`${meal.canteenId ?? 'unknown'}-${meal.id}`}
                    meal={meal}
                    canteenName={meal.canteenId ? canteenNameById.get(meal.canteenId) : undefined}
                    onPress={() => handleMealPress(meal)}
                  />
                ))}
              </View>
            </View>
          )}
        </ThemedView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    width: 44,
  },
  title: {
    marginTop: 0,
  },
  listContainer: {
    flex: 1,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'GoogleSans-Bold',
    marginBottom: 12,
  },
  mealsList: {
    gap: 0,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: 'GoogleSans-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
});
