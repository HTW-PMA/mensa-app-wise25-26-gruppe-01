import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Fonts } from '@/constants/theme';
import { validateEmail, getFieldError } from '@/utils/validation';
import { handleFirebaseError } from '@/utils/firebaseErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const borderColor = isDark ? '#333' : '#E5E7EB';

  const isFormValid = validateEmail(email) && password.length >= 1;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.replace('/(tabs)' as any);
    } catch (err) {
      const message = handleFirebaseError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Sign In</ThemedText>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.welcomeTitle}>Welcome back!</ThemedText>
            <ThemedText style={[styles.welcomeSubtitle, { color: isDark ? '#9BA1A6' : '#666' }]}>
              Sign in to access your favorites and personalized recommendations.
            </ThemedText>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF4444" />
              <ThemedText style={styles.errorMessage}>{error}</ThemedText>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <AuthInput
              label="Email"
              icon="email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              onBlur={() => setTouched({ ...touched, email: true })}
              error={touched.email ? getFieldError(email, 'email') : null}
            />

            <AuthInput
              label="Password"
              icon="lock"
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              onBlur={() => setTouched({ ...touched, password: true })}
            />

            {/* Forgot Password */}
            <Pressable
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon.')}
            >
              <ThemedText style={[styles.forgotPasswordText, { color: Colors.light.tint }]}>
                Forgot Password?
              </ThemedText>
            </Pressable>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={[
              styles.signInButton,
              { backgroundColor: Colors.light.tint },
              !isFormValid && styles.signInButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
            )}
          </Pressable>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <ThemedText style={[styles.signUpText, { color: isDark ? '#9BA1A6' : '#666' }]}>
              Don't have an account?{' '}
            </ThemedText>
            <Pressable onPress={() => router.replace('/(auth)/register' as any)}>
              <ThemedText style={[styles.signUpLink, { color: Colors.light.tint }]}>
                Sign Up
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.select({
      ios: 12,
      android: 35,
    }),
    paddingBottom: Platform.select({
      android: 10,
    }),
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorMessage: {
    flex: 1,
    color: '#FF4444',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  form: {
    marginBottom: 24,
    includeFontPadding: false,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  signUpLink: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});
