import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ServerWidgetSectionProps {
  widgetEnabled: boolean;
  setWidgetEnabled: (enabled: boolean) => void;
  activeColonyId: string;
  widgetApiUrl: string;
  widgetIframeSnippet: string;
  t: (key: string) => string;
}

export function ServerWidgetSection({
  widgetEnabled,
  setWidgetEnabled,
  activeColonyId,
  widgetApiUrl,
  widgetIframeSnippet,
  t,
}: ServerWidgetSectionProps) {
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [hasCopiedApi, setHasCopiedApi] = useState(false);
  const [hasCopiedWidget, setHasCopiedWidget] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground">
          {t('Server Widget')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t(
            'Embed an HTML widget on your website to display your online members, voice channels, and invite link.',
          )}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-foreground font-medium">
          {t('Enable Server Widget')}
        </span>
        <Switch
          checked={widgetEnabled}
          onCheckedChange={setWidgetEnabled}
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t(
          'By enabling the widget, your server profile will be visible to others outside of your server members. You can control Profile privacy in Server Settings > Profile.',
        )}
      </p>

      {/* Expanded Widget Details when Enabled */}
      {widgetEnabled && (
        <div className="mt-4 p-4 rounded-xl bg-[#1e1f22] border border-border/80 space-y-4">
          {/* Server ID */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Server ID')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeColonyId}
                className="w-full text-xs bg-[#111214] border border-border/60 rounded-lg px-3 py-2 text-foreground font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(activeColonyId);
                  setHasCopiedId(true);
                  toast.success(t('Server ID disalin ke clipboard!'));
                  setTimeout(() => setHasCopiedId(false), 2000);
                }}
                className="h-9 px-3 shrink-0"
              >
                {hasCopiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {hasCopiedId ? t('Disalin') : t('Salin')}
              </Button>
            </div>
          </div>

          {/* JSON API */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('JSON API')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={widgetApiUrl}
                className="w-full text-xs bg-[#111214] border border-border/60 rounded-lg px-3 py-2 text-foreground font-mono truncate"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(widgetApiUrl);
                  setHasCopiedApi(true);
                  toast.success(t('Widget API URL disalin!'));
                  setTimeout(() => setHasCopiedApi(false), 2000);
                }}
                className="h-9 px-3 shrink-0"
              >
                {hasCopiedApi ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {hasCopiedApi ? t('Disalin') : t('Salin')}
              </Button>
            </div>
          </div>

          {/* Premade HTML Snippet */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Premade Widget Code')}
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={widgetIframeSnippet}
                rows={3}
                className="w-full text-xs bg-[#111214] border border-border/60 rounded-lg p-2.5 text-muted-foreground font-mono resize-none focus:outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(widgetIframeSnippet);
                  setHasCopiedWidget(true);
                  toast.success(t('Kode embed widget berhasil disalin!'));
                  setTimeout(() => setHasCopiedWidget(false), 2000);
                }}
                className="absolute right-2.5 bottom-2.5 h-7 text-xs px-2.5 bg-[#1e1f22]"
              >
                {hasCopiedWidget ? (
                  <Check className="w-3 h-3 text-emerald-500 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {hasCopiedWidget ? t('Disalin') : t('Salin Iframe')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
