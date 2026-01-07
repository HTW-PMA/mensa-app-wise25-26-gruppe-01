import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtitleColor = isDark ? '#9BA1A6' : '#666';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <ThemedText style={[styles.title, { color: textColor }]}>
            Welcome to UniEats
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
            Find the best meals at your university
          </ThemedText>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <FeatureItem
            emoji="📍"
            title="Find nearby Mensas"
            description="Discover cafeterias close to you"
            isDark={isDark}
          />
          <FeatureItem
            emoji="🥗"
            title="Browse today's menu"
            description="See what's cooking today"
            isDark={isDark}
          />
          <FeatureItem
            emoji="❤️"
            title="Save your favorites"
            description="Quick access to meals you love"
            isDark={isDark}
          />
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsSection}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: Colors.light.tint }]}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, { borderColor: Colors.light.tint }]}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: Colors.light.tint }]}>
              Create Account
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  emoji: string;
  title: string;
  description: string;
  isDark: boolean;
}

function FeatureItem({ emoji, title, description, isDark }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureEmoji}>
        <ThemedText style={styles.featureEmojiText}>{emoji}</ThemedText>
      </View>
      <View style={styles.featureText}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText
          style={[styles.featureDescription, { color: isDark ? '#9BA1A6' : '#666' }]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  featuresSection: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmojiText: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  buttonsSection: {
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
});
