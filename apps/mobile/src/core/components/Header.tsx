import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu, Plus, Bot } from 'lucide-react-native';
import { getThemeColors, getModelById, THEME } from '@chatbyok/core';
import { useAppStore } from '../store/useAppStore';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { useDeviceLayout } from '../hooks/useDeviceLayout';

export function Header() {
  const theme = useAppStore((s) => s.theme);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const createSession = useChatStore((s) => s.createSession);
  const activeSession = useChatStore((s) => s.getActiveSession());
  const colors = getThemeColors(theme);
  const activeModel = getModelById(activeSession?.modelId || '');
  const { isSplitView } = useDeviceLayout();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.bgSurface,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      {/* If split-view on tablet, drawer button is replaced by logo / spacer */}
      {!isSplitView ? (
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          aria-label="Open sessions drawer"
        >
          <Menu size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.titleContainer}>
        <View style={styles.brandRow}>
          <Bot size={16} color={colors.brand.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>ChatByok</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {activeModel?.name || 'AI Assistant'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => createSession()}
        style={[styles.newChatButton, { backgroundColor: colors.brand.primary }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Plus size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 44,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: THEME.fontSizeNum.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: THEME.fontSizeNum.xs,
    marginTop: 1,
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: THEME.radiusNum.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
