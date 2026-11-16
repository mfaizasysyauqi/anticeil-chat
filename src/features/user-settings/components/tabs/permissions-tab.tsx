import React, { useState } from 'react';
import { ShieldAlert, Check, ExternalLink, Globe, ChevronDown, ChevronRight, Gamepad2, Link2, Eye, EyeOff, Ban, Palette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface PermissionsTabProps {
  onNavigateSection?: (section: string) => void;
}

export function PermissionsTab({ onNavigateSection }: PermissionsTabProps) {
  const { t } = useTranslation();
  const [allowDmsFromServerMembers, setAllowDmsFromServerMembers] = useState(true);
  const [allowFriendRequestsFrom, setAllowFriendRequestsFrom] = useState({
    everyone: true,
    friendsOfFriends: true,
    serverMembers: true,
  });

  // Messaging Permissions State (Discord Parity)
  const [contentFilterTab, setContentFilterTab] = useState<'mature' | 'graphic'>('mature');
  const [contentFilterSettings, setContentFilterSettings] = useState({
    mature: {
      friends: 'show',
      others: 'block',
      server: 'show',
    },
    graphic: {
      friends: 'show',
      others: 'block',
      server: 'show',
    },
  });
  const [allowAgeRestrictedCommands, setAllowAgeRestrictedCommands] = useState(false);
  const [allowAgeRestrictedIos, setAllowAgeRestrictedIos] = useState(false);
  const [spamFilterOption, setSpamFilterOption] = useState<'all' | 'non-friends' | 'none'>('non-friends');
  const [enableMessageRequests, setEnableMessageRequests] = useState(true);
  const [showPersonalizedFriendRequests, setShowPersonalizedFriendRequests] = useState(true);
  const [allowGameDmsAndInvites, setAllowGameDmsAndInvites] = useState(true);
  const [gameDmsVisibility, setGameDmsVisibility] = useState<'all' | 'game-players' | 'none'>('all');


  return (
          <div className="space-y-8 pb-8">
            {/* ── 1. CONTENT FILTERS ── */}
            <div id="permissions-content-filters" className="space-y-4 scroll-mt-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Content Filters')}
                </h2>
                <div className="mt-3 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Sensitive content filters')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("Choose how you want to see image-based media detected by Anticeil's sensitive content filters.")}{' '}
                    <button
                      type="button"
                      onClick={() => toast.info(t('Filter mendeteksi media berorientasi dewasa atau kekerasan dan dapat memburamkan atau memblokirnya.'))}
                      className="text-primary hover:underline font-medium inline cursor-pointer"
                    >
                      {t('Learn more')}
                    </button>
                  </p>
                </div>
              </div>

              {/* Two-part layout: Left tabs (Mature Sexual Media / Graphic Media), Right filter controls */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col md:flex-row">
                <div className="w-full md:w-56 p-2 bg-muted/20 border-b md:border-b-0 md:border-r border-border/70 flex md:flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setContentFilterTab('mature')}
                    className={cn(
                      'relative w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between',
                      contentFilterTab === 'mature'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    {contentFilterTab === 'mature' && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                    )}
                    <span>{t('Mature Sexual Media')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentFilterTab('graphic')}
                    className={cn(
                      'relative w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between',
                      contentFilterTab === 'graphic'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    {contentFilterTab === 'graphic' && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                    )}
                    <span>{t('Graphic Media')}</span>
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-3.5 bg-card">
                  {[
                    {
                      key: 'friends' as const,
                      label: t('Direct messages from friends'),
                    },
                    {
                      key: 'others' as const,
                      label: t('Direct messages from others'),
                    },
                    {
                      key: 'server' as const,
                      label: t('Messages in server channels'),
                    },
                  ].map((target) => {
                    const currentVal = contentFilterSettings[contentFilterTab][target.key];
                    return (
                      <div
                        key={target.key}
                        className="flex items-center justify-between gap-4 py-1"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {target.label}
                        </span>
                        <div className="w-32 shrink-0">
                          <Select
                            value={currentVal}
                            onValueChange={(val: any) =>
                              setContentFilterSettings((prev) => ({
                                ...prev,
                                [contentFilterTab]: {
                                  ...prev[contentFilterTab],
                                  [target.key]: val,
                                },
                              }))
                            }
                          >
                            <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="show">
                                <span className="flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{t('Show')}</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="blur">
                                <span className="flex items-center gap-1.5">
                                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{t('Blur')}</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="block">
                                <span className="flex items-center gap-1.5">
                                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                                  <span>{t('Block')}</span>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanatory note below filter card */}
              <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                {contentFilterTab === 'mature'
                  ? t('Helps detect image-based media that may contain sexually explicit or suggestive material involving adults.')
                  : t('Helps detect image-based media that may contain gore, intense violence, or disturbing visual content.')}
              </p>

              {/* Age restricted toggles */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow access to age-restricted commands from apps in DMs')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Allows people 18+ to access commands marked as age-restricted in DMs. Applies to all apps.')}
                    </div>
                  </div>
                  <Switch
                    checked={allowAgeRestrictedCommands}
                    onCheckedChange={setAllowAgeRestrictedCommands}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow access to age-restricted servers on iOS')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Access age-restricted servers (18+) on iOS devices, after joining them on desktop.')}
                    </div>
                  </div>
                  <Switch
                    checked={allowAgeRestrictedIos}
                    onCheckedChange={setAllowAgeRestrictedIos}
                  />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection?.('appearance')}
                  className="w-full p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground group-hover:text-primary transition-colors">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Appearance')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Show/hide media in chat, spoiler content')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 2. SPAM FILTERS ── */}
            <div id="permissions-spam-filters" className="space-y-4 scroll-mt-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Spam Filters')}
                </h2>
                <div className="mt-2 space-y-0.5">
                  <h3 className="text-xs font-semibold text-foreground">
                    {t('Automatically filter suspected spam messages')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('Anticeil can filter out some messages that contain spam. These messages go to your Spam inbox.')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                {[
                  {
                    id: 'all' as const,
                    label: t('Filter all spam'),
                  },
                  {
                    id: 'non-friends' as const,
                    label: t('Filter messages from non-friends (Recommended)'),
                  },
                  {
                    id: 'none' as const,
                    label: t("Don't filter spam"),
                  },
                ].map((opt) => {
                  const isSelected = spamFilterOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSpamFilterOption(opt.id)}
                      className={cn(
                        'w-full p-4 flex items-center gap-3 text-left transition-colors cursor-pointer',
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                      <span className={cn('text-xs', isSelected ? 'font-bold text-foreground' : 'text-foreground/90 font-medium')}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 3. DIRECT MESSAGE (DM) PERMISSIONS ── */}
            <div id="permissions-direct-messages" className="space-y-4 scroll-mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-foreground">
                  {t('Direct Message (DM) Permissions')}
                </h2>

                {/* Colony / Server Scope Selector */}
                <button
                  type="button"
                  onClick={() => toast.info(t('Pengaturan ini berlaku secara global untuk seluruh colony Anda.'))}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer w-fit"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>{t('All servers / colonies')}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </button>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Direct Messages')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Allow DMs from other server members')}
                    </div>
                  </div>
                  <Switch
                    checked={allowDmsFromServerMembers}
                    onCheckedChange={setAllowDmsFromServerMembers}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Message requests')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Filter messages from server members you may not know.')}{' '}
                      <button
                        type="button"
                        onClick={() => toast.info(t('Pesan dari pengguna di luar daftar teman akan masuk ke Permintaan Pesan terlebih dahulu.'))}
                        className="text-primary hover:underline font-medium inline cursor-pointer"
                      >
                        {t('Learn more')}
                      </button>
                    </div>
                  </div>
                  <Switch
                    checked={enableMessageRequests}
                    onCheckedChange={setEnableMessageRequests}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 4. FRIEND REQUEST PERMISSIONS ── */}
            <div id="permissions-friend-requests" className="space-y-4 scroll-mt-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Friend Request Permissions')}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {t('Control who can send you friend requests and how they appear.')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Allow Friend Requests from...')}
                </div>

                <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                  {[
                    {
                      key: 'everyone' as const,
                      label: t('Everyone'),
                      desc: null,
                    },
                    {
                      key: 'friendsOfFriends' as const,
                      label: t('Friend of friends'),
                      desc: null,
                    },
                    {
                      key: 'serverMembers' as const,
                      label: t('Server members'),
                      desc: t('Server members can only send you friend requests from servers where you also allow Direct Messages.'),
                    },
                  ].map((item) => (
                    <div key={item.key} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {item.label}
                        </div>
                        {item.desc && (
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            {item.desc}
                          </div>
                        )}
                      </div>
                      <Switch
                        checked={(allowFriendRequestsFrom as any)[item.key]}
                        onCheckedChange={(val) =>
                          setAllowFriendRequestsFrom((prev) => ({ ...prev, [item.key]: val }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Show personalized messages */}
              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show personalized messages')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Show personalized messages on incoming friend requests. If you accept, the message will still appear in your DMs.')}
                  </div>
                </div>
                <Switch
                  checked={showPersonalizedFriendRequests}
                  onCheckedChange={setShowPersonalizedFriendRequests}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 5. MESSAGING IN CONNECTED GAMES ── */}
            <div id="permissions-connected-games" className="space-y-4 scroll-mt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t('Messaging in Connected Games')}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {t('These are settings for games like Neverness to Everness that use Anticeil to power their social experiences.')}
                  </p>
                </div>
                {/* Game badge icon */}
                <div className="size-11 rounded-2xl bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Allow friends from games to send direct messages and invites')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t("Let friends from connected games send DMs and invite me to play games, even when the game we play isn't open.")}
                  </div>
                </div>
                <Switch
                  checked={allowGameDmsAndInvites}
                  onCheckedChange={setAllowGameDmsAndInvites}
                />
              </div>

              {/* Show Direct Messages in games */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show Direct Messages in games')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {t('Read and respond to DMs directly from game chats.')}
                  </div>
                </div>

                <div className="divide-y divide-border/60">
                  {[
                    {
                      id: 'all' as const,
                      label: t('Show all DMs'),
                    },
                    {
                      id: 'game-players' as const,
                      label: t('Show only DMs from people who also play the game'),
                    },
                    {
                      id: 'none' as const,
                      label: t("Don't show any DMs"),
                    },
                  ].map((opt) => {
                    const isSelected = gameDmsVisibility === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGameDmsVisibility(opt.id)}
                        className={cn(
                          'w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer',
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          )}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                        </div>
                        <span className={cn('text-xs', isSelected ? 'font-bold text-foreground' : 'text-foreground/90 font-medium')}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <button
                  type="button"
                  onClick={() => toast.info(t('Belum ada game atau aplikasi eksternal yang diotorisasi.'))}
                  className="w-full p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground group-hover:text-primary transition-colors">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Authorized Apps')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Manage your games in Authorized Apps')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>
          </div>

  );
}
