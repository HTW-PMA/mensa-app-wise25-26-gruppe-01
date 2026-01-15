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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAiChefResponse, AIChefHistoryMessage } from '@/services/aiChefApi';
import { useMensas } from '@/hooks/useMensas';
import { useMeals } from '@/hooks/useMeals';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useLocation } from '@/hooks/useLocation';
import { useTranslation } from '@/hooks/useTranslation';
import { useProfile } from '@/contexts/ProfileContext';
import { AIMealCard } from '@/components/AIMealCard';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  recommendedMeals?: Array<{
    mealId: string;
    reason: string;
  }>;
  visibleMealsCount?: number; // ✅ neu
};

const SUGGESTION_KEYS = [
  'aiChef.suggestions.vegetarian',
  'aiChef.suggestions.pasta',
  'aiChef.suggestions.budget',
  'aiChef.suggestions.tired',
  'aiChef.suggestions.compare',
];

const MORE_COMMANDS = ['mehr', 'more', 'noch mehr', 'weiter', 'weitere'];

export default function AiChefScreen() {
  const { t } = useTranslation();
  const { profile } = useProfile();

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

  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

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

  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');
  const inputBackgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#EEEEEE', dark: '#333333' }, 'background');
  const aiBubbleColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const chipBackgroundColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const primaryGreen = Colors.light.tint;

  useEffect(() => {
    setMessages((prev) => {
      const hasUserMessage = prev.some((message) => message.sender === 'user');
      return hasUserMessage ? prev : initialMessages;
    });
  }, [initialMessages]);

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
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => scrollToEnd(true));
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const buildHistory = (): AIChefHistoryMessage[] => {
    const recent = messages.slice(-8);
    return recent.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
  };

  /**
   * ✅ Local UI-command: "Mehr"
   * Increases visibleMealsCount on the latest assistant message that contains recommendedMeals.
   * Does NOT call the API.
   */
  const showMoreMeals = () => {
    setMessages((prev) => {
      const lastIdx = [...prev].reverse().findIndex(
          (m) => m.sender === 'assistant' && m.recommendedMeals && m.recommendedMeals.length > 0
      );

      if (lastIdx === -1) return prev;

      const idx = prev.length - 1 - lastIdx;
      const last = prev[idx];
      const total = last.recommendedMeals?.length ?? 0;
      const current = last.visibleMealsCount ?? 3;

      if (total === 0) return prev;

      // already all shown -> add assistant info bubble
      if (current >= total) {
        const infoMsg: Message = {
          id: Date.now().toString(),
          sender: 'assistant',
          text: 'Das waren schon alle passenden Gerichte, die ich heute gefunden habe.',
        };
        return [...prev, infoMsg];
      }

      const next = Math.min(current + 3, total);
      const updated: Message = { ...last, visibleMealsCount: next };
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });

    requestAnimationFrame(() => scrollToEnd(true));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalText = (textToSend ?? inputText).trim();
    if (!finalText || loading || isLoadingContext) return;

    // ✅ Intercept "Mehr" / "More" commands and handle locally
    const lower = finalText.toLowerCase();
    if (MORE_COMMANDS.includes(lower)) {
      if (!textToSend) setInputText('');
      showMoreMeals();
      return;
    }

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
            userPreferences: {
              allergies: profile?.allergies || [],
              dietType: profile?.dietType || 'none',
            },
            userLocation: location ?? undefined,
            contextStatus: { isLoadingContext, isErrorContext },
          },
          history
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'assistant',
        recommendedMeals: response.recommendedMeals,
        visibleMealsCount: 3, // ✅ start with 3
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

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
        <View style={{ marginBottom: 12 }}>
          {/* User Bubble */}
          {isUser && (
              <View style={[styles.messageBubble, styles.userBubble, { backgroundColor: primaryGreen }]}>
                <Text style={[styles.messageText, { color: '#FFFFFF', includeFontPadding: false }]}>{item.text}</Text>
              </View>
          )}

          {/* AI Meals -> render cards (sliced) + auto "Mehr" button */}
          {!isUser && item.recommendedMeals && item.recommendedMeals.length > 0 && (
              <View>
                {item.recommendedMeals
                    .slice(0, item.visibleMealsCount ?? 3) // ✅ only show visible portion
                    .map((rec) => {
                      const meal = meals?.find((m) => m.id === rec.mealId);
                      if (!meal) return null;
                      const canteenName = mensas?.find((m) => m.id === meal.canteenId)?.name;

                      return (
                          <AIMealCard key={rec.mealId} meal={meal} canteenName={canteenName} reason={rec.reason} />
                      );
                    })}

                {/* ✅ "Mehr" button only if there are more meals left */}
                {(item.visibleMealsCount ?? 3) < item.recommendedMeals.length && (
                    <TouchableOpacity
                        style={[styles.suggestionChip, { backgroundColor: primaryGreen, alignSelf: 'flex-end', marginTop: 8 }]}
                        onPress={showMoreMeals}
                        activeOpacity={0.85}
                    >
                      <Text style={[styles.suggestionText, { color: '#FFFFFF' }]}>Mehr</Text>
                    </TouchableOpacity>
                )}
              </View>
          )}

          {/* AI Text fallback */}
          {!isUser && (!item.recommendedMeals || item.recommendedMeals.length === 0) && (
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: aiBubbleColor }]}>
                <Text style={[styles.messageText, { color: textColor, includeFontPadding: false }]}>{item.text}</Text>
              </View>
          )}
        </View>
    );
  };

  const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0;
  const showSuggestions = messages.length <= initialMessages.length && !loading;

  return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
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
                  { backgroundColor: inputBackgroundColor, color: textColor, fontFamily: Fonts.regular },
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
                style={[styles.sendButton, { backgroundColor: primaryGreen, opacity: canSend ? 1 : 0.4 }]}
                onPress={() => handleSendMessage()}
                activeOpacity={0.8}
                disabled={!canSend}
            >
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    ...Platform.select({ ios: { paddingBottom: 12 }, android: { paddingBottom: 5 } }),
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    ...Platform.select({ ios: { marginTop: 0 }, android: { marginTop: 14 } }),
  },
  keyboardAvoidingView: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingTop: 16 },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 12 },
  aiBubble: { alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', borderTopRightRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 22, fontFamily: Fonts.regular, includeFontPadding: false },

  suggestionsContainer: { paddingTop: 8, paddingBottom: 12, paddingLeft: 16 },
  suggestionsTitle: { fontSize: 14, fontFamily: Fonts.bold, marginBottom: 8, includeFontPadding: false },
  suggestionsList: { paddingRight: 16 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  suggestionText: { fontSize: 14, fontFamily: Fonts.regular, includeFontPadding: false },

  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginRight: 10, includeFontPadding: false },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
