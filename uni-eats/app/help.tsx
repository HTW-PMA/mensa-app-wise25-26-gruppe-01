import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { FAQItem } from '@/components/help/FAQItem';
import { ContactItem } from '@/components/help/ContactItem';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';

interface FAQData {
  id: string;
  question: string;
  answer: string;
}

export default function HelpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFAQPress = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const sectionTitleColor = isDark ? Colors.dark.text : '#333';
  const borderColor = isDark ? '#333333' : '#E5E7EB';
  const faqData: FAQData[] = [
    {
      id: '1',
      question: t('help.faq.orderQuestion'),
      answer: t('help.faq.orderAnswer'),
    },
    {
      id: '2',
      question: t('help.faq.favoritesQuestion'),
      answer: t('help.faq.favoritesAnswer'),
    },
    {
      id: '3',
      question: t('help.faq.allergensQuestion'),
      answer: t('help.faq.allergensAnswer'),
    },
    {
      id: '4',
      question: t('help.faq.contactQuestion'),
      answer: t('help.faq.contactAnswer'),
    },
    {
      id: '5',
      question: t('help.faq.preferencesQuestion'),
      answer: t('help.faq.preferencesAnswer'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('help.title')}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
            {t('help.faq.title')}
          </ThemedText>
          
          <View style={[styles.faqContainer, { borderColor }]}>
            {faqData.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                isExpanded={expandedId === faq.id}
                onPress={() => handleFAQPress(faq.id)}
              />
            ))}
          </View>
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
            {t('help.contactTitle')}
          </ThemedText>
          
          <View style={styles.contactContainer}>
            <ContactItem
              icon="email"
              label={t('help.contactEmail')}
              value="support@unieats.com"
              type="email"
            />
            <ContactItem
              icon="phone"
              label={t('help.contactPhone')}
              value="+49 123 456 7890"
              type="phone"
            />
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  faqContainer: {
    marginTop: 2,
    borderTopWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  contactContainer: {

  },
});

