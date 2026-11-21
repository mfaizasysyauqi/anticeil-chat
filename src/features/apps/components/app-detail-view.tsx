import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Radio,
  Share2,
  MoreHorizontal,
  Users,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Gamepad2,
  Tv,
  Globe,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { VoiceAppDefinition } from '@/features/voice/data/voice-activities';
import { ANTICEIL_APPS } from '@/features/voice/data/voice-activities';

export interface AppDetailViewProps {
  app: VoiceAppDefinition;
  onBack: () => void;
  onLaunchStandalone: (app: VoiceAppDefinition) => void;
  onOpenSendToChannel: (app: VoiceAppDefinition) => void;
  onSelectOtherApp: (app: VoiceAppDefinition) => void;
  horizontalPadding?: string;
}

export function AppDetailView({
  app,
  onBack,
  onLaunchStandalone,
  onOpenSendToChannel,
  onSelectOtherApp,
  horizontalPadding = 'px-4 sm:px-6 md:px-8',
}: AppDetailViewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const AppIcon = app.icon || Gamepad2;
  const screenshots = app.screenshots && app.screenshots.length > 0
    ? app.screenshots
    : [app.bannerImage || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80'];

  const categoryLabel =
    app.category === 'productivity'
      ? 'Utilitas & Produktivitas'
      : app.category === 'game'
      ? 'Game'
      : 'Hiburan';

  const relatedApps = ANTICEIL_APPS.filter((a) => a.id !== app.id).slice(0, 3);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', app.id);
      navigator.clipboard.writeText(url.toString()).then(() => {
        setIsCopied(true);
        toast.success(`Tautan ${app.title} berhasil disalin ke clipboard!`);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden select-none">
      {/* ── App Bar Header (Discord style: Back arrow + Title) ─────────────── */}
      <div className={cn('sticky top-0 z-30 h-12 border-b border-sidebar-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-md gap-3', horizontalPadding)}>
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onBack}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/60 cursor-pointer shrink-0"
            title="Kembali ke Katalog Aktivitas"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <span className="text-sm font-bold text-foreground truncate tracking-wide">
            {app.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground border-border"
            title="Salin tautan aplikasi"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Tersalin' : 'Bagikan'}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Opsi lainnya"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShare} className="gap-2 cursor-pointer text-xs">
                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Salin Tautan Aktivitas</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSendToChannel(app)} className="gap-2 cursor-pointer text-xs">
                <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Buka di Saluran Lain</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.info('Aplikasi ini terverifikasi aman oleh tim Anticeil.')}
                className="gap-2 cursor-pointer text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Status Keamanan: Terverifikasi</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Main Scroll Area ──────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn('py-6 max-w-6xl mx-auto space-y-6', horizontalPadding)}>
          {/* Hero Banner with Landscape Cover */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-2xl bg-zinc-950">
            {/* Landscape Backdrop */}
            <div
              className={cn(
                'h-52 sm:h-64 md:h-76 w-full relative bg-cover bg-center overflow-hidden',
                app.bannerGradient || 'bg-gradient-to-r from-zinc-900 to-zinc-950'
              )}
              style={
                app.bannerImage
                  ? { backgroundImage: `url(${app.bannerImage})` }
                  : undefined
              }
            >
              {/* Dim Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
            </div>

            {/* Overlapping App Header & Meta */}
            <div className="px-5 sm:px-8 pb-6 pt-0 -mt-12 sm:-mt-14 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div className="flex items-end gap-4 min-w-0">
                {/* Large App Icon */}
                <div
                  className={cn(
                    'size-20 sm:size-24 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 border-4 border-background',
                    app.iconBg || 'bg-primary',
                    app.iconColor || 'text-white'
                  )}
                >
                  <AppIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>

                <div className="space-y-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight truncate">
                      {app.title}
                    </h1>
                    {app.badge && (
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                        {app.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Oleh <span className="text-foreground font-semibold">{app.developer}</span> • {categoryLabel}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Primary [Launch] + Secondary [Add/Send] */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <Button
                  size="default"
                  onClick={() => onLaunchStandalone(app)}
                  className={cn(
                    'h-10 px-5 sm:px-6 font-bold text-sm gap-2 cursor-pointer shadow-lg transition-transform active:scale-95 shrink-0',
                    app.buttonClass || 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  )}
                  title="Mulai dan jalankan aktivitas ini"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span>Luncurkan</span>
                </Button>

                <Button
                  size="default"
                  variant="outline"
                  onClick={() => onOpenSendToChannel(app)}
                  className="h-10 px-4 font-semibold text-sm gap-2 cursor-pointer bg-card hover:bg-accent border-border text-foreground shrink-0 shadow-xs"
                  title="Buka atau kirim undangan aktivitas ke saluran colony"
                >
                  <Radio className="w-4 h-4 text-primary" />
                  <span>Buka di Saluran</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ── 2-Column Content Layout (Discord App Directory Style) ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
            {/* Left Column: Media Carousel + Overview + Permissions + You Might Like */}
            <div className="lg:col-span-2 space-y-8 min-w-0">
              {/* Media Carousel / Screenshot Preview */}
              {screenshots.length > 0 && (
                <div className="space-y-3">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-black/60 shadow-md group">
                    <img
                      src={screenshots[currentSlideIndex]}
                      alt={`${app.title} Preview ${currentSlideIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-300"
                    />

                    {/* Carousel Nav Buttons */}
                    {screenshots.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevSlide}
                          className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                          aria-label="Previous Slide"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={nextSlide}
                          className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                          aria-label="Next Slide"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Carousel Pagination Dots */}
                  {screenshots.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {screenshots.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={cn(
                            'h-2 rounded-full transition-all cursor-pointer',
                            idx === currentSlideIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                          )}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section: Overview */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Overview
                </h3>
                <div className="space-y-3 text-sm text-foreground/90 leading-relaxed font-normal bg-card/40 border border-border/50 rounded-xl p-5">
                  <h4 className="font-bold text-base text-foreground">
                    APA ITU {app.title.toUpperCase()}?
                  </h4>
                  <p className="text-muted-foreground">
                    {app.overviewLong || app.description}
                  </p>

                  <h5 className="font-semibold text-sm pt-2 text-foreground">
                    CARA MENGGUNAKAN
                  </h5>
                  <p className="text-muted-foreground">
                    {app.howToPlay || 'Klik tombol "Luncurkan" untuk mulai menggunakan secara mandiri, atau pilih "Buka di Saluran" untuk mengundang teman bermain bersama di channel suara colony Anda.'}
                  </p>
                </div>
              </div>

              {/* Section: Data Access / Permissions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Akses Data & Privasi
                </h3>
                <div className="rounded-xl border border-border/60 bg-card/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Izin Akses Aplikasi Standar</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Semua aplikasi di Anticeil beroperasi di lingkungan terisolasi yang aman (*secure sandbox*). Aplikasi ini hanya berinteraksi dengan sesi panggilan aktif yang Anda izinkan.
                  </p>
                </div>
              </div>

              {/* Section: You Might Also Like */}
              {relatedApps.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Aktivitas Serupa Lainnya
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {relatedApps.map((rel) => {
                      const RelIcon = rel.icon || Gamepad2;
                      return (
                        <div
                          key={rel.id}
                          onClick={() => onSelectOtherApp(rel)}
                          className="rounded-xl border border-border bg-card p-3 hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                'size-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs',
                                rel.iconBg || 'bg-primary',
                                rel.iconColor || 'text-white'
                              )}
                            >
                              <RelIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-foreground block truncate group-hover:text-primary transition-colors">
                                {rel.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {rel.developer}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {rel.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Metadata Sidebar */}
            <div className="space-y-6 lg:border-l lg:border-border/60 lg:pl-6">
              {/* Server Count */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Jumlah Colony
                </span>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{app.serverCount || 'In 48 colonies'}</span>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Kategori
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
                    {categoryLabel}
                  </Badge>
                </div>
              </div>

              {/* Supported Languages */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Bahasa yang Didukung
                </span>
                <p className="text-sm text-foreground/90 font-medium">
                  {app.supportedLanguages?.join(', ') || 'Bahasa Indonesia, English (US)'}
                </p>
              </div>

              {/* Developer Info */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Pengembang
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span>{app.developer}</span>
                  <span title="Verified Creator">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  </span>
                </div>
              </div>

              {/* Useful Links */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Tautan
                </span>
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => toast.info('Ketentuan Layanan Anticeil Community Standard')}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ketentuan Layanan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Kebijakan Privasi & Keamanan Data')}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Kebijakan Privasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Pusat Bantuan & Komunitas')}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Pusat Bantuan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
