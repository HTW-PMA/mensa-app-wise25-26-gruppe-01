import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { mensaApi } from '@/services/mensaApi';

/**
 * Hook to check favorite meals against today's menu and send notifications
 */
export function useFavoriteMealAlerts() {
  const { user, isAuthenticated } = useAuth();
  const { favoriteCanteenIds, favoriteMealIds } = useFavoritesContext();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    if (favoriteCanteenIds.length === 0 || favoriteMealIds.length === 0) {
      return;
    }

    const checkFavoriteMeals = async () => {
      try {
        const notificationService = await import('@/services/notificationService');
        const today = new Date().toISOString().slice(0, 10);
        console.log(`🔍 Checking favorite meals for user ${user.id} on ${today}`);

        // Fetch all canteens
        const allCanteens = await mensaApi.getCanteens({ loadingtype: 'complete' });

        // For each favorite canteen
        for (const canteenId of favoriteCanteenIds) {
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
          for (const favoriteMealId of favoriteMealIds) {
            const matchedMeal = mealsForCanteen.find((meal) => meal.id === favoriteMealId);

            if (matchedMeal) {
              const alreadyNotified = await notificationService.wasNotifiedToday(
                user.id,
                matchedMeal.id,
                today
              );

              if (!alreadyNotified) {
                try {
                  await notificationService.notifyFavoriteMealAvailable(
                    matchedMeal.name,
                    canteen.name,
                    canteen.id,
                    matchedMeal.id
                  );

                  await notificationService.markNotifiedToday(user.id, matchedMeal.id, today);
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
  }, [isAuthenticated, user?.id, favoriteCanteenIds.join(','), favoriteMealIds.join(',')]);
}
