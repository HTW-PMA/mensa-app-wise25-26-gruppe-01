import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const { t } = useTranslation();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#f5f5f5', dark: '#1a1a1a' }, 'background');
  const placeholderColor = useThemeColor({ light: '#999', dark: '#666' }, 'icon');
  const resolvedPlaceholder = placeholder ?? t('search.placeholder');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Ionicons
        name="search"
        size={22}
        color={placeholderColor}
        style={styles.icon}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: textColor,
          },
        ]}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} style={styles.clearButton} hitSlop={10}>
          <Ionicons name="close-circle" size={20} color={placeholderColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 20,
    borderWidth: 0,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 16,
    fontFamily: Fonts.regular,

    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});
