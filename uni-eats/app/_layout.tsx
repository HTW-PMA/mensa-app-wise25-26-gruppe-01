import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/config/queryClient';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: '(tabs)',
};

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
                <FavoritesProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack>
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
                </FavoritesProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}