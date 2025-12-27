import { StyleSheet, View, Text, ActivityIndicator, Image, FlatList, Pressable, type DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useMensas } from '@/hooks/useMensas';
import { type Canteen } from '@/services/mensaApi';
import { MensaCardCompact } from '@/components/MensaCardCompact';


// --- Business Logic / Helpers (Person A & C) ---

/**
 * Person A & C: TODO: Implement distance calculation logic here
 * - calculateDistance: Berechnung der Entfernung basierend auf dem aktuellen Standort des Benutzers und dem Standort von Mensa (lat, lng)
 * - sortMensasByDistance: Sortieren der Mensa-Liste nach Nähe
 * Es wäre gut, die Funktionen zuerst im Services-Ordner zu implementieren und hier nur die fertigen Funktionen zu verwenden.
 */

const calculateDistance = (lat?: number, lng?: number): string => {
    // TODO: Use actual user location (Person C) and calculate distance
    if (!lat || !lng) return '– km';
    return '1.2 km'; // Dummy value
};


// --- UI Components (Person B) ---

const MapPin = ({ number, top, left, onPress, name, distance }: { number: number, top: DimensionValue, left: DimensionValue, onPress: () => void, name: string, distance: string }) => (
  <Pressable style={[styles.pinContainer, { top, left }]} onPress={onPress}>
    {({ pressed }) => (
        <>
            <View style={[styles.pinCircle, pressed && { transform: [{ scale: 1.1 }] }]}>
                <Ionicons name="restaurant" size={21} color="#fff" />
            </View>
            <View style={styles.pinBadge}>
              <Text style={styles.pinText}>{number}</Text>
            </View>

            {/* Tooltip visible only while pressed */}
            {pressed && (
                <View style={styles.tooltipContainer}>
                    <Text style={styles.tooltipName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.tooltipDistance}>{distance}</Text>
                    <View style={styles.tooltipArrow} />
                </View>
            )}
        </>
    )}
  </Pressable>
);

export default function MapScreen() {
    const { data: mensas, isLoading } = useMensas();
    const router = useRouter();

    // Helper to get ID safely (Person A/C Logic placeholder)
    const getMensaId = (index: number) => {
        if (mensas && mensas.length > index) {
            return mensas[index].id;
        }
        return '1';
    };

    const getMensaData = (index: number) => {
        if (mensas && mensas.length > index) {
            const m = mensas[index];
            return {
                name: m.name,
                distance: calculateDistance(m.address?.latitude, m.address?.longitude)
            };
        }
        return { name: 'Mensa', distance: '– km' };
    };

    const handlePinPress = (index: number) => {
        const id = getMensaId(index);
        router.push({ pathname: '/mensa-detail', params: { id } });
    };

    const renderHeader = () => (
        <View>
            <Text style={styles.title}>Mensa Map</Text>
            
            <View style={styles.mapCard}>
                <View style={styles.mapImageContainer}>
                    <Image
                        // Placeholder map of Berlin area
                        source={{ uri: 'https://www.welt-atlas.de/datenbank/karten/karte-1-68.gif' }}
                        style={styles.mapImage}
                        resizeMode="cover"
                    />
                    
                    {/* Interactive Dummy Pins linked to first 3 mensas */}
                    <MapPin 
                        number={1} 
                        top="30%" 
                        left="40%" 
                        onPress={() => handlePinPress(0)} 
                        {...getMensaData(0)}
                    />
                    <MapPin 
                        number={2} 
                        top="50%" 
                        left="20%" 
                        onPress={() => handlePinPress(1)} 
                        {...getMensaData(1)}
                    />
                    <MapPin 
                        number={3} 
                        top="60%" 
                        left="70%" 
                        onPress={() => handlePinPress(2)} 
                        {...getMensaData(2)}
                    />

                    {/* Legend Overlay inside Map */}
                    <View style={styles.legendOverlay}>
                        <Text style={styles.legendTitle}>Map Legend</Text>
                        <View style={styles.legendRow}>
                            <Text style={{ fontSize: 12 }}>🟢</Text> 
                            <Text style={styles.legendText}>Mensa Location</Text>
                        </View>
                    </View>
                </View>
            </View>

            <Text style={[styles.title, styles.listTitle]}>All Mensas</Text>
        </View>
    );

    const renderItem = ({ item, index }: { item: Canteen; index: number }) => (
        <View style={styles.cardWrapper}>
            <MensaCardCompact 
                canteen={item} 
                distance={calculateDistance(item.address?.latitude, item.address?.longitude)}
                onPress={() => router.push({ pathname: '/mensa-detail', params: { id: item.id } })} 
            />
            {/* Rank Badge overlaying top-left corner */}
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
            </View>
        </View>
    );

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
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    mapImageContainer: {
        height: 320,
        width: '100%',
        position: 'relative',
        backgroundColor: '#f0f0f0',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    // Internal Legend Overlay
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
    // Pins
    pinContainer: {
        position: 'absolute',
        width: 66,
        height: 66,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    pinCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: Colors.light.tint,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    pinBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 27,
        height: 27,
        borderRadius: 13.5,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.light.tint,
    },
    pinText: {
        fontSize: 14,
        fontFamily: 'GoogleSans-Bold',
        color: Colors.light.tint,

        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',

    },
    // Card & Badge Styles
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
        zIndex: 10, // Ensure it sits on top of the card
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
    // Tooltip Styles
    tooltipContainer: {
        position: 'absolute',
        top: 60, // Position below the pin
        left: -27, // Center horizontally relative to pin (approx width/2)
        width: 120,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 8,
        zIndex: 100,
        alignItems: 'center',

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    tooltipArrow: {
        position: 'absolute',
        top: -8,
        left: 54, // Center of tooltip width - half arrow width
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 8,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#fff',
    },
    tooltipName: {
        fontFamily: 'GoogleSans-Bold',
        fontSize: 12,
        color: '#000',
        textAlign: 'center',
    },
    tooltipDistance: {
        fontFamily: 'GoogleSans-Regular',
        fontSize: 10,
        color: '#666',
    },
});

