import React, { useState } from 'react';
import { Code2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface DeveloperTabProps {}

export function DeveloperTab(_props: DeveloperTabProps) {
  const { t } = useTranslation();
  // Developer Mode States
  const [developerMode, setDeveloperMode] = useState<boolean>(true);
  const [applicationTestMode, setApplicationTestMode] = useState<boolean>(false);
  const [applicationTestId, setApplicationTestId] = useState<string>('');

  // ==========================================


  return (
          <div className="space-y-6 max-w-2xl pb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('Developer')}</h2>
            </div>

            {/* Developer Mode */}
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40">
              <div className="space-y-0.5 pr-4">
                <div className="text-xs font-semibold text-foreground">{t('Developer Mode')}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Developer Mode exposes context menu items helpful for people writing apps using the')}{' '}
                  <a
                    href="https://discord.com/developers/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5865F2] hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    Discord API
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                  .
                </div>
              </div>
              <Switch
                checked={developerMode}
                onCheckedChange={(checked) => {
                  setDeveloperMode(checked);
                  toast.success(
                    checked ? t('Developer Mode diaktifkan') : t('Developer Mode dinonaktifkan'),
                  );
                }}
              />
            </div>

            {/* Application Test Mode */}
            <div className="space-y-3 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Application Test Mode')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Enter your Discord application ID to enable test mode for that application.')}
                  </div>
                </div>
                <Switch
                  checked={applicationTestMode}
                  onCheckedChange={(checked) => {
                    setApplicationTestMode(checked);
                    toast.success(
                      checked
                        ? t('Application Test Mode aktif')
                        : t('Application Test Mode nonaktif'),
                    );
                  }}
                />
              </div>

              {applicationTestMode && (
                <div className="p-4 rounded-xl border border-border/80 bg-[#1e1f22] space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <label className="text-xs font-semibold text-foreground">
                    {t('Application ID')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="e.g. 123456789012345678"
                      value={applicationTestId}
                      onChange={(e) => setApplicationTestId(e.target.value)}
                      className="h-9 text-xs bg-[#2b2d31] border-border/80 text-foreground font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!applicationTestId.trim()) {
                          toast.error(t('Masukkan Application ID terlebih dahulu'));
                          return;
                        }
                        toast.success(
                          t(`Test mode diaktifkan untuk App ID: ${applicationTestId.trim()}`),
                        );
                      }}
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-4 h-9 font-semibold shrink-0 cursor-pointer"
                    >
                      {t('Activate')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

  );
}
