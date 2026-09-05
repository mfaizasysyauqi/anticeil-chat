'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  Wand2,
  Sparkles,
  Ratio,
  Clock,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  Trash2,
  Pin,
  ExternalLink,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImageStore } from '../../image/store/useImageStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { getTranslation } from '@anticeil/core';
import { VideoModelSelectorModal, VIDEO_PROVIDERS } from './VideoModelSelectorModal';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { DropdownSelect } from '../../../shared/components/DropdownSelect';
import { MediaDetailModal } from '../../../shared/components/MediaDetailModal';
import { MediaCardMenu } from '../../image/components/ImageView';
import { useWorkspaceStore } from '../../storage/store/useWorkspaceStore';
import { generateCinematicVideo } from '../utils/videoGenerator';

export function VideoView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('5s');
  const [selectedModel, setSelectedModel] = useState('luma');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];
  const durations = ['3s', '5s', '10s'];

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  const addImageItem = useImageStore((s) => s.addItem);
  const removeImageItem = useImageStore((s) => s.removeItem);
  const toggleImagePin = useImageStore((s) => s.togglePin);
  const moveImageToCollection = useImageStore((s) => s.moveToCollection);
  const hydrateFromApi = useImageStore((s) => s.hydrateFromApi);
  const imageItems = useImageStore((s) => s.items);
  const imageCollections = useWorkspaceStore((s) => s.imageCollections);

  const generatedVideos = imageItems
    .filter((i) => i.type === 'video')
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  // Load history from Supabase once on mount
  useEffect(() => {
    if (session?.access_token) {
      hydrateFromApi(session.access_token);
    }
  }, [session?.access_token]);

  // Find current provider and model for display name
  const currentProvider = VIDEO_PROVIDERS.find((p) =>
    p.models.some((m) => m.id === selectedModel)
  );
  const currentModelInfo = currentProvider?.models.find((m) => m.id === selectedModel);
  const modelDisplayName = currentModelInfo?.name || selectedModel;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Storage capacity check (approx 4MB for video)
    const estimatedBytes = 4 * 1024 * 1024;
    if (!canFit(estimatedBytes)) {
      alert(
        language === 'id'
          ? 'Kapasitas penyimpanan Anda tidak mencukupi untuk render video baru.'
          : 'Not enough storage space in your quota.'
      );
      return;
    }

    // Credit check & deduction for Anticeil Free video models
    const isAnticeilFree = currentProvider?.id === 'anticeil' || currentModelInfo?.keyType === 'free';
    if (isAnticeilFree) {
      const allowed = useCreditStore.getState().deductCredits('video', 'anticeil');
      if (!allowed) return;
    }

    setIsGenerating(true);
    try {
      const durSec = parseInt(selectedDuration, 10) || 5;
      const { url: directVideoUrl, blob } = await generateCinematicVideo(
        prompt.trim(),
        selectedRatio,
        durSec,
        currentModelInfo?.name || 'Luma Ray 2'
      );

      let finalUrl = directVideoUrl;

      // Attempt to persist to R2 & Supabase
      try {
        const res = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'video',
            prompt: prompt.trim(),
            mediaUrl: directVideoUrl,
            metadata: {
              ratio: selectedRatio,
              duration: selectedDuration,
              model: currentModelInfo?.name || 'Luma Ray 2',
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Video] Failed to upload video to R2, using direct url:', err);
      }

      const nowIso = new Date().toISOString();
      const newItem = {
        id: String(Date.now()),
        type: 'video' as const,
        url: finalUrl,
        prompt: prompt.trim(),
        ratio: selectedRatio,
        duration: selectedDuration,
        model: currentModelInfo?.name || 'Luma Ray 2',
        createdAt: nowIso,
        createdAtLabel: 'Just now',
        isPinned: false,
        collectionId: null,
      };
      addImageItem(newItem);
      setSelectedMediaItem(newItem);

      addUsage(estimatedBytes, 'images');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }

      setPrompt('');
    } catch (err: any) {
      console.error('[Video Generation Error]', err);
      alert(language === 'id' ? 'Gagal membuat video. Silakan coba lagi.' : 'Failed to generate video.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (pText: string, id: string) => {
    navigator.clipboard.writeText(pText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadVideo = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil-video-${id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const videoStarters = [
    {
      category: 'Drone Shot',
      icon: Film,
      color: '#fb7185',
      badgeBg: 'rgba(251, 113, 133, 0.12)',
      title: language === 'id' ? 'FPV Drone Meluncur di Air Terjun' : 'Cinematic FPV Waterfall Dive',
      prompt:
        language === 'id'
          ? 'Pengambilan gambar video FPV drone sinematik 4K meluncur cepat menyusuri tebing air terjun tropis dengan kabut air bercahaya matahari terbit.'
          : 'Cinematic 4K FPV drone dive down a lush tropical waterfall canyon with morning mist and golden sunbeams.',
      ratio: '16:9',
      duration: '5s',
    },
    {
      category: 'Slow Motion',
      icon: Clock,
      color: '#0073EA',
      badgeBg: 'rgba(0, 115, 234, 0.12)',
      title: language === 'id' ? 'Percikan Kopi Makro Slow Motion' : 'Slow Motion Macro Coffee Splash',
      prompt:
        language === 'id'
          ? 'Video slow motion 1000fps tetesan kopi espresso jatuh ke dalam cangkir keramik, menciptakan gelombang tetesan sempurna dengan pencahayaan kafe warm.'
          : '1000fps slow-motion macro shot of an espresso droplet splashing into a ceramic cup with warm cafe ambient lighting.',
      ratio: '1:1',
      duration: '5s',
    },
    {
      category: 'Sci-Fi / Space',
      icon: Sparkles,
      color: '#A25DDC',
      badgeBg: 'rgba(162, 93, 220, 0.12)',
      title: language === 'id' ? 'Pesawat Luar Angkasa Masuk Nebula' : 'Starship Entering Cosmic Nebula',
      prompt:
        language === 'id'
          ? 'Pesawat penjelajah luar angkasa futuristik meluncur perlahan menembus nebula kosmik berwarna ungu dan emas dengan partikel debu bintang bercahaya.'
          : 'Futuristic exploration starship smoothly cruising through a vibrant purple and gold cosmic nebula with glittering space dust.',
      ratio: '16:9',
      duration: '10s',
    },
    {
      category: 'Cinematic',
      icon: Wand2,
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      title: language === 'id' ? 'Hujan Neon Cyberpunk Tokyo' : 'Neon Tokyo Night Drive',
      prompt:
        language === 'id'
          ? 'Tampak sudut rendah kamera mobil retro-futuristik melintasi jalanan Tokyo yang basah oleh hujan, bayangan neon merah dan biru berkilau di aspal.'
          : 'Low-angle cinematic car driving through rainy Tokyo streets at night, red and cyan neon reflections glistening on wet asphalt.',
      ratio: '16:9',
      duration: '5s',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <VideoModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        selectedModelId={selectedModel}
        onSelectModel={(id) => setSelectedModel(id)}
      />

      {/* ── Scrollable Upper Area (Hero + Starters) ── */}
      <div className="page-scroll-container" style={{ flex: 1, overflowY: 'auto', justifyContent: 'center' }}>
        <div className="page-content-wrapper" style={{ gap: 'var(--space-xl)', padding: 'var(--space-2xl) 0' }}>
          {/* Minimalist Editorial Hero Greeting */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#fb7185',
                }}
              />
              <span>
                {language === 'id'
                  ? '100% Neural Generation • Multi-Model Video Studio'
                  : '100% Neural Generation • Multi-Model Video Studio'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-sm)',
              }}
            >
              {language === 'id' ? 'Where should we begin?' : 'Where should we begin?'}
            </h1>
            <p
              style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {language === 'id'
                ? 'Buat video sinematik berkualitas tinggi dari prompt teks dengan AI generatif.'
                : 'Generate high-resolution video art, cinematic clips, and motion content from text.'}
            </p>
          </div>

          {/* Curated Bento Starter Cards (2x2 grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-sm)',
              width: '100%',
            }}
          >
            {videoStarters.map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(card.prompt);
                    setSelectedRatio(card.ratio);
                    setSelectedDuration(card.duration);
                  }}
                  className="hover-card"
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-sm)',
                    boxShadow: 'var(--inner-glow)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: card.color,
                        background: card.badgeBg,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Icon size={12} color={card.color} />
                      {card.category}
                    </span>
                    <ArrowUpRight size={13} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {card.title}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {card.prompt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Docked Bottom Prompt Bar ── */}
      <MediaPromptForm
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleGenerate}
        isGenerating={isGenerating}
        placeholder={
          language === 'id'
            ? 'Deskripsikan video yang ingin dibuat...'
            : 'Describe the video you want to generate...'
        }
        modelDisplayName={modelDisplayName}
        onModelSelectorOpen={() => {
          if (!user) {
            openAuthModal('login');
            return;
          }
          setIsModelSelectorOpen(true);
        }}
        language={language as 'en' | 'id'}
        brandColor="#fb7185"
        additionalControls={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Ratio Dropdown Selector */}
            <DropdownSelect
              value={selectedRatio}
              options={ratios}
              onChange={setSelectedRatio}
              icon={<Ratio size={13} color="var(--text-muted)" />}
              brandColor="#fb7185"
            />

            {/* Distinct Vertical Separator */}
            <div
              style={{
                width: '1px',
                height: '16px',
                backgroundColor: 'var(--border-subtle)',
                margin: '0 2px',
                flexShrink: 0,
              }}
            />

            {/* Duration Dropdown Selector */}
            <DropdownSelect
              value={selectedDuration}
              options={durations}
              onChange={setSelectedDuration}
              icon={<Clock size={13} color="var(--text-muted)" />}
              brandColor="#fb7185"
            />
          </div>
        }
      />

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedMediaItem}
        onClose={() => setSelectedMediaItem(null)}
        onDelete={(id) => { removeImageItem(id); setSelectedMediaItem(null); }}
        language={language as 'en' | 'id'}
      />
    </div>
  );
}
