import React, { useState } from 'react';
import {
  Zap, Gem, CreditCard, Gift, Receipt, Check, ChevronDown, Sparkles,
  ExternalLink, Search, Trash2, Key, Info, HelpCircle, Heart, Upload, Smile, Flame, Tv, User,
  MonitorPlay, Video, X, Play, Star, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface BillingTabProps {
  activeSection: 'nitro' | 'boost' | 'subscriptions' | 'gifts' | 'billing';
  theme?: any;
  onNavigateSection?: (section: string) => void;
}

export function BillingTab({
  activeSection,
  theme,
  onNavigateSection,
}: BillingTabProps) {
  const { t } = useTranslation();
  // Colony Boost State (Discord Parity)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [boostedColonies, setBoostedColonies] = useState<{ [id: string]: number }>({
    c1: 0,
    c2: 2,
    c3: 6,
  });

  // Gift & Billing State (Discord Parity)
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    { id: string; name: string; type: string; details: string; isDefault: boolean }[]
  >([]);

  const handleRedeemCode = () => {
    if (!redeemCodeInput.trim()) {
      toast.error(t('Masukkan kode hadiah terlebih dahulu'));
      return;
    }
    const code = redeemCodeInput.trim().toUpperCase();
    if (code.startsWith('WUMP') || code.startsWith('NECTAR') || code.length >= 8) {
      toast.success(t('Kode hadiah berhasil diklaim! 1 Bulan Nectar telah ditambahkan ke akun Anda. 🎉'));
      setRedeemCodeInput('');
    } else {
      toast.error(t('Kode hadiah tidak valid atau telah kedaluwarsa'));
    }
  };



  return (
    <>
      {activeSection === 'nitro' && (
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
                    onClick={() =>
                      toast.success(t('Membuka langganan Nectar... Akun Anda memenuhi syarat promo perdana!'))
                    }
                    className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs sm:text-sm h-10 px-6 rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current text-purple-600" />
                    <span>{t('Subscribe')}</span>
                  </Button>

                  <Button
                    size="default"
                    variant="outline"
                    onClick={() =>
                      toast.info(t('Pilih kontak atau colony untuk mengirimkan Gift Nectar.'))
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
              {/* TIER 1: NECTAR BASIC */}
              <div className="rounded-2xl p-6 bg-linear-to-b from-[#0066FE] to-[#004ECC] text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[380px]">
                {/* Mascot Graphic on Scooter */}
                <div className="absolute top-4 right-4 size-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-lg select-none">
                  🛵
                </div>

                <div>
                  <div className="text-2xl font-black tracking-tight">NECTAR</div>
                  <div className="text-[11px] font-black tracking-widest text-sky-200 uppercase mt-0.5">
                    BASIC
                  </div>
                  <div className="text-sm font-bold text-white/95 mt-2">
                    IDR 29,000.00 / month
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { icon: <Upload className="w-4 h-4 text-sky-200" />, label: '50MB uploads' },
                      { icon: <Smile className="w-4 h-4 text-sky-200" />, label: 'Custom emoji anywhere' },
                      { icon: <Flame className="w-4 h-4 text-sky-200" />, label: 'Unlimited Super Reactions' },
                      { icon: <Sparkles className="w-4 h-4 text-sky-200" />, label: 'Special Nectar badge on your profile' },
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-white/95">
                        <span className="shrink-0">{feat.icon}</span>
                        <span>{feat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => toast.success(t('Pilihan Nectar Basic dipilih: IDR 29,000/bln'))}
                  className="w-full mt-6 bg-white/15 hover:bg-white/25 text-white border-white/40 font-bold text-xs h-10 rounded-xl cursor-pointer"
                >
                  {t('Subscribe')}
                </Button>
              </div>

              {/* TIER 2: NECTAR FULL */}
              <div className="rounded-2xl p-6 bg-linear-to-b from-[#8F2DF5] via-[#A838E6] to-[#DB2B88] text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[380px]">
                {/* Flying Mascot Graphic */}
                <div className="absolute top-4 right-4 size-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-lg select-none">
                  🚀
                </div>

                <div>
                  <div className="text-2xl font-black tracking-tight">NECTAR</div>
                  <div className="text-sm font-bold text-white/95 mt-2">
                    IDR 83,169.00 / month
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { icon: <Upload className="w-4 h-4 text-pink-200" />, label: '1GB uploads' },
                      { icon: <Smile className="w-4 h-4 text-pink-200" />, label: 'Custom emoji anywhere' },
                      { icon: <Flame className="w-4 h-4 text-pink-200" />, label: 'Unlimited Super Reactions' },
                      { icon: <Tv className="w-4 h-4 text-pink-200" />, label: 'HD video streaming' },
                      { icon: <Gem className="w-4 h-4 text-pink-200" />, label: '2 Colony Boosts' },
                      { icon: <User className="w-4 h-4 text-pink-200" />, label: 'Custom profiles and more!' },
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-white/95">
                        <span className="shrink-0">{feat.icon}</span>
                        <span>{feat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => toast.success(t('Pilihan Nectar Full dipilih: IDR 83,169/bln'))}
                  className="w-full mt-6 bg-white hover:bg-white/90 text-purple-950 font-black text-xs h-10 rounded-xl shadow-lg cursor-pointer"
                >
                  {t('Subscribe')}
                </Button>
              </div>
            </div>

            {/* ── 3. FAVORITE NECTAR PERKS (BENTO GRID) ── */}
            <div className="space-y-6 pt-2">
              <h3 className="text-xl sm:text-2xl font-black text-foreground text-center">
                {t('Favorite Nectar Perks')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Perk 1: More Emoji Power */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex flex-col justify-between overflow-hidden relative">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      COLONY EMOJIS
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-2xl select-none text-center">
                      <span className="hover:scale-125 transition-transform cursor-pointer">🚀</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">🔥</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">✨</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">🎉</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">😎</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">🍕</span>
                    </div>
                    <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Use in any colony, server or DM</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">More Emoji Power</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Hype, roast, and meme with custom emoji anywhere.
                    </p>
                  </div>
                </div>

                {/* Perk 2: HD Video */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 border border-border/60 p-3 flex flex-col justify-between text-white overflow-hidden relative">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                        LIVE 4K 60FPS
                      </span>
                      <MonitorPlay className="w-4 h-4 text-purple-300" />
                    </div>
                    <div className="text-center font-mono font-bold text-sm tracking-wider text-purple-200">
                      ULTRA HD STREAMING
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/70 font-mono">
                      <span>Source 3840×2160</span>
                      <span>Audio 384kbps</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">HD Video</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Better video resolutions for all your streams. Stream apps and games in sweet, sweet HD.
                    </p>
                  </div>
                </div>

                {/* Perk 3: 1GB Uploads */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border shadow-xs">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate">
                          game_footage_master_render.mp4
                        </div>
                        <div className="text-[10px] text-muted-foreground">982 MB of 1.0 GB</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">98%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">1GB Uploads</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Upload what you want with increased 1GB upload size.
                    </p>
                  </div>
                </div>

                {/* Perk 4: Custom App Icons */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-3">
                    {[
                      { bg: 'from-amber-500 to-rose-500', icon: '⚡' },
                      { bg: 'from-indigo-600 to-purple-600', icon: '🌌' },
                      { bg: 'from-emerald-500 to-teal-600', icon: '🌿' },
                      { bg: 'from-fuchsia-600 to-pink-500', icon: '🌸' },
                    ].map((theme, i) => (
                      <div
                        key={i}
                        className={cn(
                          'size-12 rounded-2xl bg-linear-to-br flex items-center justify-center text-xl shadow-md border border-white/20 select-none hover:scale-110 transition-transform cursor-pointer',
                          theme.bg
                        )}
                      >
                        {theme.icon}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Custom App Icons</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Choose a mobile and in-app desktop icon that fits your vibe.
                    </p>
                  </div>
                </div>

                {/* Perk 5: Use Custom Sounds */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-2">
                    {['🎺 Airhorn', '🦆 Quack', '👏 Applause', '⚡ Laser'].map((snd, i) => (
                      <div
                        key={i}
                        onClick={() => toast.success(`Sound effect diputar: ${snd}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-[11px] font-bold text-foreground shadow-2xs hover:border-primary cursor-pointer select-none"
                      >
                        {snd}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Use Custom Sounds</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Use custom sounds and personalized entrance sounds across voice channels.
                    </p>
                  </div>
                </div>

                {/* Perk 6: Video Backgrounds */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-linear-to-tr from-sky-900 via-indigo-900 to-violet-900 border border-border/60 p-3 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-200">
                      <Video className="w-3.5 h-3.5" />
                      <span>VIRTUAL BACKGROUND</span>
                    </div>
                    <div className="text-center font-bold text-xs tracking-wider">
                      Cozy Anime Loft & Neon City
                    </div>
                    <div className="text-[10px] text-white/70 text-right">HD Camera Preview</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Video Backgrounds</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Make video calls unique with your own backgrounds.
                    </p>
                  </div>
                </div>

                {/* Perk 7: Unlimited Super Reactions */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-xs shadow-xs">
                      <Flame className="w-4 h-4 fill-current animate-bounce" />
                      <span>x18 SUPER REACTION</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-500 font-bold text-xs shadow-xs">
                      <span>💖 x35</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Unlimited Super Reactions</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      We made Super Reactions unlimited so you can unleash the chaos in your chats.
                    </p>
                  </div>
                </div>

                {/* Perk 8: Special Sticker Access */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-4 text-3xl select-none">
                    <span className="hover:rotate-12 transition-transform cursor-pointer">🎨</span>
                    <span className="hover:scale-125 transition-transform cursor-pointer">👾</span>
                    <span className="hover:-rotate-12 transition-transform cursor-pointer">🐱</span>
                    <span className="hover:scale-125 transition-transform cursor-pointer">🌟</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Special Sticker Access</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Use custom stickers anywhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4. SUBSCRIBER BADGE SPOTLIGHT CARD ── */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3 shadow-xs">
              <div className="size-16 rounded-2xl bg-linear-to-br from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto shadow-md">
                <Zap className="w-8 h-8 fill-current animate-pulse text-purple-500" />
              </div>
              <h4 className="text-base font-bold text-foreground">Subscriber Badge</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Get this cool badge for being a Nectar subscriber.
              </p>
            </div>

            {/* ── 5. COMPARISON TABLE ── */}
            <div className="space-y-6 pt-4">
              <h3 className="text-xl sm:text-2xl font-black text-foreground text-center">
                {t('Pick the plan that works best for you')}
              </h3>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-12 border-b border-border text-xs font-bold text-foreground bg-muted/30">
                  <div className="col-span-6 sm:col-span-6 p-4 flex items-end">
                    <span>Pricing and Features</span>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-4 text-center border-l border-border/60 flex flex-col justify-end">
                    <div className="text-sm font-black">NECTAR</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">BASIC</div>
                    <div className="text-[11px] text-muted-foreground mt-1">IDR 29,000.00/mo</div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-4 text-center border-l-2 border-pink-500 bg-pink-500/5 flex flex-col justify-end relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                      MOST POPULAR
                    </span>
                    <div className="text-sm font-black text-pink-500">NECTAR</div>
                    <div className="text-[11px] text-muted-foreground mt-1">IDR 83,169.00/mo</div>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/60 text-xs">
                  {[
                    { feature: 'Custom emoji anywhere and animated', basic: true, nectar: true },
                    { feature: 'Custom stickers anywhere', basic: true, nectar: true },
                    { feature: 'Custom App Icons', basic: true, nectar: true },
                    { feature: 'Super Reactions', basic: true, nectar: true },
                    { feature: 'Larger File Uploads', basic: '50 MB', nectar: '1 GB' },
                    { feature: 'HD streaming', basic: false, nectar: 'Up to 4K and 60fps' },
                    { feature: '2 Boosts + 30% off extra Boosts', basic: false, nectar: true },
                    { feature: 'Animated avatar, banner, and profile theme', basic: false, nectar: true },
                    { feature: 'Display Name Styles', basic: false, nectar: true },
                    { feature: 'Custom per-server profiles', basic: false, nectar: true },
                    { feature: 'Shop member pricing, and exclusive items', basic: false, nectar: true },
                    { feature: 'Colors for your Anticeil theme', basic: false, nectar: true },
                    { feature: 'Nectar badge on your profile', basic: true, nectar: true },
                    { feature: 'Custom video backgrounds', basic: true, nectar: true },
                    { feature: 'Custom sounds anywhere', basic: false, nectar: true },
                    { feature: 'Custom entrance sounds', basic: false, nectar: true },
                    { feature: 'Join up to 200 servers', basic: false, nectar: true },
                    { feature: 'Longer messages up to 4000 characters', basic: false, nectar: true },
                    { feature: '3 Nectar friend passes', basic: false, nectar: true },
                    { feature: 'Keep Quest avatar decorations rewards longer', basic: false, nectar: true },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'grid grid-cols-12 items-center transition-colors',
                        idx % 2 === 0 ? 'bg-card' : 'bg-muted/15'
                      )}
                    >
                      <div className="col-span-6 sm:col-span-6 p-3.5 font-medium text-foreground">
                        {row.feature}
                      </div>

                      {/* Basic Col */}
                      <div className="col-span-3 sm:col-span-3 p-3.5 text-center border-l border-border/60">
                        {typeof row.basic === 'boolean' ? (
                          row.basic ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-foreground text-[11px]">{row.basic}</span>
                        )}
                      </div>

                      {/* Nectar Col */}
                      <div className="col-span-3 sm:col-span-3 p-3.5 text-center border-l-2 border-pink-500 bg-pink-500/5">
                        {typeof row.nectar === 'boolean' ? (
                          row.nectar ? (
                            <Check className="w-4 h-4 text-pink-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-black text-pink-500 text-[11px]">{row.nectar}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 6. FLOATING STICKY CTA BAR ── */}
            <div className="sticky bottom-4 z-20 flex justify-center mt-8">
              <div className="p-1.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    toast.success(t('Membuka langganan Nectar... Akun Anda memenuhi syarat promo perdana!'))
                  }
                  className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-purple-600" />
                  <span>{t('Subscribe')}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info(t('Pilih teman dari daftar kontak untuk mengirimkan Gift Nectar.'))
                  }
                  className="border-border hover:bg-muted font-bold text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 text-foreground"
                >
                  <Gift className="w-3.5 h-3.5 text-pink-500" />
                  <span>{t('Gift Nectar')}</span>
                </Button>
              </div>
            </div>
          </div>
      )}

      {activeSection === 'boost' && (
          <div className="space-y-8 pb-12">
            {/* ── 1. HEADER WITH EXPLANATION & VIDEO CARD ── */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="space-y-3 max-w-md">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 shadow-xs">
                    <Gem className="w-6 h-6 fill-pink-500/20" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t('Colony Boosts')}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'Boosting a colony unlocks perks for everyone in that colony. You can manage your Boosts here (add, subtract, cancel — just beware the 7 day cooldown).'
                  )}{' '}
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(t('Colony Boost memberikan peningkatan kapasitas file, kualitas stream, dan ratusan slot emoji.'))
                    }
                    className="text-primary hover:underline font-medium inline cursor-pointer"
                  >
                    {t('Learn more')}
                  </button>
                </p>
              </div>

              {/* Video Mockup Thumbnail Card */}
              <div
                onClick={() =>
                  toast.success(t('Memutar panduan interaktif: Cara kerja Colony Boost.'))
                }
                className="w-full lg:w-72 h-36 rounded-2xl bg-linear-to-br from-indigo-950 via-purple-950 to-pink-950 border border-purple-500/30 p-3.5 flex flex-col justify-between text-white relative overflow-hidden shadow-xl cursor-pointer group hover:border-purple-500/60 transition-all shrink-0"
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/90">
                    {t('How do Boosts work?')}
                  </span>
                  <Gem className="w-4 h-4 text-pink-400" />
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
            <div className="rounded-2xl p-4 bg-linear-to-r from-purple-900/30 via-indigo-900/30 to-pink-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Zap className="w-5 h-5 fill-current text-pink-400" />
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

            {/* ── 3. THESE COLONIES COULD USE A BOOST ── */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('These colonies could use a Boost')}
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'c1',
                    name: "zmsta's colony",
                    initials: 'ZC',
                    color: 'bg-indigo-600',
                    defaultLevel: 0,
                  },
                  {
                    id: 'c2',
                    name: 'awd community',
                    initials: 'AWD',
                    color: 'bg-emerald-600',
                    defaultLevel: 0,
                  },
                  {
                    id: 'c3',
                    name: '[FULLZ] Global Hub',
                    initials: 'FLZ',
                    color: 'bg-purple-600',
                    defaultLevel: 1,
                  },
                ].map((col) => {
                  const currentBoosts = boostedColonies[col.id] ?? 0;
                  const level = currentBoosts >= 14 ? 3 : currentBoosts >= 7 ? 2 : currentBoosts >= 2 ? 1 : 0;

                  return (
                    <div
                      key={col.id}
                      className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-4 shadow-xs hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'size-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0',
                            col.color
                          )}
                        >
                          {col.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {col.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Gem className="w-3 h-3 text-pink-500" />
                            <span>
                              {currentBoosts === 0
                                ? t('No Boosts')
                                : `${currentBoosts} Boosts • Level ${level}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setBoostedColonies((prev) => ({
                            ...prev,
                            [col.id]: (prev[col.id] ?? 0) + 1,
                          }));
                          toast.success(t(`Berhasil memberikan Boost ke ${col.name}! 🎉`));
                        }}
                        className="h-8 text-xs font-bold hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30 border border-transparent transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Gem className="w-3.5 h-3.5 text-pink-500" />
                        <span>{t('Boost this colony')}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 4. LEVEL PERKS PREVIEW TABLE ── */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Level Perks Overview')}
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-12 border-b border-border text-xs font-bold text-foreground bg-muted/30">
                  <div className="col-span-4 p-4 font-bold">Perks</div>
                  <div className="col-span-2 sm:col-span-2 p-3 text-center border-l border-border/60">
                    <div>Level 1</div>
                    <div className="text-[10px] text-muted-foreground font-medium">2 Boosts</div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                    <div>Level 2</div>
                    <div className="text-[10px] text-muted-foreground font-medium">7 Boosts</div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                    <div>Level 3</div>
                    <div className="text-[10px] text-muted-foreground font-medium">14 Boosts</div>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/60 text-xs">
                  {[
                    { perk: 'Emoji Slots', l1: '100', l2: '150', l3: '250' },
                    { perk: 'Sticker Slots', l1: '15', l2: '30', l3: '60' },
                    { perk: 'Soundboard Slots', l1: '24', l2: '36', l3: '48' },
                    { perk: 'Stream Quality', l1: '720p & 60fps', l2: '1440p & 60fps', l3: '1440p & 60fps' },
                    { perk: 'Audio Quality', l1: '128kbps', l2: '256kbps', l3: '384kbps' },
                    { perk: 'Upload Size Limit', l1: '10MB', l2: '50MB', l3: '100MB' },
                    { perk: 'Video Stage Seats', l1: '50', l2: '150', l3: '300' },
                    { perk: 'Animated Colony Icon', l1: true, l2: true, l3: true },
                    { perk: 'Colony Invite Background', l1: true, l2: true, l3: true },
                    { perk: 'Colony Banner', l1: false, l2: 'Static', l3: 'Animated' },
                    { perk: 'Custom Role Icons', l1: false, l2: true, l3: true },
                    { perk: 'Custom Invite Link', l1: false, l2: false, l3: true },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'grid grid-cols-12 items-center transition-colors',
                        idx % 2 === 0 ? 'bg-card' : 'bg-muted/15'
                      )}
                    >
                      <div className="col-span-4 p-3 font-semibold text-foreground">
                        {row.perk}
                      </div>

                      {/* Level 1 */}
                      <div className="col-span-2 sm:col-span-2 p-3 text-center border-l border-border/60">
                        {typeof row.l1 === 'boolean' ? (
                          row.l1 ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-foreground text-[11px]">{row.l1}</span>
                        )}
                      </div>

                      {/* Level 2 */}
                      <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                        {typeof row.l2 === 'boolean' ? (
                          row.l2 ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-foreground text-[11px]">{row.l2}</span>
                        )}
                      </div>

                      {/* Level 3 */}
                      <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                        {typeof row.l3 === 'boolean' ? (
                          row.l3 ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-pink-500 text-[11px]">{row.l3}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 5. GIVE YOUR COMMUNITY A BOOST & BE RECOGNIZED ── */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xl font-bold text-foreground text-center">
                {t('Give your community a Boost & be recognized')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-xs">
                    <Gem className="w-6 h-6 text-pink-500" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Display your support with a Member List icon')}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 mx-auto shadow-xs">
                    <Star className="w-6 h-6 fill-pink-500/40 text-pink-500 animate-pulse" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Unlock a profile badge that evolves over time')}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Get an exclusive Booster role')}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto shadow-xs">
                    <Heart className="w-6 h-6 fill-rose-500/40" />
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
                        <span className="text-xs font-bold text-foreground">{faq.q}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2',
                            isOpen && 'rotate-180'
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
          </div>
      )}

      {activeSection === 'subscriptions' && (
          <div className="space-y-8 pb-12">
            <h2 className="text-xl font-bold text-foreground">
              {t('Subscriptions')}
            </h2>

            {/* 1. Your Subscriptions */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Your Subscriptions')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t(
                    'These are your current subscriptions. They will be billed on the same billing cycle. You can update any subscription at any time.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-2xl select-none shadow-2xs">
                  🎲
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {t('You have no active subscriptions')}
                </div>
                <Button
                  size="sm"
                  onClick={() => onNavigateSection?.('nitro')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 px-4 rounded-xl cursor-pointer"
                >
                  {t('Explore Nectar Plans')}
                </Button>
              </div>
            </div>

            {/* 2. Subscription Credit */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Subscription Credit')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t(
                    'When you accept a gift while you have a running subscription, redeem a promotion, or accept a gift that differs from your current subscription, it will appear here as credit.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-2xl select-none shadow-2xs">
                  🎲
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {t('You have no unused credits')}
                </div>
              </div>
            </div>
          </div>
      )}

      {activeSection === 'gifts' && (
          <div className="space-y-8 pb-12">
            <h2 className="text-xl font-bold text-foreground">
              {t('Gift Inventory')}
            </h2>

            {/* 1. Redeem Codes */}
            <div id="gift-redeem-codes" className="space-y-3 scroll-mt-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Redeem Codes')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t("Received a code for Nectar or a game? That's exciting! Enter it below.")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
                <Input
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  placeholder="WUMP-AAAAA-BBBBB-CCCCC"
                  className="h-10 text-xs font-mono uppercase bg-card border-border tracking-wider"
                />
                <Button
                  onClick={handleRedeemCode}
                  className="h-10 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  {t('Redeem')}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* 2. The Gifting Badge */}
            <div id="gift-gifting-badge" className="space-y-3 scroll-mt-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('The Gifting Badge')}
              </h3>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
                {/* 6 Badges Progression */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  {[
                    { tier: 'Patron', count: 'Gifted 1x', icon: '🎁', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30' },
                    { tier: 'Champion', count: 'Gifted 2x', icon: '💎', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' },
                    { tier: 'Luminary', count: 'Gifted 3x', icon: '🎀', color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30' },
                    { tier: 'Icon', count: 'Gifted 6x', icon: '🔮', color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30' },
                    { tier: 'Hero', count: 'Gifted 10x', icon: '👑', color: 'from-violet-500/20 to-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' },
                    { tier: 'Legend', count: 'Gifted 20x', icon: '🏆', color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30' },
                  ].map((badge, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-2xl border p-3 flex flex-col items-center justify-between gap-2 bg-linear-to-b shadow-2xs hover:scale-105 transition-transform cursor-pointer',
                        badge.color
                      )}
                    >
                      <span className="text-2xl select-none">{badge.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-foreground">{badge.tier}</div>
                        <div className="text-[10px] text-muted-foreground">{badge.count}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
                    {t('Your badge progresses as you gift. Exceptions include when a gift is refunded or when fraud is detected.')}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => toast.info(t('Pilih teman dari daftar kontak untuk mengirimkan hadiah.'))}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{t('Send a Gift')}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* 3. Gifts I Purchased */}
            <div id="gift-purchased" className="space-y-3 scroll-mt-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('Gifts I Purchased')}
              </h3>

              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-1.5 shadow-xs">
                <div className="text-xs font-bold text-foreground">
                  {t('There are no gifts.')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Feeling generous? Give someone the gift of Nectar and make their day!')}
                </div>
              </div>
            </div>
          </div>
      )}

      {activeSection === 'billing' && (
          <div className="space-y-8 pb-12">
            <h2 className="text-xl font-bold text-foreground">
              {t('Billing')}
            </h2>

            {/* 1. Payment Methods */}
            <div id="billing-payment-methods" className="space-y-3 scroll-mt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Payment Methods')}
                  </h3>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>Country/Region: Indonesia</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                {savedPaymentMethods.length === 0 ? (
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t('No payment method saved')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Checkout faster by saving a payment method')}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedPaymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-xs font-bold text-foreground">{pm.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{pm.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => {
                    setSavedPaymentMethods([
                      {
                        id: 'pm-qris',
                        name: 'QRIS / GoPay (Midtrans)',
                        type: 'e-wallet',
                        details: 'Instant QRIS & GoPay Auto-Debit',
                        isDefault: true,
                      },
                    ]);
                    toast.success(t('Metode pembayaran QRIS / GoPay berhasil ditambahkan!'));
                  }}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  {t('Add Payment Method')}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* 2. Transaction History */}
            <div id="billing-transaction-history" className="space-y-3 scroll-mt-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('Transaction History')}
              </h3>

              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
                <div className="text-xs text-muted-foreground">
                  {t("You haven't made any transactions yet.")}
                </div>
              </div>
            </div>
          </div>
      )}
    </>
  );
}
