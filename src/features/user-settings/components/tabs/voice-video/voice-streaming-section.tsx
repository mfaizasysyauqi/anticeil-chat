import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export function VoiceStreamingSection() {
  const { t } = useTranslation();
  const [showStreamPreviews, setShowStreamPreviews] = useState(true);
  const [showAdvancedStream, setShowAdvancedStream] = useState(false);

  return (
    <div id="voice-streaming" className="scroll-mt-6 space-y-6 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {t('Streaming')}
        </h2>
      </div>

      {/* Show Stream Previews switch */}
      <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
        <div>
          <div className="text-xs font-bold text-foreground">
            {t('Show Stream Previews')}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t(
              'Allows others to see a preview of your stream before they join.',
            )}
          </div>
        </div>
        <Switch
          checked={showStreamPreviews}
          onCheckedChange={setShowStreamPreviews}
        />
      </div>

      {/* Show Advanced Stream Settings Accordion */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setShowAdvancedStream(!showAdvancedStream)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div>
            <div className="text-xs font-bold text-foreground">
              {t('Show Advanced Stream Settings')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Stream Attenuation, Stream Attenuation Strength, and more')}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
              showAdvancedStream && 'rotate-180',
            )}
          />
        </button>

        {showAdvancedStream && (
          <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Stream Attenuation')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    'Menurunkan volume game saat Anda berbicara saat live stream',
                  )}
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-1.5 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {t('Stream Attenuation Strength')}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  75%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={75}
                className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
              />
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Hardware Acceleration for Screen Capture')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    'Menggunakan akselerasi GPU untuk screen sharing tanpa lag',
                  )}
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Use OpenH264 Video Codec by Cisco')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Codec kompresi video standar berkinerja tinggi')}
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
