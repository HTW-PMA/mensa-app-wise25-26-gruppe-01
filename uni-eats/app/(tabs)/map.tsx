import { StyleSheet, View, Text, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '@/constants/theme';
import { useMensas } from '@/hooks/useMensas';
import { type Canteen } from '@/services/mensaApi';
import { MensaCardCompact } from '@/components/MensaCardCompact';

// expo-maps benötigt ein natives Modul; auf Web laden wir es nicht, um Runtime-Fehler zu vermeiden.
const isWeb = Platform.OS === 'web';
let MapView: any;
let Marker: any;
if (!isWeb) {
    const ExpoMaps = require('expo-maps') as typeof import('expo-maps');
    MapView = ExpoMaps.default;
    Marker = ExpoMaps.Marker;
}

// --- Helpers ---
const FALLBACK_COORDS = { latitude: 52.52, longitude: 13.405 }; // Berlin fallback

const toCoords = (canteen: Canteen) => {
    const lat = canteen.address?.geoLocation?.latitude;
    const lon = canteen.address?.geoLocation?.longitude;
    if (typeof lat === 'number' && typeof lon === 'number') {
        return { latitude: lat, longitude: lon };
    }
    return null;
};

const haversineDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function MapScreen() {
    const router = useRouter();
    const { data: mensas, isLoading } = useMensas();

    const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [requestingLocation, setRequestingLocation] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadLocation = async () => {
            setRequestingLocation(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationError('LOCATION_DENIED');
                    return;
                }

                const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (!cancelled) {
                    setLocation(current);
                }
            } catch (error) {
                console.error('Location error', error);
                if (!cancelled) setLocationError('LOCATION_ERROR');
            } finally {
                if (!cancelled) setRequestingLocation(false);
            }
        };

        loadLocation();
        return () => {
            cancelled = true;
        };
    }, []);

    const userCoords = useMemo(() => {
        if (location?.coords) {
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        }
        return null;
    }, [location]);

    const initialCenter = userCoords ?? FALLBACK_COORDS;
    const mapKey = `${initialCenter.latitude}-${initialCenter.longitude}`;

    const formatDistance = (canteen: Canteen) => {
        const coords = toCoords(canteen);
        if (!coords) return '– km';
        const origin = userCoords ?? FALLBACK_COORDS;
        const km = haversineDistanceKm(origin.latitude, origin.longitude, coords.latitude, coords.longitude);
        return `${km.toFixed(1)} km`;
    };

    const renderHeader = () => (
        <View>
            <Text style={styles.title}>Mensa Map</Text>

            <View style={styles.mapCard}>
                <View style={styles.mapContainer}>
                    <MapView
                        key={mapKey}
                        style={styles.map}
                        initialCameraPosition={{
                            center: initialCenter,
                            pitch: 0,
                            heading: 0,
                            zoom: 12,
                            altitude: 1000,
                        }}
                        googleMapsApiKey={googleMapsApiKey}
                    >
                        {userCoords && (
                            <Marker coordinate={userCoords} title="Du bist hier" description="Aktuelle Position">
                                <Ionicons name="person" size={22} color={Colors.light.tint} />
                            </Marker>
                        )}

                        {(mensas || []).map((mensa) => {
                            const coords = toCoords(mensa);
                            if (!coords) return null;

                            return (
                                <Marker
                                    key={mensa.id}
                                    coordinate={coords}
                                    title={mensa.name}
                                    description={formatDistance(mensa)}
                                    onPress={() => router.push({ pathname: '/mensa-detail', params: { id: mensa.id } })}
                                >
                                    <Ionicons name="restaurant" size={22} color={Colors.light.tint} />
                                </Marker>
                            );
                        })}
                    </MapView>

                    <View style={styles.legendOverlay}>
                        <Text style={styles.legendTitle}>Map Legend</Text>
                        <View style={styles.legendRow}>
                            <Text style={{ fontSize: 12 }}>🟢</Text>
                            <Text style={styles.legendText}>Mensa Location</Text>
                        </View>
                        {userCoords && (
                            <View style={styles.legendRow}>
                                <Text style={{ fontSize: 12 }}>🔵</Text>
                                <Text style={styles.legendText}>Dein Standort</Text>
                            </View>
                        )}
                    </View>
                </View>

                {requestingLocation && (
                    <View style={styles.infoRow}>
                        <ActivityIndicator size="small" color={Colors.light.tint} />
                        <Text style={styles.infoText}>Standort wird geladen…</Text>
                    </View>
                )}

                {locationError === 'LOCATION_DENIED' && (
                    <View style={styles.infoRow}>
                        <Ionicons name="warning" size={18} color={Colors.light.tint} />
                        <Text style={styles.infoText}>Standortzugriff verweigert. Zeige Berlin als Startpunkt.</Text>
                    </View>
                )}

                {locationError === 'LOCATION_ERROR' && (
                    <View style={styles.infoRow}>
                        <Ionicons name="warning" size={18} color={Colors.light.tint} />
                        <Text style={styles.infoText}>Standort konnte nicht geladen werden. Nutze Fallback.</Text>
                    </View>
                )}

                {Platform.OS === 'web' && !googleMapsApiKey && (
                    <View style={styles.infoRow}>
                        <Ionicons name="warning" size={18} color={Colors.light.tint} />
                        <Text style={styles.infoText}>Google Maps API Key fehlt. Bitte EXPO_PUBLIC_GOOGLE_MAPS_API_KEY setzen.</Text>
                    </View>
                )}
            </View>

            <Text style={[styles.title, styles.listTitle]}>All Mensas</Text>
        </View>
    );

    const renderItem = ({ item, index }: { item: Canteen; index: number }) => (
        <View style={styles.cardWrapper}>
            <MensaCardCompact
                canteen={item}
                distance={formatDistance(item)}
                onPress={() => router.push({ pathname: '/mensa-detail', params: { id: item.id } })}
            />
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
            </View>
        </View>
    );

    if (isWeb) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="warning" size={18} color={Colors.light.tint} />
                    <Text style={[styles.infoText, { textAlign: 'center' }]}>Maps sind im Web nicht verfügbar. Bitte native App / Dev Client nutzen.</Text>
                </View>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={mensas || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    title: {
        fontFamily: 'GoogleSans-Bold',
        fontSize: 24,
        marginTop: 60,
        marginLeft: 20,
        marginBottom: 20,
        color: '#000',
    },
    listTitle: {
        marginTop: 30,
        marginBottom: 10,
    },
    mapCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#fff',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    mapContainer: {
        height: 320,
        width: '100%',
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    legendOverlay: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    legendTitle: {
        fontFamily: 'GoogleSans-Bold',
        fontSize: 12,
        color: '#333',
        marginBottom: 2,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendText: {
        fontFamily: 'GoogleSans-Regular',
        fontSize: 11,
        color: '#555',
        includeFontPadding: false,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
    },
    infoText: {
        fontFamily: 'GoogleSans-Regular',
        fontSize: 13,
        color: '#444',
        flex: 1,
    },
    cardWrapper: {
        position: 'relative',
        marginHorizontal: 20,
        marginBottom: 12,
    },
    rankBadge: {
        position: 'absolute',
        top: -6, 
        left: -6,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    rankText: {
        color: '#fff',
        fontFamily: 'GoogleSans-Bold',
        fontSize: 14,
    },
});

