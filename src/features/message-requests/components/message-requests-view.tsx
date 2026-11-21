import React, { useState } from 'react';
import { Mail, ShieldAlert, Check, X, Menu, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SidebarNavToggle } from '@/components/ui/sidebar-nav-toggle';
import { EmptyState } from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING, CHANNEL_VERTICAL_PADDING, LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { useTranslation } from '@/core/i18n';
import { CommunityAvatar } from '@/chat/chat-avatar';
import type { MessageRequestItem, MessageRequestsTab } from '../types';

interface MessageRequestsViewProps {
  requests: MessageRequestItem[];
  onAccept: (item: MessageRequestItem) => void;
  onIgnore: (item: MessageRequestItem) => void;
  onReportSpam: (item: MessageRequestItem) => void;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  verticalPadding?: string;
}

export function MessageRequestsView({
  requests,
  onAccept,
  onIgnore,
  onReportSpam,
  onOpenSidebar,
  horizontalPadding = CHANNEL_HORIZONTAL_PADDING,
  verticalPadding = CHANNEL_VERTICAL_PADDING,
}: MessageRequestsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MessageRequestsTab>('requests');

  const pendingRequests = requests.filter((r) => !r.isSpam);
  const nonContactRequests = requests.filter((r) => !r.isSpam && (!r.isContact || r.mutualServers === 0));
  const spamRequests = requests.filter((r) => r.isSpam);

  const currentList =
    activeTab === 'requests'
      ? pendingRequests
      : activeTab === 'non_contacts'
      ? nonContactRequests
      : spamRequests;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden select-none">
      {/* Top Header Bar: Discord Style Message Requests */}
      <div
        className={cn(
          'sticky top-0 z-20 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background overflow-hidden',
          horizontalPadding
        )}
      >
        <div className="flex items-center gap-2 shrink-0">
          <SidebarNavToggle onClick={onOpenSidebar} />

          {/* Title & Icon: Hidden on mobile (<sm), shown on tablet & desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Permintaan Pesan')}</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-4 mx-1 shrink-0" />
        </div>

        {/* Tab Filter Pills: Requests & Spam */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1">
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
              activeTab === 'requests'
                ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>{t('Semua')}</span>
            {pendingRequests.length > 0 && (
              <span className="text-[10px] text-muted-foreground/80">({pendingRequests.length})</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('non_contacts')}
            className={cn(
              'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
              activeTab === 'non_contacts'
                ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>{t('Luar Kontak')}</span>
            {nonContactRequests.length > 0 && (
              <span className="text-[10px] text-muted-foreground/80">({nonContactRequests.length})</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('spam')}
            className={cn(
              'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
              activeTab === 'spam'
                ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>{t('Spam')}</span>
            {spamRequests.length > 0 && (
              <span className="text-[10px] text-muted-foreground/80">({spamRequests.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(LAYOUT_PAGE_SPACING.BODY_HORIZONTAL, verticalPadding)}>
        {/* Section Header Count */}
        <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-4">
          {activeTab === 'requests'
            ? `${t('Semua Permintaan Tertunda')} — ${pendingRequests.length}`
            : activeTab === 'non_contacts'
            ? `${t('Permintaan dari Luar Kontak')} — ${nonContactRequests.length}`
            : `${t('Spam')} — ${spamRequests.length}`}
        </div>

        {/* Requests List */}
        {currentList.length === 0 ? (
          <EmptyState
            icon={
              activeTab === 'requests' ? (
                <ShieldCheck className="w-8 h-8 text-primary/80 stroke-[1.8]" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-muted-foreground/80 stroke-[1.8]" />
              )
            }
            title={
              activeTab === 'requests'
                ? t('Tidak ada permintaan pesan')
                : activeTab === 'non_contacts'
                ? t('Tidak ada permintaan dari luar kontak')
                : t('Tidak ada pesan spam')
            }
            description={
              activeTab === 'requests'
                ? t('Saat orang yang bukan teman Anda mengirim pesan langsung, pesannya akan muncul di sini.')
                : activeTab === 'non_contacts'
                ? t('Semua pesan dari pengguna di luar daftar kontak Anda difilter dan dikelompokkan di sini.')
                : t('Pesan mencurigakan atau yang ditandai sebagai spam akan dikarantina di tab ini.')
            }
          />
        ) : (
          <div className="divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden bg-card/40">
            {currentList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 hover:bg-accent/30 transition-colors group"
              >
                {/* Left Profile Info */}
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <CommunityAvatar
                    imageUrl={item.avatar}
                    name={item.name}
                    className="w-10 h-10 shrink-0 border border-border/50 rounded-full"
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{item.username}</span>
                      {(!item.isContact || item.mutualServers === 0) && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t('Luar Kontak')}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground/60">{item.date}</span>
                    </div>
                    <div className="text-xs text-muted-foreground/75 mt-0.5 flex items-center gap-1.5">
                      <span>
                        {item.mutualServers > 0
                          ? `${item.mutualServers} ${t('Colony Bersama')}`
                          : t('Tidak Ada Colony Bersama')}
                      </span>
                      {item.initialMessage && (
                        <>
                          <span>•</span>
                          <span className="truncate italic text-muted-foreground/90 max-w-[280px]">
                            "{item.initialMessage}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeTab !== 'spam' ? (
                    <>
                      <button
                        onClick={() => onIgnore(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                      >
                        {t('Abaikan')}
                      </button>
                      <button
                        onClick={() => onAccept(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('Terima DM')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onAccept(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-border hover:bg-accent text-foreground rounded-md transition-colors cursor-pointer"
                      >
                        {t('Terima DM')}
                      </button>
                      <button
                        onClick={() => onReportSpam(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t('Laporkan Spam')}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </ScrollArea>
    </div>
  );
}
