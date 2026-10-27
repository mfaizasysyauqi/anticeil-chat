import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { idTranslations } from './locales/id';
import { enTranslations } from './locales/en';

export type SupportedLocale = 'id' | 'en';

export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (text: string, params?: Record<string, any>) => string;
}

const LOCALE_STORAGE_KEY = 'anticeil_locale';

const dictionaries: Record<SupportedLocale, Record<string, string>> = {
  id: idTranslations,
  en: enTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale;
      if (saved === 'id' || saved === 'en') {
        return saved;
      }
    } catch {}
    return 'id'; // Default to Indonesian
  });

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {}
  }, []);

  const t = useCallback(
    (text: string, params?: Record<string, any>): string => {
      const dict = dictionaries[locale] || dictionaries.id;
      let translated = dict[text] ?? text;

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          translated = translated.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
        }
      }

      return translated;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
