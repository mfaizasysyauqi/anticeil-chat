import React, { useState } from 'react';
import {
  Globe,
  X,
  Sparkles,
  Compass,
  LineChart,
  AlertCircle,
  Hash,
  Shield,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Colony, ColonyChannel, ColonyCommunitySettings } from '@/chat/chat-types';

interface CommunityOverviewTabProps {
  activeColony: Colony;
  channels?: ColonyChannel[];
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onNavigateSection?: (section: string) => void;
  onClose?: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function CommunityOverviewTab({
  activeColony,
  channels = [],
  onUpdateColony,
  onNavigateSection,
  onClose,
  t,
}: CommunityOverviewTabProps) {
  const comm = activeColony.communitySettings || {};

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [rulesChannelId, setRulesChannelId] = useState(
    comm.rulesChannelId || channels.find((c) => c.name.includes('rule'))?.id || channels[0]?.id || ''
  );
  const [communityUpdatesChannelId, setCommunityUpdatesChannelId] = useState(
    comm.communityUpdatesChannelId || 'none'
  );
  const [safetyNotificationsChannelId, setSafetyNotificationsChannelId] = useState(
    comm.safetyNotificationsChannelId || 'none'
  );
  const [primaryLanguage, setPrimaryLanguage] = useState(
    comm.primaryLanguage || 'English'
  );
  const [serverDescription, setServerDescription] = useState(
    comm.description || activeColony.description || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    rulesChannelId !== (comm.rulesChannelId || channels.find((c) => c.name.includes('rule'))?.id || channels[0]?.id || '') ||
    communityUpdatesChannelId !== (comm.communityUpdatesChannelId || 'none') ||
    safetyNotificationsChannelId !== (comm.safetyNotificationsChannelId || 'none') ||
    primaryLanguage !== (comm.primaryLanguage || 'English') ||
    serverDescription !== (comm.description || activeColony.description || '');

  const handleReset = () => {
    setRulesChannelId(comm.rulesChannelId || channels.find((c) => c.name.includes('rule'))?.id || channels[0]?.id || '');
    setCommunityUpdatesChannelId(comm.communityUpdatesChannelId || 'none');
    setSafetyNotificationsChannelId(comm.safetyNotificationsChannelId || 'none');
    setPrimaryLanguage(comm.primaryLanguage || 'English');
    setServerDescription(comm.description || activeColony.description || '');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: ColonyCommunitySettings = {
        enabled: true,
        rulesChannelId,
        communityUpdatesChannelId,
        safetyNotificationsChannelId,
        primaryLanguage,
        description: serverDescription,
      };
      await onUpdateColony(activeColony.id, {
        communitySettings: updated,
        description: serverDescription,
      });
      toast.success(t('Pengaturan Community berhasil disimpan! 🌐'));
    } catch {
      toast.error(t('Gagal menyimpan pengaturan komunitas'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableCommunity = async () => {
    try {
      await onUpdateColony(activeColony.id, {
        communitySettings: { enabled: false },
      });
      toast.info(t('Fitur Server Komunitas dinonaktifkan.'));
    } catch {
      toast.error(t('Gagal menonaktifkan fitur komunitas'));
    }
  };

  return (
    <div className="space-y-8 w-full pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {t('Community Settings')}
        </h2>
      </div>

      {/* Banner Card (Screenshot 1) */}
      {!isBannerDismissed && (
        <div className="relative p-5 rounded-2xl bg-card border border-border/80 shadow-lg space-y-4">
          <button
            type="button"
            onClick={() => setIsBannerDismissed(true)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1.5 pr-8">
            <h3 className="text-sm font-bold text-foreground">
              {t('Your server is now a Community Server!')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'You now have access to additional tools that can help you moderate, run, and grow your server. Check out some of them to get started!'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              size="sm"
              onClick={() => onNavigateSection?.('onboarding')}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3.5 rounded-lg cursor-pointer"
            >
              {t('Set up Onboarding')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onNavigateSection?.('access');
                toast.info(t('Buka tab Access untuk mengaktifkan status Discoverable.'));
              }}
              className="text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border h-8 px-3.5 rounded-lg cursor-pointer"
            >
              {t('Apply for Discovery')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateSection?.('server-insights')}
              className="text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border h-8 px-3.5 rounded-lg cursor-pointer"
            >
              {t('Check Server Insights')}
            </Button>
          </div>
        </div>
      )}

      {/* Section 1: Rules or guidelines channel */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-md">
            <h3 className="text-xs font-bold text-foreground">
              {t('Rules or guidelines channel')}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t(
                'Please select the channel that hosts your rules. This channel will by default start from the top and will feature a special header.'
              )}
            </p>
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <Select value={rulesChannelId} onValueChange={setRulesChannelId}>
              <SelectTrigger className="h-9 text-xs bg-muted border-border text-foreground">
                <SelectValue placeholder={t('Pilih Channel Rules')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    #{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Section 2: Community Updates Channel */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-md">
            <h3 className="text-xs font-bold text-foreground">
              {t('Community Updates Channel')}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t(
                'This is the channel where Anticeil will send relevant updates for Community admins and moderators. As some info might be sensitive, we recommend selecting a role-restricted channel.'
              )}
            </p>
            <span className="text-[10px] text-muted-foreground/80 block mt-1">
              {t("Optional. Without a moderator channel, raid alerts and lockdown notices won't be delivered.")}
            </span>
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <Select
              value={communityUpdatesChannelId}
              onValueChange={setCommunityUpdatesChannelId}
            >
              <SelectTrigger className="h-9 text-xs bg-muted border-border text-foreground">
                <SelectValue placeholder={t('None')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="none" className="text-xs">
                  {t('None')}
                </SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    #{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Section 3: Safety Notifications Channel */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-md">
            <h3 className="text-xs font-bold text-foreground">
              {t('Safety Notifications Channel')}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t(
                'This is the channel where Anticeil will send you important safety updates about your server. As some info might be sensitive, we recommend selecting a role-restricted channel.'
              )}
            </p>
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <Select
              value={safetyNotificationsChannelId}
              onValueChange={setSafetyNotificationsChannelId}
            >
              <SelectTrigger className="h-9 text-xs bg-muted border-border text-foreground">
                <SelectValue placeholder={t('Select...')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="none" className="text-xs">
                  {t('Select...')}
                </SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    #{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Section 4: Server Primary Language */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-md">
            <h3 className="text-xs font-bold text-foreground">
              {t('Server Primary Language')}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('This helps Anticeil customize features for you and your members.')}
            </p>
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <Select value={primaryLanguage} onValueChange={setPrimaryLanguage}>
              <SelectTrigger className="h-9 text-xs bg-muted border-border text-foreground">
                <SelectValue placeholder="English" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="English" className="text-xs">
                  English
                </SelectItem>
                <SelectItem value="Indonesian" className="text-xs">
                  Indonesian (Bahasa Indonesia)
                </SelectItem>
                <SelectItem value="Japanese" className="text-xs">
                  Japanese (日本語)
                </SelectItem>
                <SelectItem value="Spanish" className="text-xs">
                  Spanish (Español)
                </SelectItem>
                <SelectItem value="French" className="text-xs">
                  French (Français)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Section 5: Server Description */}
      <div className="space-y-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-foreground">
            {t('Server Description')}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t(
              "Describe your community. This description will be displayed in external embeds of this server's invite link."
            )}
          </p>
        </div>
        <textarea
          value={serverDescription}
          onChange={(e) => setServerDescription(e.target.value)}
          placeholder={t('Tell the world a bit about this server.')}
          rows={3}
          className="w-full p-2.5 text-xs bg-muted border border-border text-foreground resize-none rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="border-t border-border/60" />

      {/* Section 6: Disable Community (Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-0.5 max-w-md">
          <h3 className="text-xs font-bold text-foreground">
            {t('Disable Community')}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t(
              'This will remove specific features for Community Servers, like Server Discovery and Server Insights.'
            )}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleDisableCommunity}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold h-9 px-4 rounded-lg cursor-pointer shrink-0"
        >
          {t('Disable Community')}
        </Button>
      </div>

      {/* Floating Save Changes Bar when dirty */}
      {isDirty && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 rounded-xl bg-card border border-border shadow-2xl animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t('Careful — you have unsaved changes!')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-3 cursor-pointer"
            >
              {t('Reset')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 font-semibold cursor-pointer shadow-xs"
            >
              {isSaving ? t('Menyimpan...') : t('Save Changes')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
