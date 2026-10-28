import React from 'react';
import { Webhook, Copy, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { communityApi } from '@/chat/chat-api';
import type { CommunityHub } from '@/chat/chat-types';

interface IntegrationsTabProps {
  activeHub: CommunityHub;
  onClose: () => void;
  onOpenWebhooks?: () => void;
  t: (key: string) => string;
}

export function IntegrationsTab({
  activeHub,
  onClose,
  onOpenWebhooks,
  t,
}: IntegrationsTabProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{t('Integrasi & Automasi')}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Kelola bot, webhook, dan alur automasi Activepieces yang terhubung ke server ini.')}
      </p>

      <div className="space-y-4">
        {/* Webhook Card */}
        <div className="rounded-lg border bg-card/40 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('Incoming Webhooks')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('Kirim pesan otomatis via HTTP POST dari automasi luar.')}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onOpenWebhooks?.();
              }}
            >
              {t('Buka Panel Webhook')}
            </Button>
          </div>

          <div className="rounded bg-muted/50 p-2.5 flex items-center justify-between text-xs font-mono">
            <span className="truncate pr-2">{`${window.location.origin}/api/v1/community/webhook?hubId=${activeHub?.id}`}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px]"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/v1/community/webhook?hubId=${activeHub?.id}`);
                toast.success(t('URL Webhook disalin! 📋'));
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              {t('Salin')}
            </Button>
          </div>
        </div>

        {/* Connected Bots */}
        <div className="rounded-lg border bg-card/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('Bot & Aplikasi Terhubung')}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={async () => {
                await communityApi.testWebhook({
                  hubId: activeHub.id,
                  botName: 'Anticeil Integration Assistant',
                  content: `Halo! Integrasi automasi server #${activeHub.name} berjalan dengan normal. 🤖✨`,
                });
                toast.success(t('Pesan tes bot berhasil dikirim ke saluran! 🚀'));
              }}
            >
              <Send className="w-3 h-3 mr-1.5" />
              {t('Tes Bot')}
            </Button>
          </div>

          <div className="space-y-2">
            {[
              {
                name: 'Anticeil Automation Bot',
                desc: 'Memproses triggers workflow Activepieces ke chat',
                status: 'Online',
                badge: 'bg-emerald-500',
              },
              {
                name: 'Webhook Ingestion Assistant',
                desc: 'Menerima alert & webhook dari sistem eksternal',
                status: 'Aktif',
                badge: 'bg-blue-500',
              },
            ].map((b, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border bg-background/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn('w-2 h-2 rounded-full', b.badge)} />
                  {b.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
