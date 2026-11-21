import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty';
import { useTranslation } from '@/core/i18n';
import type { MessageRequestsTab } from '../types';

export interface MessageRequestsEmptyStateProps {
  activeTab: MessageRequestsTab;
  className?: string;
}

/**
 * Reusable DRY empty state component for Message Requests tabs
 * Ensures identical high-fidelity visual styling (blue shield icon badge)
 * across "Semua", "Luar Kontak", and "Spam" tabs.
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
      icon={<ShieldCheck className="w-8 h-8 text-primary/80 stroke-[1.8]" />}
      title={title}
      description={description}
      className={className}
    />
  );
}
