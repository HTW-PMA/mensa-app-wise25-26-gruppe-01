import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Fonts } from '@/constants/theme';

export default function LanguageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { locale, setLanguage } = useLanguage();

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const dividerColor = isDark ? '#333333' : '#E5E7EB';
  const subtitleGrayColor = isDark ? '#9BA1A6' : '#6B7280';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: dividerColor }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('account.languageTitle')}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.sectionTitle}>{t('account.languageTitle')}</ThemedText>
        <View style={styles.languageOptions}>
          <TouchableOpacity
            onPress={() => setLanguage('en')}
            style={[
              styles.languageOption,
              {
                backgroundColor: locale === 'en' ? Colors.light.tint : 'transparent',
                borderColor: locale === 'en' ? Colors.light.tint : dividerColor,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.languageOptionText,
                { color: locale === 'en' ? '#FFFFFF' : subtitleGrayColor },
              ]}
            >
              {t('account.languageEnglish')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('de')}
            style={[
              styles.languageOption,
              {
                backgroundColor: locale === 'de' ? Colors.light.tint : 'transparent',
                borderColor: locale === 'de' ? Colors.light.tint : dividerColor,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.languageOptionText,
                { color: locale === 'de' ? '#FFFFFF' : subtitleGrayColor },
              ]}
            >
              {t('account.languageGerman')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    ...Platform.select({
      ios: {
        marginTop: 0,
      },
      android: {
        marginTop: 18,
      },
    }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  languageOptionText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});
