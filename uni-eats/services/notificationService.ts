import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'mensa-default';

/**
 * Initialize notification handler and request permissions
 */
export async function initializeNotifications(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');

    // Check if Notifications module has the required function
    if (!Notifications.setNotificationHandler) {
      console.warn('⚠️ Notifications.setNotificationHandler not available');
      return;
    }

    // Set notification handler BEFORE setting up listeners
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    console.log('✅ Notification handler configured');

    // Request permissions (works on physical devices)
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log(`📱 Notification permission status: ${status}`);
      if (status !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
      }
    } catch (permError) {
      console.warn('⚠️ Could not request notification permissions:', permError);
    }

    // Configure Android channel (only on Android)
    if (Platform.OS === 'android') {
      try {
        if (Notifications.setNotificationChannelAsync) {
          await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
            name: 'Mensa Notifications',
            importance: Notifications.AndroidImportance?.DEFAULT || 2,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4CAF50',
            sound: 'default',
          });
          console.log('📱 Android notification channel configured');
        }
      } catch (channelError) {
        console.warn('⚠️ Could not configure Android channel:', channelError);
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize notifications:', error);
  }
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
    console.error('❌ Error checking notification status:', e);
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
    console.log(`✅ Marked notification for meal ${mealId} on ${dateISO}`);
  } catch (e) {
    console.error('❌ Error marking notification:', e);
  }
}

/**
 * Send notification when favorite meal is available
 */
export async function notifyFavoriteMealAvailable(
  mealName: string,
  canteenName: string,
  canteenId: string,
  mealId: string
): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lieblingsgericht verfügbar! 🍽️',
        body: `Dein Favorit ${mealName} gibt es heute in der ${canteenName}.`,
        sound: 'default',
        data: {
          canteenId,
          mealId,
          mealName,
          type: 'favorite-meal-available',
        },
      },
      trigger: {
        seconds: 1, // Show immediately after 1 second
      },
    });

    console.log(`🔔 Notification scheduled for meal: ${mealName} (ID: ${identifier})`);
  } catch (error) {
    console.error('❌ Failed to schedule notification:', error);
  }
}
