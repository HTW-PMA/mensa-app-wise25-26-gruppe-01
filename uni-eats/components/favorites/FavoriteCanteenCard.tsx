import React from 'react';
import { StyleSheet, Pressable, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { type Canteen } from '@/services/mensaApi';
import { formatDistance } from '@/hooks/useLocation';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FavoriteCanteenCardProps {
  canteen: Canteen;
  onPress?: () => void;
  onRemove?: () => void;
}

export function FavoriteCanteenCard({ canteen, onPress, onRemove }: FavoriteCanteenCardProps) {
  const { t } = useTranslation();
  
  const tintColor = useThemeColor({ light: Colors.light.tint, dark: '#2c2c2e' }, 'tint');
  const textColor = '#FFFFFF';

  const distanceText = canteen.distance !== undefined 
    ? t('favorites.distanceAway', { distance: formatDistance(canteen.distance) })
    : canteen.address?.district || canteen.address?.city || '';

  const renderRightActions = () => {
    if (!onRemove) return null;
    return (
      <View style={styles.deleteAction} />
    );
  };

  const CardContent = (
    <Pressable
      style={({ pressed }) => [
        styles.container, 
        { backgroundColor: tintColor },
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={[styles.name, { color: textColor }]}>{canteen.name}</Text>
        {distanceText ? (
          <Text style={[styles.distance, { color: 'rgba(255,255,255,0.8)' }]}>{distanceText}</Text>
        ) : null}
      </View>
    </Pressable>
  );

  if (onRemove) {
    return (
      <Swipeable 
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === 'right' && onRemove) {
            onRemove();
          }
        }}
      >
        {CardContent}
      </Swipeable>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80, // Ensure consistent height
    
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
    marginBottom: 4,
  },
  distance: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
  },
  deleteAction: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
