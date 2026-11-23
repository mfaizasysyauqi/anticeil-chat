import React from 'react';
import {
  Hash,
  Volume2,
  MessagesSquare,
  Columns3,
  Megaphone,
  Podcast,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eye,
  Smile,
  Info,
  Radio,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { ColonyChannel, ColonyChannelType } from '@/chat/chat-types';
import type { ColonyCategory } from '../../api/categories-api';

export interface ChannelOverviewTabProps {
  channel: ColonyChannel;
  name: string;
  setName: (name: string) => void;
  channelType: ColonyChannelType;
  setChannelType: (type: ColonyChannelType) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  categories?: ColonyCategory[];
  topic: string;
  setTopic: React.Dispatch<React.SetStateAction<string>>;
  slowmode: number;
  setSlowmode: (val: number) => void;
  contentVisibility: 'default' | 'spoiler' | 'nsfw';
  setContentVisibility: (val: 'default' | 'spoiler' | 'nsfw') => void;
  isAnnouncement?: boolean;
  setIsAnnouncement?: (val: boolean) => void;
  defaultAutoArchiveDuration?: number;
  setDefaultAutoArchiveDuration?: (val: number) => void;
  userLimit?: number;
  setUserLimit?: (val: number) => void;
  bitrate?: number;
  setBitrate?: (val: number) => void;
  boostTier?: number;
}

const SLOWMODE_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
  { label: '15m', value: 900 },
  { label: '30m', value: 1800 },
  { label: '1h', value: 3600 },
  { label: '2h', value: 7200 },
  { label: '6h', value: 21600 },
];

const AUTO_ARCHIVE_OPTIONS = [
  { label: '1 Hour', value: 60 },
  { label: '24 Hours', value: 1440 },
  { label: '3 Days', value: 4320 },
  { label: '1 Week', value: 10080 },
];

export function ChannelOverviewTab({
  channel,
  name,
  setName,
  channelType,
  setChannelType,
  categoryId,
  setCategoryId,
  categories = [],
  topic,
  setTopic,
  slowmode,
  setSlowmode,
  contentVisibility,
  setContentVisibility,
  isAnnouncement = false,
  setIsAnnouncement,
  defaultAutoArchiveDuration = 4320,
  setDefaultAutoArchiveDuration,
  userLimit = 0,
  setUserLimit,
  bitrate = 64000,
  setBitrate,
  boostTier = 0,
}: ChannelOverviewTabProps) {
  const { t } = useTranslation();
  const maxBitrateKbps = boostTier >= 3 ? 384 : boostTier >= 2 ? 256 : boostTier >= 1 ? 128 : 96;

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('channel-topic-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      setTopic((prev) => prev + prefix + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = topic.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;
    const nextTopic = topic.substring(0, start) + replacement + topic.substring(end);
    setTopic(nextTopic);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 10);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Section Title ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Overview')}</h2>
      </div>

      {/* ── 1. Channel Name ──────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Channel Name')}
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-muted-foreground font-semibold">
            {channelType === 'voice' ? (
              <Volume2 className="w-4 h-4" />
            ) : channelType === 'forum' ? (
              <MessagesSquare className="w-4 h-4" />
            ) : channelType === 'kanban' ? (
              <Columns3 className="w-4 h-4" />
            ) : channelType === 'announcement' ? (
              <Megaphone className="w-4 h-4" />
            ) : channelType === 'stage' ? (
              <Podcast className="w-4 h-4" />
            ) : (
              <Hash className="w-4 h-4" />
            )}
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={channel.name || 'new-channel'}
            className="w-full bg-input/40 border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
          />
          <button
            type="button"
            onClick={() => insertMarkdown('🎉')}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 1.2 Category Assignment & Channel Type ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Category')}
          </label>
          <Select
            value={categoryId || 'none'}
            onValueChange={(val) => setCategoryId(val === 'none' ? '' : val)}
          >
            <SelectTrigger className="w-full bg-input/40 border border-border rounded-lg text-xs font-medium h-10">
              <SelectValue placeholder={t('No Category')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="none" className="text-xs">
                {t('Tanpa Kategori (Root)')}
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                  📁 {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {t('Kelompokkan saluran ini ke dalam kategori tertentu agar susunan server lebih teratur.')}
          </p>
        </div>

        {/* Channel Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Tipe Channel')}
          </label>
          <Select
            value={channelType}
            onValueChange={(val) => setChannelType(val as ColonyChannelType)}
          >
            <SelectTrigger className="w-full bg-input/40 border border-border rounded-lg text-xs font-medium h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="text" className="text-xs">
                # Text Channel
              </SelectItem>
              <SelectItem value="voice" className="text-xs">
                🔊 Voice Channel
              </SelectItem>
              <SelectItem value="forum" className="text-xs">
                💬 Forum Channel
              </SelectItem>
              <SelectItem value="announcement" className="text-xs">
                📢 Announcement Channel
              </SelectItem>
              <SelectItem value="stage" className="text-xs">
                🎙️ Stage Channel
              </SelectItem>
              <SelectItem value="kanban" className="text-xs">
                📋 Kanban Board
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {t('Ubah format interaksi saluran sesuai kebutuhan diskusi server.')}
          </p>
        </div>
      </div>

      {/* ── 2. Channel Topic ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Channel Topic')}
        </label>
        <div className="border border-border rounded-lg bg-input/30 overflow-hidden focus-within:border-primary transition-colors">
          {/* Rich Text Toolbar */}
          <div className="flex items-center justify-between p-1.5 border-b border-border bg-muted/40 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => insertMarkdown('**')}
                className="p-1 hover:bg-muted rounded hover:text-foreground transition-colors cursor-pointer"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*')}
                className="p-1 hover:bg-muted rounded hover:text-foreground transition-colors cursor-pointer"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('__')}
                className="p-1 hover:bg-muted rounded hover:text-foreground transition-colors cursor-pointer"
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('~~')}
                className="p-1 hover:bg-muted rounded hover:text-foreground transition-colors cursor-pointer"
                title="Strikethrough"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-border mx-1" />
              <button
                type="button"
                onClick={() => insertMarkdown('||')}
                className="p-1 hover:bg-muted rounded hover:text-foreground transition-colors cursor-pointer"
                title="Spoiler"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => insertMarkdown('✨')}
              className="p-1 hover:bg-muted rounded hover:text-foreground transition-colors cursor-pointer text-muted-foreground"
              title="Emoji / Sticker"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            id="channel-topic-textarea"
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('Let everyone know how to use this channel!')}
            className="w-full bg-transparent p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
            maxLength={1024}
          />
        </div>
        <div className="flex justify-end">
          <span className="text-[10px] text-muted-foreground font-mono">
            {1024 - topic.length}
          </span>
        </div>
      </div>

      {/* ── Voice Channel Settings: BITRATE & USER LIMIT (Discord 1:1 Parity) ── */}
      {channelType === 'voice' && (
        <div className="space-y-6 pt-4 border-t border-border">
          {/* 1. Bitrate Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Bitrate')}
              </label>
              <span className="text-xs font-bold text-foreground font-mono">
                {Math.round((bitrate || 64000) / 1000)}kbps
              </span>
            </div>
            <div className="space-y-1">
              <input
                type="range"
                min={8}
                max={maxBitrateKbps}
                step={8}
                value={Math.round((bitrate || 64000) / 1000)}
                onChange={(e) => setBitrate?.(Number(e.target.value) * 1000)}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>8kbps</span>
                <span>{maxBitrateKbps}kbps</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t(
                '8kbps - {{max}}kbps. Audio di atas 96kbps membutuhkan Colony Boost Level 1 (128kbps), Level 2 (256kbps), atau Level 3 (384kbps).',
                { max: `${maxBitrateKbps}kbps` }
              )}
            </p>
          </div>

          {/* 2. User Limit Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('User Limit')}
              </label>
              <span className="text-xs font-bold text-foreground">
                {userLimit === 0
                  ? t('Tidak Terbatas (No Limit)')
                  : t('{{count}} Pengguna', { count: userLimit })}
              </span>
            </div>
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={99}
                step={1}
                value={userLimit || 0}
                onChange={(e) => setUserLimit?.(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{t('Tidak Terbatas')}</span>
                <span>99 {t('Pengguna')}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t(
                'Membatasi jumlah pengguna yang dapat terhubung ke saluran suara ini secara bersamaan. Pengguna dengan hak Administrator dapat melewati batas ini.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Slowmode ──────────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Slowmode')}
        </label>
        <Select
          value={String(slowmode)}
          onValueChange={(val) => setSlowmode(Number(val))}
        >
          <SelectTrigger className="w-full bg-input/40 border border-border rounded-lg text-xs font-medium h-10">
            <SelectValue placeholder="Off" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            {SLOWMODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t('Members will be restricted to sending one message and creating one thread per this interval, unless they have the Bypass Slowmode permission.')}
        </p>
      </div>

      {/* ── 4. Content Visibility ────────────────────────────────────── */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Content Visibility')}
        </label>
        <div className="space-y-2">
          {/* Default */}
          <div
            onClick={() => setContentVisibility('default')}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
              contentVisibility === 'default'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border bg-card/40 hover:bg-muted/40'
            )}
          >
            <div className="mt-0.5 flex items-center justify-center">
              <div
                className={cn(
                  'size-4 rounded-full border flex items-center justify-center transition-colors',
                  contentVisibility === 'default'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/60 bg-transparent'
                )}
              >
                {contentVisibility === 'default' && (
                  <div className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">{t('Default')}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {t('Channel content is always visible.')}
              </div>
            </div>
          </div>

          {/* Spoiler */}
          <div
            onClick={() => setContentVisibility('spoiler')}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
              contentVisibility === 'spoiler'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border bg-card/40 hover:bg-muted/40'
            )}
          >
            <div className="mt-0.5 flex items-center justify-center">
              <div
                className={cn(
                  'size-4 rounded-full border flex items-center justify-center transition-colors',
                  contentVisibility === 'spoiler'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/60 bg-transparent'
                )}
              >
                {contentVisibility === 'spoiler' && (
                  <div className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">{t('Spoiler Channel')}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {t('Mark this channel as containing spoilers, so that plot twists, heavy topics, or other sensitive discussions are hidden until users choose to view.')}
              </div>
            </div>
          </div>

          {/* Age-Restricted */}
          <div
            onClick={() => setContentVisibility('nsfw')}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
              contentVisibility === 'nsfw'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border bg-card/40 hover:bg-muted/40'
            )}
          >
            <div className="mt-0.5 flex items-center justify-center">
              <div
                className={cn(
                  'size-4 rounded-full border flex items-center justify-center transition-colors',
                  contentVisibility === 'nsfw'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/60 bg-transparent'
                )}
              >
                {contentVisibility === 'nsfw' && (
                  <div className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">{t('Age-Restricted Channel')}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {t('Users will need to confirm they are of over the legal age to view in the content in this channel. Age-restricted channels are exempt from the explicit content filter.')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Announcement Channel ──────────────────────────────────── */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="text-xs font-bold text-foreground">
              {t('Announcement Channel')}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('Users can follow this channel in their own servers. Posts you "Publish" from this channel will appear in those servers.')}{' '}
              <span className="text-primary hover:underline cursor-pointer">{t('Learn more.')}</span>
            </p>
          </div>
          {setIsAnnouncement && (
            <Switch
              checked={isAnnouncement}
              onCheckedChange={setIsAnnouncement}
              className="shrink-0 cursor-pointer"
            />
          )}
        </div>

        {/* Discord Blue Info Notice Callout */}
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-400 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
          <div className="text-[11px] text-blue-300/90 leading-relaxed">
            {t('By creating an announcement channel, your server profile will be visible to others outside your server members. You can control Profile privacy in Server Settings > Profile.')}
          </div>
        </div>
      </div>

      {/* ── 6. Hide After Inactivity ─────────────────────────────────── */}
      <div className="space-y-2 pt-4 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Hide After Inactivity')}
        </label>
        <Select
          value={String(defaultAutoArchiveDuration)}
          onValueChange={(val) => setDefaultAutoArchiveDuration && setDefaultAutoArchiveDuration(Number(val))}
        >
          <SelectTrigger className="w-full bg-input/40 border border-border rounded-lg text-xs font-medium h-10">
            <SelectValue placeholder="3 Days" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {AUTO_ARCHIVE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t('New threads will not show in the channel list after being inactive for the specified duration.')}
        </p>
      </div>

      {/* ── 7. Discord Authentic Subtle Footer Graphic ───────────────── */}
      <div className="pt-6 pb-2 flex justify-center opacity-25 select-none pointer-events-none">
        <svg
          className="w-36 h-20 text-muted-foreground"
          viewBox="0 0 160 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle audio gear / channel equipment silhouette */}
          <rect x="20" y="25" width="45" height="35" rx="6" stroke="currentColor" strokeWidth="2" />
          <line x1="28" y1="35" x2="57" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="43" x2="48" y2="43" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="51" x2="52" y2="51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          
          <rect x="75" y="15" width="65" height="50" rx="8" stroke="currentColor" strokeWidth="2" />
          <circle cx="95" cy="35" r="8" stroke="currentColor" strokeWidth="2" />
          <line x1="95" y1="31" x2="95" y2="39" stroke="currentColor" strokeWidth="2" />
          <circle cx="120" cy="35" r="8" stroke="currentColor" strokeWidth="2" />
          <line x1="120" y1="31" x2="120" y2="39" stroke="currentColor" strokeWidth="2" />
          <rect x="85" y="52" width="45" height="4" rx="2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
