import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PasswordStrength } from '@/utils/validation';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
}

export function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();
  const bars = [0, 1, 2, 3];
  const label = t(`validation.passwordStrength.${strength.label}`);

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {bars.map((index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor:
                  index <= strength.score ? strength.color : '#E0E0E0',
              },
            ]}
          />
        ))}
      </View>
      <ThemedText style={[styles.label, { color: strength.color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    marginLeft: 12,
    textTransform: 'capitalize',
  },
});
