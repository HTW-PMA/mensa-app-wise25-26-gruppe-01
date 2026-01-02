import React from 'react';
import { StyleSheet, Pressable, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Canteen } from '@/services/mensaApi';
import { formatDistance } from '@/hooks/useLocation';
import { Colors } from '@/constants/theme';

interface FavoriteCanteenCardProps {
  canteen: Canteen;
  onPress?: () => void;
  onRemove?: () => void;
}

export function FavoriteCanteenCard({ canteen, onPress, onRemove }: FavoriteCanteenCardProps) {
  const distanceText = canteen.distance !== undefined 
    ? `${formatDistance(canteen.distance)} away`
    : canteen.address?.district || canteen.address?.city || '';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{canteen.name}</Text>
        {distanceText ? (
          <Text style={styles.distance}>{distanceText}</Text>
        ) : null}
      </View>
      
      {onRemove && (
        <Pressable
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          hitSlop={10}
        >
          <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.7)" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.tint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flex: 1,
  },
  name: {
    fontFamily: 'GoogleSans-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  distance: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  removeButton: {
    padding: 4,
    marginLeft: 12,
  },
});
