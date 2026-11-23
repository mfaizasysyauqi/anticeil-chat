import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface AccessibilityPreviewProps {
  enableHighContrast: boolean;
  saturationLevel: number;
  chatFontSize: number;
  chatMessageDisplay: 'default' | 'compact';
  spaceMessageGroups: number;
  showUserAvatars: boolean;
  roleColorsDisplay: 'names' | 'dot' | 'none';
  alwaysUnderlineLinks: boolean;
  currentUser?: any;
  currentUserName?: string;
}

export function AccessibilityPreview({
  enableHighContrast,
  saturationLevel,
  chatFontSize,
  chatMessageDisplay,
  spaceMessageGroups,
  showUserAvatars,
  roleColorsDisplay,
  alwaysUnderlineLinks,
  currentUser,
  currentUserName,
}: AccessibilityPreviewProps) {
  const { t } = useTranslation();

  const displayName =
    currentUser?.name || currentUserName || currentUser?.username || 'User';
  const avatarUrl = currentUser?.imageUrl || currentUser?.avatar || null;

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between select-none">
        <span>{t('Preview')}</span>
        <span className="text-[10px] text-emerald-400 font-mono font-medium">
          {chatFontSize}px · {saturationLevel}%
        </span>
      </div>
      <div
        className={cn(
          'rounded-2xl border bg-card text-card-foreground p-3.5 sm:p-4 relative shadow-sm transition-all overflow-hidden',
          enableHighContrast ? 'border-2 border-foreground' : 'border-border',
        )}
        style={{
          filter: saturationLevel !== 100 ? `saturate(${saturationLevel}%)` : undefined,
        }}
      >
        <div
          className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4"
          style={{ fontSize: `${chatFontSize}px` }}
        >
          <div className="flex-1 min-w-0 space-y-3 w-full">
            {/* Message 1 */}
            <div
              className={cn(
                'flex items-start gap-3',
                chatMessageDisplay === 'compact' && 'items-baseline gap-2',
              )}
              style={{ marginBottom: `${spaceMessageGroups}px` }}
            >
              {chatMessageDisplay !== 'compact' && showUserAvatars && (
                <div className="size-9 rounded-full bg-muted border border-border/70 overflow-hidden shrink-0 ring-1 ring-border/40 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-bold text-xs truncate max-w-[130px] sm:max-w-none',
                      roleColorsDisplay === 'names'
                        ? 'text-primary'
                        : 'text-foreground',
                    )}
                  >
                    {roleColorsDisplay === 'dot' && (
                      <span className="inline-block size-2 rounded-full bg-primary mr-1.5" />
                    )}
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    13.33
                  </span>
                </div>
                <div className="text-foreground mt-0.5 leading-snug break-words">
                  {t('what happened to all the beans')}
                </div>
                {/* Reactions */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-muted/70 border border-primary/40 text-[11px] font-bold text-foreground flex items-center gap-1 shadow-2xs">
                    <span>🪕</span>
                    <span>3</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-muted/70 border border-border/70 text-[11px] font-semibold text-muted-foreground flex items-center gap-1 shadow-2xs">
                    <span>📦</span>
                    <span>1</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Message 2 */}
            <div
              className={cn(
                'flex items-start gap-3',
                chatMessageDisplay === 'compact' && 'items-baseline gap-2',
              )}
            >
              {chatMessageDisplay !== 'compact' && showUserAvatars && (
                <div className="size-9 rounded-full bg-muted border border-border/70 overflow-hidden shrink-0 ring-1 ring-border/40 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-bold text-xs truncate max-w-[130px] sm:max-w-none',
                      roleColorsDisplay === 'names'
                        ? 'text-primary'
                        : 'text-foreground',
                    )}
                  >
                    {roleColorsDisplay === 'dot' && (
                      <span className="inline-block size-2 rounded-full bg-primary mr-1.5" />
                    )}
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    13.33
                  </span>
                </div>
                <div className="text-foreground mt-0.5 leading-snug break-words">
                  {t("here's a link")}{' '}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className={cn(
                      'text-primary font-semibold underline-offset-2 break-all',
                      alwaysUnderlineLinks && 'underline',
                    )}
                  >
                    https://anticeil.com/accessibility
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right side live status & example button */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
            <div className="flex items-center gap-1.5 select-none">
              <div
                className="size-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                title={t('Online')}
              >
                🟢
              </div>
              <div
                className="size-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-black shadow-xs"
                title={t('Idle')}
              >
                🌙
              </div>
              <div
                className="size-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                title={t('Do Not Disturb')}
              >
                ⛔
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 h-8 rounded-md shadow-xs cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              {t('Example Button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
