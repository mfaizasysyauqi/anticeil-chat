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
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImageStore } from '../../image/store/useImageStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { getTranslation } from '@anticeil/core';
import { VideoModelSelectorModal, VIDEO_PROVIDERS } from './VideoModelSelectorModal';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { MediaControlButton } from '../../../shared/components/MediaControlButton';
import { MediaDetailModal } from '../../../shared/components/MediaDetailModal';
import { MediaCardMenu } from '../../image/components/ImageView';
import { useWorkspaceStore } from '../../storage/store/useWorkspaceStore';
import { generateCinematicVideo } from '../utils/videoGenerator';

export function VideoView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const session = useAuthStore((s) => s.session);

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Storage capacity check (approx 4MB for video)
    const estimatedBytes = 4 * 1024 * 1024;
    if (!canFit(estimatedBytes)) {
      alert(
        language === 'id'
          ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk render video baru.'
          : 'Not enough storage space in your 1 GB quota.'
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
      addImageItem({
        id: String(Date.now()),
        type: 'video',
        url: finalUrl,
        prompt: prompt.trim(),
        ratio: selectedRatio,
        duration: selectedDuration,
        model: currentModelInfo?.name || 'Luma Ray 2',
        createdAt: nowIso,
        createdAtLabel: 'Just now',
      });

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

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🎬</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {language === 'id' ? 'Video — Studio AI Visual' : 'Video — AI Visual Studio'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {language === 'id'
              ? 'Buat video berkualitas tinggi dari deskripsi teks dengan AI generatif — gratis tanpa API key.'
              : 'Generate high-resolution video art, concept designs, and motion content directly from your client.'}
          </p>
        </div>

        {/* ── Prompt Card (Chat-style elegant floating input) ── */}
        <VideoModelSelectorModal
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          selectedModelId={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
        />

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
          onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
          language={language}
          brandColor="#fb7185"
          additionalControls={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Ratio Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ratio size={13} color="var(--text-muted)" style={{ marginRight: '2px', flexShrink: 0 }} />
                {ratios.map((ratio) => (
                  <MediaControlButton
                    key={ratio}
                    label={ratio}
                    isSelected={selectedRatio === ratio}
                    onClick={() => setSelectedRatio(ratio)}
                    brandColor="#fb7185"
                  />
                ))}
              </div>

              {/* Distinct Vertical Separator */}
              <div
                style={{
                  width: '1px',
                  height: '18px',
                  backgroundColor: 'var(--border-strong, rgba(0,0,0,0.15))',
                  margin: '0 2px',
                  flexShrink: 0,
                }}
              />

              {/* Duration Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="var(--text-muted)" style={{ marginRight: '2px', flexShrink: 0 }} />
                {durations.map((dur) => (
                  <MediaControlButton
                    key={dur}
                    label={dur}
                    isSelected={selectedDuration === dur}
                    onClick={() => setSelectedDuration(dur)}
                    brandColor="#fb7185"
                  />
                ))}
              </div>
            </div>
          }
        />

        {/* ── Recent Generations Section ── */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Film size={18} color="#fb7185" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              {language === 'id' ? 'Generasi Video Terbaru' : 'Recent Video Generations'}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              {generatedVideos.length}
            </span>
          </div>

          {/* Video Grid or Empty State */}
          {generatedVideos.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {generatedVideos.map((item) => {
                const isPlaying = playingVideoId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1))',
                    }}
                  >
                    {/* Video Player */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: item.ratio === '9:16' ? '9/16' : item.ratio === '1:1' ? '1/1' : '16/9',
                        backgroundColor: '#0a0a0c',
                        overflow: 'hidden',
                      }}
                    >
                      <video
                        id={`video-${item.id}`}
                        src={item.url}
                        loop
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onPlay={() => setPlayingVideoId(item.id)}
                        onPause={() => {
                          if (playingVideoId === item.id) setPlayingVideoId(null);
                        }}
                      />

                      {/* Play/Pause Overlay Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const vid = document.getElementById(`video-${item.id}`) as HTMLVideoElement;
                          if (vid) {
                            if (vid.paused) {
                              vid.play();
                              setPlayingVideoId(item.id);
                            } else {
                              vid.pause();
                              setPlayingVideoId(null);
                            }
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: isPlaying ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: isPlaying ? 0 : 1,
                          transition: 'opacity 0.2s ease, transform 0.15s ease',
                        }}
                        className="play-overlay-btn"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (isPlaying) e.currentTarget.style.opacity = '0';
                        }}
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                      </button>

                      {/* Badges on Video */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {item.duration && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: 'rgba(0,0,0,0.65)',
                              backdropFilter: 'blur(6px)',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {item.duration}
                          </span>
                        )}
                        {item.ratio && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: 'rgba(0,0,0,0.65)',
                              backdropFilter: 'blur(6px)',
                              color: '#fb7185',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              border: '1px solid rgba(251,113,133,0.3)',
                            }}
                          >
                            {item.ratio}
                          </span>
                        )}
                      </div>

                      {/* Pin Button */}
                      <button
                        type="button"
                        onClick={() => toggleImagePin(item.id)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: item.isPinned ? '#fb7185' : 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(6px)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={item.isPinned ? 'Lepas Sematan' : 'Sematkan Video'}
                      >
                        <Pin size={12} style={{ transform: item.isPinned ? 'rotate(45deg)' : 'none' }} />
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <p
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-primary)',
                          margin: '0 0 10px 0',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                        title={item.prompt}
                        onClick={() => setSelectedMediaItem(item)}
                      >
                        {item.prompt}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.model || 'Luma Ray 2'}
                        </span>

                        <MediaCardMenu
                          id={item.id}
                          isPinned={item.isPinned}
                          prompt={item.prompt}
                          url={item.url}
                          type="video"
                          collectionId={item.collectionId || null}
                          collections={imageCollections}
                          language={language}
                          onTogglePin={() => toggleImagePin(item.id)}
                          onMoveToCollection={(colId) => moveImageToCollection(item.id, colId)}
                          onCopyPrompt={() => handleCopyPrompt(item.prompt, item.id)}
                          onDownload={() => handleDownloadVideo(item.url, item.id)}
                          onDelete={() => removeImageItem(item.id)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px dashed var(--border-subtle)',
                background: 'var(--bg-card)',
              }}
            >
              <Film size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                {language === 'id' ? 'Belum ada video yang dibuat' : 'No videos generated yet'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {language === 'id' ? 'Ketik prompt di atas untuk memulai generasi video' : 'Type a prompt above to start generating videos'}
              </p>
            </div>
          )}
        </div>
      </div>

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
