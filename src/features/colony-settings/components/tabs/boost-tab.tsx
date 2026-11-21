import React, { useState, useRef } from 'react';
import {
  Zap,
  Gem,
  ImagePlus,
  ChevronDown,
  Camera,
  Check,
  Plus,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { colonyApi } from '@/chat/chat-api';
import type { Colony } from '@/chat/chat-types';

interface BoostTabProps {
  activeColony: Colony;
  onUpdateColony: (colonyId: string, updates: Partial<Colony>) => Promise<void>;
  onClose?: () => void;
  t: (key: string) => string;
}

export function BoostTab({
  activeColony,
  onUpdateColony,
  onClose,
  t,
}: BoostTabProps) {
  const [isBoostingServer, setIsBoostingServer] = useState(false);

  // Boost Tier and Count
  const [boostsCount, setBoostsCount] = useState<number>(
    activeColony.boostsCount || 0,
  );
  const [boostTier, setBoostTier] = useState<number>(
    activeColony.boostTier || 0,
  );

  // Settings states
  const [showBoostProgressBar, setShowBoostProgressBar] = useState<boolean>(
    Boolean(activeColony.showBoostProgressBar),
  );
  const [serverBannerUrl, setServerBannerUrl] = useState<string>(
    activeColony.serverBannerUrl || '',
  );
  const [inviteBackgroundUrl, setInviteBackgroundUrl] = useState<string>(
    activeColony.inviteBackgroundUrl || '',
  );
  const [customInviteVanity, setCustomInviteVanity] = useState<string>(
    activeColony.customInviteVanity || '',
  );

  // Hidden file inputs
  const serverBannerInputRef = useRef<HTMLInputElement | null>(null);
  const inviteBackgroundInputRef = useRef<HTMLInputElement | null>(null);

  // Target boosts for current tier goal
  const targetBoosts = boostTier >= 3 ? 14 : boostTier === 2 ? 14 : boostTier === 1 ? 7 : 2;

  const handleBoost = async () => {
    setIsBoostingServer(true);
    try {
      const res = await colonyApi.boostHub(activeColony.id);
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      setBoostsCount(res.boostsCount);
      setBoostTier(res.boostTier);
      await onUpdateColony(activeColony.id, {
        boostsCount: res.boostsCount,
        boostTier: res.boostTier,
      });
      toast.success(
        t(`Colony berhasil di-boost! Sekarang di Tingkat ${res.boostTier} ⚡🎉`),
      );
    } catch {
      toast.error(t('Gagal melakukan boost colony.'));
    } finally {
      setIsBoostingServer(false);
    }
  };

  const handleSave = async () => {
    await onUpdateColony(activeColony.id, {
      showBoostProgressBar,
      serverBannerUrl,
      inviteBackgroundUrl,
      customInviteVanity,
      boostsCount,
      boostTier,
    });
    toast.success(t('Pengaturan Boost Perks berhasil disimpan! ⚡'));
    onClose?.();
  };

  return (
    <div className="w-full space-y-8">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={serverBannerInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            toast.error(t('Ukuran file maksimal 10 MB.'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = event.target?.result as string;
            if (res) {
              setServerBannerUrl(res);
              toast.success(t('Server Banner berhasil dipilih!'));
            }
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      <input
        type="file"
        ref={inviteBackgroundInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            toast.error(t('Ukuran file maksimal 10 MB.'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = event.target?.result as string;
            if (res) {
              setInviteBackgroundUrl(res);
              toast.success(t('Invite Background berhasil dipilih!'));
            }
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Header with Quick Boost Simulator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Boost Perks')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Kelola fitur dan fasilitas eksklusif dari Server Boosting.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-bold flex items-center gap-1.5"
          >
            <Gem className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {t('Level')} {boostTier} • {boostsCount} {t('Boosts')}
            </span>
          </Badge>

          <Button
            size="sm"
            disabled={isBoostingServer}
            onClick={handleBoost}
            className="bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] hover:opacity-90 text-white font-bold text-xs h-9 px-4 rounded-lg cursor-pointer shadow-md shadow-purple-500/20"
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            <span>{isBoostingServer ? t('Memproses...') : t('Boost (+1)')}</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: SHOW BOOST PROGRESS BAR WITH LIVE CHANNEL LIST MOCKUP */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        {/* Left Side: Description & Switch */}
        <div className="flex-1 space-y-4 max-w-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('Show Boost progress bar')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t(
                  'Servers with the Boost progress bar enabled get more Boosts. This progress bar will display in your channel list, attached to your server name (or server banner if you have one set).',
                )}
              </p>
            </div>
            <Switch
              checked={showBoostProgressBar}
              onCheckedChange={setShowBoostProgressBar}
            />
          </div>
        </div>

        {/* Right Side: Discord Client Mockup (Discord 1:1 Parity) */}
        <div className="w-full sm:w-[320px] shrink-0">
          <div className="rounded-2xl border border-border/80 bg-[#1e1f22] shadow-2xl overflow-hidden flex h-[280px]">
            {/* Left miniature server icon strip */}
            <div className="w-12 bg-[#111214] flex flex-col items-center py-3 gap-3 border-r border-border/40 shrink-0">
              <div className="size-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                💬
              </div>
              <div className="relative flex items-center justify-center w-full">
                {/* Active server pill indicator */}
                <div className="absolute -left-0.5 w-1 h-5 bg-white rounded-r-full" />
                <div className="size-8 rounded-[12px] bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  🎲
                </div>
              </div>
              <div className="size-8 rounded-full bg-[#2b2d31] flex items-center justify-center text-muted-foreground text-xs font-bold hover:bg-[#35373c] transition-colors">
                🎮
              </div>
              <div className="size-8 rounded-full bg-[#2b2d31] flex items-center justify-center text-muted-foreground text-xs font-bold hover:bg-[#35373c] transition-colors">
                🦆
              </div>
              <div className="size-8 rounded-full bg-[#2b2d31] flex items-center justify-center text-emerald-400 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            {/* Right channels container */}
            <div className="flex-1 bg-[#1e1f22] flex flex-col min-w-0">
              {/* Server Header Banner */}
              <div
                className={cn(
                  'h-24 p-3 relative flex flex-col justify-between transition-all duration-300',
                  serverBannerUrl
                    ? 'bg-cover bg-center'
                    : 'bg-gradient-to-r from-purple-900/60 via-sky-900/50 to-indigo-900/60',
                )}
                style={
                  serverBannerUrl
                    ? { backgroundImage: `url(${serverBannerUrl})` }
                    : undefined
                }
              >
                <div className="flex items-center justify-between text-white drop-shadow-md">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold truncate">
                      {activeColony?.name || "Xena's Lounge"}
                    </span>
                    <span className="text-[10px] text-emerald-400">💮</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0" />
                </div>

                {!serverBannerUrl && (
                  <div className="self-center -mb-2">
                    <div className="text-3xl opacity-80 filter drop-shadow">
                      🧊
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Boost Goal Bar attached under banner */}
              {showBoostProgressBar && (
                <div className="px-2.5 py-2 bg-[#2b2d31]/80 border-b border-border/40 transition-all">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                      Boost Goal
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      {boostsCount}/{targetBoosts} Boosts &gt;
                    </span>
                  </div>
                  <div className="w-full bg-[#111214] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#5865F2] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(10, (boostsCount / targetBoosts) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Mini Channels List */}
              <div className="p-2 space-y-1 overflow-hidden flex-1">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.06] text-foreground text-xs font-medium">
                  <span className="text-muted-foreground text-sm font-semibold">
                    #
                  </span>
                  <span>general</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded text-muted-foreground text-xs hover:bg-white/[0.03]">
                  <span className="text-muted-foreground text-sm font-semibold">
                    #
                  </span>
                  <span>memes</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded text-muted-foreground text-xs hover:bg-white/[0.03]">
                  <span className="text-muted-foreground text-sm font-semibold">
                    #
                  </span>
                  <span>gaming</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 2: SERVER BANNER BACKGROUND (LVL 2) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        <div className="flex-1 space-y-3 max-w-md">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {t('Server Banner Background')}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Gem className="w-3 h-3" />
              LVL 2
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('This image will display at the top of your channels list.')}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'The recommended minimum size is 960x540 and recommended aspect ratio is 16:9.',
            )}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info(t('Banner server akan tampil di bagian atas daftar saluran.'));
              }}
              className="text-blue-400 hover:underline font-semibold"
            >
              {t('Learn more.')}
            </a>
          </p>

          <div className="pt-2">
            {boostTier >= 2 ? (
              <Button
                type="button"
                onClick={() => serverBannerInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 h-9 rounded-lg cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {serverBannerUrl ? t('Change Background') : t('Upload Background')}
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleBoost}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-opacity cursor-pointer border border-white/20"
              >
                <Gem className="w-4 h-4 text-white" />
                <span>{t('Unlock with Boosting')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 16:9 Preview Card */}
        <div className="w-full sm:w-[320px] shrink-0">
          <div
            onClick={() => {
              if (boostTier >= 2) {
                serverBannerInputRef.current?.click();
              } else {
                toast.info(t('Fitur ini membutuhkan Server Boost Level 2.'));
              }
            }}
            className={cn(
              'aspect-video rounded-2xl bg-[#2b2d31]/80 border border-border/80 relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-lg',
              serverBannerUrl && 'bg-cover bg-center',
            )}
            style={
              serverBannerUrl
                ? { backgroundImage: `url(${serverBannerUrl})` }
                : undefined
            }
          >
            <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-muted-foreground group-hover:text-white transition-colors">
              <ImagePlus className="w-4 h-4" />
            </div>
            {!serverBannerUrl && (
              <span className="text-xs text-muted-foreground/60 font-semibold">
                960 x 540
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 3: SERVER INVITE BACKGROUND (LVL 1) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        <div className="flex-1 space-y-3 max-w-md">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {t('Server Invite Background')}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Gem className="w-3 h-3" />
              LVL 1
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'This image will display when your server invite is viewed in a browser, as well as in invite confirmation screens and Server Onboarding.',
            )}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'The recommended minimum size is 1920x1080 and recommended aspect ratio is 16:9.',
            )}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info(t('Background undangan akan tampil saat tautan dibuka di browser.'));
              }}
              className="text-blue-400 hover:underline font-semibold"
            >
              {t('Learn more')}
            </a>
          </p>

          <div className="pt-2">
            {boostTier >= 1 ? (
              <Button
                type="button"
                onClick={() => inviteBackgroundInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 h-9 rounded-lg cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {inviteBackgroundUrl ? t('Change Background') : t('Upload Background')}
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleBoost}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-opacity cursor-pointer border border-white/20"
              >
                <Gem className="w-4 h-4 text-white" />
                <span>{t('Unlock with Boosting')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 16:9 Preview Card */}
        <div className="w-full sm:w-[320px] shrink-0">
          <div
            onClick={() => {
              if (boostTier >= 1) {
                inviteBackgroundInputRef.current?.click();
              } else {
                toast.info(t('Fitur ini membutuhkan Server Boost Level 1.'));
              }
            }}
            className={cn(
              'aspect-video rounded-2xl bg-[#2b2d31]/80 border border-border/80 relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-lg',
              inviteBackgroundUrl && 'bg-cover bg-center',
            )}
            style={
              inviteBackgroundUrl
                ? { backgroundImage: `url(${inviteBackgroundUrl})` }
                : undefined
            }
          >
            <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-muted-foreground group-hover:text-white transition-colors">
              <ImagePlus className="w-4 h-4" />
            </div>
            {!inviteBackgroundUrl && (
              <span className="text-xs text-muted-foreground/60 font-semibold">
                1920 x 1080
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border/50 my-6" />

      {/* SECTION 4: CUSTOM INVITE LINK (LVL 3) */}
      <div className="space-y-3 max-w-xl">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">
            {t('Custom Invite Link')}
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
            <Gem className="w-3 h-3" />
            LVL 3
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(
            "Bring others to your server easily with your own customized invite link. Heads up though, anyone with the link can join and you'll need at least one text channel that is open to all server members.",
          )}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast.info(t('Tautan undangan kustom vanity URL untuk server tingkat 3.'));
            }}
            className="text-blue-400 hover:underline font-semibold"
          >
            {t('Learn more.')}
          </a>
        </p>

        <div className="pt-2">
          {boostTier >= 3 ? (
            <div className="flex items-center gap-2 max-w-md">
              <span className="text-xs text-muted-foreground font-mono">
                https://anticeil.com/invite/
              </span>
              <input
                type="text"
                value={customInviteVanity}
                onChange={(e) =>
                  setCustomInviteVanity(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  )
                }
                placeholder="nama-server-kustom"
                className="h-9 px-3 rounded-lg bg-[#1e1f22] border border-border/80 text-xs font-semibold text-foreground focus:outline-none focus:border-primary w-full"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleBoost}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-opacity cursor-pointer border border-white/20"
            >
              <Gem className="w-4 h-4 text-white" />
              <span>{t('Unlock with Boosting')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Save & Cancel Buttons */}
      <div className="pt-6 border-t border-border/50 flex items-center gap-3">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
          onClick={handleSave}
        >
          {t('Simpan Perubahan')}
        </Button>
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-lg cursor-pointer"
          >
            {t('Batal')}
          </Button>
        )}
      </div>
    </div>
  );
}
