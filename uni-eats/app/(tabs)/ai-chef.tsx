import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

import { getAiChefResponse } from '@/services/aiChefApi';
import { useMensas } from '@/hooks/useMensas';
import { useMeals } from '@/hooks/useMeals';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ChatMessage =
    | { id: string; role: 'assistant'; kind: 'intro' }
    | { id: string; role: 'assistant' | 'user'; kind: 'text'; text: string };

const SUGGESTIONS = [
  'What should I eat today?',
  'Something vegan',
  'Healthy options',
  'Based on my favorites',
] as const;

export default function AiChefScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';

  // Theme tokens
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  // Manual colors (keine neuen Tokens!)
  const border = scheme === 'dark' ? '#26322A' : '#E5E7EB';
  const muted = scheme === 'dark' ? '#A7B0AA' : '#6B7280';
  const subtext = scheme === 'dark' ? '#C9D1CB' : '#374151';
  const cardBg = scheme === 'dark' ? '#121A14' : '#FFFFFF';
  const inputBg = scheme === 'dark' ? '#121A14' : '#F3F4F6';
  const bottomBarBg = scheme === 'dark' ? '#0F1511' : '#FFFFFF';
  const badgeBg = scheme === 'dark' ? '#12301A' : '#E7F8EA';

  // Data
  const { data: mensas, isLoading: isLoadingMensas, isError: isMensasError } = useMensas();
  const { data: meals, isLoading: isLoadingMeals, isError: isMealsError } = useMeals();
  const { favoriteCanteenIds, favoriteMealIds } = useFavoritesContext();

  const isLoadingContext = isLoadingMensas || isLoadingMeals;
  const isErrorContext = isMensasError || isMealsError;

  // Chat state
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'assistant', kind: 'intro' },
  ]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const canSend = useMemo(
      () => input.trim().length > 0 && !loading && !isLoadingContext,
      [input, loading, isLoadingContext]
  );

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  const handleChipPress = (value: string) => {
    setInput(value);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSend = async () => {
    if (!canSend) return;

    const trimmed = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', kind: 'text', text: trimmed },
    ]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
          .filter((m): m is Extract<ChatMessage, { kind: 'text' }> => m.kind === 'text')
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.text }));

      const response = await getAiChefResponse(
          trimmed,
          {
            mensas: mensas ?? [],
            meals: meals ?? [],
            favoriteCanteenIds,
            favoriteMealIds,
            contextStatus: { isLoadingContext, isErrorContext },
          },
          history
      );

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', kind: 'text', text: response },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          kind: 'text',
          text: e instanceof Error ? e.message : 'Unexpected error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
      <ThemedView style={[styles.root, { backgroundColor: bg }]}>
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <MaterialCommunityIcons name="robot-outline" size={20} color={tint} />
              </View>

              <View style={styles.headerText}>
                <Text style={[styles.title, { color: text, fontFamily: Fonts.bold }]}>
                  AI Chef
                </Text>
                <Text style={[styles.subtitle, { color: muted, fontFamily: Fonts.regular }]}>
                  Your personal food advisor
                </Text>
              </View>
            </View>

            <View style={[styles.headerDivider, { borderBottomColor: border }]} />

            {/* Content */}
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
              {messages.map((m) =>
                  m.kind === 'intro' ? (
                      <View key={m.id} style={styles.rowLeft}>
                        <View style={[styles.smallBadge, { backgroundColor: badgeBg }]}>
                          <MaterialCommunityIcons name="robot-outline" size={18} color={tint} />
                        </View>

                        <View
                            style={[
                              styles.introCard,
                              { backgroundColor: cardBg, borderColor: border },
                            ]}
                        >
                          <Text style={[styles.introTitle, { fontFamily: Fonts.bold }]}>
                            Hi! I&apos;m your AI Chef assistant 🍽️
                          </Text>

                          <Text style={[styles.introParagraph, { color: subtext }]}>
                            I can help you find the perfect meal based on today&apos;s menu and your
                            favorites. Try asking me:
                          </Text>

                          {[
                            "'What should I eat today?'",
                            "'Recommend something vegan'",
                            "'I want something healthy'",
                            "'Based on my favorites'",
                          ].map((t) => (
                              <Text key={t} style={[styles.bulletText, { color: subtext }]}>
                                • {t}
                              </Text>
                          ))}
                        </View>
                      </View>
                  ) : (
                      <View
                          key={m.id}
                          style={[
                            styles.msgRow,
                            m.role === 'user' ? styles.rowRight : styles.rowLeftOnly,
                          ]}
                      >
                        {m.role !== 'user' && (
                            <View style={[styles.smallBadge, { backgroundColor: badgeBg }]}>
                              <MaterialCommunityIcons name="robot-outline" size={18} color={tint} />
                            </View>
                        )}

                        <View
                            style={[
                              styles.bubble,
                              m.role === 'user'
                                  ? { backgroundColor: tint }
                                  : { backgroundColor: cardBg, borderColor: border },
                            ]}
                        >
                          <Text
                              style={[
                                styles.bubbleText,
                                { color: m.role === 'user' ? '#fff' : subtext },
                              ]}
                          >
                            {m.text}
                          </Text>
                        </View>
                      </View>
                  )
              )}

              {loading && (
                  <View style={styles.rowLeftOnly}>
                    <View style={[styles.smallBadge, { backgroundColor: badgeBg }]}>
                      <MaterialCommunityIcons name="robot-outline" size={18} color={tint} />
                    </View>
                    <View style={[styles.bubble, { backgroundColor: cardBg }]}>
                      <ActivityIndicator color={tint} />
                    </View>
                  </View>
              )}

              {/* Chips */}
              <View style={styles.tryAskingWrap}>
                <Text style={[styles.tryAskingLabel, { color: muted }]}>✨ Try asking:</Text>
                <View style={styles.chipsWrap}>
                  {SUGGESTIONS.map((s) => (
                      <Pressable
                          key={s}
                          onPress={() => handleChipPress(s)}
                          style={[
                            styles.chip,
                            { backgroundColor: cardBg, borderColor: border },
                          ]}
                      >
                        <Text style={{ color: text }}>{s}</Text>
                      </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom input */}
            <View style={[styles.bottomBar, { backgroundColor: bottomBarBg, borderTopColor: border }]}>
              <View style={styles.inputRow}>
                <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask me anything about food..."
                    placeholderTextColor={scheme === 'dark' ? '#7C8A80' : '#9CA3AF'}
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, borderColor: border, color: text },
                    ]}
                    onSubmitEditing={handleSend}
                />

                <Pressable
                    onPress={handleSend}
                    disabled={!canSend}
                    style={[
                      styles.sendBtn,
                      { backgroundColor: tint, opacity: canSend ? 1 : 0.4 },
                    ]}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  headerDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 8,
  },

  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: { marginLeft: 12 },
  title: { fontSize: 18 },
  subtitle: { fontSize: 13, marginTop: 2 },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  rowLeft: { flexDirection: 'row', alignItems: 'flex-start' },
  rowLeftOnly: { flexDirection: 'row', marginTop: 12 },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },

  msgRow: { gap: 10 },

  smallBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 6,
  },

  introCard: {
    maxWidth: '88%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },

  introTitle: { fontSize: 16, marginBottom: 8 },
  introParagraph: { fontSize: 14, marginBottom: 8 },
  bulletText: { fontSize: 14, marginTop: 4 },

  bubble: {
    maxWidth: '85%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  bubbleText: { fontSize: 14 },

  tryAskingWrap: { marginTop: 20 },
  tryAskingLabel: { fontSize: 13, marginBottom: 10 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

