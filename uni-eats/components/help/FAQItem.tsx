import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onPress: () => void;
}

export function FAQItem({ question, answer, isExpanded, onPress }: FAQItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onPress();
  };

  const questionBackgroundColor = isExpanded 
    ? Colors.light.tint 
    : isDark ? '#1a1a1a' : '#FFFFFF';
  
  const questionTextColor = isExpanded 
    ? '#FFFFFF' 
    : isDark ? Colors.dark.text : Colors.light.text;

  const borderColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      <TouchableOpacity
        style={[
          styles.questionContainer,
          { backgroundColor: questionBackgroundColor },
          isExpanded && styles.questionContainerExpanded,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={question}
        accessibilityState={{ expanded: isExpanded }}
      >
        <ThemedText 
          style={[
            styles.questionText, 
            { color: questionTextColor }
          ]}
          numberOfLines={2}
        >
          {question}
        </ThemedText>
        <MaterialIcons
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color={isExpanded ? '#FFFFFF' : isDark ? Colors.dark.icon : Colors.light.icon}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={[styles.answerContainer, { backgroundColor: isDark ? '#0a0a0a' : '#F9FAFB' }]}>
          <ThemedText style={[styles.answerText, { color: isDark ? '#9BA1A6' : '#6B7280' }]}>
            {answer}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  questionContainerExpanded: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  answerText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
});
