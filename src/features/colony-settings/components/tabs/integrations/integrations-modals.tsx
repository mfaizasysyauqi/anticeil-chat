import React, { useState } from 'react';
import { Webhook, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { ColonyChannel } from '@/chat/chat-types';

export interface CreateWebhookDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channels: ColonyChannel[];
  onCreateWebhook: (name: string, channelId: string) => void;
  t: (key: string) => string;
}

export function CreateWebhookDialog({
  isOpen,
  onOpenChange,
  channels,
  onCreateWebhook,
  t,
}: CreateWebhookDialogProps) {
  const [name, setName] = useState('Captain Hook');
  const [channelId, setChannelId] = useState(channels[0]?.id || 'general');

  const handleCreate = () => {
    onCreateWebhook(name, channelId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-[#1e1f22] border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Webhook className="w-4 h-4 text-primary" />
            <span>{t('Create New Webhook')}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('Send automated messages from external APIs and services into your channel.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {t('Webhook Name')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Captain Hook"
              className="text-xs bg-[#111214] border-border/70 h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {t('Channel')}
            </label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="text-xs bg-[#111214] border-border/70 h-9">
                <SelectValue placeholder={t('Pilih Channel')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f22] border-border/80">
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    #{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            {t('Batal')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
          >
            {t('Simpan Webhook')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FollowedChannelsDialog({
  isOpen,
  onOpenChange,
  t,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string) => string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-[#1e1f22] border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Radio className="w-4 h-4 text-primary" />
            <span>{t('Channels Followed')}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            {t('Following an Announcement channel from another server lets you automatically receive updates and news directly in your own channels.')}
          </p>
          <p>
            {t('To follow a channel, navigate to any Announcement channel across Anticeil servers and click the "Follow" button.')}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
          >
            {t('Mengerti')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TwitchIntegrationModal({
  isOpen,
  onOpenChange,
  isConnected,
  onConnect,
  onDisconnect,
  t,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnect: (account: string) => void;
  onDisconnect: () => void;
  t: (key: string) => string;
}) {
  const [account, setAccount] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#1e1f22] border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#9146FF]">
            <span>Twitch Creator Integration</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('Hubungkan akun Twitch Anda untuk menyinkronkan subscriber ke peran otomatis dan menggunakan emotikon channel.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Twitch Username / Channel URL
          </label>
          <Input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="e.g. shroud"
            className="text-xs bg-[#111214] border-border/70 h-9"
          />
        </div>
        <DialogFooter className="gap-2">
          {isConnected ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDisconnect();
                setAccount('');
                onOpenChange(false);
              }}
              className="text-xs cursor-pointer"
            >
              {t('Disconnect')}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!account.trim()) {
                toast.error(t('Masukkan username Twitch terlebih dahulu.'));
                return;
              }
              onConnect(account.trim());
              onOpenChange(false);
            }}
            className="text-xs bg-[#9146FF] hover:bg-[#772CE8] text-white cursor-pointer"
          >
            {t('Hubungkan Twitch')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function YoutubeIntegrationModal({
  isOpen,
  onOpenChange,
  isConnected,
  onConnect,
  onDisconnect,
  t,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnect: (channel: string) => void;
  onDisconnect: () => void;
  t: (key: string) => string;
}) {
  const [channel, setChannel] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#1e1f22] border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-500">
            <span>YouTube Creator Integration</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('Hubungkan channel YouTube Anda untuk memberikan peran khusus kepada member channel dan subscriber.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="text-xs font-semibold text-muted-foreground">
            YouTube Channel Handle or URL
          </label>
          <Input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="e.g. @MrBeast"
            className="text-xs bg-[#111214] border-border/70 h-9"
          />
        </div>
        <DialogFooter className="gap-2">
          {isConnected ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDisconnect();
                setChannel('');
                onOpenChange(false);
              }}
              className="text-xs cursor-pointer"
            >
              {t('Disconnect')}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!channel.trim()) {
                toast.error(t('Masukkan handle YouTube terlebih dahulu.'));
                return;
              }
              onConnect(channel.trim());
              onOpenChange(false);
            }}
            className="text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            {t('Hubungkan YouTube')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
