import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { user } = useAuth();
  
  const cardBackground = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subTextColor = isDark ? '#9BA1A6' : '#6B7280';
  const borderColor = isDark ? '#333333' : '#E5E7EB';
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? Colors.dark.background : '#F2F2F7' },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{t('profile.title')}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerContainer}>
          <View style={[styles.avatarContainer, { backgroundColor: Colors.light.tint }]}>
            <ThemedText style={styles.avatarText}>
              {user?.name ? getInitials(user.name) : 'UE'}
            </ThemedText>
          </View>
          
          <ThemedText style={styles.userName}>{user?.name || 'User'}</ThemedText>
          <ThemedText style={[styles.userEmail, { color: subTextColor }]}>
            {user?.email || ''}
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              { 
                backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                opacity: pressed ? 0.8 : 1
              }
            ]}
            onPress={() => router.push('/profile-edit' as any)}
          >
            <Ionicons name="pencil" size={16} color={Colors.light.tint} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.editButtonText, { color: Colors.light.tint }]}>
              {t('profile.editButton')}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.cardsContainer}>
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F0F9F2' }]}>
                <Ionicons name="school-outline" size={20} color={Colors.light.tint} />
              </View>
              <ThemedText style={styles.cardTitle}>{t('profile.statusTitle')}</ThemedText>
            </View>
            <ThemedText style={[styles.cardValue, { color: textColor }]}>
              {profile?.status ? t(`profile.status.${profile.status}`) : t('profile.notSet')}
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F0F9F2' }]}>
                <Ionicons name="business-outline" size={20} color={Colors.light.tint} />
              </View>
              <ThemedText style={styles.cardTitle}>{t('profile.universityTitle')}</ThemedText>
            </View>
            <ThemedText style={[styles.cardValue, { color: textColor }]}>
              {profile?.universityName ?? t('profile.notSet')}
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F0F9F2' }]}>
                <Ionicons name="restaurant-outline" size={20} color={Colors.light.tint} />
              </View>
              <ThemedText style={styles.cardTitle}>{t('profile.dietTitle')}</ThemedText>
            </View>
            <ThemedText style={[styles.cardValue, { color: textColor }]}>
              {profile?.dietType ? t(`profile.diet.${profile.dietType}`) : t('profile.notSet')}
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#FFF0F0' }]}>
                <Ionicons name="alert-circle-outline" size={20} color={Colors.light.tint} />
              </View>
              <ThemedText style={styles.cardTitle}>{t('profile.allergiesTitle')}</ThemedText>
            </View>
            <ThemedText style={[styles.cardValue, { color: textColor }]}>
              {profile?.allergies?.length ? profile.allergies.join(', ') : t('profile.none')}
            </ThemedText>
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
  content: {
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    lineHeight: 42,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginBottom: 4,
    lineHeight: 32,
    paddingVertical: 2,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 20,
    lineHeight: 20,
    paddingVertical: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    opacity: 0.8,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    paddingLeft: 48, // Align with title text (36 icon + 12 gap)
  },
});
