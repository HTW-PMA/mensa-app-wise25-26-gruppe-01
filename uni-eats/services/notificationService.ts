import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { t } from '@/utils/i18n';

let expoPushToken: string | undefined;

/**
 * Initialize notification handler and register for push notifications
 */
export async function initializeNotifications(): Promise<string | undefined> {
  try {
    // Configure how notifications behave when received while the app is foregrounded
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const token = await registerForPushNotificationsAsync();
    expoPushToken = token;
    console.log('Notification system initialized. Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return undefined;
  }
}

/**
 * Get the stored Expo Push Token
 */
export function getExpoPushToken(): string | undefined {
  return expoPushToken;
}

/**
 * Generate storage key for dedup tracking
 */
function getNotificationKey(
  userId: string,
  mealId: string,
  dateISO: string,
  canteenId: string
): string {
  return `notified:${userId}:${canteenId}:${mealId}:${dateISO}`;
}

/**
 * Check if user was already notified about this meal today
 */
export async function wasNotifiedToday(
  userId: string,
  mealId: string,
  dateISO: string,
  canteenId: string
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(getNotificationKey(userId, mealId, dateISO, canteenId));
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
  dateISO: string,
  canteenId: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(getNotificationKey(userId, mealId, dateISO, canteenId), '1');
    console.log(`Marked notification for meal ${mealId} on ${dateISO}`);
  } catch (e) {
    console.error('Error marking notification:', e);
  }
}

/**
 * Send notification when favorite meal is available
 * Uses expo-notifications for local notification
 */
export async function notifyFavoriteMealAvailable(
  mealName: string,
  canteenName: string,
  canteenId: string,
  mealId: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.favoriteMealTitle'),
        body: t('notifications.favoriteMealMessage', { mealName, canteenName }),
        data: { canteenId, mealId },
      },
      trigger: null, // Send immediately
    });
    console.log(`Notification scheduled for meal: ${mealName}`);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
