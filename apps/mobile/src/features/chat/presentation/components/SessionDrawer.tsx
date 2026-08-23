import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { MessageSquare, Trash2, X, Plus, Bot } from 'lucide-react-native';
import { getThemeColors, getModelById, THEME } from '@anticeil/core';
import { useAppStore } from '../../../../core/store/useAppStore';
import { useChatStore } from '../../store/useChatStore';

interface SessionDrawerProps {
  isInline?: boolean;
}

export function SessionDrawer({ isInline = false }: SessionDrawerProps) {
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const theme = useAppStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const selectSession = useChatStore((s) => s.selectSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const createSession = useChatStore((s) => s.createSession);

  const content = (
    <View
      style={[
        isInline ? styles.inlineContainer : styles.drawerContent,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong },
      ]}
    >
      {/* Drawer Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.titleRow}>
          <Bot size={18} color={colors.brand.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Chat Sessions</Text>
        </View>
        {!isInline && (
          <TouchableOpacity
            onPress={() => setDrawerOpen(false)}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        onPress={() => {
          createSession();
          if (!isInline) setDrawerOpen(false);
        }}
        style={[styles.newChatBtn, { backgroundColor: colors.brand.primary }]}
      >
        <Plus size={16} color="#FFFFFF" />
        <Text style={styles.newChatText}>New Conversation</Text>
      </TouchableOpacity>

      {/* Session List */}
      <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const modelDef = getModelById(session.modelId);

          return (
            <TouchableOpacity
              key={session.id}
              onPress={() => {
                selectSession(session.id);
                if (!isInline) setDrawerOpen(false);
              }}
              style={[
                styles.sessionItem,
                {
                  backgroundColor: isActive ? colors.bgSubtle : 'transparent',
                  borderColor: isActive ? colors.borderStrong : 'transparent',
                },
              ]}
            >
              <MessageSquare
                size={16}
                color={isActive ? colors.brand.primary : colors.textMuted}
              />
              <View style={styles.sessionInfo}>
                <Text
                  style={[
                    styles.sessionTitle,
                    {
                      color: isActive ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isActive ? '700' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {session.title}
                </Text>
                <Text style={[styles.modelLabel, { color: colors.textMuted }]}>
                  {modelDef?.name || session.modelId}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => deleteSession(session.id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isInline) {
    return content;
  }

  if (!isDrawerOpen) return null;

  return (
    <Modal
      visible={isDrawerOpen}
      animationType="fade"
      transparent
      onRequestClose={() => setDrawerOpen(false)}
    >
      <View style={styles.overlay}>{content}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-start',
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  inlineContainer: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: THEME.fontSizeNum.md,
    fontWeight: '700',
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: THEME.radiusNum.md,
    marginVertical: 14,
  },
  newChatText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: THEME.fontSizeNum.sm,
  },
  sessionList: {
    flex: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    minHeight: 44,
    borderRadius: THEME.radiusNum.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: THEME.fontSizeNum.sm,
  },
  modelLabel: {
    fontSize: THEME.fontSizeNum.micro,
    marginTop: 2,
  },
  deleteBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
