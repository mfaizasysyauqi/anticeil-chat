import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bot, User, Sparkles } from 'lucide-react-native';
import { ChatMessage, getThemeColors, THEME } from '@chatbyok/core';
import { useAppStore } from '../../../../core/store/useAppStore';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const theme = useAppStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.brand.primary : colors.bgAiBubble,
            borderColor: isUser ? 'transparent' : colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.roleTag}>
            {isUser ? (
              <User size={12} color="#FFFFFF" />
            ) : (
              <Bot size={12} color={colors.brand.primary} />
            )}
            <Text
              style={[
                styles.roleText,
                { color: isUser ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {isUser ? 'You' : 'Assistant'}
            </Text>
          </View>

          {message.tokensUsed && (
            <View style={styles.tokenTag}>
              <Sparkles size={10} color={isUser ? '#E0E7FF' : colors.textMuted} />
              <Text
                style={[
                  styles.tokenText,
                  { color: isUser ? '#E0E7FF' : colors.textMuted },
                ]}
              >
                {message.tokensUsed.total}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.content,
            { color: isUser ? '#FFFFFF' : colors.textPrimary },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    padding: 12,
    borderRadius: THEME.radiusNum.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: THEME.fontSizeNum.xs,
    fontWeight: '700',
  },
  tokenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tokenText: {
    fontSize: THEME.fontSizeNum.micro,
  },
  content: {
    fontSize: THEME.fontSizeNum.base,
    lineHeight: 20,
  },
});
