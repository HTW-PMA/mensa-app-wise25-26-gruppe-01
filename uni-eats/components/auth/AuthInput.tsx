import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TextInputProps,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export function AuthInput({
  label,
  error,
  icon,
  secureTextEntry,
  ...props
}: AuthInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const backgroundColor = isDark ? '#1a1a1a' : '#F5F5F5';
  const borderColor = error
    ? '#FF4444'
    : isFocused
    ? Colors.light.tint
    : isDark
    ? '#333'
    : '#E0E0E0';
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const placeholderColor = isDark ? '#666' : '#999';
  const iconColor = isDark ? '#666' : '#999';

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={isFocused ? Colors.light.tint : iconColor}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: textColor },
            icon && styles.inputWithIcon,
          ]}
          placeholderTextColor={placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={props.keyboardType === 'email-address' ? 'none' : props.autoCapitalize}
          {...props}
        />
        
        {secureTextEntry && (
          <Pressable
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={10}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility' : 'visibility-off'}
              size={20}
              color={iconColor}
            />
          </Pressable>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color="#FF4444" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    height: '100%',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    fontFamily: Fonts.regular,
  },
});
