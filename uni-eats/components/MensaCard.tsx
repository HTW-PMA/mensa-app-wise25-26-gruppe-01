import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { type Canteen } from '@/services/mensaApi';
import { Colors } from '@/constants/theme';

interface MensaCardProps {
  canteen: Canteen;
  onPress: () => void;
}

export function MensaCard({ canteen, onPress }: MensaCardProps) {
  // Bookmark status (currently resets when the app is closed and reopened)
  const [isFavorite, setIsFavorite] = useState(false);

  // importing rating/review data (default value 0,0, 0)
  const rating = canteen.rating ? canteen.rating.toFixed(1) : '0.0';
  const reviewCount = canteen.reviewCount || 0;

  // Dummy data that will later be replaced with APIs and logic
  const distance = '0.0 km';
  const duration = '00-00 min';
  
  // Temporary tags for design examples (to be integrated with the Menu API later)
  const badges = ['Fast Service', 'Vegan', 'Halal'];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >

      <View style={styles.imageContainer}>
        {/* Replace with actual image later */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
          style={styles.image}
          contentFit="cover"
          transition={500}
        />
        {/* Badge display on the image */}
        <View style={styles.badgeOverlay}>
          {badges.slice(0, 2).map((badge, index) => (
            <View key={index} style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      </View>


      <View style={styles.contentContainer}>

        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {canteen.name}
          </Text>
          <Pressable 
            onPress={(e) => {
              e.stopPropagation(); // Prevent card clicks and toggle only hearts
              setIsFavorite(!isFavorite);
            }}
            hitSlop={10}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? Colors.light.tint : "#333"}
              style={{ transform: [{ translateY: -2.5}]}}
            />
          </Pressable>
        </View>


        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={16} color="#FFCC00" style={{ transform: [{ translateY: -3.5}, { translateX: 1 }] }} />
            <Text style={styles.infoText}>
              <Text style={styles.ratingText}>{rating}</Text> ({reviewCount})
            </Text>
          </View>
          
          <Text style={styles.separator}>•</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-sharp" size={16} color="#666" style={{ transform: [{ translateY: -3.5}, { translateX: 1 }] }} />
            <Text style={styles.infoText}>{distance}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#666" style={{ transform: [{ translateY: -3.5}, { translateX: 1 }] }} />
            <Text style={styles.infoText}>{duration}</Text>
          </View>
        </View>

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#eee',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  badgeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'GoogleSans-Bold',
    lineHeight: 22,
  },
  contentContainer: {
    padding: 13,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 20,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -13,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    marginHorizontal: 5,
    color: '#ccc',
    transform: [{ translateY: -3.5}]

  },
  infoText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
  },
  ratingText: {
    fontFamily: 'GoogleSans-Bold',
    color: '#333',
  },
});