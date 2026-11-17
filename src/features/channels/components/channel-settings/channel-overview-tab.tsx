import React from 'react';
import {
  Hash,
  Volume2,
  MessagesSquare,
  Columns3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eye,
  Smile,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
}: ChannelOverviewTabProps) {
  const { t } = useTranslation();

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
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{t('Overview')}</h2>
      </div>

      {/* 1. Channel Name */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Channel Name')}
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-muted-foreground font-semibold">
            {channel.type === 'voice' ? (
              <Volume2 className="w-4 h-4" />
            ) : channel.type === 'forum' ? (
              <MessagesSquare className="w-4 h-4" />
            ) : channel.type === 'kanban' ? (
              <Columns3 className="w-4 h-4" />
            ) : (
              <Hash className="w-4 h-4" />
            )}
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="new-channel"
            className="w-full bg-muted/40 border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
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

      {/* 1.5 Channel Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Tipe Channel')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { type: 'text' as const, label: 'Text', icon: Hash },
            { type: 'voice' as const, label: 'Voice', icon: Volume2 },
            { type: 'forum' as const, label: 'Forum', icon: MessagesSquare },
            { type: 'kanban' as const, label: 'Kanban', icon: Columns3 },
          ].map((item) => {
            const isSelected = channelType === item.type;
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setChannelType(item.type)}
                className={cn(
                  'flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary font-bold ring-1 ring-primary/40'
                    : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t('Ubah format interaksi saluran: Text untuk obrolan pesan, Voice untuk panggilan & aktivitas layar bersama, Forum untuk utas diskusi, Kanban untuk papan manajemen tugas.')}
        </p>
      </div>

      {/* 1.6 Category Assignment */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Category')}
        </label>
        <Select
          value={categoryId || 'none'}
          onValueChange={(val) => setCategoryId(val === 'none' ? '' : val)}
        >
          <SelectTrigger className="w-full bg-muted/40 border border-border rounded-lg text-xs font-medium h-10">
            <SelectValue placeholder={t('No Category')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
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

      {/* 2. Channel Topic */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Channel Topic')}
        </label>
        <div className="border border-border rounded-lg bg-muted/40 overflow-hidden focus-within:border-primary transition-colors">
          <div className="flex items-center gap-1 p-1.5 border-b border-border bg-muted/20 text-muted-foreground text-xs">
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
          <textarea
            id="channel-topic-textarea"
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('Let everyone know how to use this channel...')}
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

      {/* 3. Slowmode */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('Slowmode')}
          </label>
          <span className="text-xs font-bold text-primary font-mono">
            {SLOWMODE_OPTIONS.find((opt) => opt.value === slowmode)?.label || `${slowmode}s`}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={SLOWMODE_OPTIONS.length - 1}
          step="1"
          value={Math.max(0, SLOWMODE_OPTIONS.findIndex((opt) => opt.value === slowmode))}
          onChange={(e) => {
            const selected = SLOWMODE_OPTIONS[parseInt(e.target.value, 10)];
            if (selected) setSlowmode(selected.value);
          }}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-0.5">
          <span>Off</span>
          <span>5m</span>
          <span>6h</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t('Members will be restricted to sending one message and creating one thread per this interval, unless they have the Bypass Slowmode permission.')}
        </p>
      </div>

      {/* 4. Content Visibility */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('Content Visibility')}
        </label>
        <div className="space-y-2">
          {/* Default */}
          <label
            onClick={() => setContentVisibility('default')}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
              contentVisibility === 'default'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card/40 hover:bg-muted/40'
            )}
          >
            <input
              type="radio"
              name="content-visibility"
              checked={contentVisibility === 'default'}
              onChange={() => setContentVisibility('default')}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">{t('Default')}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {t('Channel content is always visible.')}
              </div>
            </div>
          </label>

          {/* Spoiler */}
          <label
            onClick={() => setContentVisibility('spoiler')}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
              contentVisibility === 'spoiler'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card/40 hover:bg-muted/40'
            )}
          >
            <input
              type="radio"
              name="content-visibility"
              checked={contentVisibility === 'spoiler'}
              onChange={() => setContentVisibility('spoiler')}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">{t('Spoiler Channel')}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {t('Mark this channel as containing spoilers, so that plot twists, heavy topics, or other sensitive discussions are hidden until users choose to view.')}
              </div>
            </div>
          </label>

          {/* Age-Restricted */}
          <label
            onClick={() => setContentVisibility('nsfw')}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer',
              contentVisibility === 'nsfw'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card/40 hover:bg-muted/40'
            )}
          >
            <input
              type="radio"
              name="content-visibility"
              checked={contentVisibility === 'nsfw'}
              onChange={() => setContentVisibility('nsfw')}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground">{t('Age-Restricted Channel')}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {t('Users will need to confirm they are of age to view the content in this channel.')}
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
