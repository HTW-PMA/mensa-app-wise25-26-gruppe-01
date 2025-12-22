import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="mensa-detail"
                    options={{
                        title: 'Mensa Details',
                        headerShown: true,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}