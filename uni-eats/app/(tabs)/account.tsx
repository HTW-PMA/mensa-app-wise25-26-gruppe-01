import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccountMenuItem } from '@/components/AccountMenuItem';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { storage } from '@/utils/storage';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

const STORAGE_KEY_USER = 'user_profile';
const APP_VERSION = '1.0.0';

export default function AccountScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState({ meals: 0, mensas: 0 });

  // Lade Benutzerdaten beim Start
  useEffect(() => {
    loadUserProfile();
    loadFavoritesCount();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedUser = await storage.get<UserProfile>(STORAGE_KEY_USER);
      if (savedUser) {
        setUser(savedUser);
      } else {
        // Fallback zu Dummy-Daten (kann durch echte User-Authentifizierung ersetzt werden)
        const dummyUser: UserProfile = {
          name: 'Max Student',
          email: 'max.student@university.edu',
        };
        setUser(dummyUser);
        await storage.save(STORAGE_KEY_USER, dummyUser);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback Nutzer
      setUser({
        name: 'Max Student',
        email: 'max.student@university.edu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavoritesCount = async () => {
    try {
      // Hier können echte Daten aus der API geladen werden
      // Für Demo-Zwecke verwenden wir statische Werte
      setFavoritesCount({ meals: 2, mensas: 1 });
    } catch (error) {
      console.error('Error loading favorites count:', error);
    }
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
    Alert.alert('Edit Profile', 'Edit-Profil-Seite wird noch implementiert');
  };

  const handleFavorites = () => {
    // TODO: Navigiere zu Favoriten-Liste
    Alert.alert('My Favorites', 'Favoriten-Seite wird noch implementiert');
  };

  const handleProfile = () => {
    // TODO: Navigiere zu Profil-Einstellungen
    Alert.alert('Profile Settings', 'Profil-Einstellungen werden noch implementiert');
  };

  const handleHelp = () => {
    // TODO: Navigiere zu FAQ/Support-Seite
    Alert.alert('Help & Support', 'FAQ/Support-Seite wird noch implementiert');
  };

  const handleSettings = () => {
    // TODO: Navigiere zu App-Einstellungen
    Alert.alert('Settings', 'Einstellungen werden noch implementiert');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              // Lösche Benutzerdaten
              await storage.remove(STORAGE_KEY_USER);
              // TODO: Navigiere zu Login/Welcome-Seite
              // navigation.reset({
              //   index: 0,
              //   routes: [{ name: 'login' }],
              // });
              Alert.alert('Success', 'Du wurdest abgemeldet');
            } catch (error) {
              Alert.alert('Error', 'Fehler beim Abmelden');
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
                {user?.name || 'User'}
              </ThemedText>
              <ThemedText
                style={[styles.userEmail, { color: subtitleGrayColor }]}
              >
                {user?.email || 'email@university.edu'}
              </ThemedText>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              <ThemedText style={styles.editButtonText}>
                Edit
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <AccountMenuItem
            icon="favorite-outline"
            title="My Favorites"
            subtitle={`${favoritesCount.meals} meals, ${favoritesCount.mensas} mensa`}
            onPress={handleFavorites}
            showDivider={true}
          />

          <AccountMenuItem
            icon="person"
            title="Profile"
            subtitle="Personal info and preferences"
            onPress={handleProfile}
            showDivider={true}
          />

          <AccountMenuItem
            icon="help-outline"
            title="Help"
            subtitle="FAQ and support"
            onPress={handleHelp}
            showDivider={true}
          />

          <AccountMenuItem
            icon="settings"
            title="Settings"
            subtitle="App preferences"
            onPress={handleSettings}
            showDivider={false}
          />
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
              Sign Out
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: subtitleGrayColor }]}>
            UniEats v{APP_VERSION}
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
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600',
  },

  // Menu Section Styles
  menuSection: {
    marginTop: 20,
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
    fontWeight: '600',
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
    fontWeight: '400',
  },
});
