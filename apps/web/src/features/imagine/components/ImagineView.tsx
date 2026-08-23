'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Palette,
  Ratio,
  Film,
  Music,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@chatbyok/core';

type MediaMode = 'image' | 'video' | 'audio';

export function ImagineView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ti = t.imagine;

  const [mediaMode, setMediaMode] = useState<MediaMode>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [isGenerating, setIsGenerating] = useState(false);

  const mediaModes: { id: MediaMode; label: string; icon: React.ReactNode }[] = [
    { id: 'image', label: language === 'id' ? 'Gambar' : 'Image', icon: <ImageIcon size={14} /> },
    { id: 'video', label: language === 'id' ? 'Video' : 'Video', icon: <Film size={14} /> },
    { id: 'audio', label: language === 'id' ? 'Audio' : 'Audio', icon: <Music size={14} /> },
  ];

  const imageModels = [
    { id: 'flux', name: 'FLUX.1 Schnell (Gratis/Client)', provider: 'Pollinations AI' },
    { id: 'imagen3', name: 'Google Imagen 3 (Gemini Key)', provider: 'Gemini BYOK' },
    { id: 'dalle3', name: 'DALL-E 3 (OpenAI Key)', provider: 'OpenAI BYOK' },
    { id: 'sdxl', name: 'Stable Diffusion XL', provider: 'Stability AI' },
    { id: 'flux-dev', name: 'FLUX.1 Dev (8K Ultra)', provider: 'Black Forest Labs' },
  ];

  const videoModels = [
    { id: 'luma', name: 'Luma Ray 2 (Client Simulation)', provider: 'Dream Machine' },
    { id: 'sora', name: 'Sora (OpenAI Key)', provider: 'OpenAI BYOK' },
    { id: 'kling', name: 'Kling v1.6', provider: 'Kuaishou AI' },
  ];

  const audioModels = [
    { id: 'elevenlabs', name: 'ElevenLabs Turbo (Key)', provider: 'ElevenLabs BYOK' },
    { id: 'suno', name: 'Suno v4', provider: 'Suno AI' },
    { id: 'udio', name: 'Udio', provider: 'Udio AI' },
  ];

  const activeModels = mediaMode === 'image' ? imageModels : mediaMode === 'video' ? videoModels : audioModels;

  const [generatedImages, setGeneratedImages] = useState<
    Array<{ id: string; url: string; prompt: string; style: string; ratio: string; createdAt: string }>
  >([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Neon futuristic cyberpunk metropolis glowing in rain with volumetric lights 8K',
      style: 'Cyberpunk',
      ratio: '16:9',
      createdAt: 'Just now',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
      prompt: 'Minimalist 3D glassmorphic geometric crystal orb floating on warm beige background',
      style: '3D Render',
      ratio: '1:1',
      createdAt: '2 mins ago',
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const styles = ['Photorealistic', 'Anime / Manga', 'Cyberpunk', '3D Render', 'Cinematic', 'Oil Painting', 'Pixel Art'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const encodedPrompt = encodeURIComponent(`${prompt}, ${selectedStyle} style, highly detailed, masterwork`);
    const width = selectedRatio === '16:9' ? 1280 : selectedRatio === '9:16' ? 720 : 1024;
    const height = selectedRatio === '16:9' ? 720 : selectedRatio === '9:16' ? 1280 : 1024;
    const modelParam = selectedModel === 'dalle3' ? 'flux' : selectedModel === 'imagen3' ? 'flux-realism' : selectedModel;
    const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${modelParam}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    setTimeout(() => {
      setGeneratedImages((prev) => [
        {
          id: String(Date.now()),
          url: directUrl,
          prompt: prompt.trim(),
          style: selectedStyle,
          ratio: selectedRatio,
          createdAt: 'Just now',
        },
        ...prev,
      ]);
      setIsGenerating(false);
      setPrompt('');
    }, 1200);
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper" style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🎨</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {ti.title}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {ti.subtitle}
          </p>
        </div>

        {/* ── Media Mode Tab Switcher ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '4px',
            width: 'fit-content',
          }}
        >
          {mediaModes.map((mode) => {
            const active = mediaMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setMediaMode(mode.id);
                  setSelectedModel(
                    mode.id === 'image' ? 'flux' : mode.id === 'video' ? 'luma' : 'suno'
                  );
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Prompt Card ── */}
        <form
          onSubmit={handleGenerate}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '14px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Textarea */}
          <div style={{ padding: '16px 18px 12px 18px' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mediaMode === 'image'
                  ? ti.promptPlaceholder
                  : mediaMode === 'video'
                  ? (language === 'id'
                      ? 'Jelaskan video yang ingin Anda buat secara detail (contoh: Drone terbang di atas hutan hujan tropis, 4K sinematik)...'
                      : 'Describe the video you want to generate in detail (e.g. Drone flying over tropical rainforest, 4K cinematic)...')
                  : (language === 'id'
                      ? 'Jelaskan audio/musik yang ingin Anda buat (contoh: Musik lofi santai untuk belajar dengan suara rintik hujan)...'
                      : 'Describe the audio/music you want to generate (e.g. Chill lofi beats for study with soft rain sounds)...')
              }
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Controls Row (Model, Style, Aspect Ratio) */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              background: 'var(--bg-main)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Model Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} color="#A25DDC" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Model:
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {activeModels.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Select (Image only) */}
              {mediaMode === 'image' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {ti.style}:
                  </span>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {styles.map((s) => (
                      <option key={s} value={s} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ratio Selector (Image and Video) */}
              {(mediaMode === 'image' || mediaMode === 'video') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ratio size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {ti.aspectRatio}:
                  </span>
                  <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-subtle)', padding: '2px', borderRadius: '6px' }}>
                    {ratios.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRatio(r)}
                        style={{
                          border: 'none',
                          background: selectedRatio === r ? 'var(--brand-primary)' : 'transparent',
                          color: selectedRatio === r ? '#FFFFFF' : 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Row with Right-Aligned Button */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              background: 'var(--bg-surface)',
            }}
          >
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-reasoning))',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
                boxShadow: '0 2px 10px rgba(0, 115, 234, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{ti.generating}</span>
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  <span>
                    {mediaMode === 'image'
                      ? ti.generate
                      : mediaMode === 'video'
                      ? (language === 'id' ? 'Hasilkan Video' : 'Generate Video')
                      : (language === 'id' ? 'Hasilkan Audio' : 'Generate Audio')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Gallery / Feed Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={16} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {ti.recentGenerations}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {generatedImages.length}
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: 'var(--accent-success)', fontWeight: 600 }}>
            {ti.freeBadge}
          </span>
        </div>

        {/* Image Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          {generatedImages.map((img) => (
            <div
              key={img.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg, 12px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Image Preview Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: img.ratio.replace(':', '/'),
                  background: 'var(--bg-main)',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.prompt}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                {/* Style & Ratio Floating Tags */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    display: 'flex',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {img.style}
                  </span>
                  <span
                    style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {img.ratio}
                  </span>
                </div>
              </div>

              {/* Card Footer Info & Actions */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={img.prompt}
                >
                  {img.prompt}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {img.createdAt}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(img.id, img.prompt)}
                      title={ti.copyPrompt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: copiedId === img.id ? 'var(--accent-success)' : 'var(--text-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedId === img.id ? ti.copied : ti.copyPrompt}</span>
                    </button>

                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`imagine-${img.id}.jpg`}
                      title={ti.download}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={12} />
                      <span>{ti.download}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
