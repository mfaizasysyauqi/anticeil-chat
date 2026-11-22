import React, { useState, useMemo } from 'react';
import {
  Hash,
  Volume2,
  Copy,
  Check,
  Activity,
  MessageSquare,
  Users,
  Bot,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { toast } from 'sonner';
import { ColonyWidgetSection } from './analytics/colony-widget-section';
import { colonyApi } from '@/chat/chat-api';
import type {
  Colony,
  ColonyStats,
  ColonyChannel,
  ColonyMember,
} from '@/chat/chat-types';

interface AnalyticsTabProps {
  activeColony: Colony;
  serverStats: ColonyStats | null;
  setServerStats: React.Dispatch<React.SetStateAction<ColonyStats | null>>;
  channels: ColonyChannel[];
  members: ColonyMember[];
  onUpdateColony?: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  t: (key: string) => string;
}

export function AnalyticsTab({
  activeColony,
  serverStats,
  setServerStats,
  channels,
  members,
  onUpdateColony,
  onClose,
  t,
}: AnalyticsTabProps) {
  // Current Colony channels (filtered by active colony if applicable)
  const colonyChannels = useMemo(() => {
    const list = channels.filter(
      (c) => (c.colonyId || 'anticeil') === activeColony?.id,
    );
    return list.length > 0 ? list : channels;
  }, [channels, activeColony?.id]);

  const textChannels = useMemo(() => {
    return colonyChannels.filter(
      (c) => !c.type || c.type === 'text' || c.type === 'forum',
    );
  }, [colonyChannels]);

  const voiceChannels = useMemo(() => {
    return colonyChannels.filter((c) => c.type === 'voice');
  }, [colonyChannels]);

  // Load initial settings from activeColony
  const initialSettings = activeColony.engagementSettings || {};

  // 1. System Messages State
  const [sendWelcomeMessage, setSendWelcomeMessage] = useState(
    initialSettings.sendWelcomeMessage !== false,
  );
  const [replyWelcomeSticker, setReplyWelcomeSticker] = useState(
    initialSettings.replyWelcomeSticker !== false,
  );
  const [sendBoostMessage, setSendBoostMessage] = useState(
    initialSettings.sendBoostMessage !== false,
  );
  const [sendSetupTips, setSendSetupTips] = useState(
    initialSettings.sendSetupTips !== false,
  );
  const [systemChannelId, setSystemChannelId] = useState(
    initialSettings.systemChannelId ||
      textChannels[0]?.id ||
      colonyChannels[0]?.id ||
      '',
  );

  // 2. Activity Feed Settings State
  const [activityFeedEnabled, setActivityFeedEnabled] = useState(
    initialSettings.activityFeedEnabled !== false,
  );

  // 3. Default Notification Settings State ('all' | 'mentions')
  const [defaultNotifications, setDefaultNotifications] = useState<'all' | 'mentions'>(
    initialSettings.defaultNotifications || 'all',
  );

  // 4. Inactive Channel & Timeout State
  const [afkChannelId, setAfkChannelId] = useState<string>(
    initialSettings.afkChannelId || 'none',
  );
  const [afkTimeout, setAfkTimeout] = useState<number>(
    initialSettings.afkTimeout || 300,
  ); // 300s = 5m

  // 5. Server Widget State
  const [widgetEnabled, setWidgetEnabled] = useState(
    Boolean(initialSettings.widgetEnabled),
  );

  // Widget URLs
  const widgetIframeSnippet = `<iframe src="https://dev-chat.anticeil.com/widget?id=${activeColony.id}&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>`;
  const widgetApiUrl = `https://dev-chat.anticeil.com/api/guilds/${activeColony.id}/widget.json`;

  const handleSave = async () => {
    if (onUpdateColony) {
      await onUpdateColony(activeColony.id, {
        engagementSettings: {
          sendWelcomeMessage,
          replyWelcomeSticker,
          sendBoostMessage,
          sendSetupTips,
          systemChannelId,
          activityFeedEnabled,
          defaultNotifications,
          afkChannelId: afkChannelId === 'none' ? null : afkChannelId,
          afkTimeout,
          widgetEnabled,
        },
      });
      toast.success(t('Pengaturan Engagement berhasil disimpan! 🚀'));
      onClose?.();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {t('Engagement')}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Manage settings that help keep your colony active.')}
        </p>
      </div>

      {/* SECTION 1: SYSTEM MESSAGES */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t('System Messages')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Configure system event messages sent to your colony.')}
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Switch 1 */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-foreground font-medium">
              {t('Send a random welcome message when someone joins this colony.')}
            </span>
            <Switch
              checked={sendWelcomeMessage}
              onCheckedChange={setSendWelcomeMessage}
            />
          </div>

          {/* Switch 2 */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-foreground font-medium">
              {t('Prompt members to reply to welcome messages with a sticker.')}
            </span>
            <Switch
              checked={replyWelcomeSticker}
              onCheckedChange={setReplyWelcomeSticker}
            />
          </div>

          {/* Switch 3 */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-foreground font-medium">
              {t('Send a message when someone boosts this colony.')}
            </span>
            <Switch
              checked={sendBoostMessage}
              onCheckedChange={setSendBoostMessage}
            />
          </div>

          {/* Switch 4 */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-foreground font-medium">
              {t('Send helpful tips for colony setup.')}
            </span>
            <Switch
              checked={sendSetupTips}
              onCheckedChange={setSendSetupTips}
            />
          </div>
        </div>

        {/* System Messages Channel Dropdown */}
        <div className="pt-2">
          <FormDropdown
            label={t('System Messages Channel')}
            description={t('This is the channel we send system event messages to.')}
            value={systemChannelId}
            onChange={(val) => setSystemChannelId(val)}
            options={
              textChannels.length > 0
                ? textChannels.map((ch) => ({
                    value: ch.id,
                    label: `# ${ch.name}${ch.description ? ` — ${ch.description}` : ''}`,
                  }))
                : [{ value: '', label: '# general' }]
            }
          />
        </div>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 2: ACTIVITY FEED SETTINGS */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t('Activity Feed Settings')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'Shows a feed of activity from games and connected apps in this colony.',
            )}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-foreground font-medium">
            {t('Display Activity Feed in this colony')}
          </span>
          <Switch
            checked={activityFeedEnabled}
            onCheckedChange={setActivityFeedEnabled}
          />
        </div>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 3: DEFAULT NOTIFICATION SETTINGS */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t('Default Notification Settings')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t(
              'This will determine whether members who have not explicitly set their notification settings receive a notification for every message sent in this colony or not.',
            )}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Option 1: All Messages */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setDefaultNotifications('all')}
              className="size-4 rounded-full border border-muted-foreground flex items-center justify-center group-hover:border-foreground"
            >
              {defaultNotifications === 'all' && (
                <div className="size-2 rounded-full bg-primary" />
              )}
            </div>
            <span
              onClick={() => setDefaultNotifications('all')}
              className="text-xs font-semibold text-foreground"
            >
              {t('All Messages')}
            </span>
          </label>

          {/* Option 2: Only @mentions */}
          <div className="space-y-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setDefaultNotifications('mentions')}
                className="size-4 rounded-full border border-muted-foreground flex items-center justify-center group-hover:border-foreground"
              >
                {defaultNotifications === 'mentions' && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <span
                onClick={() => setDefaultNotifications('mentions')}
                className="text-xs font-semibold text-foreground"
              >
                {t('Only @mentions')}
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground pl-7">
              {t(
                'We highly recommend setting this to only @mentions for a Community Server.',
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 4: INACTIVE CHANNEL & INACTIVE TIMEOUT */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Inactive Channel */}
          <div>
            <FormDropdown
              label={t('Inactive Channel')}
              value={afkChannelId}
              onChange={(val) => setAfkChannelId(val)}
              options={[
                { value: 'none', label: t('No Inactive Channel') },
                ...voiceChannels.map((vc) => ({
                  value: vc.id,
                  label: `🔊 ${vc.name}`,
                })),
              ]}
            />
          </div>

          {/* Inactive Timeout */}
          <div>
            <FormDropdown
              label={t('Inactive Timeout')}
              value={String(afkTimeout)}
              onChange={(val) => setAfkTimeout(Number(val))}
              options={[
                { value: '60', label: t('1 minute') },
                { value: '300', label: t('5 minutes') },
                { value: '900', label: t('15 minutes') },
                { value: '1800', label: t('30 minutes') },
                { value: '3600', label: t('1 hour') },
              ]}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {t(
            'Automatically move members to this channel and mute them when they have been idle for longer than the inactive timeout. This does not affect browsers.',
          )}
        </p>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 5: COLONY WIDGET */}
      <ColonyWidgetSection
        widgetEnabled={widgetEnabled}
        setWidgetEnabled={setWidgetEnabled}
        activeColonyId={activeColony.id}
        widgetApiUrl={widgetApiUrl}
        widgetIframeSnippet={widgetIframeSnippet}
        t={t}
      />

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 6: ANALYTICS OVERVIEW CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {t('Overview & Community Health')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const stats = await colonyApi.getHubStats(activeColony.id);
              setServerStats(stats);
              toast.success(t('Data analitik diperbarui! 📊'));
            }}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> {t('Segarkan')}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Card className="p-3 bg-[#1e1f22] border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {t('Pesan')}
              </span>
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              {serverStats?.totalMessages || 0}
            </p>
          </Card>

          <Card className="p-3 bg-[#1e1f22] border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {t('Saluran')}
              </span>
              <Hash className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              {serverStats?.totalChannels || colonyChannels.length}
            </p>
          </Card>

          <Card className="p-3 bg-[#1e1f22] border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {t('Anggota')}
              </span>
              <Users className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              {members.length}
            </p>
          </Card>

          <Card className="p-3 bg-[#1e1f22] border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {t('Bot Webhook')}
              </span>
              <Bot className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              {serverStats?.botMessages || 0}
            </p>
          </Card>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-4 flex items-center gap-3">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
          onClick={handleSave}
        >
          {t('Simpan Perubahan')}
        </Button>
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-lg cursor-pointer"
          >
            {t('Batal')}
          </Button>
        )}
      </div>
    </div>
  );
}
