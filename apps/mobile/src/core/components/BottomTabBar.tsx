import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageSquare, Sparkles, KeyRound } from 'lucide-react-native';
import { getThemeColors, getTranslation, THEME } from '@chatbyok/core';
import { useAppStore, ActiveTab } from '../store/useAppStore';

export function BottomTabBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const colors = getThemeColors(theme);
  const t = getTranslation(language);

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'chat', label: t.nav.chat, icon: MessageSquare },
    { id: 'prompts', label: t.nav.prompts, icon: Sparkles },
    { id: 'settings', label: t.nav.settings, icon: KeyRound },
  ];

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
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;
        const tintColor = isActive ? colors.brand.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabButton}
          >
            <IconComponent size={20} color={tintColor} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: tintColor,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: THEME.fontSizeNum.xs,
  },
});
