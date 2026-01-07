import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack, useSegments, useRouter } from 'expo-router';
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
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const { isAuthenticated, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to welcome if not authenticated
            router.replace('/(auth)/welcome' as any);
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to home if authenticated
            router.replace('/(tabs)' as any);
        }
    }, [isAuthenticated, isLoading, segments]);

    // Show loading screen while checking auth state
    if (isLoading) {
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
                        title: 'My Favorites',
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="help"
                    options={{
                        title: 'Help',
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
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
                <AuthProvider>
                    <FavoritesProvider>
                        <RootLayoutNav />
                    </FavoritesProvider>
                </AuthProvider>
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