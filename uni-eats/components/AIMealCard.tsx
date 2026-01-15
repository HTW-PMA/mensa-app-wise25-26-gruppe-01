import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '@/services/mensaApi';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Fonts } from '@/constants/theme';
import { selectPriceForStatus } from '@/utils/priceHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useProfile } from '@/contexts/ProfileContext';

// Helper to get image (reusing logic from MealCard or keeping it simple)
const getMealImage = (meal: Meal): string => {
    const searchText = `${meal.name} ${meal.category || ''}`.toLowerCase();

    const imageMap: Record<string, string> = {
        // 1. Eindeutige Formen/Kategorien (höchste Priorität)
        suppe: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=160&h=160&fit=crop',
        stew: 'https://images.unsplash.com/photo-1591386767153-987783380885?w=160&h=160&fit=crop',
        eintopf: 'https://images.unsplash.com/photo-1608500218987-0f2b3be34b47?w=160&h=160&fit=crop',
        salat: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&h=160&fit=crop',
        bowl: 'https://images.unsplash.com/photo-1602881917445-0b1ba001addf?w=160&h=160&fit=crop',
        kuchen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&h=160&fit=crop',
        pudding: 'https://images.unsplash.com/photo-1734671223988-20df071ab200?w=160&h=160&fit=crop',
        joghurt: 'https://images.unsplash.com/photo-1564149503905-7fef56abc1f2?w=160&h=160&fit=crop',
        smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=160&h=160&fit=crop',

        // 2. Klare Hauptgerichte
        pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop',
        burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&h=160&fit=crop',
        pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=160&h=160&fit=crop',
        spaghetti: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=160&h=160&fit=crop',
        tortellini: 'https://images.unsplash.com/photo-1628885405379-5d58de03edb0?w=160&h=160&fit=crop',
        lasagne: 'https://plus.unsplash.com/premium_photo-1671559021023-3da68c12aeed?w=160&h=160&fit=crop',
        gnocchi: 'https://images.unsplash.com/photo-1710532767837-bddfa38b5736?w=160&h=160&fit=crop',
        pommes: 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=160&h=160&fit=crop',
        fries: 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=160&h=160&fit=crop',
        dessert: 'https://plus.unsplash.com/premium_photo-1678715022988-417bbb94e3df?w=160&h=160&fit=crop',

        // 3. Spezifische Zutaten & Gerichte (wird nur geprüft, wenn oben nichts gefunden)
        schnitzel: 'https://images.unsplash.com/photo-1560611588-163f295eb145?w=160&h=160&fit=crop',
        steak: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=160&h=160&fit=crop',
        wurst: 'https://images.unsplash.com/photo-1695089028198-80245e2f5d06?w=160&h=160&fit=crop',
        curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=160&h=160&fit=crop',
        wok: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
        reis: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
        fisch: 'https://plus.unsplash.com/premium_photo-1683707120330-603d9963cb02?w=160&h=160&fit=crop',
        braten: 'https://images.unsplash.com/photo-1581073766947-e8f3ef5393a4?w=160&h=160&fit=crop',
        gulasch: 'https://plus.unsplash.com/premium_photo-1669687759693-52ba5f9fa7a8?w=160&h=160&fit=crop',
        falafel: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb8?w=160&h=160&fit=crop',
        grill: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=160&h=160&fit=crop',
        auflauf: 'https://images.unsplash.com/photo-1645453014403-4ad5170a386c?w=160&h=160&fit=crop',
        pfanne: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=160&h=160&fit=crop',
    };

    for (const [key, url] of Object.entries(imageMap)) {
        if (searchText.includes(key)) return url;
    }

    if (searchText.includes('vegan') || searchText.includes('vegetarisch')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=160&h=160&fit=crop';
    }

    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&h=160&fit=crop';
};

interface AIMealCardProps {
    meal: Meal;
    canteenName?: string;
    reason?: string;
}

export const AIMealCard = ({ meal, canteenName, reason }: AIMealCardProps) => {
    const router = useRouter();
    const { t } = useTranslation();
    const { profile } = useProfile();

    // 🧠 Allergene prüfen (kompatibel mit deinem Profilmodell)
    const allergies: string[] =
        (profile as any)?.userPreferences?.allergies ||
        (profile as any)?.allergies ||
        [];

    const mealText = `${meal.name} ${(meal.additives?.map((a) => a.text).join(' ') ?? '')}`.toLowerCase();
    const detectedAllergens = allergies.filter((a: string) =>
        mealText.includes(a.toLowerCase())
    );

    const hasAllergenConflict = detectedAllergens.length > 0;
    const allergenText = detectedAllergens.join(', ');

    // 🎨 Dynamische Farben & Texte
    const reasonBgColor = hasAllergenConflict ? '#FFF4E5' : '#ECFDF5'; // orange vs grün
    const reasonTextColor = hasAllergenConflict ? '#B45309' : '#065F46'; // orange vs grün
    const reasonText = hasAllergenConflict
        ? ` Achtung: Enthält ${allergenText}`
        : reason || 'Passt zu deiner Suche.';



    const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');
    const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
    const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');
    const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#333333' }, 'border');
    const reasonBg = useThemeColor({ light: '#F0F9F4', dark: '#0D2B16' }, 'background');
    const reasonColor = useThemeColor({ light: '#027A16', dark: '#4CAF50' }, 'text');

    const imageUrl = useMemo(() => getMealImage(meal), [meal.name, meal.category]);

    const selectedPrice = useMemo(
        () => selectPriceForStatus(meal.prices, profile?.status),
        [meal.prices, profile?.status]
    );

    const priceDisplay =
        selectedPrice.price !== null ? t('common.priceFormat', { value: selectedPrice.price.toFixed(2) }) : '';

    // ✅ Kalorien (neu) – nur berechnet, Layout-Logik bleibt getrennt
    const calories = useMemo(() => {
        if (meal.co2Bilanz) return Math.round(meal.co2Bilanz * 0.8 + 200);
        return 450;
    }, [meal.co2Bilanz]);

    const handlePress = () => {
        router.push({
            pathname: '/meal-detail',
            params: {
                id: meal.id,
                name: meal.name,
                category: meal.category,
                prices: JSON.stringify(meal.prices),
                additives: JSON.stringify(meal.additives),
                badges: JSON.stringify(meal.badges),
                co2Bilanz: meal.co2Bilanz?.toString(),
                waterBilanz: meal.waterBilanz?.toString(),
                canteenName: canteenName,
                canteenId: meal.canteenId,
            },
        });
    };

    return (
        <View style={styles.wrapper}>
            {/* AI Reason Bubble (Chef's Note) */}
            {reason && (
                <View style={[styles.reasonContainer, { backgroundColor: reasonBgColor }]}>
                    <Ionicons
                        name={hasAllergenConflict ? 'warning' : 'sparkles'}
                        size={14}
                        color={reasonTextColor}
                        style={{ marginTop: 2 }}
                    />
                    <Text style={[styles.reasonText, { color: reasonTextColor }]} numberOfLines={2}>
                        {reasonText}
                    </Text>
                </View>
            )}

            {/* Actual Meal Card */}
            <Pressable
                style={({ pressed }) => [
                    styles.cardContainer,
                    { backgroundColor, borderColor },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handlePress}
            >
                <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={200} />

                <View style={styles.content}>
                    {/* 1. Reihe: Name */}
                    <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
                        {meal.name}
                    </Text>

                    {/* 2. Reihe: Mensa Standort */}
                    {canteenName ? (
                        <View style={styles.canteenRow}>
                            <Ionicons name="location-sharp" size={12} color={subTextColor} style={{ marginTop: 1 }} />
                            <Text style={[styles.canteenText, { color: subTextColor }]} numberOfLines={1}>
                                {canteenName}
                            </Text>
                        </View>
                    ) : null}

                    {/* 3. Reihe: Preis + kcal (ohne andere Anzeigen zu beeinflussen) */}
                    <View style={styles.bottomRow}>
                        <View style={styles.kcalRow}>
                            <Ionicons name="flame-outline" size={12} color={subTextColor} />
                            <Text style={[styles.kcalText, { color: subTextColor }]}>{calories} kcal</Text>
                        </View>

                        {priceDisplay ? <Text style={styles.price}>{priceDisplay}</Text> : null}
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.light.tint} style={{ marginRight: 8 }} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
        marginLeft: 16,
        marginRight: 32,
    },
    reasonContainer: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        borderBottomLeftRadius: 4,
        marginBottom: -4,
        zIndex: 1,
        alignSelf: 'flex-start',
        maxWidth: '95%',
    },
    reasonText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        lineHeight: 18,
        flex: 1,
    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 8,
        borderWidth: 1,
        gap: 12,

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    title: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        lineHeight: 20,
    },

    // ✅ 2. Reihe (neu, ersetzt metaRow nur für Standort-Zeile)
    canteenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    canteenText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        includeFontPadding: false,
        lineHeight: 14,
    },

    // ✅ 3. Reihe: kcal links, Preis rechts
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 4,
    },
    kcalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    kcalText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        includeFontPadding: false,
        lineHeight: 14,
    },

    price: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        color: Colors.light.tint,
        includeFontPadding: false,
    },
});
