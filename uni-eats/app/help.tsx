import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { FAQItem } from '@/components/help/FAQItem';
import { ContactItem } from '@/components/help/ContactItem';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';

interface FAQData {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQData[] = [
  {
    id: '1',
    question: 'How do I order from a mensa?',
    answer: 'Browse available mensas, select your desired meals, and add them to your cart. You can pick up your order at the selected mensa.',
  },
  {
    id: '2',
    question: 'How do I add meals to favorites?',
    answer: 'Tap the heart icon on any meal to add it to your favorites. You can view all your favorites in the Account section.',
  },
  {
    id: '3',
    question: 'What do the allergen symbols mean?',
    answer: 'Each meal displays allergen information. Tap on the allergen info to see a detailed list of allergens present in the dish.',
  },
  {
    id: '4',
    question: 'How can I contact support?',
    answer: 'You can reach our support team at support@unieats.com or call +49 123 456 7890 during business hours (9:00 AM - 6:00 PM).',
  },
  {
    id: '5',
    question: 'Can I change my dietary preferences?',
    answer: 'Yes! Go to Profile > Dietary Preferences to customize your meal recommendations based on your dietary needs.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFAQPress = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const sectionTitleColor = isDark ? Colors.dark.text : '#333';
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Zurück"
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Help</ThemedText>
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
            Frequently Asked Questions
          </ThemedText>
          
          <View style={[styles.faqContainer, { borderColor }]}>
            {FAQ_DATA.map((faq) => (
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
            Contact Support
          </ThemedText>
          
          <View style={styles.contactContainer}>
            <ContactItem
              icon="email"
              label="Email"
              value="support@unieats.com"
              type="email"
            />
            <ContactItem
              icon="phone"
              label="Phone"
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
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 16,
  },
  faqContainer: {
    borderTopWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  contactContainer: {
    paddingTop: 8,
  },
});
