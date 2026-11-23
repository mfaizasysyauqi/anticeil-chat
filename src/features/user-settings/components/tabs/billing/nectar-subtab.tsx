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
  Crown,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { subscriptionsApi, loadMidtransSnap, DEFAULT_MIDTRANS_CLIENT_KEY } from '@/features/billing/api/subscriptions-api';

export interface NectarSubtabProps {
  theme?: any;
}

export type NitroSubtabProps = NectarSubtabProps;

export function NectarSubtab({ theme }: NectarSubtabProps) {
  const { t } = useTranslation();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'nectar_basic' | 'nectar_boost' | 'royal_enterprise') => {
    setSubscribing(plan);
    try {
      const res = await subscriptionsApi.createMidtransToken(plan);
      if (!res || !res.snapToken) {
        throw new Error('Gagal mendapatkan token pembayaran dari server');
      }

      await loadMidtransSnap(res.clientKey || DEFAULT_MIDTRANS_CLIENT_KEY);

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
                plan === 'royal_enterprise'
                  ? t('Selamat! Anda sekarang berlangganan Royal Enterprise! 👑')
                  : plan === 'nectar_boost'
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
          plan === 'royal_enterprise'
            ? t('Selamat! Anda sekarang berlangganan Royal Enterprise! 👑')
            : plan === 'nectar_boost'
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
    <div className="space-y-6 pb-8 relative">
      {/* ── 1. HERO BANNER ── */}
      <div className="rounded-2xl p-5 sm:p-6 bg-linear-to-r from-[#4A32B3] via-[#5865F2] to-[#7946E0] text-white relative overflow-hidden shadow-xl">
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
          className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/35 backdrop-blur-md transition-colors cursor-pointer text-white/90 hover:text-white"
          title={t('Simpan')}
        >
          <Heart className="w-4 h-4" />
        </button>

        <div className="relative z-10 max-w-xl mx-auto text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white drop-shadow-sm">
            {t('Unlock a World of Perks with Nectar')}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
            {t('Mulai dari IDR 29,000 / bulan. Batalkan kapan saja.')}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Button
              size="default"
              onClick={() => handleSubscribe('nectar_boost')}
              disabled={subscribing !== null}
              className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs sm:text-sm h-9 px-5 rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
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
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold text-xs sm:text-sm h-9 px-5 rounded-xl backdrop-blur-sm cursor-pointer flex items-center gap-2"
            >
              <Gift className="w-4 h-4 text-pink-300" />
              <span>{t('Gift Nectar')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. THREE TIER CARDS (Identical & Consistent with Send Gift Modal) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* TIER 1: POLLEN (BASIC) */}
        <div className="relative rounded-2xl bg-card border border-border/80 hover:border-yellow-500/50 p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-yellow-400">POLLEN 🌼</h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                    BASIC
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-lg sm:text-xl font-black text-foreground">IDR 29,000</span>
                  <span className="text-xs text-muted-foreground">/bulan</span>
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">IDR 290,000/tahun</span>
              </div>
              <div className="size-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl shadow-2xs shrink-0">
                🌼
              </div>
            </div>

            <div className="w-full h-px bg-border/60" />

            <div className="space-y-2 text-xs text-foreground/80">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-black">↑</span>
                <span>{t('Upload file hingga 50MB')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>😊</span>
                <span>{t('Custom emoji di mana saja')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💥</span>
                <span>{t('Super Reactions tanpa batas')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <span>{t('Badge profil spesial Pollen')}</span>
              </div>
            </div>
          </div>

          <div className="pt-5 flex flex-col gap-2">
            <Button
              onClick={() => handleSubscribe('nectar_basic')}
              disabled={subscribing !== null}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs h-9 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {subscribing === 'nectar_basic' ? t('Mengaktifkan...') : t('Get Pollen')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(t('Pilih penerima untuk Gift Pollen.'))
              }
              className="w-full text-xs font-semibold h-8 rounded-xl border-border text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('Gift Pollen')}
            </Button>
          </div>
        </div>

        {/* TIER 2: NECTAR (POPULAR) */}
        <div className="relative rounded-2xl bg-card border-2 border-primary hover:border-primary/90 p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-md hover:shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
            POPULAR
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-amber-400">NECTAR 🍯</h3>
                </div>
                <div className="mt-1">
                  <span className="text-lg sm:text-xl font-black text-foreground">IDR 85,000</span>
                  <span className="text-xs text-muted-foreground">/bulan</span>
                </div>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  IDR 850,000/tahun • <span className="text-amber-400 font-semibold">{t('Hemat 16% per tahun')}</span>
                </span>
              </div>
              <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-primary/30 flex items-center justify-center text-xl shadow-2xs shrink-0">
                🚀
              </div>
            </div>

            <div className="w-full h-px bg-border/60" />

            <div className="space-y-2 text-xs text-foreground/80">
              <div className="flex items-center gap-2">
                <span className="text-primary font-black">↑</span>
                <span>{t('Kapasitas upload file 1GB')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>😊</span>
                <span>{t('Custom emoji di mana saja')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💥</span>
                <span>{t('Super Reactions tanpa batas')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🖵</span>
                <span>{t('Streaming video kualitas HD 4K')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💎</span>
                <span>{t('2 Free Colony Boosts')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span>{t('Custom banner & avatar profil')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-sm shrink-0">
                🔮
              </div>
              <div>
                <span className="text-[11px] font-bold text-foreground block">Free Reward Choice</span>
                <span className="text-[9px] text-muted-foreground">3 pilihan bonus tersedia</span>
              </div>
            </div>
          </div>

          <div className="pt-5 flex flex-col gap-2">
            <Button
              onClick={() => handleSubscribe('nectar_boost')}
              disabled={subscribing !== null}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs h-9 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {subscribing === 'nectar_boost' ? t('Mengaktifkan...') : t('Get Nectar')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(t('Pilih penerima untuk Gift Nectar Full.'))
              }
              className="w-full text-xs font-semibold h-8 rounded-xl border-border text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('Gift Nectar')}
            </Button>
          </div>
        </div>

        {/* TIER 3: ROYAL (ENTERPRISE) */}
        <div className="relative rounded-2xl bg-card border border-amber-500/40 hover:border-amber-400 p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] font-black uppercase tracking-wider text-black shadow-md flex items-center gap-1">
            <span>👑</span>
            <span>ROYAL ENTERPRISE</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-amber-400">ROYAL 👑</h3>
                </div>
                <div className="mt-1">
                  <span className="text-lg sm:text-xl font-black text-foreground">IDR 499,000</span>
                  <span className="text-xs text-muted-foreground">/bulan</span>
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium block mt-0.5">Sovereign Colony Tier</span>
              </div>
              <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shadow-2xs shrink-0">
                👑
              </div>
            </div>

            <div className="w-full h-px bg-border/60" />

            <div className="space-y-2 text-xs text-foreground/80">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black">★</span>
                <span>{t('Corporate SSO & JIT Domain')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black">↑</span>
                <span>{t('Upload file tanpa batas')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💎</span>
                <span>{t('10 Free Colony Boosts')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span>{t('Retensi audit log 365 hari')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>{t('Dedicated SLA & 99.9% uptime')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👑</span>
                <span>{t('Badge profil Sovereign Crown')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">
                🏛️
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-300 block">Sovereign Team Access</span>
                <span className="text-[9px] text-muted-foreground">Full domain capture & SSO</span>
              </div>
            </div>
          </div>

          <div className="pt-5 flex flex-col gap-2">
            <Button
              onClick={() => handleSubscribe('royal_enterprise')}
              disabled={subscribing !== null}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:opacity-95 text-black font-black text-xs h-9 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {subscribing === 'royal_enterprise' ? t('Mengaktifkan...') : t('Get Royal Enterprise 👑')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(t('Hubungi sales kami untuk custom enterprise contract & invoice.'))
              }
              className="w-full text-xs font-semibold h-8 rounded-xl border-border text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              {t('Contact Sales')}
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
