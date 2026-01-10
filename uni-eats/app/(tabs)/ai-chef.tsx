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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { getAiChefResponse, AIChefHistoryMessage } from '@/services/aiChefApi';
import { useMensas } from '@/hooks/useMensas';
import { useMeals } from '@/hooks/useMeals';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text:
        'Hi! Ich bin dein AI-Chef-Assistent 🍽️\n\n' +
        'Ich helfe dir, das perfekte Gericht basierend auf deinen Vorlieben und Favoriten zu finden.',
    sender: 'assistant',
  },
];

const SUGGESTIONS = ['Vegetarisch 🌱', 'Pasta 🍝', 'Fleisch 🥩', 'Günstig 💶', 'Salat 🥗'];

export default function AiChefScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Data
  const { data: mensas, isLoading: isLoadingMensas, isError: isMensasError } = useMensas();
  const { data: meals, isLoading: isLoadingMeals, isError: isMealsError } = useMeals();
  const { favoriteCanteenIds, favoriteMealIds } = useFavoritesContext();

  const isLoadingContext = isLoadingMensas || isLoadingMeals;
  const isErrorContext = isMensasError || isMealsError;

  // Theme colors
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');

  const inputBackgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#EEEEEE', dark: '#333333' }, 'background');
  const aiBubbleColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const chipBackgroundColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');

  const primaryGreen = Colors.light.tint;

  const canSend = useMemo(() => {
    return inputText.trim().length > 0 && !loading && !isLoadingContext;
  }, [inputText, loading, isLoadingContext]);

  const scrollToEnd = (animated = true) => {
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated }));
  };

  useEffect(() => {
    const t = setTimeout(() => scrollToEnd(true), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

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
        text: e instanceof Error ? e.message : 'Unexpected error',
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
        <View
            style={[
              styles.messageBubble,
              isUser
                  ? [styles.userBubble, { backgroundColor: primaryGreen }]
                  : [styles.aiBubble, { backgroundColor: aiBubbleColor }],
            ]}
        >
          <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : textColor }]}>
            {item.text}
          </Text>
        </View>
    );
  };

  // Minimal keyboard offset
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0;

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
          <Text style={[styles.headerTitle, { color: textColor }]}>👨‍🍳 AI-Chef</Text>
        </View>

        <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToEnd(true)}
              contentContainerStyle={[
                styles.messageList,
                {
                  paddingBottom: 8,
                },
              ]}
          />

          {/* Loading bubble */}
          {loading && (
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: aiBubbleColor, marginHorizontal: 16 }]}>
                <ActivityIndicator color={primaryGreen} />
              </View>
          )}

          {/* Try Asking Zone */}
          {messages.length <= 1 && !loading && (
              <View style={[styles.suggestionsContainer, { backgroundColor }]}>
                <Text style={[styles.suggestionsTitle, { color: subTextColor }]}>✨ Probier mal:</Text>
                <FlatList
                    data={SUGGESTIONS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.suggestionsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.suggestionChip, { backgroundColor: chipBackgroundColor }]}
                            onPress={() => handleSuggestionPress(item)}
                            activeOpacity={0.8}
                        >
                          <Text style={[styles.suggestionText, { color: textColor }]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
              </View>
          )}

          {/* Input Area */}
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
                placeholder="Was möchtest du essen?"
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
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    lineHeight: 32,
    includeFontPadding: false,
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
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
    fontSize: 15,
    lineHeight: 21,
    fontFamily: Fonts.regular,
    includeFontPadding: false,
  },

  suggestionsContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingLeft: 16,
  },
  suggestionsTitle: {
    fontSize: 15,
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
    borderRadius: 18,
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 15,
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
});