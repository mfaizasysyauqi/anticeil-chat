import React, { useState } from 'react';
import {
  Zap,
  Gift,
  Check,
  Sparkles,
  ExternalLink,
  Heart,
  Smile,
  Flame,
  Tv,
  User,
  MonitorPlay,
  Video,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { subscriptionsApi, loadMidtransSnap } from '@/features/billing/api/subscriptions-api';

export interface NectarSubtabProps {
  theme?: any;
}

export type NitroSubtabProps = NectarSubtabProps;

export function NectarSubtab({ theme }: NectarSubtabProps) {
  const { t } = useTranslation();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'nectar_basic' | 'nectar_boost') => {
    setSubscribing(plan);
    try {
      const res = await subscriptionsApi.createMidtransToken(plan);
      if (!res || !res.snapToken) {
        throw new Error('Gagal mendapatkan token pembayaran dari server');
      }

      await loadMidtransSnap(res.clientKey || (import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string) || '');

      if (typeof window !== 'undefined' && (window as any).snap) {
        (window as any).snap.pay(res.snapToken, {
          onSuccess: async () => {
            toast.loading(t('Memverifikasi pembayaran...'), { id: 'midtrans-verify' });
            try {
              await subscriptionsApi.verifyMidtransPayment(res.orderId);
              await subscriptionsApi.subscribe(plan);
              toast.dismiss('midtrans-verify');
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              toast.success(
                plan === 'nectar_boost'
                  ? t('Selamat! Anda sekarang berlangganan Nectar VIP! 🎉')
                  : t('Selamat! Anda sekarang berlangganan Pollen! 🎉')
              );
            } catch {
              toast.dismiss('midtrans-verify');
              toast.success(t('Pembayaran berhasil diterima!'));
            }
          },
          onPending: () => {
            toast.info(t('Pembayaran pending. Silakan selesaikan pembayaran di QRIS atau Virtual Account Anda.'));
          },
          onError: () => {
            toast.error(t('Pembayaran gagal atau dibatalkan.'));
          },
          onClose: () => {
            setSubscribing(null);
          },
        });
      } else if (res.redirectUrl) {
        window.open(res.redirectUrl, '_blank');
      } else {
        // Fallback direct activation
        await subscriptionsApi.subscribe(plan);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success(
          plan === 'nectar_boost'
            ? t('Selamat! Anda sekarang berlangganan Nectar VIP! 🎉')
            : t('Selamat! Anda sekarang berlangganan Pollen! 🎉')
        );
      }
    } catch (err: any) {
      toast.error(err?.message || t('Gagal mengaktifkan langganan'));
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="space-y-10 pb-16 relative">
      {/* ── 1. HERO BANNER ── */}
      <div className="rounded-3xl p-6 sm:p-10 bg-linear-to-r from-[#4A32B3] via-[#5865F2] to-[#7946E0] text-white relative overflow-hidden shadow-2xl">
        {/* Starry sparkle accents */}
        <Sparkles className="w-5 h-5 text-amber-300 absolute top-5 left-8 animate-pulse pointer-events-none" />
        <Sparkles className="w-4 h-4 text-purple-200 absolute top-14 left-1/3 opacity-70 pointer-events-none" />
        <Sparkles className="w-6 h-6 text-pink-300 absolute bottom-6 right-12 animate-pulse pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Heart bookmark top-right */}
        <button
          type="button"
          onClick={() => toast.success(t('Disimpan ke daftar favorit!'))}
          className="absolute top-5 right-5 p-2 rounded-xl bg-black/20 hover:bg-black/35 backdrop-blur-md transition-colors cursor-pointer text-white/90 hover:text-white"
          title={t('Simpan')}
        >
          <Heart className="w-4 h-4" />
        </button>

        <div className="relative z-10 max-w-xl mx-auto text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-white drop-shadow-sm">
            {t('Unlock a World of Perks with Nectar')}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
            {t('Plans start at only IDR 29,000.00/month. Cancel anytime')}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="default"
              onClick={() => handleSubscribe('nectar_boost')}
              disabled={subscribing !== null}
              className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs sm:text-sm h-10 px-6 rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current text-purple-600" />
              <span>{subscribing === 'nectar_boost' ? t('Mengaktifkan...') : t('Subscribe')}</span>
            </Button>

            <Button
              size="default"
              variant="outline"
              onClick={() =>
                toast.info(
                  t('Pilih kontak atau colony untuk mengirimkan Gift Nectar.'),
                )
              }
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold text-xs sm:text-sm h-10 px-6 rounded-xl backdrop-blur-sm cursor-pointer flex items-center gap-2"
            >
              <Gift className="w-4 h-4 text-pink-300" />
              <span>{t('Gift Nectar')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. TWO TIER CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* TIER 1: POLLEN (BASIC) */}
        <div className="rounded-2xl p-6 bg-linear-to-b from-[#0066FE] to-[#004ECC] text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[380px]">
          <div className="absolute top-4 right-4 size-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-lg select-none">
            🌼
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <div className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                <span>POLLEN</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 border border-white/30">
                  BASIC
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1">
                {t('Supercharge your chatting and express yourself casually')}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-2xl sm:text-3xl font-black">
                IDR 29,000.00
              </div>
              <div className="text-xs text-white/80 font-medium">
                {t('/ month')}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/20 text-xs">
              {[
                t('50MB file sharing limit (5x bigger)'),
                t('Custom emojis & stickers anywhere'),
                t('Unlimited Super Reactions'),
                t('Special Pollen badge on your profile'),
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-white/95">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 relative z-10 flex flex-col gap-2">
            <Button
              onClick={() => handleSubscribe('nectar_basic')}
              disabled={subscribing !== null}
              className="w-full bg-white hover:bg-white/90 text-blue-900 font-extrabold text-xs h-10 rounded-xl shadow-lg cursor-pointer"
            >
              {subscribing === 'nectar_basic' ? t('Mengaktifkan...') : t('Get Pollen')}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast.info(t('Pilih penerima untuk Gift Pollen.'))
              }
              className="w-full hover:bg-white/15 text-white/90 hover:text-white font-semibold text-xs h-8 rounded-xl cursor-pointer"
            >
              {t('Gift Pollen')}
            </Button>
          </div>
        </div>

        {/* TIER 2: NECTAR (POPULAR) */}
        <div className="rounded-2xl p-6 bg-linear-to-b from-[#5865F2] via-[#7B3FE4] to-[#B028A7] text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px] border border-white/20">
          <div className="absolute top-4 right-4 size-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-xl select-none">
            🍯
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <div className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                <span>NECTAR</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-purple-950 shadow-xs">
                  {t('POPULAR')}
                </span>
              </div>
              <p className="text-xs text-white/90 mt-1">
                {t(
                  'Unleash the ultimate Anticeil experience with full VIP perks',
                )}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-2xl sm:text-3xl font-black">
                IDR 85,000.00
              </div>
              <div className="text-xs text-white/80 font-medium">
                {t('/ month')} •{' '}
                <span className="text-amber-300 font-bold">
                  {t('Hemat 16% per tahun')}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/20 text-xs">
              {[
                t('500MB upload capacity for clips and documents'),
                t('HD 4K 60fps streaming & screen sharing'),
                t('2 Free Colony Boosts + 30% off extra boosts'),
                t('Custom colony profiles, avatars, banners & bios'),
                t('Longer messages up to 4,000 characters & 200 server slots'),
                t('Custom sounds anywhere & animated emoji avatars'),
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-white">
                  <Check className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 relative z-10 flex flex-col gap-2">
            <Button
              onClick={() => handleSubscribe('nectar_boost')}
              disabled={subscribing !== null}
              className="w-full bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs h-10 rounded-xl shadow-xl cursor-pointer"
            >
              {subscribing === 'nectar_boost' ? t('Mengaktifkan...') : t('Get Nectar')}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast.info(t('Pilih penerima untuk Gift Nectar Full.'))
              }
              className="w-full hover:bg-white/15 text-white/90 hover:text-white font-semibold text-xs h-8 rounded-xl cursor-pointer"
            >
              {t('Gift Nectar')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3. DETAILED PERKS COMPARISON & HIGHLIGHTS ── */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-foreground">
          {t('Popular Nectar Perks')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Smile className="w-5 h-5 text-indigo-400" />,
              title: t('Use Custom Emojis Anywhere'),
              desc: t(
                'Collect or create your own custom and animated emojis, and use them across any channel or DM.',
              ),
            },
            {
              icon: <Flame className="w-5 h-5 text-pink-400" />,
              title: t('Unmatched Video Streaming'),
              desc: t(
                'Share your screen in crisp 4K 60fps for work presentations or gaming sessions with friends.',
              ),
            },
            {
              icon: <Tv className="w-5 h-5 text-cyan-400" />,
              title: t('Bigger 500MB Uploads'),
              desc: t(
                'Upload large design archives, raw videos, and hi-res project files without external host links.',
              ),
            },
            {
              icon: <User className="w-5 h-5 text-emerald-400" />,
              title: t('Custom Colony Profiles'),
              desc: t(
                'Be who you want in every colony. Change your avatar, banner, bio, and theme per server.',
              ),
            },
            {
              icon: <MonitorPlay className="w-5 h-5 text-amber-400" />,
              title: t('2 Free Colony Boosts'),
              desc: t(
                'Give your favorite communities level badges, extra emoji slots, and top-tier audio quality.',
              ),
            },
            {
              icon: <Video className="w-5 h-5 text-purple-400" />,
              title: t('Special Badges & Themes'),
              desc: t(
                'Stand out in member lists with an evolving subscriber badge and exclusive app color themes.',
              ),
            },
          ].map((perk, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-xs hover:border-border/80 transition-colors"
            >
              <div className="size-9 rounded-xl bg-muted/80 flex items-center justify-center">
                {perk.icon}
              </div>
              <div className="text-xs font-bold text-foreground">
                {perk.title}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {perk.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. FOOTER CALLOUT ── */}
      <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="text-xs font-bold text-foreground">
            {t('Looking to gift a friend?')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t(
              'Spread the joy and surprise someone with a monthly or yearly Nectar pass.',
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            toast.info(
              t(
                'Pilih teman dari daftar kontak untuk mengirimkan Gift Nectar.',
              ),
            )
          }
          className="border-border hover:bg-muted font-bold text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 text-foreground shrink-0"
        >
          <Gift className="w-3.5 h-3.5 text-pink-500" />
          <span>{t('Gift Nectar')}</span>
        </Button>
      </div>
    </div>
  );
}

export const NitroSubtab = NectarSubtab;
