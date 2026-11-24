import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

export interface SelectImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'avatar' | 'banner';
  currentImageUrl?: string | null;
  onSelectImage: (dataUrlOrHttpUrl: string) => void;
  onOpenNectarUpgrade?: () => void;
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

// Curated 6 slots for recent avatar / banner uploads
const PRESET_RECENT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
];

const PRESET_RECENT_BANNERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
];

export function SelectImageDialog({
  open,
  onOpenChange,
  mode,
  currentImageUrl,
  onSelectImage,
  onOpenNectarUpgrade,
}: SelectImageDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'gif'>('picker');
  const [searchQuery, setSearchQuery] = useState('');

  const isAvatar = mode === 'avatar';
  const recentPresets = isAvatar ? PRESET_RECENT_AVATARS : PRESET_RECENT_BANNERS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSelectImage(reader.result);
        onOpenChange(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    onSelectImage(url);
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
        className="relative w-full max-w-md p-0 overflow-hidden bg-[#18191c] text-white border border-[#27272a] shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-bold tracking-tight text-white">
            {t('Select an Image')}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
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

        <div className="px-5 pb-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'picker' ? (
            <>
              {/* 2 Big Action Cards (Upload Image & Choose GIF) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Upload Image Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-xl bg-[#111214] border border-white/10 hover:border-white/30 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="size-11 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                    {t('Upload Image')}
                  </span>
                </button>

                {/* Choose GIF Card */}
                <button
                  type="button"
                  onClick={() => setActiveTab('gif')}
                  className="h-32 rounded-xl bg-[#111214] border border-white/10 hover:border-white/30 relative flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group overflow-hidden shadow-sm"
                >
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                    GIF
                  </div>
                  <div className="size-11 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                    {t('Choose GIF')}
                  </span>
                </button>
              </div>

              {/* Recent Avatars / Banners Section */}
              <div className="space-y-2 pt-1">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200">
                    {isAvatar ? t('Recent Avatars') : t('Recent Banners')}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {isAvatar
                      ? t('Access your 6 most recent avatar uploads.')
                      : t('Access your 6 most recent banner uploads.')}
                  </p>
                </div>

                {/* 6 Preview Slots */}
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {recentPresets.map((url, idx) => {
                    const isCurrent = currentImageUrl === url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(url)}
                        className={cn(
                          'relative aspect-square border overflow-hidden transition-transform hover:scale-105 cursor-pointer bg-[#111214]',
                          isAvatar ? 'rounded-full' : 'rounded-lg',
                          isCurrent
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/50'
                            : 'border-white/10 hover:border-white/30'
                        )}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-[#5865F2]/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* GIF Gallery Sub-view */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('picker')}
                  className="text-xs text-zinc-400 hover:text-white h-7 px-2"
                >
                  ← {t('Kembali')}
                </Button>
                <div className="text-xs font-bold text-zinc-300">
                  {t('Pilih Animated GIF')}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Cari GIF anime, lofi, gaming...')}
                  className="w-full h-8 pl-8 pr-3 bg-[#111214] border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Curated Categories */}
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {CURATED_GIFS.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
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
                            onClick={() => handleSelectPreset(it.url)}
                            className={cn(
                              'relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-[#5865F2] hover:scale-105 transition-all cursor-pointer group',
                              isAvatar && 'aspect-square rounded-full'
                            )}
                            title={it.title}
                          >
                            <img
                              src={it.url}
                              alt={it.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

          {/* Bottom Callout Banner (Animate your avatar/banner with Nectar) */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#5865F2]/20 via-purple-600/20 to-pink-600/20 border border-[#5865F2]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">
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
              className="h-7 text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white shrink-0 rounded-lg shadow-sm cursor-pointer"
            >
              {t('Get Nectar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
