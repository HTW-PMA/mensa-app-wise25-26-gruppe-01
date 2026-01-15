import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { mensaApi } from '@/services/mensaApi';

/**
 * Hook to check favorite meals against today's menu and send notifications
 */
export function useFavoriteMealAlerts() {
  const { user, isAuthenticated } = useAuth();
  const { favoriteMeals } = useFavoritesContext();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    if (favoriteMeals.length === 0) {
      return;
    }

    const checkFavoriteMeals = async () => {
      try {
        const notificationService = await import('@/services/notificationService');
        const today = new Date().toISOString().slice(0, 10);
        console.log(`🔍 Checking favorite meals for user ${user.id} on ${today}`);

        // Fetch all canteens
        const allCanteens = await mensaApi.getCanteens({ loadingtype: 'complete' });

        const favoritesByCanteen = favoriteMeals.reduce<Record<string, Set<string>>>(
          (acc, favorite) => {
            if (!acc[favorite.canteenId]) {
              acc[favorite.canteenId] = new Set<string>();
            }
            acc[favorite.canteenId].add(favorite.mealId);
            return acc;
          },
          {}
        );

        // For each favorite canteen
        for (const canteenId of Object.keys(favoritesByCanteen)) {
          const canteen = allCanteens.find((c) => c.id === canteenId);
          if (!canteen) continue;

          // Get meals for this canteen today
          let mealsForCanteen = [];
          try {
            mealsForCanteen = await mensaApi.getMeals({
              canteenId,
              date: today,
              loadingtype: 'complete',
            });
          } catch (e) {
            console.warn(`⚠️ Failed to fetch meals for canteen ${canteenId}:`, e);
            continue;
          }

          // Check if any favorite meals are available today
          const favoriteMealIdSet = favoritesByCanteen[canteenId] ?? new Set<string>();
          for (const favoriteMealId of favoriteMealIdSet) {
            const matchedMeal = mealsForCanteen.find((meal) => meal.id === favoriteMealId);

            if (matchedMeal) {
              const alreadyNotified = await notificationService.wasNotifiedToday(
                user.id,
                matchedMeal.id,
                today,
                canteen.id
              );

              if (!alreadyNotified) {
                try {
                  await notificationService.notifyFavoriteMealAvailable(
                    matchedMeal.name,
                    canteen.name,
                    canteen.id,
                    matchedMeal.id
                  );

                  await notificationService.markNotifiedToday(
                    user.id,
                    matchedMeal.id,
                    today,
                    canteen.id
                  );
                  console.log(`✅ Notified user about ${matchedMeal.name} at ${canteen.name}`);
                } catch (e) {
                  console.warn('⚠️ Notifications not available, skipping:', e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking favorite meals:', error);
      }
    };

    checkFavoriteMeals();
  }, [isAuthenticated, user?.id, favoriteMeals]);
}
