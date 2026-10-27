import React, { useState } from 'react';
import {
  Webhook,
  Hash,
  Copy,
  Check,
  Plus,
  Sparkles,
  Send,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { communityApi } from '@/chat/chat-api';
import type { CommunityChannel, CommunityHub } from '@/chat/chat-types';

interface WebhookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannel: CommunityChannel | null;
  hubChannels: CommunityChannel[];
  activeHub: CommunityHub | null;
  onSelectChannel?: (channelId: string) => void;
  onCreateChannel?: () => void;
}

export function WebhookDialog({
  isOpen,
  onClose,
  activeChannel,
  hubChannels,
  activeHub,
  onSelectChannel,
  onCreateChannel,
}: WebhookDialogProps) {
  const { t } = useTranslation();

  const [isCopiedWebhook, setIsCopiedWebhook] = useState(false);
  const [isCopiedChannelId, setIsCopiedChannelId] = useState(false);
  const [isCopiedHubId, setIsCopiedHubId] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const effectiveChannel = activeChannel || (hubChannels.length > 0 ? hubChannels[0] : null);
  const serverId = activeHub?.id || 'anticeil';
  const channelId = effectiveChannel?.id || '';
  const channelName = effectiveChannel?.name || 'saluran';
  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://anticeil.com'}/api/v1/community/webhook?channelId=${channelId || 'general'}&hubId=${serverId}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base flex items-center gap-1.5">
                {t('Integrasi Webhook Bot')}
                {effectiveChannel && (
                  <span className="text-muted-foreground font-normal text-xs">
                    #{channelName}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t('Hubungkan automasi Flow Builder atau bot eksternal ke saluran Anticeil Chat ini.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!effectiveChannel ? (
            /* Empty state: No channel in server */
            <div className="py-6 px-4 text-center rounded-lg border border-dashed border-border/80 bg-muted/20 space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{t('Belum Ada Saluran di Server Ini')}</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {t('Webhook memerlukan channel target untuk menerima pesan. Buat saluran pertama Anda terlebih dahulu.')}
                </p>
              </div>
              {onCreateChannel && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onCreateChannel();
                  }}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {t('Buat Saluran Pertama')}
                </Button>
              )}

              <div className="pt-2 text-left border-t border-border/40">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {t('ID Server Saat Ini (Hub ID)')}
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={serverId}
                    className="font-mono text-[11px] bg-muted/40 select-all h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(serverId);
                      setIsCopiedHubId(true);
                      setTimeout(() => setIsCopiedHubId(false), 2000);
                    }}
                  >
                    {isCopiedHubId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Channel selector if server has multiple channels */}
              {hubChannels.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {t('Pilih Saluran Target Webhook')}
                  </label>
                  <select
                    value={channelId}
                    onChange={(e) => onSelectChannel?.(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {hubChannels.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.name} {c.description ? `— ${c.description}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 1. Full Webhook URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>{t('URL Webhook Masuk')}</span>
                  <Badge variant="outline" className="text-[10px] text-primary bg-primary/5">
                    {t('Otomatis')}
                  </Badge>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="font-mono text-[11px] bg-muted/40 select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={isCopiedWebhook ? 'default' : 'outline'}
                    className="shrink-0 h-9 px-3 gap-1.5 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setIsCopiedWebhook(true);
                      setTimeout(() => setIsCopiedWebhook(false), 2000);
                    }}
                  >
                    {isCopiedWebhook ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        {t('Tersalin')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        {t('Salin URL')}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t('Tempel URL ini pada field Webhook URL di Flow Builder atau piece Anticeil Chat.')}
                </p>
              </div>

              {/* 2. Direct IDs: Channel ID & Server/Hub ID */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t('ID Saluran (Channel ID)')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={channelId}
                      className="font-mono text-[11px] bg-muted/40 select-all h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 shrink-0"
                      onClick={() => {
                        if (channelId) {
                          navigator.clipboard.writeText(channelId);
                          setIsCopiedChannelId(true);
                          setTimeout(() => setIsCopiedChannelId(false), 2000);
                        }
                      }}
                    >
                      {isCopiedChannelId ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t('ID Server (Hub ID)')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={serverId}
                      className="font-mono text-[11px] bg-muted/40 select-all h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(serverId);
                        setIsCopiedHubId(true);
                        setTimeout(() => setIsCopiedHubId(false), 2000);
                      }}
                    >
                      {isCopiedHubId ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 3. Testing Section */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{t('Uji Coba Pengiriman Bot')}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isTestingWebhook}
                    onClick={async () => {
                      setIsTestingWebhook(true);
                      try {
                        await communityApi.testWebhook({
                          channelId,
                          channel: channelName,
                          hubId: serverId,
                          botName: 'Anticeil Ping Bot',
                          content: `👋 **Tes Webhook Berhasil!** Terkoneksi ke saluran **#${channelName}** (ID Server: \`${serverId}\`). Automasi Flow Builder Anda siap mengirim pesan ke sini! 🚀`,
                        });
                        toast.success(t(`Pesan tes bot berhasil dikirim ke #${channelName} 🚀`));
                      } catch (err) {
                        console.error('Failed to test webhook', err);
                        toast.error(t('Gagal mengirim pesan tes webhook'));
                      } finally {
                        setIsTestingWebhook(false);
                      }
                    }}
                    className="h-7 text-xs px-2.5 gap-1.5"
                  >
                    {isTestingWebhook ? (
                      <Clock className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    {isTestingWebhook ? t('Mengirim...') : t('Kirim Pesan Tes')}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t('Kirim pesan simulasi bot langsung ke saluran')} <strong>#{channelName}</strong> {t('untuk memastikan webhook terhubung.')}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            {t('Tutup')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
