import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { t } from '@/utils/i18n';

/**
 * Initialize notification handler
 * Uses fallback Alert API for local development
 * For full native notifications, use EAS Build (requires Apple Developer account)
 */
export async function initializeNotifications(): Promise<void> {
  console.log('Notification system initialized (Alert API - local development mode)');
}

/**
 * Generate storage key for dedup tracking
 */
function getNotificationKey(userId: string, mealId: string, dateISO: string): string {
  return `notified:${userId}:${mealId}:${dateISO}`;
}

/**
 * Check if user was already notified about this meal today
 */
export async function wasNotifiedToday(
  userId: string,
  mealId: string,
  dateISO: string
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(getNotificationKey(userId, mealId, dateISO));
    return value === '1';
  } catch (e) {
    console.error('Error checking notification status:', e);
    return false;
  }
}

/**
 * Mark that user was notified about this meal today
 */
export async function markNotifiedToday(
  userId: string,
  mealId: string,
  dateISO: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(getNotificationKey(userId, mealId, dateISO), '1');
    console.log(`Marked notification for meal ${mealId} on ${dateISO}`);
  } catch (e) {
    console.error('Error marking notification:', e);
  }
}

/**
 * Send notification when favorite meal is available
 * Uses React Native Alert API for local development
 */
export async function notifyFavoriteMealAvailable(
  mealName: string,
  canteenName: string,
  canteenId: string,
  mealId: string
): Promise<void> {
  try {
    Alert.alert(
      t('notifications.favoriteMealTitle'),
      t('notifications.favoriteMealMessage', { mealName, canteenName }),
      [
        {
          text: t('common.cancel'),
          onPress: () => console.log('Notification dismissed'),
          style: 'cancel',
        },
        {
          text: t('common.view'),
          onPress: () => {
            console.log(`User tapped notification for meal: ${mealName} at ${canteenId}`);
          },
        },
      ]
    );
    console.log(`Alert notification shown for meal: ${mealName}`);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}
