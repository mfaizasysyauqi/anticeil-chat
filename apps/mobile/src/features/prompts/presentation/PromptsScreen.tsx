import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Sparkles, ArrowRight, Bot } from 'lucide-react-native';
import { getThemeColors, getTranslation, THEME, Persona } from '@anticeil/core';
import { useAppStore } from '../../../core/store/useAppStore';
import { usePromptStore } from '../store/usePromptStore';
import { useChatStore } from '../../chat/store/useChatStore';
import { useDeviceLayout } from '../../../core/hooks/useDeviceLayout';

export function PromptsScreen() {
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const colors = getThemeColors(theme);
  const t = getTranslation(language);
  const { isSplitView } = useDeviceLayout();

  const personas = usePromptStore((s) => s.personas);
  const createSession = useChatStore((s) => s.createSession);

  const handleUsePersona = (persona: Persona) => {
    createSession(undefined, undefined, persona.systemPrompt);
    setActiveTab('chat');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgMain }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBox}>
        <View style={styles.titleRow}>
          <Sparkles size={20} color={colors.brand.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t.prompts.title}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t.prompts.subtitle}
        </Text>
      </View>

      <View style={[styles.grid, isSplitView && styles.gridSplit]}>
        {personas.map((persona) => (
          <View
            key={persona.id}
            style={[
              styles.card,
              isSplitView && styles.cardSplit,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
            ]}
          >
            <View style={styles.topRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: colors.bgSubtle },
                ]}
              >
                <Bot size={20} color={colors.brand.primary} />
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={[styles.personaName, { color: colors.textPrimary }]}>
                  {persona.name}
                </Text>
                <Text style={[styles.categoryTag, { color: colors.textMuted }]}>
                  {persona.category.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {persona.description}
            </Text>

            <TouchableOpacity
              onPress={() => handleUsePersona(persona)}
              style={[
                styles.useBtn,
                { backgroundColor: colors.brand.primary },
              ]}
            >
              <Text style={styles.useBtnText}>{t.prompts.usePersona}</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
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
    padding: 16,
    borderRadius: THEME.radiusNum.md,
    borderWidth: 1,
    gap: 10,
    width: '100%',
  },
  cardSplit: {
    width: '48.5%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radiusNum.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: THEME.fontSizeNum.base,
    fontWeight: '700',
  },
  categoryTag: {
    fontSize: THEME.fontSizeNum.micro,
    fontWeight: '600',
    marginTop: 1,
  },
  description: {
    fontSize: THEME.fontSizeNum.sm,
    lineHeight: 18,
    minHeight: 36,
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: THEME.radiusNum.sm,
    marginTop: 4,
  },
  useBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: THEME.fontSizeNum.sm,
  },
});
