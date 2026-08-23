import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getThemeColors } from '@anticeil/core';
import { useAppStore } from './src/core/store/useAppStore';
import { Header } from './src/core/components/Header';
import { BottomTabBar } from './src/core/components/BottomTabBar';
import { ChatScreen } from './src/features/chat/presentation/ChatScreen';
import { PromptsScreen } from './src/features/prompts/presentation/PromptsScreen';
import { SettingsScreen } from './src/features/settings/presentation/SettingsScreen';

function MainApp() {
  const insets = useSafeAreaInsets();
  const activeTab = useAppStore((s) => s.activeTab);
  const theme = useAppStore((s) => s.theme);
  const colors = getThemeColors(theme);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSurface,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Header />
      <View style={[styles.main, { backgroundColor: colors.bgMain }]}>
        {activeTab === 'chat' && <ChatScreen />}
        {activeTab === 'prompts' && <PromptsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>
      <BottomTabBar />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    flex: 1,
  },
});
