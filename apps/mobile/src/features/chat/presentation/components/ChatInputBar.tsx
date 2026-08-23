import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Send, Square } from 'lucide-react-native';
import { getThemeColors, getTranslation, THEME } from '@chatbyok/core';
import { useAppStore } from '../../../../core/store/useAppStore';
import { useChatStore } from '../../store/useChatStore';

interface ChatInputBarProps {
  onSend: (text: string) => void;
}

export function ChatInputBar({ onSend }: ChatInputBarProps) {
  const [text, setText] = useState('');
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const stopGeneration = useChatStore((s) => s.stopGeneration);

  const colors = getThemeColors(theme);
  const t = getTranslation(language);

  const handleSend = () => {
    if (!text.trim() || isGenerating) return;
    onSend(text);
    setText('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.bgInput,
            borderColor: colors.borderStrong,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t.chat.placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={4000}
          style={[styles.input, { color: colors.textPrimary }]}
        />

        {isGenerating ? (
          <TouchableOpacity
            onPress={stopGeneration}
            style={[styles.actionButton, { backgroundColor: colors.accent.danger }]}
          >
            <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            style={[
              styles.actionButton,
              {
                backgroundColor: text.trim() ? colors.brand.primary : colors.bgSubtle,
              },
            ]}
          >
            <Send
              size={15}
              color={text.trim() ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: THEME.radiusNum.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: THEME.fontSizeNum.base,
    paddingVertical: 6,
    maxHeight: 120,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: THEME.radiusNum.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
