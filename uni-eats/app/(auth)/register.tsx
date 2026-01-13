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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';
import {
  validateEmail,
  validateName,
  validatePassword,
  passwordsMatch,
  getFieldError,
} from '@/utils/validation';
import { handleFirebaseError } from '@/utils/firebaseErrors';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const borderColor = isDark ? '#333' : '#E5E7EB';

  const passwordValidation = validatePassword(password);
  const isFormValid =
    validateName(name) &&
    validateEmail(email) &&
    passwordValidation.isValid &&
    passwordsMatch(password, confirmPassword) &&
    agreeToTerms;

  const handleRegister = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      await signUp(name, email, password);
      router.replace('complete-profile' as any);
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
          <ThemedText style={styles.headerTitle}>{t('auth.register.title')}</ThemedText>
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
            <ThemedText style={styles.welcomeTitle}>{t('auth.register.welcomeTitle')}</ThemedText>
            <ThemedText style={[styles.welcomeSubtitle, { color: isDark ? '#9BA1A6' : '#666' }]}>
              {t('auth.register.welcomeSubtitle')}
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
              label={t('auth.register.nameLabel')}
              icon="person"
              placeholder={t('auth.register.namePlaceholder')}
              autoComplete="name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              onBlur={() => setTouched({ ...touched, name: true })}
              error={touched.name ? getFieldError(name, 'name') : null}
            />

            <AuthInput
              label={t('auth.register.emailLabel')}
              icon="email"
              placeholder={t('auth.register.emailPlaceholder')}
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
              label={t('auth.register.passwordLabel')}
              icon="lock"
              placeholder={t('auth.register.passwordPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              onBlur={() => setTouched({ ...touched, password: true })}
              error={touched.password ? getFieldError(password, 'password') : null}
            />

            {password.length > 0 && (
              <PasswordStrengthIndicator strength={passwordValidation.strength} />
            )}

            <AuthInput
              label={t('auth.register.confirmPasswordLabel')}
              icon="lock-outline"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              error={
                touched.confirmPassword
                  ? getFieldError(confirmPassword, 'confirmPassword', password)
                  : null
              }
            />

            {/* Terms Checkbox */}
            <Pressable
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreeToTerms && styles.checkboxChecked,
                  { borderColor: agreeToTerms ? Colors.light.tint : isDark ? '#666' : '#ccc' },
                ]}
              >
                {agreeToTerms && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <ThemedText style={[styles.termsText, { color: isDark ? '#9BA1A6' : '#666' }]}>
                {t('auth.register.terms.prefix')}{' '}
                <ThemedText style={{ color: Colors.light.tint }}>
                  {t('auth.register.terms.termsOfService')}
                </ThemedText>
                {' '}
                {t('auth.register.terms.and')}{' '}
                <ThemedText style={{ color: Colors.light.tint }}>
                  {t('auth.register.terms.privacyPolicy')}
                </ThemedText>
              </ThemedText>
            </Pressable>
          </View>

          {/* Create Account Button */}
          <Pressable
            style={[
              styles.createButton,
              { backgroundColor: Colors.light.tint },
              !isFormValid && styles.createButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.createButtonText}>{t('auth.register.submit')}</ThemedText>
            )}
          </Pressable>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <ThemedText style={[styles.signInText, { color: isDark ? '#9BA1A6' : '#666' }]}>
              {t('auth.register.haveAccount')}{' '}
            </ThemedText>
            <Pressable onPress={() => router.replace('/login' as any)}>
              <ThemedText style={[styles.signInLink, { color: Colors.light.tint }]}>
                {t('auth.register.signIn')}
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
    borderBottomWidth: 1,
    paddingVertical: Platform.select({
      ios: 12,
      android: 35,
    }),
    paddingBottom: Platform.select({
      android: 10,
    }),
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
    paddingTop: 24,
    paddingBottom: 24,
  },
  welcomeSection: {
    marginBottom: 24,
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
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  createButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  signInLink: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});
