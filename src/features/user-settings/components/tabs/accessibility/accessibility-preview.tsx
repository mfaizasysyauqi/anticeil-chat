import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface AccessibilityPreviewProps {
  enableHighContrast: boolean;
  saturationLevel: number;
  chatFontSize: number;
  chatMessageDisplay: 'default' | 'compact';
  spaceMessageGroups: number;
  showUserAvatars: boolean;
  roleColorsDisplay: 'names' | 'dot' | 'none';
  alwaysUnderlineLinks: boolean;
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
}: AccessibilityPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {t('Preview')}
      </div>
      <div
        className={cn(
          'rounded-2xl border border-border/80 bg-[#1e1f22] p-4 relative shadow-sm transition-all',
          enableHighContrast && 'border-2 border-white',
        )}
        style={{
          filter: `saturate(${saturationLevel}%)`,
        }}
      >
        <div
          className="flex items-start justify-between gap-4"
          style={{ fontSize: `${chatFontSize}px` }}
        >
          <div className="flex-1 space-y-3">
            {/* Message 1 */}
            <div
              className={cn(
                'flex items-start gap-3',
                chatMessageDisplay === 'compact' && 'items-baseline gap-2',
              )}
              style={{ marginBottom: `${spaceMessageGroups}px` }}
            >
              {chatMessageDisplay !== 'compact' && showUserAvatars && (
                <div className="size-9 rounded-full bg-zinc-700 overflow-hidden shrink-0 ring-2 ring-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-bold text-xs',
                      roleColorsDisplay === 'names' ? 'text-indigo-400' : 'text-foreground',
                    )}
                  >
                    {roleColorsDisplay === 'dot' && <span className="inline-block size-2 rounded-full bg-indigo-400 mr-1.5" />}
                    zmsta
                  </span>
                  <span className="text-[10px] text-muted-foreground">13.33</span>
                </div>
                <div className="text-foreground mt-0.5 leading-snug">
                  what happened to all the beans
                </div>
                {/* Reactions */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded-lg bg-[#2b2d31] border border-indigo-500/40 text-[11px] font-bold text-white flex items-center gap-1">
                    <span>🪕</span>
                    <span>3</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#2b2d31] border border-border/60 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
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
                <div className="size-9 rounded-full bg-zinc-700 overflow-hidden shrink-0 ring-2 ring-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-bold text-xs',
                      roleColorsDisplay === 'names' ? 'text-indigo-400' : 'text-foreground',
                    )}
                  >
                    {roleColorsDisplay === 'dot' && <span className="inline-block size-2 rounded-full bg-indigo-400 mr-1.5" />}
                    zmsta
                  </span>
                  <span className="text-[10px] text-muted-foreground">13.33</span>
                </div>
                <div className="text-foreground mt-0.5 leading-snug">
                  here&apos;s a link{' '}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className={cn(
                      'text-primary font-semibold',
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
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="flex flex-col gap-1.5">
              <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="Online">
                🟢
              </div>
              <div className="size-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-black shadow-xs" title="Idle">
                🌙
              </div>
              <div className="size-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="DND">
                ⛔
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => toast.success(t('Pratinjau tombol aksesibilitas responsif!'))}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 h-8 rounded-md shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              Example Button
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
