import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, View, useColorScheme, Text, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};


// Initial messages in German
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hi! Ich bin dein AI-Chef-Assistent 🍽️ \nIch helfe dir, das perfekte Gericht basierend auf deinen Vorlieben und Favoriten zu finden.',
    sender: 'ai'
  },
];

const SUGGESTIONS = [
  "Vegetarisch 🌱",
  "Pasta 🍝",
  "Fleisch 🥩",
  "Günstig 💶",
  "Salat 🥗"
];

export default function AiChefScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  
  // Get theme colors using useThemeColor hook for consistency
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const subTextColor = useThemeColor({ light: '#666666', dark: '#9BA1A6' }, 'text');
  const iconColor = useThemeColor({ light: '#687076', dark: '#9BA1A6' }, 'icon');
  
  // Specific UI colors based on theme
  const inputBackgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#1C1C1E' }, 'background');
  const borderColor = useThemeColor({ light: '#EEEEEE', dark: '#333333' }, 'background');
  const aiBubbleColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const chipBackgroundColor = useThemeColor({ light: '#F0F0F0', dark: '#2C2C2E' }, 'background');
  const primaryGreen = Colors.light.tint; // Use the brand tint color

    const handleSendMessage = (textToSend?: string) => {
      const finalItem = textToSend || inputText;
      if (finalItem.trim().length === 0) return;
  
      Keyboard.dismiss();

      const newMessage: Message = {
        id: Date.now().toString(),
        text: finalItem,
        sender: 'user',
      };
  
      setMessages((prev) => [...prev, newMessage]);
      if (!textToSend) setInputText('');
  
      // Scroll to end after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Mock AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Ich suche dir gleich ein passendes Gericht heraus! (KI-Logik wird noch verbunden)',
          sender: 'ai',
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1000);
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
          <Text 
            style={[
              isUser ? styles.userText : styles.aiText,
              { color: isUser ? '#FFFFFF' : textColor }
            ]}
          >
            {item.text}
          </Text>
        </View>
      );
    };
  
    return (
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>👨‍🍳 AI-Chef</Text>
        </View>
  
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
  
          {/* Try Asking Zone */}
          {messages.length === 1 && (
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
                  >
                    <Text style={[styles.suggestionText, { color: textColor }]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
  
          {/* Input Area */}
          <View style={[styles.inputContainer, { borderTopColor: borderColor, backgroundColor }]}>
            <TextInput
              style={[ 
                styles.input, 
                { 
                  backgroundColor: inputBackgroundColor, 
                  color: textColor,
                  fontFamily: Fonts.regular
                }
              ]}
              placeholder="Was möchtest du essen?"
              placeholderTextColor={colorScheme === 'dark' ? '#9BA1A6' : '#999999'}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: primaryGreen }]} 
              onPress={() => handleSendMessage()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    lineHeight: 32,
    includeFontPadding: false,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
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
  aiText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.regular,
  },
  suggestionsContainer: {
    paddingVertical: 10,
    paddingLeft: 16,

  },
  suggestionsTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 1,
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
    padding: 12,
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