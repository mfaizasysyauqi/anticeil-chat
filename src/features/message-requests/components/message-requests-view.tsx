import React, { useState } from 'react';
import { Mail, ShieldAlert, Check, X, Menu, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
}

export function MessageRequestsView({
  requests,
  onAccept,
  onIgnore,
  onReportSpam,
  onOpenSidebar,
  horizontalPadding = 'px-6',
}: MessageRequestsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MessageRequestsTab>('requests');

  const pendingRequests = requests.filter((r) => !r.isSpam);
  const spamRequests = requests.filter((r) => r.isSpam);

  const currentList = activeTab === 'requests' ? pendingRequests : spamRequests;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden select-none">
      {/* Top Header Bar: Discord Style Message Requests */}
      <div
        className={`h-12 border-b border-sidebar-border ${horizontalPadding} flex items-center justify-between shrink-0 bg-background z-10`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto [scrollbar-width:none]">
          {/* Mobile burger menu */}
          {onOpenSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSidebar}
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 mr-0.5 cursor-pointer shrink-0"
              title={t('Buka Menu Sidebar')}
              aria-label={t('Buka Menu Sidebar')}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{t('Permintaan Pesan')}</span>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1 shrink-0" />

          {/* Tab Filter Pills: Requests & Spam */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                'px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0',
                activeTab === 'requests'
                  ? 'bg-accent text-accent-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>{t('Permintaan')}</span>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] text-muted-foreground/80">({pendingRequests.length})</span>
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
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${horizontalPadding} py-6 [scrollbar-width:thin]`}>
        {/* Section Header Count */}
        <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-4">
          {activeTab === 'requests'
            ? `${t('Permintaan Tertunda')} — ${pendingRequests.length}`
            : `${t('Spam')} — ${spamRequests.length}`}
        </div>

        {/* Requests List */}
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="size-16 rounded-full bg-accent/40 flex items-center justify-center mb-4 text-muted-foreground">
              {activeTab === 'requests' ? (
                <ShieldCheck className="w-8 h-8 text-primary/70" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-muted-foreground/70" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {activeTab === 'requests'
                ? t('Tidak ada permintaan pesan')
                : t('Tidak ada pesan spam')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {activeTab === 'requests'
                ? t('Saat orang yang bukan teman Anda mengirim pesan langsung, pesannya akan muncul di sini.')
                : t('Pesan mencurigakan atau yang ditandai sebagai spam akan dikarantina di tab ini.')}
            </p>
          </div>
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
                  {activeTab === 'requests' ? (
                    <>
                      <button
                        onClick={() => onIgnore(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                      >
                        {t('Abaikan')}
                      </button>
                      <button
                        onClick={() => onAccept(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
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
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#da373c] hover:bg-[#be3135] text-white rounded-md transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
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
    </div>
  );
}
