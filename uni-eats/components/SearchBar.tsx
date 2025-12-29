import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({
  placeholder = 'Search for meals or mensas',
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#f5f5f5', dark: '#1a1a1a' }, 'background');
  const placeholderColor = useThemeColor({ light: '#999', dark: '#666' }, 'icon');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Ionicons
        name="search"
        size={20}
        color={placeholderColor}
        style={styles.icon}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: textColor,
            borderColor: useThemeColor({ light: '#ddd', dark: '#333' }, 'background'),
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} style={styles.clearButton}>
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
    paddingHorizontal: 12,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
});
