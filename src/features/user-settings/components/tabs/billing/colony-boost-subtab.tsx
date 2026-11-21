import React, { useState, useEffect } from 'react';
import {
  Gem,
  Zap,
  Check,
  ChevronDown,
  Sparkles,
  Heart,
  Star,
  ShieldCheck,
  Play,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { coloniesApi } from '@/features/colonies/api/colonies-api';
import {
  subscriptionsApi,
  loadMidtransSnap,
  type UserSubscription,
} from '@/features/billing/api/subscriptions-api';
import type { Colony } from '@/chat/chat-types';

const BOOST_PACKS = [
  {
    count: 1,
    name: '1x Colony Boost',
    price: 35000,
    priceFormatted: 'Rp 35.000 / bln',
    desc: 'Tingkatkan 1 slot boost ke colony pilihan Anda.',
    badge: 'Standard',
  },
  {
    count: 3,
    name: '3x Colony Boost Pack',
    price: 99000,
    priceFormatted: 'Rp 99.000 / bln',
    desc: 'Buka Level 2 Colony langsung bersama komunitas.',
    badge: 'Hemat 6%',
    popular: true,
  },
  {
    count: 5,
    name: '5x Colony Clan Pack',
    price: 150000,
    priceFormatted: 'Rp 150.000 / bln',
    desc: 'Buka kapasitas streaming 1080p dan 250 slot emoji kustom.',
    badge: 'Hemat 14%',
  },
];

export interface ColonyBoostSubtabProps {
  onNavigateSection?: (section: string) => void;
}

export function ColonyBoostSubtab({
  onNavigateSection,
}: ColonyBoostSubtabProps) {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [coloniesList, setColoniesList] = useState<Colony[]>([]);
  const [userSub, setUserSub] = useState<UserSubscription | null>(null);
  const [boostedColonies, setBoostedColonies] = useState<{
    [id: string]: number;
  }>({});
  const [isBuyBoostDialogOpen, setIsBuyBoostDialogOpen] = useState(false);
  const [targetColonyForBoost, setTargetColonyForBoost] = useState<Colony | null>(null);
  const [selectedBoostPack, setSelectedBoostPack] = useState(BOOST_PACKS[0]);
  const [isPurchasingBoost, setIsPurchasingBoost] = useState(false);

  useEffect(() => {
    subscriptionsApi.getSubscription().then(setUserSub);
    coloniesApi.getColonies().then((cols) => {
      setColoniesList(cols);
      const initial: Record<string, number> = {};
      cols.forEach((c) => {
        initial[c.id] = c.boostsCount || 0;
      });
      setBoostedColonies(initial);
    });
  }, []);

  const handleBoostColony = async (colony: Colony) => {
    if ((userSub?.boostSlots ?? 0) <= 0) {
      setTargetColonyForBoost(colony);
      setIsBuyBoostDialogOpen(true);
      return;
    }
    try {
      const res = await coloniesApi.boostHub(colony.id);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setBoostedColonies((prev) => ({
        ...prev,
        [colony.id]: (prev[colony.id] || 0) + 1,
      }));
      setUserSub((prev) =>
        prev
          ? {
              ...prev,
              boostSlots:
                typeof (res as any)?.remainingBoostSlots === 'number'
                  ? (res as any).remainingBoostSlots
                  : Math.max(0, prev.boostSlots - 1),
            }
          : null,
      );
      toast.success(
        t(
          `Colony "${colony.name}" berhasil di-Boost! Level saat ini: Level ${res?.boostTier || colony.boostTier || 1} 💎`,
        ),
      );
    } catch (err: any) {
      toast.error(err?.message || t('Gagal melakukan boost'));
    }
  };

  const handleBuyBoostCheckout = async (pack: (typeof BOOST_PACKS)[0], colonyId?: string) => {
    setIsPurchasingBoost(true);
    try {
      const res = await subscriptionsApi.createBoostToken(pack.count, colonyId);
      if (!res || !res.snapToken) {
        // Direct local purchase fallback
        await subscriptionsApi.purchaseBoostSlots(pack.count, colonyId);
        if (colonyId) {
          await coloniesApi.boostHub(colonyId);
          setBoostedColonies((prev) => ({
            ...prev,
            [colonyId]: (prev[colonyId] || 0) + 1,
          }));
        }
        setUserSub((prev) =>
          prev
            ? { ...prev, boostSlots: prev.boostSlots + (colonyId ? pack.count - 1 : pack.count) }
            : null,
        );
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success(t(`Berhasil membeli ${pack.name}! 💎`));
        setIsBuyBoostDialogOpen(false);
        return;
      }

      await loadMidtransSnap(
        res.clientKey || (import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string) || '',
      );

      if (typeof window !== 'undefined' && (window as any).snap) {
        (window as any).snap.pay(res.snapToken, {
          onSuccess: async () => {
            toast.loading(t('Memverifikasi pembayaran Midtrans...'), {
              id: 'midtrans-boost-verify',
            });
            try {
              await subscriptionsApi.verifyMidtransPayment(res.orderId);
              await subscriptionsApi.purchaseBoostSlots(pack.count, colonyId);
              if (colonyId) {
                await coloniesApi.boostHub(colonyId);
                setBoostedColonies((prev) => ({
                  ...prev,
                  [colonyId]: (prev[colonyId] || 0) + 1,
                }));
              }
              setUserSub((prev) =>
                prev
                  ? { ...prev, boostSlots: prev.boostSlots + (colonyId ? pack.count - 1 : pack.count) }
                  : null,
              );
              toast.dismiss('midtrans-boost-verify');
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              toast.success(t(`Pembayaran berhasil! ${pack.name} telah aktif! 🎉`));
              setIsBuyBoostDialogOpen(false);
            } catch {
              toast.dismiss('midtrans-boost-verify');
              toast.success(t('Pembayaran berhasil diterima!'));
              setIsBuyBoostDialogOpen(false);
            }
          },
          onPending: () => {
            toast.info(t('Pembayaran pending di Midtrans (QRIS/GoPay/VA).'));
          },
          onError: () => {
            toast.error(t('Pembayaran dibatalkan atau gagal.'));
          },
          onClose: () => {
            setIsPurchasingBoost(false);
          },
        });
      } else if (res.redirectUrl) {
        window.open(res.redirectUrl, '_blank');
      }
    } catch (err: any) {
      toast.error(err?.message || t('Gagal memproses pembayaran'));
    } finally {
      setIsPurchasingBoost(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. HEADER WITH EXPLANATION & VIDEO CARD ── */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div className="space-y-3 max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-xs">
              <Gem className="w-6 h-6 fill-sky-500/20" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {t('Colony Boosts')}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'Boosting a colony unlocks perks for everyone in that colony. You can manage your Boosts here (add, subtract, cancel — just beware the 7 day cooldown).',
            )}{' '}
            <button
              type="button"
              onClick={() =>
                toast.info(
                  t(
                    'Colony Boost memberikan peningkatan kapasitas file, kualitas stream, dan ratusan slot emoji.',
                  ),
                )
              }
              className="text-primary hover:underline font-medium inline cursor-pointer"
            >
              {t('Learn more')}
            </button>
          </p>

          {/* User's Boost Slots Status Card */}
          <div className="p-3 rounded-2xl border border-sky-500/30 bg-sky-500/5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>
                    {userSub?.status === 'active' && userSub.planId === 'nectar_boost'
                      ? t('Langganan Nectar Aktif')
                      : t('Slot Colony Boost')}
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-400">
                    {userSub?.boostSlots ?? 0} {t('Slot Tersedia')}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {(userSub?.boostSlots ?? 0) > 0
                    ? t('Anda dapat meningkatkan colony favorit Anda sekarang!')
                    : t('Berlangganan Nectar untuk mendapatkan 2 slot boost gratis.')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  setTargetColonyForBoost(null);
                  setIsBuyBoostDialogOpen(true);
                }}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] h-7 px-3 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('Beli Slot Boost')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Video Mockup Thumbnail Card */}
        <div
          onClick={() =>
            toast.success(
              t('Memutar panduan interaktif: Cara kerja Colony Boost.'),
            )
          }
          className="w-full lg:w-72 h-36 rounded-2xl bg-linear-to-br from-indigo-950 via-purple-950 to-sky-950 border border-purple-500/30 p-3.5 flex flex-col justify-between text-white relative overflow-hidden shadow-xl cursor-pointer group hover:border-purple-500/60 transition-all shrink-0"
        >
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90">
              {t('How do Boosts work?')}
            </span>
            <Gem className="w-4 h-4 text-sky-400" />
          </div>
          {/* Centered Play Button */}
          <div className="relative z-10 size-11 rounded-full bg-white/20 group-hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center mx-auto text-white shadow-lg transition-transform group-hover:scale-110">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <div className="relative z-10 text-[10px] text-white/70 font-mono text-center">
            2:14 • Tutorial Video
          </div>
        </div>
      </div>

      {/* ── 2. PROMO BANNER: GET 2 BOOSTS WITH NECTAR ── */}
      <div className="rounded-2xl p-4 bg-linear-to-r from-purple-900/30 via-indigo-900/30 to-sky-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Zap className="w-5 h-5 fill-current text-sky-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              {t('Get 2 Boosts with Nectar!')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Nectar users get 2 Boosts included with their membership.')}{' '}
              <button
                type="button"
                onClick={() => onNavigateSection?.('nitro')}
                className="text-primary hover:underline font-medium inline cursor-pointer"
              >
                {t('Learn more')}
              </button>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onNavigateSection?.('nitro')}
          className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs h-8 px-4 rounded-xl shadow-md cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-purple-600 mr-1.5" />
          <span>{t('Get Nectar')}</span>
        </Button>
      </div>

      {/* ── 3. COLONY BOOST PERK LEVELS (Discord 1:1 Parity) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {t('Colony Level Milestones')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {t('Tier perks apply to all colony members')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEVEL 1 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Gem className="w-4 h-4 fill-current" />
                  LEVEL 1
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {t('2 Boosts')}
                </span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                {[
                  t('+50 custom emoji slots (100 total)'),
                  t('+24 custom sticker slots (30 total)'),
                  t('128 Kbps high fidelity audio'),
                  t('720p 60fps Go Live streams'),
                  t('Custom colony invite background'),
                  t('Animated colony icon display'),
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 leading-tight"
                  >
                    <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById('my-colonies-boost-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else toast.info(t('Pilih colony di daftar bawah untuk mengaktifkan Boost.'));
              }}
              className="w-full text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('Boost Colony')}
            </Button>
          </div>

          {/* LEVEL 2 */}
          <div className="rounded-2xl border-2 border-purple-500/40 bg-card p-5 space-y-4 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Gem className="w-4 h-4 fill-current" />
                  LEVEL 2
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {t('7 Boosts')}
                </span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                {[
                  t('Everything in Level 1 and...'),
                  t('+50 more emoji slots (150 total)'),
                  t('+30 sticker slots (60 total)'),
                  t('256 Kbps studio audio quality'),
                  t('1080p 60fps Go Live streams'),
                  t('Colony banner art display'),
                  t('50MB upload limit for all members'),
                  t('Custom role icons for members'),
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 leading-tight"
                  >
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const el = document.getElementById('my-colonies-boost-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else toast.info(t('Pilih colony di daftar bawah untuk mengaktifkan Boost.'));
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              {t('Boost Colony')}
            </Button>
          </div>

          {/* LEVEL 3 */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Gem className="w-4 h-4 fill-current" />
                  LEVEL 3
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {t('14 Boosts')}
                </span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                {[
                  t('Everything in Level 2 and...'),
                  t('+100 more emoji slots (250 total)'),
                  t('+60 sticker slots (120 total)'),
                  t('384 Kbps maximum audio bitrate'),
                  t('Vanity invite URL (e.g. .gg/nama)'),
                  t('100MB file upload limit for members'),
                  t('Animated colony banner background'),
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 leading-tight"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById('my-colonies-boost-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else toast.info(t('Pilih colony di daftar bawah untuk mengaktifkan Boost.'));
              }}
              className="w-full text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('Boost Colony')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4. YOUR ACTIVE COLONY BOOSTS ── */}
      <div id="my-colonies-boost-section" className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-foreground">
          {t('Your Boosts & Supported Colonies')}
        </h3>

        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
          {(coloniesList.length > 0
            ? coloniesList
            : [
                {
                  id: 'c1',
                  name: 'Anticeil Official',
                  boostsCount: 0,
                  boostTier: 1,
                } as Colony,
              ]
          ).map((colony) => {
            const userBoostCount = boostedColonies[colony.id] || 0;
            return (
              <div
                key={colony.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-muted/80 border border-border flex items-center justify-center text-sm font-bold text-foreground select-none shadow-2xs">
                    {colony.initials || '🛡️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {colony.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        Level {colony.boostTier || 1}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {(colony.boostsCount || 0) + userBoostCount} {t('boosts total')} •{' '}
                      <span className="text-foreground font-medium">
                        {userBoostCount} {t('dari Anda')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    onClick={() => handleBoostColony(colony)}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs h-8 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Gem className="w-3.5 h-3.5 fill-current" />
                    <span>{t('Boost Colony')}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. BENEFIT HIGHLIGHT TILES ── */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xl font-bold text-foreground text-center">
          {t('Give your community a Boost & be recognized')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
            <div className="size-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-xs">
              <Gem className="w-6 h-6 text-sky-400" />
            </div>
            <div className="text-xs font-bold text-foreground">
              {t('Display your support with a Member List icon')}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
            <div className="size-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-xs">
              <Star className="w-6 h-6 fill-sky-500/40 text-sky-400 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-foreground">
              {t('Unlock a profile badge that evolves over time')}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
            <div className="size-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-foreground">
              {t('Get an exclusive Booster role')}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
            <div className="size-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-xs">
              <Heart className="w-6 h-6 fill-sky-500/40" />
            </div>
            <div className="text-xs font-bold text-foreground">
              {t('Show support for your community')}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. BOOSTING FAQ ── */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-foreground">
          {t('Boosting FAQ')}
        </h3>

        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
          {[
            {
              q: 'What is a Colony Boost?',
              a: 'Colony Boosting is a way to support your favorite community and unlock premium perks for all members, such as better audio, 1080p/4K streams, custom vanity URLs, and hundreds of extra emoji slots.',
            },
            {
              q: 'How do I Boost a colony?',
              a: "Click 'Boost this colony' next to any colony in your list above, or click the colony dropdown menu in the sidebar and choose Colony Boost.",
            },
            {
              q: 'Can I Boost a Colony multiple times?',
              a: 'Yes! You can apply multiple Boosts to the same colony to help it reach higher perk levels faster.',
            },
            {
              q: 'Can I continue Boosting a colony after it reaches Level 3?',
              a: 'Yes, you can continue boosting a Level 3 colony to provide a buffer against expired boosts and ensure the colony never loses its Level 3 status.',
            },
            {
              q: "What are 'additional perks' and how are they different from Levels?",
              a: 'Additional perks allow colonies to unlock specialized benefits such as extra soundboard slots or custom themes even before hitting the next full milestone level.',
            },
            {
              q: 'How much do the new additional perks cost?',
              a: 'Additional perks are unlocked using available Boost slots or through community contributor points.',
            },
            {
              q: 'Are additional perks replacing the current server level system?',
              a: 'No, the 3-tier Level system remains the core progression milestone for all colonies.',
            },
            {
              q: 'Do additional perks use separate Boosts from my server level?',
              a: "No, all Boosts contribute towards your colony's total level pool.",
            },
            {
              q: 'Are additional perks a one-time purchase, or do they require ongoing Boosts?',
              a: 'Perks remain active as long as the colony maintains the required number of active subscriber boosts.',
            },
          ].map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-foreground">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed bg-muted/10 border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. BUY BOOST PACKS DIALOG (MIDTRANS SNAP) ── */}
      <Dialog open={isBuyBoostDialogOpen} onOpenChange={setIsBuyBoostDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border rounded-2xl space-y-4">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-sky-400">
              <Gem className="w-5 h-5 fill-current" />
              <DialogTitle className="text-base font-bold text-foreground">
                {targetColonyForBoost
                  ? t(`Beli Boost untuk "${targetColonyForBoost.name}"`)
                  : t('Beli Slot Colony Boost')}
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                'Pembayaran instan dan aman via Midtrans Snap (QRIS, GoPay, ShopeePay, Virtual Account, & Kartu Kredit).',
              )}
            </p>
          </DialogHeader>

          {/* Pack Selection */}
          <div className="space-y-2.5 pt-1">
            {BOOST_PACKS.map((pack) => {
              const isSelected = selectedBoostPack.count === pack.count;
              return (
                <div
                  key={pack.count}
                  onClick={() => setSelectedBoostPack(pack)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none',
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/40 text-foreground'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground',
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{pack.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-400">
                        {pack.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{pack.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-foreground font-mono">
                      {pack.priceFormatted}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 ml-auto mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Target Colony summary if selected */}
          {targetColonyForBoost && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('Diterapkan otomatis ke:')}</span>
              <span className="font-bold text-foreground">{targetColonyForBoost.name}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPurchasingBoost}
              onClick={() => setIsBuyBoostDialogOpen(false)}
              className="text-xs font-medium cursor-pointer"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPurchasingBoost}
              onClick={() => handleBuyBoostCheckout(selectedBoostPack, targetColonyForBoost?.id)}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isPurchasingBoost ? t('Memproses...') : t(`Bayar ${selectedBoostPack.priceFormatted.split(' /')[0]}`)}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
