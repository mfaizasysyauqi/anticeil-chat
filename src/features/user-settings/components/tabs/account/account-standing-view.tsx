import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface AccountStandingViewProps {
  currentUserName: string;
  currentUser: any;
  onBack: () => void;
}

export function AccountStandingView({
  currentUserName,
  currentUser,
  onBack,
}: AccountStandingViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('Account / Account Standing')}</span>
      </button>

      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
        <div className="relative">
          <CommunityAvatar
            name={currentUserName}
            email={currentUser?.email}
            imageUrl={currentUser?.imageUrl}
            size={84}
            showStatus={false}
            className="ring-4 ring-card rounded-full shadow-xl bg-card"
          />
          <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-md">
            <Check className="w-4 h-4 text-white stroke-[3]" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-foreground">
            {t('Your account is')}{' '}
            <span className="text-emerald-500">{t('all good')}</span>
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
            {t(
              "Thank you for upholding Anticeil's Terms of Service and Community Guidelines. If you have a violation, it will appear here.",
            )}
          </p>
        </div>

        {/* Status Stepper / Progress meter (matching Discord) */}
        <div className="w-full max-w-lg pt-6 px-4">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full z-0" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 w-0" />

            {[
              { label: t('All good'), active: true, color: 'bg-emerald-500 ring-emerald-500/30' },
              { label: t('Limited'), active: false, color: 'bg-muted ring-muted/30' },
              { label: t('Very limited'), active: false, color: 'bg-muted ring-muted/30' },
              { label: t('At risk'), active: false, color: 'bg-muted ring-muted/30' },
              { label: t('Suspended'), active: false, color: 'bg-muted ring-muted/30' },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center group">
                <div
                  className={cn(
                    'size-5 rounded-full border-2 border-background flex items-center justify-center transition-all',
                    step.color,
                    step.active && 'ring-4',
                  )}
                >
                  {step.active && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
                <span
                  className={cn(
                    'text-[11px] mt-2 font-semibold select-none',
                    step.active ? 'text-foreground font-bold' : 'text-muted-foreground/60',
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
