import React, { useRef } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Bot, Shield } from 'lucide-react-native';
import { MessageBubble } from './components/MessageBubble';
import { ChatInputBar } from './components/ChatInputBar';
import { SessionDrawer } from './components/SessionDrawer';
import { getThemeColors, getTranslation, THEME } from '@anticeil/core';
import { useAppStore } from '../../../core/store/useAppStore';
import { useChatStore } from '../store/useChatStore';
import { useDeviceLayout } from '../../../core/hooks/useDeviceLayout';

export function ChatScreen() {
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const colors = getThemeColors(theme);
  const t = getTranslation(language);
  const { isSplitView } = useDeviceLayout();

  const messages = useChatStore((s) => s.getActiveMessages());
  const sendMessage = useChatStore((s) => s.sendMessage);
  const flatListRef = useRef<FlatList>(null);

  const chatPane = (
    <View style={styles.chatPane}>
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: colors.brand.primary },
            ]}
          >
            <Bot size={36} color="#FFFFFF" />
          </View>

          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t.app.name}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t.app.tagline}
          </Text>

          <View
            style={[
              styles.badge,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
            ]}
          >
            <Shield size={14} color={colors.accent.success} />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              100% Client-side BYOK
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <ChatInputBar onSend={(text) => sendMessage(text)} />
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgMain, flexDirection: isSplitView ? 'row' : 'column' },
      ]}
    >
      {/* If split-view on tablet/landscape, render session drawer inline on left */}
      <SessionDrawer isInline={isSplitView} />
      {chatPane}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatPane: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: THEME.radiusNum.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: THEME.fontSizeNum.xl,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: THEME.fontSizeNum.sm,
    textAlign: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radiusNum.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: THEME.fontSizeNum.xs,
    fontWeight: '600',
  },
});
