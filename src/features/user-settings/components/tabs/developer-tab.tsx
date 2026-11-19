import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { userSettingsApi } from '../../api/user-settings-api';

export interface DeveloperTabProps {}

export function DeveloperTab(_props: DeveloperTabProps) {
  const { t } = useTranslation();
  // Developer Mode States
  const [developerMode, setDeveloperMode] = useState<boolean>(false);
  const [applicationTestMode, setApplicationTestMode] = useState<boolean>(false);
  const [applicationTestId, setApplicationTestId] = useState<string>('');

  useEffect(() => {
    userSettingsApi.getSettings().then((settings) => {
      if (settings?.developer) {
        setDeveloperMode(Boolean(settings.developer.developerMode));
        setApplicationTestMode(Boolean(settings.developer.applicationTestMode));
        setApplicationTestId(settings.developer.applicationTestId || '');
      }
    });
  }, []);

  const handleToggleDeveloperMode = async (checked: boolean) => {
    setDeveloperMode(checked);
    try {
      await userSettingsApi.updateSettings({
        developer: {
          developerMode: checked,
          applicationTestMode,
          applicationTestId,
        },
      });
      toast.success(
        checked ? t('Developer Mode diaktifkan') : t('Developer Mode dinonaktifkan'),
      );
    } catch {
      toast.error(t('Gagal menyimpan pengaturan developer'));
    }
  };

  const handleToggleTestMode = async (checked: boolean) => {
    setApplicationTestMode(checked);
    try {
      await userSettingsApi.updateSettings({
        developer: {
          developerMode,
          applicationTestMode: checked,
          applicationTestId,
        },
      });
      toast.success(
        checked ? t('Application Test Mode aktif') : t('Application Test Mode nonaktif'),
      );
    } catch {
      toast.error(t('Gagal menyimpan pengaturan test mode'));
    }
  };

  const handleSaveTestId = async () => {
    const cleanId = applicationTestId.trim();
    if (!cleanId) {
      toast.error(t('Masukkan Application ID terlebih dahulu'));
      return;
    }
    try {
      await userSettingsApi.updateSettings({
        developer: {
          developerMode,
          applicationTestMode,
          applicationTestId: cleanId,
        },
      });
      toast.success(
        t(`Test mode diaktifkan untuk App ID: ${cleanId}`),
      );
    } catch {
      toast.error(t('Gagal mengaktifkan App ID'));
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
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
              href="https://anticeil.com/docs"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Anticeil API
              <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
            .
          </div>
        </div>
        <Switch
          checked={developerMode}
          onCheckedChange={handleToggleDeveloperMode}
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
              {t('Enter your Anticeil application ID to enable test mode for that application.')}
            </div>
          </div>
          <Switch
            checked={applicationTestMode}
            onCheckedChange={handleToggleTestMode}
          />
        </div>

        {applicationTestMode && (
          <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <label className="text-xs font-semibold text-foreground">
              {t('Application ID')}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="e.g. 123456789012345678"
                value={applicationTestId}
                onChange={(e) => setApplicationTestId(e.target.value)}
                className="h-9 text-xs bg-muted/40 border-border/80 text-foreground font-mono"
              />
              <Button
                size="sm"
                onClick={handleSaveTestId}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 h-9 font-semibold shrink-0 cursor-pointer"
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
