import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUniversities } from '@/hooks/useUniversities';
import { useTranslation } from '@/hooks/useTranslation';
import { Colors, Fonts } from '@/constants/theme';
import {
  DietType,
  ProfileStatus,
  useProfile,
} from '@/contexts/ProfileContext';
import { University } from '@/services/mensaApi';

const ALLERGEN_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'Gluten', labelKey: 'allergens.gluten' },
  { value: 'Laktose', labelKey: 'allergens.lactose' },
  { value: 'Nüsse', labelKey: 'allergens.nuts' },
  { value: 'Eier', labelKey: 'allergens.eggs' },
  { value: 'Soja', labelKey: 'allergens.soy' },
  { value: 'Fisch', labelKey: 'allergens.fish' },
  { value: 'Schalenfrüchte', labelKey: 'allergens.shellfish' },
  { value: 'Sellerie', labelKey: 'allergens.celery' },
];

const DIET_OPTIONS: Array<{ value: DietType; labelKey: string }> = [
  { value: 'none', labelKey: 'profile.diet.none' },
  { value: 'vegetarian', labelKey: 'profile.diet.vegetarian' },
  { value: 'vegan', labelKey: 'profile.diet.vegan' },
  { value: 'pescatarian', labelKey: 'profile.diet.pescatarian' },
];

const STATUS_OPTIONS: Array<{ value: ProfileStatus; labelKey: string; hintKey: string }> = [
  { value: 'student', labelKey: 'profile.status.student', hintKey: 'profile.statusHint.student' },
  { value: 'employee', labelKey: 'profile.status.employee', hintKey: 'profile.statusHint.employee' },
  { value: 'guest', labelKey: 'profile.status.guest', hintKey: 'profile.statusHint.guest' },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { profile, saveProfile, isLoading: isProfileLoading } = useProfile();
  const { data: universities, isLoading: isUniversitiesLoading, isError } = useUniversities();

  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietType, setDietType] = useState<DietType>('none');
  const [status, setStatus] = useState<ProfileStatus | null>(null);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const cardColor = isDark ? '#1C1C1E' : '#F7F7F8';
  const borderColor = isDark ? '#333333' : '#E5E7EB';
  const textMuted = isDark ? '#9BA1A6' : '#666666';
  const isEditMode = pathname.includes('profile-edit');

  useEffect(() => {
    if (!profile) return;
    setAllergies(profile.allergies ?? []);
    setDietType(profile.dietType ?? 'none');
    setStatus(profile.status ?? null);
    setUniversityId(profile.universityId ?? null);
    setUniversityName(profile.universityName ?? null);
  }, [profile]);

  const toggleAllergy = (allergy: string) => {
    setError(null);
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((item) => item !== allergy) : [...prev, allergy]
    );
  };

  const handleStatusChange = (nextStatus: ProfileStatus) => {
    setError(null);
    setStatus(nextStatus);
    if (nextStatus === 'guest') {
      setUniversityId(null);
      setUniversityName(null);
    }
  };

  const handleSelectUniversity = (uni: University) => {
    setError(null);
    setUniversityId(uni.id);
    setUniversityName(uni.name);
  };

  const filteredUniversities = useMemo(() => {
    const list = universities ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((uni) => {
      const name = uni.name.toLowerCase();
      const shortName = uni.shortName?.toLowerCase() ?? '';
      return name.includes(query) || shortName.includes(query);
    });
  }, [universities, searchQuery]);

  const needsUniversity = status === 'student' || status === 'employee';
  const canSave = Boolean(status) && (!needsUniversity || Boolean(universityId));

  const handleSave = async () => {
    if (!canSave) {
      setError(t('profile.validation.statusAndUniversity'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        allergies,
        dietType,
        status: status as ProfileStatus,
        universityId: universityId ?? undefined,
        universityName: universityName ?? undefined,
      });
      router.replace(isEditMode ? '/profile' as any : '/(tabs)' as any);
    } catch (err) {
      setError(t('profile.validation.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (isProfileLoading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {isEditMode ? t('profile.editTitle') : t('profile.completeTitle')}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textMuted }]}>
              {isEditMode
                ? t('profile.editSubtitle')
                : t('profile.completeSubtitle')}
            </ThemedText>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#FF4444" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t('profile.allergiesTitle')}</ThemedText>
            <ThemedText style={[styles.sectionHint, { color: textMuted }]}>
              {t('profile.allergiesHint')}
            </ThemedText>
            <View style={styles.allergyGrid}>
              {ALLERGEN_OPTIONS.map((allergy) => {
                const isSelected = allergies.includes(allergy.value);
                return (
                  <Pressable
                    key={allergy.value}
                    style={[
                      styles.chip,
                      { backgroundColor: cardColor, borderColor: isSelected ? Colors.light.tint : 'transparent' },
                    ]}
                    onPress={() => toggleAllergy(allergy.value)}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        { color: isSelected ? Colors.light.tint : isDark ? '#FFFFFF' : '#111111' },
                      ]}
                    >
                      {t(allergy.labelKey)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t('profile.dietTitle')}</ThemedText>
            <View style={styles.optionList}>
              {DIET_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.optionRow, { backgroundColor: cardColor }]}
                  onPress={() => {
                    setError(null);
                    setDietType(option.value);
                  }}
                >
                  <ThemedText style={styles.optionText}>{t(option.labelKey)}</ThemedText>
                  {dietType === option.value && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.light.tint} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t('profile.statusTitle')}</ThemedText>
            <ThemedText style={[styles.sectionHint, { color: textMuted }]}>
              {t('profile.statusHint.general')}
            </ThemedText>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: isSelected ? Colors.light.tint : cardColor,
                        borderColor: isSelected ? Colors.light.tint : borderColor,
                      },
                    ]}
                    onPress={() => handleStatusChange(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.statusLabel,
                        { color: isSelected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111111' },
                      ]}
                    >
                      {t(option.labelKey)}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.statusHint,
                        { color: isSelected ? '#FFFFFF' : textMuted },
                      ]}
                    >
                      {t(option.hintKey)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {needsUniversity && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t('profile.universityTitle')}</ThemedText>
              <ThemedText style={[styles.sectionHint, { color: textMuted }]}>
                {t('profile.universityHint')}
              </ThemedText>

              <View style={[styles.searchContainer, { backgroundColor: cardColor }]}>
                <Ionicons name="search" size={18} color={textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#111111' }]}
                  placeholder={t('profile.universitySearchPlaceholder')}
                  placeholderTextColor={textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {isUniversitiesLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.light.tint} />
                  <ThemedText style={[styles.loadingText, { color: textMuted }]}>
                    {t('profile.universityLoading')}
                  </ThemedText>
                </View>
              )}

              {!isUniversitiesLoading && (isError || (universities && universities.length === 0)) && (
                <ThemedText style={[styles.sectionHint, { color: textMuted }]}>
                  {t('profile.universityLoadError')}
                </ThemedText>
              )}

              {!isUniversitiesLoading && filteredUniversities.length > 0 && (
                <View style={styles.optionList}>
                  {filteredUniversities.map((uni) => {
                    const isSelected = universityId === uni.id;
                    return (
                      <Pressable
                        key={uni.id}
                        style={[
                          styles.optionRow,
                          { backgroundColor: cardColor, borderColor: isSelected ? Colors.light.tint : 'transparent', borderWidth: 1 },
                        ]}
                        onPress={() => handleSelectUniversity(uni)}
                      >
                        <View style={styles.universityText}>
                          <ThemedText style={styles.optionText}>{uni.name}</ThemedText>
                          {uni.shortName && (
                            <ThemedText style={[styles.optionSubText, { color: textMuted }]}>
                              {uni.shortName}
                            </ThemedText>
                          )}
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color={Colors.light.tint} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: Colors.light.tint, opacity: canSave ? 1 : 0.5 },
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.saveButtonText}>
                {isEditMode ? t('profile.saveChanges') : t('profile.saveProfile')}
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginBottom: 12,
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  optionList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  optionSubText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  statusRow: {
    gap: 10,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  statusHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 4 }),
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    paddingVertical: 6,
  },
  universityText: {
    flex: 1,
  },
  saveButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 13,
    fontFamily: Fonts.regular,
    flex: 1,
  },
});

