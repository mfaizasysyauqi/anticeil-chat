import React, { useState, useMemo } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface LanguageTabProps {
  locale?: string;
  setLocale?: (locale: any) => void;
}

export function LanguageTab({
  locale: propLocale,
  setLocale: propSetLocale,
}: LanguageTabProps) {
  const { t, locale: contextLocale, setLocale: contextSetLocale } = useTranslation();
  const locale = propLocale ?? contextLocale;
  const setLocale = propSetLocale ?? contextSetLocale;
  // ==========================================
  // LANGUAGE & TIME STATES (Discord Parity)
  // ==========================================
  const [timeFormat, setTimeFormat] = useState<'auto' | '12h' | '24h'>(() => {
    try {
      return (localStorage.getItem('anticeil_time_format') as any) || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() => {
    return locale === 'id' ? 'id-ID' : 'en-US';
  });
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Sync code when locale changes
  React.useEffect(() => {
    setSelectedLanguageCode(locale === 'id' ? 'id-ID' : 'en-US');
  }, [locale]);

  const languagesList = useMemo(
    () => [
      { code: 'id-ID', locale: 'id' as const, flag: '🇮🇩', name: 'Bahasa Indonesia' },
      { code: 'en-US', locale: 'en' as const, flag: '🇺🇸', name: 'English' },
    ],
    [],
  );

  const currentLanguage = useMemo(() => {
    return languagesList.find((l) => l.code === selectedLanguageCode) || languagesList[0];
  }, [languagesList, selectedLanguageCode]);

  return (
    <div className="space-y-6 w-full pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Select a Language')}</h2>
        <div className="text-xs text-muted-foreground mt-1">
          {t('Pilih bahasa yang Anda inginkan untuk tampilan Anticeil.')}
        </div>
      </div>

      {/* Language Selector Dropdown / Popover (Matching Screenshot) */}
      <div className="relative">
        <div
          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border text-foreground cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl leading-none">{currentLanguage.flag}</span>
            <span className="text-xs font-semibold text-foreground">{currentLanguage.name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs font-medium">{currentLanguage.name}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isLanguageDropdownOpen && 'rotate-180',
              )}
            />
          </div>
        </div>

        {/* Language Selection List Dropdown */}
        {isLanguageDropdownOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 p-2 rounded-2xl border border-border/80 bg-[#1e1f22] shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
            {languagesList.map((lang) => {
              const isSelected = selectedLanguageCode === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguageCode(lang.code);
                    setLocale(lang.locale);
                    setIsLanguageDropdownOpen(false);
                    toast.success(
                      t('Bahasa diubah ke {{name}}', { name: lang.name })
                    );
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted/40 text-foreground',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time format (Matching Screenshot) */}
      <div className="space-y-3 pt-4">
        <div className="text-xs font-bold text-foreground">{t('Time format')}</div>
        <div className="space-y-2.5">
          {[
            {
              id: 'auto',
              title: t('Auto'),
              desc: t('Matches your selected language locale settings'),
            },
            {
              id: '12h',
              title: t('12-hour'),
              desc: t('Example: 1:33 PM'),
            },
            {
              id: '24h',
              title: t('24-hour'),
              desc: t('Example: 13:33'),
            },
          ].map((tf) => {
            const isSelected = timeFormat === tf.id;
            return (
              <div
                key={tf.id}
                onClick={() => {
                  setTimeFormat(tf.id as any);
                  try {
                    localStorage.setItem('anticeil_time_format', tf.id);
                  } catch {}
                  toast.success(
                    t('Format waktu diubah ke {{title}}', { title: tf.title })
                  );
                }}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-primary/5 border-primary'
                          : 'bg-card border-border/70 hover:bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'size-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                          isSelected ? 'border-primary' : 'border-muted-foreground/50',
                        )}
                      >
                        {isSelected && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4 min-w-0">
                        <span className="text-xs font-semibold text-foreground shrink-0">{tf.title}</span>
                        <span className="text-[11px] text-muted-foreground font-mono sm:text-right pl-3">
                          {tf.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

  );
}
