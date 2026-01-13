import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';
import { useProfile } from '@/contexts/ProfileContext';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { profile } = useProfile();
  const cardBackground = isDark ? '#1C1C1E' : '#F7F7F8';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>{t('profile.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('profile.subtitle')}</ThemedText>
          <Pressable
            style={[styles.editButton, { backgroundColor: Colors.light.tint }]}
            onPress={() => router.push('/profile-edit' as any)}
          >
            <ThemedText style={styles.editButtonText}>{t('profile.editButton')}</ThemedText>
          </Pressable>
        </ThemedView>

        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.cardTitle}>{t('profile.statusTitle')}</ThemedText>
          <ThemedText style={styles.cardValue}>
            {profile?.status ? t(`profile.status.${profile.status}`) : t('profile.notSet')}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.cardTitle}>{t('profile.universityTitle')}</ThemedText>
          <ThemedText style={styles.cardValue}>
            {profile?.universityName ?? t('profile.notSet')}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.cardTitle}>{t('profile.dietTitle')}</ThemedText>
          <ThemedText style={styles.cardValue}>
            {profile?.dietType ? t(`profile.diet.${profile.dietType}`) : t('profile.notSet')}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={styles.cardTitle}>{t('profile.allergiesTitle')}</ThemedText>
          <ThemedText style={styles.cardValue}>
            {profile?.allergies?.length ? profile.allergies.join(', ') : t('profile.none')}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  editButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
});
