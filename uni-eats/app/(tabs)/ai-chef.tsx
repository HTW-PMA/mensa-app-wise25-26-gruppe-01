import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAiChefResponse, AIChefHistoryMessage, UserPreferences } from '@/services/aiChefApi';
import { useMensas } from '@/hooks/useMensas';
import { useMeals } from '@/hooks/useMeals';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useLocation } from '@/hooks/useLocation';
import { storage } from '@/utils/storage';
import { useTranslation } from '@/hooks/useTranslation';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
};

const SUGGESTION_KEYS = [
  'aiChef.suggestions.vegetarian',
  'aiChef.suggestions.pasta',
  'aiChef.suggestions.budget',
  'aiChef.suggestions.tired',
  'aiChef.suggestions.compare',
];

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

const DIET_OPTIONS: Array<{ value: UserPreferences['dietType']; labelKey: string }> = [
  { value: 'none', labelKey: 'profile.diet.none' },
  { value: 'vegetarian', labelKey: 'profile.diet.vegetarian' },
  { value: 'vegan', labelKey: 'profile.diet.vegan' },
  { value: 'pescatarian', labelKey: 'profile.diet.pescatarian' },
];

const STORAGE_KEY_PREFERENCES = 'ai_chef_user_preferences';

export default function AiChefScreen() {
  const { t } = useTranslation();
  const initialMessages = useMemo<Message[]>(
    () => [
      { id: 'ai-1', text: t('aiChef.messages.greeting'), sender: 'assistant' },
      { id: 'ai-2', text: t('aiChef.messages.prompt'), sender: 'assistant' },
    ],
    [t]
  );

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Local state for smooth input handling
  const [localBudget, setLocalBudget] = useState('');

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    allergies: [],
    dietType: 'none',
    dailyBudget: undefined,
    spentToday: 0,
  });

  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);

  const insets = useSafeAreaInsets();

  // Data
  const { data: mensas, isLoading: isLoadingMensas, isError: isMensasError } = useMensas();
  const { data: meals, isLoading: isLoadingMeals, isError: isMealsError } = useMeals();
  const { favoriteCanteenIds, favoriteMeals } = useFavoritesContext();
  const { location } = useLocation();

  const isLoadingContext = isLoadingMensas || isLoadingMeals;
  const isErrorContext = isMensasError || isMealsError;

  const favoriteMealIds = useMemo(
    () => Array.from(new Set(favoriteMeals.map((favorite) => favorite.mealId))),
    [favoriteMeals]
  );

  // Theme colors
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');

  const inputBackgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#EEEEEE', dark: '#333333' }, 'background');
  const aiBubbleColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const chipBackgroundColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const modalBackground = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');

  const primaryGreen = Colors.light.tint;

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      const hasUserMessage = prev.some((message) => message.sender === 'user');
      return hasUserMessage ? prev : initialMessages;
    });
  }, [initialMessages]);

  // Sync local budget input when preferences change (e.g. after loading)
  useEffect(() => {
    setLocalBudget(preferences.dailyBudget?.toString() || '');
  }, [preferences.dailyBudget]);

  const loadPreferences = async () => {
    try {
      const saved = await storage.get<UserPreferences>(STORAGE_KEY_PREFERENCES);
      if (saved) {
        setPreferences(saved);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPrefs: UserPreferences) => {
    try {
      await storage.save(STORAGE_KEY_PREFERENCES, newPrefs);
      setPreferences(newPrefs);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const canSend = useMemo(() => {
    return inputText.trim().length > 0 && !loading && !isLoadingContext;
  }, [inputText, loading, isLoadingContext]);

  const scrollToEnd = (animated = true) => {
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated }));
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToEnd(true), 100);
    return () => clearTimeout(timer);
  }, [messages.length, loading]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => scrollToEnd(true)
    );
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const buildHistory = (): AIChefHistoryMessage[] => {
    const recent = messages.slice(-8);
    return recent.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalText = (textToSend ?? inputText).trim();
    if (!finalText || loading || isLoadingContext) return;

    Keyboard.dismiss();

    const userMsg: Message = {
      id: Date.now().toString(),
      text: finalText,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const history = buildHistory();

      const response = await getAiChefResponse(
        finalText,
        {
          mensas: mensas ?? [],
          meals: meals ?? [],
          favoriteCanteenIds,
          favoriteMealIds,
          userPreferences: preferences,
          userLocation: location ?? undefined,
          contextStatus: { isLoadingContext, isErrorContext },
        },
        history
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        text: e instanceof Error ? e.message : t('common.unexpectedError'),
        sender: 'assistant',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToEnd(true), 80);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const toggleAllergy = (allergy: string) => {
    const newAllergies = preferences.allergies?.includes(allergy)
      ? preferences.allergies.filter((a) => a !== allergy)
      : [...(preferences.allergies || []), allergy];

    savePreferences({ ...preferences, allergies: newAllergies });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: primaryGreen }]
            : [styles.aiBubble, { backgroundColor: aiBubbleColor }],
        ]}
      >
        <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : textColor, includeFontPadding: false }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0;

  // Preferences badge count
  const preferencesCount =
    (preferences.allergies?.length || 0) +
    (preferences.dietType !== 'none' ? 1 : 0) +
    (preferences.dailyBudget ? 1 : 0);

  const showSuggestions = messages.length <= initialMessages.length && !loading;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}> 
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: borderColor,
            backgroundColor,
            paddingTop: Math.max(insets.top, 16) + 8,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="restaurant-outline" size={22} color={primaryGreen} style={{ marginRight: 8 }} />
            <Text style={[styles.headerTitle, { color: textColor }]}>{t('aiChef.title')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.prefsButton, { backgroundColor: chipBackgroundColor }]}
            onPress={() => setShowPreferences(true)}
          >
            <Ionicons name="options-outline" size={20} color={primaryGreen} />
            {preferencesCount > 0 && (
              <View style={[styles.badge, { backgroundColor: primaryGreen }]}>
                <Text style={styles.badgeText}>{preferencesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToEnd(true)}
          contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
        />

        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: aiBubbleColor, marginHorizontal: 16 }]}> 
            <ActivityIndicator color={primaryGreen} />
          </View>
        )}

        {showSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor }]}> 
            <Text style={[styles.suggestionsTitle, { color: subTextColor }]}>{t('aiChef.suggestions.title')}</Text>
            <FlatList
              data={SUGGESTION_KEYS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.suggestionChip, { backgroundColor: chipBackgroundColor }]}
                  onPress={() => handleSuggestionPress(t(item))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.suggestionText, { color: textColor }]}>{t(item)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: borderColor,
              backgroundColor,
              paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 4,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: inputBackgroundColor,
                color: textColor,
                fontFamily: Fonts.regular,
              },
            ]}
            placeholder={t('aiChef.input.placeholder')}
            placeholderTextColor={subTextColor}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={() => handleSendMessage()}
            editable={!loading && !isLoadingContext}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: primaryGreen,
                opacity: canSend ? 1 : 0.4,
              },
            ]}
            onPress={() => handleSendMessage()}
            activeOpacity={0.8}
            disabled={!canSend}
          >
            <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Preferences Modal */}
      <Modal
        visible={showPreferences}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreferences(false)}
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: modalBackground }]}> 
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('aiChef.preferences.title')}</Text>
            <TouchableOpacity onPress={() => setShowPreferences(false)}>
              <Ionicons name="close" size={28} color={textColor} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <ScrollView style={styles.modalContent}>
              {/* Allergies */}
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profile.allergiesTitle')}</Text>
              <View style={styles.allergyGrid}>
                {ALLERGEN_OPTIONS.map((allergy) => {
                  const isSelected = preferences.allergies?.includes(allergy.value);
                  return (
                    <TouchableOpacity
                      key={allergy.value}
                      style={[
                        styles.allergyChip,
                        { backgroundColor: chipBackgroundColor, borderColor: isSelected ? primaryGreen : 'transparent', borderWidth: 2 },
                      ]}
                      onPress={() => toggleAllergy(allergy.value)}
                    >
                      <Text style={[styles.allergyText, { color: isSelected ? primaryGreen : textColor }]}>
                        {t(allergy.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Diet Type */}
              <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>{t('profile.dietTitle')}</Text>
              {DIET_OPTIONS.map((diet) => (
                <TouchableOpacity
                  key={diet.value}
                  style={[styles.dietOption, { backgroundColor: chipBackgroundColor }]}
                  onPress={() => savePreferences({ ...preferences, dietType: diet.value })}
                >
                  <Text style={[styles.dietText, { color: textColor }]}>
                    {t(diet.labelKey)}
                  </Text>
                  {preferences.dietType === diet.value && <Ionicons name="checkmark-circle" size={24} color={primaryGreen} />}
                </TouchableOpacity>
              ))}

              {/* Budget */}
              <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>{t('aiChef.preferences.budgetTitle')}</Text>
              <View style={[styles.budgetContainer, { backgroundColor: chipBackgroundColor }]}> 
                <TextInput
                  style={[styles.budgetInput, { color: textColor }]}
                  keyboardType="decimal-pad"
                  placeholder={t('aiChef.preferences.budgetPlaceholder')}
                  placeholderTextColor={subTextColor}
                  value={localBudget}
                  onChangeText={setLocalBudget}
                  onEndEditing={() => {
                    const normalized = localBudget.replace(',', '.');
                    const value = parseFloat(normalized);
                    const newBudget = isNaN(value) ? undefined : value;
                    if (newBudget !== preferences.dailyBudget) {
                      savePreferences({ ...preferences, dailyBudget: newBudget });
                    }
                  }}
                />
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingBottom: 12,
      },
      android: {
        paddingBottom: 5,
      }
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    ...Platform.select({
      ios: {
        marginTop: 0,
      },
      android: {
        marginTop: 14,
      }
    }),
  },
  prefsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  keyboardAvoidingView: { flex: 1 },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    includeFontPadding: false,
  },
  suggestionsContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingLeft: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    includeFontPadding: false,
  },
  suggestionsList: {
    paddingRight: 16,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    includeFontPadding: false,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
    includeFontPadding: false,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: Platform.select({
      ios: 16,
      android: 35
    }),
    paddingBottom: Platform.select({
      android: 10,
    }),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  allergyText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    includeFontPadding: false,
  },
  dietOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  dietText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    includeFontPadding: false,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: { paddingVertical: 12 },
      android: { paddingVertical: 2 },
    }),
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    includeFontPadding: false,
    ...Platform.select({
      android: {
        paddingVertical: 6,
        textAlignVertical: 'center',
      },
    }),
  },
});
