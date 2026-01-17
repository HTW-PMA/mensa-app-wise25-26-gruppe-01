import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
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
  const iconBg = isDark ? '#2C2C2E' : '#F2F2F7';

  const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
  };

  const InfoRow = ({
                     icon,
                     title,
                     value,
                     isLast = false
                   }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    isLast?: boolean;
  }) => (
      <View style={styles.rowContainer}>
        <View style={[styles.infoRow, { backgroundColor: cardBackground }]}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={20} color={Colors.light.tint} />
          </View>

          <View style={[styles.infoContent, !isLast && { borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.textContainer}>
              <ThemedText style={styles.infoTitle}>{title}</ThemedText>
              <ThemedText
                  style={[styles.infoValue, { color: textColor }]}
                  numberOfLines={2}
              >
                {value}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
  );

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

          <View style={styles.listSection}>
            <View style={[styles.listContainer, { backgroundColor: cardBackground }]}>
              <InfoRow
                  icon="school-outline"
                  title={t('profile.statusTitle')}
                  value={profile?.status ? t(`profile.status.${profile.status}`) : t('profile.notSet')}
              />
              <InfoRow
                  icon="business-outline"
                  title={t('profile.universityTitle')}
                  value={profile?.universityName ?? t('profile.notSet')}
              />
              <InfoRow
                  icon="restaurant-outline"
                  title={t('profile.dietTitle')}
                  value={profile?.dietType ? t(`profile.diet.${profile.dietType}`) : t('profile.notSet')}
              />
              <InfoRow
                  icon="alert-circle-outline"
                  title={t('profile.allergiesTitle')}
                  value={profile?.allergies?.length ? profile.allergies.join(', ') : t('profile.none')}
                  isLast={true}
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
  listSection: {
    paddingHorizontal: 20,
  },
  listContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  rowContainer: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    minHeight: 70,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  infoTitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
});