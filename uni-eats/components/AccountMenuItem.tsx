import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';

interface AccountMenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  showDivider?: boolean;
}

export function AccountMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showDivider = true,
}: AccountMenuItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtitleColor = isDark ? '#9BA1A6' : '#6B7280';
  const dividerColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <>
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        <MaterialIcons 
          name={icon} 
          size={40} 
          color={isDark ? Colors.dark.icon : Colors.light.icon}
          style={styles.icon}
        />
        
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
            {subtitle}
          </ThemedText>
        </View>

        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={subtitleColor}
          style={styles.chevron}
        />
      </TouchableOpacity>
      
      {showDivider && (
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 16,
    opacity: 0.8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  chevron: {
    marginLeft: 8,
  },
  divider: {
    height: 0.5,
    marginHorizontal: 16,
  },
});
