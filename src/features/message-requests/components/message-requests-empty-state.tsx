import React from 'react';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';
import type { MessageRequestsTab } from '../types';

export interface MessageRequestsEmptyStateProps {
  activeTab: MessageRequestsTab;
  className?: string;
}

/**
 * Reusable DRY empty state component for Message Requests tabs
 * Uses Atlas message requests mascot illustration across "Semua", "Luar Kontak", and "Spam" tabs.
 */
export function MessageRequestsEmptyState({
  activeTab,
  className,
}: MessageRequestsEmptyStateProps) {
  const { t } = useTranslation();

  const emptyConfig: Record<MessageRequestsTab, { title: string; description: string }> = {
    requests: {
      title: t('Tidak ada permintaan pesan'),
      description: t('Saat orang yang bukan teman Anda mengirim pesan langsung, pesannya akan muncul di sini.'),
    },
    non_contacts: {
      title: t('Tidak ada permintaan dari luar kontak'),
      description: t('Semua pesan dari pengguna di luar daftar kontak Anda difilter dan dikelompokkan di sini.'),
    },
    spam: {
      title: t('Tidak ada pesan spam'),
      description: t('Pesan mencurigakan atau yang ditandai sebagai spam akan dikarantina di tab ini.'),
    },
  };

  const { title, description } = emptyConfig[activeTab] || emptyConfig.requests;

  return (
    <EmptyState
      media={
        <img
          src="/atlas-message-requests-empty.png"
          alt={title}
          className="h-36 sm:h-44 md:h-48 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] select-none pointer-events-none mb-1 animate-in fade-in zoom-in-95 duration-300"
          loading="lazy"
        />
      }
      title={title}
      description={description}
      className={className}
    />
  );
}
