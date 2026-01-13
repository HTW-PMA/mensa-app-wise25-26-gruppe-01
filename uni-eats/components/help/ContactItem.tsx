import React from 'react';
import { StyleSheet, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';

interface ContactItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  type: 'email' | 'phone';
}

export function ContactItem({ icon, label, value, type }: ContactItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const handlePress = async () => {
    try {
      let url: string;
      
      if (type === 'email') {
        url = `mailto:${value}`;
      } else {
        // Remove spaces and special characters for phone number
        const cleanedPhone = value.replace(/\s+/g, '').replace(/-/g, '');
        url = `tel:${cleanedPhone}`;
      }

      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('help.contactUnavailableTitle'),
          type === 'email'
            ? t('help.contactEmailUnavailable')
            : t('help.contactPhoneUnavailable')
        );
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert(t('common.errorTitle'), t('help.contactActionFailed'));
    }
  };

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtitleColor = isDark ? '#9BA1A6' : '#6B7280';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={
        type === 'email' ? t('help.contactEmailHint') : t('help.contactPhoneHint')
      }
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={icon}
          size={24}
          color={Colors.light.tint}
        />
      </View>
      
      <View style={styles.textContainer}>
        <ThemedText style={[styles.label, { color: subtitleColor }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.value, { color: Colors.light.tint }]}>
          {value}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 12,
  },
  value: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
});
