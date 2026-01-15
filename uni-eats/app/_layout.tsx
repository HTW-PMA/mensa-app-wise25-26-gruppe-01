import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack, useSegments, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/config/queryClient';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useFavoriteMealAlerts } from '@/hooks/useFavoriteMealAlerts';
import { useTranslation } from '@/hooks/useTranslation';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const { isAuthenticated, isLoading } = useAuth();
    const { isProfileComplete, isLoading: isProfileLoading } = useProfile();
    const { isLoading: isLanguageLoading } = useLanguage();
    const { t } = useTranslation();
    const segments = useSegments();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    // Initialize notifications on app start
    useEffect(() => {
        const initNotifications = async () => {
            try {
                const notificationService = await import('@/services/notificationService');
                await notificationService.initializeNotifications();
                console.log('🔔 Notifications initialized successfully');
            } catch (error) {
                console.warn('⚠️ Failed to initialize notifications:', error);
            }
        };

        initNotifications();
    }, []);


    // Note: Notification tap listeners from expo-notifications are not available in local development
    // They are available only when using EAS Build for native deployment
    // Alert API notifications are shown through notifyFavoriteMealAvailable in notificationService.ts

    // Check favorite meals and send alerts
    useFavoriteMealAlerts();

    // Auth routing logic
    useEffect(() => {
        if (isLoading || isProfileLoading || isLanguageLoading || !rootNavigationState?.key) return;

        const authRoutes = ['welcome', 'login', 'register', 'complete-profile'];
        const currentRoute = segments[0] ?? '';
        const inAuthGroup =
            currentRoute === '(auth)' ||
            authRoutes.includes(currentRoute) ||
            authRoutes.includes(segments[1] ?? '');
        const inCompleteProfile = segments.includes('complete-profile');

        if (!isAuthenticated) {
            if (!inAuthGroup) {
                router.replace('/welcome' as any);
            }
            return;
        }

        if (!isProfileComplete) {
            if (!inCompleteProfile) {
                router.replace('/complete-profile' as any);
            }
            return;
        }

        if (inAuthGroup) {
            router.replace('/(tabs)' as any);
        }
    }, [
        isAuthenticated,
        isLoading,
        isProfileComplete,
        isProfileLoading,
        isLanguageLoading,
        rootNavigationState?.key,
        segments,
    ]);

    // Show loading screen while checking auth state
    if (isLoading || isProfileLoading || isLanguageLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="mensa-detail"
                    options={{
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="favorites"
                    options={{
                        title: t('favorites.title'),
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="help"
                    options={{
                        title: t('help.title'),
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="meal-detail"
                    options={{
                        title: t('mealDetail.title'),
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="profile"
                    options={{
                        title: t('profile.title'),
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="profile-edit"
                    options={{
                        title: t('profile.editTitle'),
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('modal.title') }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}

function AppProviders() {
    const { reloadKey } = useLanguage();

    return (
        <AuthProvider key={`lang-${reloadKey}`}>
            <ProfileProvider>
                <FavoritesProvider>
                    <RootLayoutNav />
                </FavoritesProvider>
            </ProfileProvider>
        </AuthProvider>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    // Load Google Sans fonts and handle potential loading errors.
    const [loaded, error] = useFonts({
        'GoogleSans-Regular': require('../assets/fonts/GoogleSans-Regular.ttf'),
        'GoogleSans-Bold': require('../assets/fonts/GoogleSans-Bold.ttf'),
    });

    useEffect(() => {
        // Hide the splash screen once fonts are loaded or if an error occurs.
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    // If fonts are not loaded yet and there's no error, keep showing the splash screen.
    if (!loaded && !error) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AppProviders />
                </LanguageProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
