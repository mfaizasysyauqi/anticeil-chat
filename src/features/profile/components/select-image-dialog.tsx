import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Sparkles,
  Zap,
  Search,
  Check,
  User,
  ImagePlus,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { profileApi } from '../api/profile-api';

export interface SelectImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'avatar' | 'banner';
  currentImageUrl?: string | null;
  onSelectImage: (dataUrlOrHttpUrl: string) => void;
  onOpenNectarUpgrade?: () => void;
  onOpenShop?: (category?: string) => void;
}

// Curated high quality animated GIF presets
const CURATED_GIFS = [
  {
    category: 'Cyberpunk & Sci-Fi',
    items: [
      { id: 'cb1', title: 'Cyber Rain City', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
      { id: 'cb2', title: 'Neon Highway', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80' },
      { id: 'cb3', title: 'Glitch Synthwave', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    category: 'Anime & Gaming',
    items: [
      { id: 'an1', title: 'Pixel Lofi Room', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
      { id: 'an2', title: 'Sunset Chill Rooftop', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80' },
      { id: 'an3', title: 'Neon Arcade Player', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    category: 'Memes & Cats',
    items: [
      { id: 'mc1', title: 'Tactical Helmet Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
      { id: 'mc2', title: 'Laser Eyes Vibe', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80' },
      { id: 'mc3', title: 'Coffee Chill Frog', url: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80' },
    ],
  },
];

export function SelectImageDialog({
  open,
  onOpenChange,
  mode,
  currentImageUrl,
  onSelectImage,
  onOpenNectarUpgrade,
  onOpenShop,
}: SelectImageDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'gif'>('picker');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentUploads, setRecentUploads] = useState<string[]>([]);
  const [, setIsLoadingRecent] = useState(true);

  const isAvatar = mode === 'avatar';

  // Load Real User Recent Uploads from Database
  useEffect(() => {
    if (!open) return;
    setActiveTab('picker');
    setSearchQuery('');

    // Load fullstack recent uploads from user profile
    setIsLoadingRecent(true);
    profileApi.getProfile()
      .then((data) => {
        const list = isAvatar ? data.recentAvatars || [] : data.recentBanners || [];
        const activeUrl = isAvatar
          ? (currentImageUrl || data.avatarUrl)
          : (currentImageUrl || data.bannerUrl);

        let merged = [...list];
        if (activeUrl && !merged.includes(activeUrl)) {
          merged = [activeUrl, ...merged];
        }
        setRecentUploads(merged.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingRecent(false);
      });
  }, [open, isAvatar, currentImageUrl]);

  const addRecentUpload = async (url: string) => {
    const updated = [url, ...recentUploads.filter((u) => u !== url)].slice(0, 6);
    setRecentUploads(updated);
    try {
      if (isAvatar) {
        await profileApi.updateProfile({ recentAvatars: updated, avatarUrl: url });
      } else {
        await profileApi.updateProfile({ recentBanners: updated, bannerUrl: url });
      }
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const resultUrl = reader.result;
        onSelectImage(resultUrl);
        await addRecentUpload(resultUrl);
        onOpenChange(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRecent = async (url: string) => {
    onSelectImage(url);
    await addRecentUpload(url);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-lg p-0 overflow-hidden bg-card text-card-foreground border border-border shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          {activeTab === 'gif' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('picker')}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                title={t('Kembali')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  {t('Choose a GIF')}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {t('Pilih animasi GIF favorit Anda.')}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {isAvatar ? t('Select an Image') : t('Select Profile Banner')}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {isAvatar
                  ? t('Unggah foto atau pilih dari avatar terbaru Anda.')
                  : t('Unggah banner kustom atau pilih dari banner terbaru Anda.')}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.gif"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: PICKER (Discord-Parity) */}
          {activeTab === 'picker' && (
            <>
              {/* 2 Big Action Cards (Upload Image & Choose GIF) */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Upload Image Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-xl bg-card border border-border/80 hover:border-primary/60 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="size-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {t('Upload Image')}
                  </span>
                </button>

                {/* 2. Choose GIF Card (with Collage Visual like Discord) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('gif')}
                  className="h-32 rounded-xl border border-border/80 hover:border-primary/60 relative flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group overflow-hidden shadow-xs"
                >
                  {/* 2x2 Collage Background */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-50 group-hover:opacity-70 transition-opacity">
                    <img src={CURATED_GIFS[0].items[0].url} alt="" className="size-full object-cover" />
                    <img src={CURATED_GIFS[2].items[0].url} alt="" className="size-full object-cover" />
                    <img src={CURATED_GIFS[1].items[0].url} alt="" className="size-full object-cover" />
                    <img src={CURATED_GIFS[2].items[1].url} alt="" className="size-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-2xs" />

                  {/* Top-right GIF badge */}
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-emerald-500/80 text-white shadow-xs z-10">
                    GIF
                  </span>

                  {/* Centered label */}
                  <div className="relative z-10 flex flex-col items-center gap-1.5">
                    <div className="size-9 rounded-full bg-background/80 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      {t('Choose GIF')}
                    </span>
                  </div>
                </button>
              </div>

              {/* Recent Avatars / Banners Section (FULLSTACK LIVE DATA) */}
              <div className="space-y-2 pt-1">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {isAvatar ? t('Recent Avatars') : t('Recent Banners')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isAvatar
                      ? t('Access your 6 most recent avatar uploads.')
                      : t('Access your 6 most recent banner uploads.')}
                  </p>
                </div>

                {/* 6 Real Slots */}
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const url = recentUploads[idx];
                    if (url) {
                      const isCurrent = currentImageUrl === url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectRecent(url)}
                          className={cn(
                            'relative aspect-square border overflow-hidden transition-all hover:scale-105 cursor-pointer bg-muted/40 shadow-xs group',
                            isAvatar ? 'rounded-full' : 'rounded-lg',
                            isCurrent
                              ? 'border-primary ring-2 ring-primary/50'
                              : 'border-border/70 hover:border-border'
                          )}
                          title={t('Pilih item ini')}
                        >
                          <img src={url} alt={`Recent ${idx}`} className="size-full object-cover" />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    }

                    // Empty placeholder slot with silhouette (Discord Parity)
                    return (
                      <button
                        key={`empty-${idx}`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'relative aspect-square border border-dashed border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all flex items-center justify-center cursor-pointer group',
                          isAvatar ? 'rounded-full' : 'rounded-lg'
                        )}
                        title={t('Unggah ke slot ini')}
                      >
                        {isAvatar ? (
                          <User className="w-5 h-5 text-muted-foreground/35 group-hover:text-primary/70 transition-colors" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground/35 group-hover:text-primary/70 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: GIF GALLERY */}
          {activeTab === 'gif' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Cari GIF anime, lofi, gaming...')}
                  className="w-full h-8 pl-8 pr-3 bg-muted/30 border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Curated Categories */}
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {CURATED_GIFS.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {cat.category}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {cat.items
                        .filter(
                          (it) =>
                            !searchQuery ||
                            it.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((it) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => handleSelectRecent(it.url)}
                            className={cn(
                              'relative aspect-video rounded-lg overflow-hidden border border-border/70 hover:border-primary hover:scale-105 transition-all cursor-pointer group shadow-xs',
                              isAvatar && 'aspect-square rounded-full'
                            )}
                            title={it.title}
                          >
                            <img
                              src={it.url}
                              alt={it.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white text-center px-1 truncate">
                                {it.title}
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Callout Banner (Nectar CTA) */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/15 via-purple-600/15 to-pink-600/15 border border-primary/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {isAvatar
                  ? t('Animate your avatar with Nectar')
                  : t('Animate your profile banner with Nectar')}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenNectarUpgrade?.();
              }}
              className="h-7 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 rounded-lg shadow-xs cursor-pointer"
            >
              {t('Get Nectar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
