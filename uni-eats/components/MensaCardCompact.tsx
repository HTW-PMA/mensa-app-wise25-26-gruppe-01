import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Canteen } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';

interface MensaCardCompactProps {
    canteen: Canteen;
    distance?: string;
    travelTime?: string;
    onPress: () => void;
}

export function MensaCardCompact({
                                     canteen,
                                     distance = '– km',
                                     travelTime = '– min',
                                     onPress
                                 }: MensaCardCompactProps) {


    const rating = canteen.rating ? canteen.rating.toFixed(1) : '–';
    const reviewCount = canteen.reviewCount ?? 0;

    return (
        <Pressable
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
            onPress={onPress}
        >
            <View style={styles.contentContainer}>


                <View style={styles.headerRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {canteen.name}
                    </Text>
                </View>


                <View style={styles.infoContainer}>


                    <View style={styles.infoItem}>
                        <Ionicons name="star" size={14} color="#FFCC00" />
                        <Text style={styles.infoText}>
                            <Text style={styles.ratingBold}>{rating}</Text> ({reviewCount})
                        </Text>
                    </View>


                    <Text style={styles.separator}>|</Text>


                    <View style={styles.infoItem}>
                        <Ionicons name="location-sharp" size={14} color={Colors.light.tint} />
                        <Text style={styles.infoText}>
                            {distance} •
                        </Text>
                        <Ionicons name="time-outline" size={16} color="#666" style={{marginLeft: 4}} />
                        <Text style={styles.infoText}>
                            {travelTime}
                        </Text>
                    </View>

                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
            }
        }),
    },
    contentContainer: {
        padding: 23,
        paddingVertical: 25,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.99 }],
    },
    headerRow: {
        marginBottom: 8,
    },
    name: {
        fontFamily: 'GoogleSans-Bold',
        fontSize: 18,
        color: '#000',
        includeFontPadding: false,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    separator: {
        marginHorizontal: 10,
        color: '#ddd',
        fontSize: 14,
        marginBottom: 2,
    },
    infoText: {
        fontFamily: 'GoogleSans-Regular',
        fontSize: 13,
        color: '#666',
        includeFontPadding: false,
    },
    ratingBold: {
        fontFamily: 'GoogleSans-Bold',
        color: '#333',
    }
});