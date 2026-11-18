import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/core/i18n';

export interface ChatBoxAppearanceSectionProps {
  previewMarkdownAsType: boolean;
  setPreviewMarkdownAsType: (v: boolean) => void;
  convertEmoticonsToEmoji: boolean;
  setConvertEmoticonsToEmoji: (v: boolean) => void;
  showStickersAutocomplete: boolean;
  setShowStickersAutocomplete: (v: boolean) => void;
  showGamesAutocomplete: boolean;
  setShowGamesAutocomplete: (v: boolean) => void;
  showSendMessageButton: boolean;
  setShowSendMessageButton: (v: boolean) => void;
}

export function ChatBoxAppearanceSection({
  previewMarkdownAsType,
  setPreviewMarkdownAsType,
  convertEmoticonsToEmoji,
  setConvertEmoticonsToEmoji,
  showStickersAutocomplete,
  setShowStickersAutocomplete,
  showGamesAutocomplete,
  setShowGamesAutocomplete,
  showSendMessageButton,
  setShowSendMessageButton,
}: ChatBoxAppearanceSectionProps) {
  const { t } = useTranslation();

  return (
    <div id="appearance-chat-box" className="scroll-mt-6 space-y-6 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Chat Box')}</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Preview emoji, mentions, and markdown syntax as you type')}
          </div>
          <Switch checked={previewMarkdownAsType} onCheckedChange={setPreviewMarkdownAsType} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div>
            <div className="text-xs font-semibold text-foreground">
              {t('Automatically convert emoticons in your messages to emoji')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('For example, when you type :) Anticeil will convert it to 🙂')}
            </div>
          </div>
          <Switch checked={convertEmoticonsToEmoji} onCheckedChange={setConvertEmoticonsToEmoji} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Show stickers in autocomplete results')}
          </div>
          <Switch checked={showStickersAutocomplete} onCheckedChange={setShowStickersAutocomplete} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Show games in autocomplete results')}
          </div>
          <Switch checked={showGamesAutocomplete} onCheckedChange={setShowGamesAutocomplete} />
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="text-xs font-semibold text-foreground">
            {t('Show send message button')}
          </div>
          <Switch checked={showSendMessageButton} onCheckedChange={setShowSendMessageButton} />
        </div>
      </div>
    </div>
  );
}
