import React from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccountMenuItem } from '@/components/AccountMenuItem';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const APP_VERSION = '1.0.0';

export default function AccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { locale, setLanguage } = useLanguage();
  const { favoriteMealIds, favoriteCanteenIds } = useFavoritesContext();
  const { user, signOut, isLoading } = useAuth();

  // Berechne Favoriten-Anzahl aus Context (Multi-Canteen Support)
  const favoritesCount = {
    meals: favoriteMealIds.length,
    mensas: favoriteCanteenIds.length,
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditProfile = () => {
    // TODO: Navigiere zu Edit-Profil-Seite oder öffne Modal
    Alert.alert(t('account.editProfileTitle'), t('account.editProfileMessage'));
  };

  const handleFavorites = () => {
    router.push('/favorites' as any);
  };

  const handleProfile = () => {
    router.push('/profile' as any);
  };

  const handleHelp = () => {
    router.push('/help' as any);
  };

  const handleSettings = () => {
    // TODO: Navigiere zu App-Einstellungen
    Alert.alert(t('account.settingsTitle'), t('account.settingsMessage'));
  };

  const handleSignOut = () => {
    Alert.alert(
      t('account.signOutTitle'),
      t('account.signOutPrompt'),
      [
        { text: t('common.cancel'), onPress: () => {}, style: 'cancel' },
        {
          text: t('account.signOutButton'),
          onPress: async () => {
            try {
              await signOut();
              // Navigation happens automatically via RootLayoutNav
            } catch (error) {
              Alert.alert(t('common.errorTitle'), t('account.signOutError'));
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.light.tint}
        />
      </ThemedView>
    );
  }

  const subtitleGrayColor = isDark ? '#9BA1A6' : '#6B7280';
  const dividerColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section - User Info */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            {/* Avatar */}
            <View
              style={[
                styles.avatar,
                { backgroundColor: Colors.light.tint },
              ]}
            >
              <ThemedText style={styles.avatarText}>
                {user && getInitials(user.name)}
              </ThemedText>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {user?.name || t('account.defaultName')}
              </ThemedText>
              <ThemedText
                style={[styles.userEmail, { color: subtitleGrayColor }]}
              >
                {user?.email || t('account.defaultEmail')}
              </ThemedText>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              <ThemedText style={styles.editButtonText}>
                {t('account.edit')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <AccountMenuItem
            icon="favorite-outline"
            title={t('account.menu.favoritesTitle')}
            subtitle={t('account.menu.favoritesSubtitle', {
              meals: favoritesCount.meals,
              mensas: favoritesCount.mensas,
              mensaLabel:
                favoritesCount.mensas === 1
                  ? t('account.menu.mensaSingle')
                  : t('account.menu.mensaPlural'),
            })}
            onPress={handleFavorites}
            showDivider={true}
          />

          <AccountMenuItem
            icon="person"
            title={t('account.menu.profileTitle')}
            subtitle={t('account.menu.profileSubtitle')}
            onPress={handleProfile}
            showDivider={true}
          />

          <AccountMenuItem
            icon="help-outline"
            title={t('account.menu.helpTitle')}
            subtitle={t('account.menu.helpSubtitle')}
            onPress={handleHelp}
            showDivider={true}
          />

          <AccountMenuItem
            icon="settings"
            title={t('account.menu.settingsTitle')}
            subtitle={t('account.menu.settingsSubtitle')}
            onPress={handleSettings}
            showDivider={false}
          />
        </View>

        <View style={styles.languageSection}>
          <ThemedText style={styles.languageTitle}>{t('account.languageTitle')}</ThemedText>
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

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutButton}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name="exit-to-app"
              size={24}
              color="white"
              style={styles.signOutIcon}
            />
            <ThemedText style={styles.signOutButtonText}>
              {t('account.signOutButton')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: subtitleGrayColor }]}>
            {t('account.version', { version: APP_VERSION })}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header Section Styles
  headerSection: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 28,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: 'white',
    lineHeight: Platform.select({
      ios: 36,
      android: 32,
        }),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginBottom: 4,
    marginVertical: 8,

  },
  userEmail: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: Colors.light.tint,

    fontFamily: Fonts.bold,
    ...Platform.select({
      ios: {
        fontSize: 16,
      },
      android: {
        fontSize: 14,

      }
    }),
  },

  // Menu Section Styles
  menuSection: {
    marginTop: 1,
  },

  languageSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  languageTitle: {
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

  // Sign Out Section Styles
  signOutSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  signOutIcon: {
    marginRight: 12,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },

  // Footer Styles
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    ...Platform.select({
      ios: {
        fontSize: 15,
      },
      android: {
        fontSize: 13,

      }
    }),

  },
});

