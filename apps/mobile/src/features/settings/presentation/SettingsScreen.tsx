import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { KeyRound, Check, ShieldCheck } from 'lucide-react-native';
import {
  PROVIDER_DEFINITIONS,
  getThemeColors,
  getTranslation,
  THEME,
} from '@anticeil/core';
import { useAppStore } from '../../../core/store/useAppStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useDeviceLayout } from '../../../core/hooks/useDeviceLayout';

export function SettingsScreen() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const colors = getThemeColors(theme);
  const t = getTranslation(language);
  const { isSplitView } = useDeviceLayout();

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgMain }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerBox}>
        <View style={styles.titleRow}>
          <KeyRound size={20} color={colors.brand.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t.settings.title}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t.settings.subtitle}
        </Text>
      </View>

      {/* Preferences (Theme & Language) */}
      <View
        style={[
          styles.prefCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.prefRow}>
          <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>Theme Mode</Text>
          <TouchableOpacity
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={[styles.prefBtn, { backgroundColor: colors.bgSubtle }]}
          >
            <Text style={[styles.prefBtnText, { color: colors.textPrimary }]}>
              {theme.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.prefRow}>
          <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>Language</Text>
          <TouchableOpacity
            onPress={() => setLanguage(language === 'en' ? 'id' : 'en')}
            style={[styles.prefBtn, { backgroundColor: colors.bgSubtle }]}
          >
            <Text style={[styles.prefBtnText, { color: colors.textPrimary }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Provider Keys Responsive Grid */}
      <View style={[styles.grid, isSplitView && styles.gridSplit]}>
        {PROVIDER_DEFINITIONS.map((provider) => {
          const config = apiKeys[provider.id];
          const hasKey = provider.requiresApiKey
            ? Boolean(config?.apiKey && config.apiKey.length > 5)
            : true;

          return (
            <View
              key={provider.id}
              style={[
                styles.card,
                isSplitView && styles.cardSplit,
                { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.providerName, { color: colors.textPrimary }]}>
                  {provider.name}
                </Text>
                {hasKey && (
                  <View
                    style={[
                      styles.readyBadge,
                      { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                    ]}
                  >
                    <Check size={11} color={colors.accent.success} />
                    <Text style={[styles.readyText, { color: colors.accent.success }]}>
                      Ready
                    </Text>
                  </View>
                )}
              </View>

              {provider.requiresApiKey && (
                <TextInput
                  value={config?.apiKey || ''}
                  onChangeText={(val) => setApiKey(provider.id, val)}
                  placeholder={`Enter ${provider.name} API Key`}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bgInput,
                      borderColor: colors.borderStrong,
                      color: colors.textPrimary,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.privacyNote}>
        <ShieldCheck size={16} color={colors.accent.success} />
        <Text style={[styles.privacyText, { color: colors.textMuted }]}>
          Keys are stored strictly on local device memory.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  headerBox: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: THEME.fontSizeNum.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: THEME.fontSizeNum.xs,
    lineHeight: 16,
  },
  prefCard: {
    padding: 14,
    borderRadius: THEME.radiusNum.md,
    borderWidth: 1,
    gap: 12,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  prefLabel: {
    fontSize: THEME.fontSizeNum.sm,
    fontWeight: '600',
  },
  prefBtn: {
    paddingHorizontal: 16,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radiusNum.sm,
  },
  prefBtnText: {
    fontSize: THEME.fontSizeNum.xs,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  gridSplit: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    padding: 14,
    borderRadius: THEME.radiusNum.md,
    borderWidth: 1,
    gap: 8,
    width: '100%',
  },
  cardSplit: {
    width: '48.5%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  providerName: {
    fontSize: THEME.fontSizeNum.base,
    fontWeight: '600',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radiusNum.full,
  },
  readyText: {
    fontSize: THEME.fontSizeNum.micro,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: THEME.radiusNum.sm,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: THEME.fontSizeNum.sm,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  privacyText: {
    fontSize: THEME.fontSizeNum.xs,
  },
});
