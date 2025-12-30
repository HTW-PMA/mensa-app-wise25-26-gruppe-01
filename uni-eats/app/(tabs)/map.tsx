import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Colors } from '@/constants/theme';
import { useMensas } from '@/hooks/useMensas';
import { type Canteen } from '@/services/mensaApi';

// expo-maps stellt plattformspezifische Views bereit; wir wählen passend zur Plattform.
const isWeb = Platform.OS === 'web';
const isIOS = Platform.OS === 'ios';
const MapComponent = isIOS ? AppleMaps.View : GoogleMaps.View;

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

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [requestingLocation, setRequestingLocation] = useState(true);

    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

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

    const cameraPosition = useMemo(
        () => ({ coordinates: initialCenter, zoom: 12 }),
        [initialCenter],
    );

    const markers = useMemo(() => {
        const mensaMarkers = (mensas || [])
            .map((mensa) => {
                const coords = toCoords(mensa);
                if (!coords) return null;
                return {
                    id: `mensa:${mensa.id}`,
                    coordinates: coords,
                    title: mensa.name,
                    snippet: formatDistance(mensa),
                    color: '#02AA20', // UniEats Green
                };
            })
            .filter(Boolean) as any[];

        if (isIOS) {
            const appleMarkers = mensaMarkers.map((marker) => ({
                id: marker.id,
                coordinates: marker.coordinates,
                title: marker.title,
                systemImage: 'fork.knife',
                color: '#02AA20',
            }));

            if (userCoords) {
                appleMarkers.unshift({
                    id: 'user',
                    coordinates: userCoords,
                    title: 'Du bist hier',
                    systemImage: 'location.fill',
                    color: '#007AFF',
                });
            }

            return appleMarkers;
        }

        const googleMarkers = mensaMarkers.map((marker) => ({
            ...marker,
        }));

        if (userCoords) {
            googleMarkers.unshift({
                id: 'user',
                coordinates: userCoords,
                title: 'Du bist hier',
                snippet: 'Aktuelle Position',
                color: '#007AFF',
            });
        }

        return googleMarkers;
    }, [mensas, userCoords, isIOS]);

    const handleMarkerClick = (marker: { id?: string }) => {
        const markerId = marker.id;

        // Wenn kein Marker oder kein Mensa-Marker, Auswahl aufheben
        if (!markerId || !markerId.startsWith('mensa:')) {
            setSelectedMarkerId(null);
            return;
        }

        // Bei erneutem Klick auf den gleichen Marker -> Detailansicht öffnen
        if (selectedMarkerId === markerId) {
            const mensaId = markerId.replace('mensa:', '');
            router.push({ pathname: '/mensa-detail', params: { id: mensaId } });
            setSelectedMarkerId(null);
        } else {
            // Erster Klick -> Marker als ausgewählt setzen (Callout wird angezeigt)
            setSelectedMarkerId(markerId);
        }
    };

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
            <View style={styles.mapContainer}>
                <MapComponent
                    key={mapKey}
                    style={styles.map}
                    cameraPosition={cameraPosition}
                    markers={markers}
                    onMarkerClick={handleMarkerClick}
                    onMapClick={() => setSelectedMarkerId(null)}
                />

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

                {/* Info Overlays */}
                <View style={styles.overlayContainer}>
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
                </View>
            </View>
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
    mapContainer: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    legendOverlay: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    legendTitle: {
        fontFamily: 'GoogleSans-Bold',
        fontSize: 12,
        color: '#333',
        marginBottom: 4,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginVertical: 1,
    },
    legendText: {
        fontFamily: 'GoogleSans-Regular',
        fontSize: 11,
        color: '#555',
        includeFontPadding: false,
    },
    overlayContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoText: {
        fontFamily: 'GoogleSans-Regular',
        fontSize: 13,
        color: '#444',
        flex: 1,
    },
});

