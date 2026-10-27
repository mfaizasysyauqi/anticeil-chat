import React from 'react';
import {
  ArrowLeft,
  MessagesSquare,
  Search,
  TrendingUp,
  ChevronDown,
  Plus,
  X,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { renderFormattedMessage } from '@/features/chat';
import dayjs from 'dayjs';
import type { CommunityChannel, CommunityMessage, CommunityThread } from '@/chat/chat-types';

export interface ForumChannelViewProps {
  activeChannel: CommunityChannel | null;
  activeThread: CommunityThread | null;
  setActiveThread: (thread: CommunityThread | null) => void;
  channelThreadsList: CommunityThread[];
  threadMessages: CommunityMessage[];
  forumSearchQuery: string;
  setForumSearchQuery: (query: string) => void;
  forumSort: 'active' | 'newest';
  setForumSort: (sort: 'active' | 'newest') => void;
  isForumComposerOpen: boolean;
  setIsForumComposerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  forumNewTitle: string;
  setForumNewTitle: (title: string) => void;
  forumNewMessage: string;
  setForumNewMessage: (msg: string) => void;
  isSubmittingForumPost: boolean;
  onCreateForumPost: (e: React.FormEvent) => void;
  threadInputText: string;
  setThreadInputText: (text: string) => void;
  onSendThreadMessage: (e: React.FormEvent) => void;
  channelPaddingClass?: string;
  t: (key: string) => string;
}

export function ForumChannelView({
  activeChannel,
  activeThread,
  setActiveThread,
  channelThreadsList,
  threadMessages,
  forumSearchQuery,
  setForumSearchQuery,
  forumSort,
  setForumSort,
  isForumComposerOpen,
  setIsForumComposerOpen,
  forumNewTitle,
  setForumNewTitle,
  forumNewMessage,
  setForumNewMessage,
  isSubmittingForumPost,
  onCreateForumPost,
  threadInputText,
  setThreadInputText,
  onSendThreadMessage,
  channelPaddingClass = 'px-4 lg:px-6',
  t,
}: ForumChannelViewProps) {
  const filteredForumPosts = (() => {
    let list = [...channelThreadsList];
    if (forumSearchQuery.trim()) {
      const q = forumSearchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.creatorName.toLowerCase().includes(q),
      );
    }
    if (forumSort === 'active') {
      list.sort(
        (a, b) =>
          new Date(b.lastMessageAt || b.createdAt || (b as any).created || '').getTime() -
          new Date(a.lastMessageAt || a.createdAt || (a as any).created || '').getTime(),
      );
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || (b as any).created || '').getTime() -
          new Date(a.createdAt || (a as any).created || '').getTime(),
      );
    }
    return list;
  })();

  // 1. Thread Discussion View (when a post is opened)
  if (activeThread) {
    return (
      <div className="flex-1 min-h-0 flex flex-col w-full h-full bg-background text-foreground">
        {/* Subheader with back button */}
        <div className={`${channelPaddingClass} py-3 border-b border-border flex items-center justify-between bg-card/40 shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveThread(null)}
              className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>#{activeChannel?.name}</span>
            </Button>
            <Separator orientation="vertical" className="h-4 bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <MessagesSquare className="w-4 h-4 text-primary shrink-0" />
              <span className="font-bold text-sm text-foreground truncate">{activeThread.name}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 font-mono hidden sm:block">
            {activeThread.creatorName} • {dayjs(activeThread.createdAt || (activeThread as any).created).fromNow()}
          </div>
        </div>

        {/* Discussion feed: OP Card + Replies list */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${channelPaddingClass} py-5 space-y-4 [scrollbar-width:thin]`}>
          {/* OP Card */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <CommunityAvatar
                name={activeThread.creatorName}
                imageUrl={activeThread.creatorAvatar}
                size={28}
              />
              <span className="text-xs font-bold text-foreground">{activeThread.creatorName}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {dayjs(activeThread.createdAt || (activeThread as any).created).format('DD MMM YYYY, HH:mm')}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 text-primary border-primary/40 bg-primary/10"
              >
                OP
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-foreground">{activeThread.name}</h3>
            {threadMessages.length > 0 && threadMessages[0].content && (
              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pt-1 border-t border-border/50">
                {renderFormattedMessage(threadMessages[0].content)}
              </div>
            )}
          </div>

          {/* Replies List */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t('Balasan')} ({Math.max(0, threadMessages.length - 1)})
            </div>

            {threadMessages.length <= 1 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t('Belum ada balasan. Jadilah yang pertama memberikan respons!')}
              </div>
            ) : (
              threadMessages.slice(1).map((msg) => (
                <div
                  key={msg.id}
                  className="flex gap-3 p-3.5 rounded-xl bg-card/60 border border-border/60 hover:border-border transition-colors"
                >
                  <CommunityAvatar
                    name={msg.senderName}
                    imageUrl={msg.senderAvatar}
                    size={32}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {dayjs(msg.createdAt).format('HH:mm')}
                      </span>
                    </div>
                    <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {renderFormattedMessage(msg.content)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Reply Bar */}
        <form
          onSubmit={onSendThreadMessage}
          className={`${channelPaddingClass} py-3 border-t border-border bg-card/40 shrink-0`}
        >
          <div className="flex items-center gap-2">
            <Input
              value={threadInputText}
              onChange={(e) => setThreadInputText(e.target.value)}
              placeholder={t(`Kirim balasan ke #${activeThread.name}...`)}
              className="text-xs h-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button
              type="submit"
              disabled={!threadInputText.trim()}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('Balas')}</span>
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // 2. Forum Board List View
  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full bg-background text-foreground">
      {/* Top Search & Actions Bar */}
      <div className={`${channelPaddingClass} py-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 shrink-0`}>
        {/* Search or create a post input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={forumSearchQuery}
            onChange={(e) => setForumSearchQuery(e.target.value)}
            placeholder={t('Search or create a post...')}
            className="pl-9 text-xs h-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Right actions: Sort & View, + New Post */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 bg-muted border-border text-foreground hover:bg-accent cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <span>
                  {forumSort === 'newest' ? 'Sort & View' : 'Aktivitas Terakhir'}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs bg-popover border-border text-popover-foreground">
              <DropdownMenuItem
                onClick={() => setForumSort('newest')}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                Terbaru (Waktu Dibuat)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setForumSort('active')}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                Aktivitas Terakhir (Balasan Baru)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setIsForumComposerOpen((prev) => !prev)}
            className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('New Post')}</span>
          </Button>
        </div>
      </div>

      {/* Inline Post Composer (when user clicks New Post) */}
      {isForumComposerOpen && (
        <div className="p-4 border-b border-border bg-card/80 animate-in fade-in-50 duration-150">
          <form
            onSubmit={onCreateForumPost}
            className="space-y-3 max-w-2xl mx-auto p-4 rounded-xl border border-border bg-muted/60 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                <span>{t('Create a Post in')} #{activeChannel?.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsForumComposerOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Title
              </label>
              <Input
                value={forumNewTitle}
                onChange={(e) => setForumNewTitle(e.target.value)}
                placeholder="Post title..."
                className="text-sm font-semibold h-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Message
              </label>
              <textarea
                value={forumNewMessage}
                onChange={(e) => setForumNewMessage(e.target.value)}
                placeholder="Tulis pesan atau topik diskusi di sini..."
                rows={4}
                className="w-full text-xs rounded-md bg-background border border-border p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsForumComposerOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingForumPost || !forumNewTitle.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 px-5"
              >
                {isSubmittingForumPost ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List Cards */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${channelPaddingClass} py-4 [scrollbar-width:thin]`}>
        {filteredForumPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4">
              <MessagesSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              {forumSearchQuery ? 'No posts matching query' : `There are no posts in #${activeChannel?.name}`}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
              {forumSearchQuery
                ? 'Coba gunakan kata kunci pencarian yang lain.'
                : 'Be the first to start an organized discussion in this forum channel!'}
            </p>
            {!isForumComposerOpen && (
              <Button
                onClick={() => setIsForumComposerOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Post</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 max-w-5xl mx-auto">
            {filteredForumPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setActiveThread(post)}
                className="p-4 rounded-xl bg-card/60 hover:bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                    {post.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-semibold text-foreground/90">{post.creatorName}: </span>
                    {post.name}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 mt-3 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                    <span>{post.messageCount || 0}</span>
                  </div>
                  <span>•</span>
                  <span className="font-mono">
                    {dayjs(post.lastMessageAt || post.createdAt || (post as any).created).fromNow()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
