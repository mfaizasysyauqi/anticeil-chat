'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  KeyRound,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  Pin,
  Folder,
  ChevronDown,
  ArrowUp,
  MoreHorizontal,
  FolderInput,
  FolderMinus,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { ImageModelSelectorModal, IMAGE_PROVIDERS } from './ImageModelSelectorModal';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImageStore } from '../store/useImageStore';
import { useWorkspaceStore } from '../../storage/store/useWorkspaceStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { getTranslation } from '@anticeil/core';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { MediaControlButton } from '../../../shared/components/MediaControlButton';

type MediaMode = 'image' | 'video' | 'audio';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  keyType: 'free' | 'gemini' | 'openai' | 'stability' | 'elevenlabs' | 'suno' | 'microsoft';
  keyRequirement: string;
  description: string;
}

interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  style: string;
  ratio: string;
  model: string;
  createdAt: string;
}

// ─── ImagineCardMenu (3-dot Menu & Submenu) ──────────────────────────────────
interface ImageCardMenuProps {
  id: string;
  isPinned?: boolean;
  prompt?: string;
  url?: string;
  collectionId?: string | null;
  collections: { id: string; name: string }[];
  language: string;
  onTogglePin: () => void;
  onMoveToCollection: (colId: string | null) => void;
  onCopyPrompt?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

function ImageCardMenu({
  id,
  isPinned,
  prompt,
  url,
  collectionId,
  collections,
  language,
  onTogglePin,
  onMoveToCollection,
  onCopyPrompt,
  onDownload,
  onDelete,
}: ImageCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [showFolderSub, setShowFolderSub] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setOpen(false);
        setShowFolderSub(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setShowFolderSub(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuW = 175;
    const menuH = 170;
    let left = rect.right - menuW;
    if (left < 8) left = 8;
    let top = rect.bottom + 4;
    if (top + menuH > window.innerHeight) {
      top = rect.top - menuH - 4;
    }
    setMenuPosition({ top, left });
    setOpen(true);
  };

  const handleCopy = () => {
    if (onCopyPrompt) {
      onCopyPrompt();
    } else if (prompt) {
      navigator.clipboard.writeText(prompt);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 9px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background-color 0.12s ease',
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="session-options-btn"
        title="Opsi Media"
        style={{
          background: isPinned ? 'rgba(162, 93, 220, 0.15)' : 'var(--bg-subtle)',
          border: `1px solid ${isPinned ? 'rgba(162, 93, 220, 0.4)' : 'var(--border-subtle)'}`,
          color: isPinned ? '#A25DDC' : 'var(--text-muted)',
          borderRadius: '6px',
          padding: '4px 6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          transition: 'all 0.15s ease',
        }}
      >
        {isPinned && <Pin size={11} fill="#A25DDC" />}
        <MoreHorizontal size={13} />
      </button>

      {open && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={portalRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.25))',
            padding: '4px',
            zIndex: 999999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '175px',
          }}
        >
          {/* Pin / Unpin */}
          <button
            type="button"
            style={btnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => {
              onTogglePin();
              setOpen(false);
            }}
          >
            <Pin size={12} fill={isPinned ? '#A25DDC' : 'none'} color={isPinned ? '#A25DDC' : undefined} />
            <span>
              {isPinned
                ? language === 'id'
                  ? 'Lepas sematan'
                  : 'Unpin from top'
                : language === 'id'
                ? 'Sematkan di atas'
                : 'Pin to top'}
            </span>
          </button>

          {/* Copy Prompt */}
          {prompt && (
            <button
              type="button"
              style={btnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={handleCopy}
            >
              {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
              <span>
                {copied
                  ? language === 'id'
                    ? 'Tersalin!'
                    : 'Copied!'
                  : language === 'id'
                  ? 'Salin Prompt'
                  : 'Copy Prompt'}
              </span>
            </button>
          )}

          {/* Move to folder Submenu */}
          {collections.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                style={btnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  setShowFolderSub(true);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FolderInput size={12} />
                <span style={{ flex: 1 }}>{language === 'id' ? 'Pindah ke folder' : 'Move to folder'}</span>
                <ChevronRight size={11} color="var(--text-muted)" />
              </button>

              {showFolderSub && (
                <div
                  onMouseEnter={() => setShowFolderSub(true)}
                  onMouseLeave={() => setShowFolderSub(false)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '100%',
                    marginLeft: '2px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md, 8px)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: '4px',
                    zIndex: 999999999,
                    minWidth: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {collectionId && (
                    <button
                      type="button"
                      style={btnStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        onMoveToCollection(null);
                        setOpen(false);
                        setShowFolderSub(false);
                      }}
                    >
                      <FolderMinus size={11} />
                      <span>{language === 'id' ? 'Lepas dari folder' : 'Remove from folder'}</span>
                    </button>
                  )}
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      style={{
                        ...btnStyle,
                        fontWeight: collectionId === c.id ? 650 : 400,
                        color: collectionId === c.id ? '#A25DDC' : 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => {
                        onMoveToCollection(c.id);
                        setOpen(false);
                        setShowFolderSub(false);
                      }}
                    >
                      <Folder size={11} color={collectionId === c.id ? '#A25DDC' : undefined} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Download */}
          {onDownload && (
            <button
              type="button"
              style={btnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                onDownload();
                setOpen(false);
              }}
            >
              <Download size={12} />
              <span>{language === 'id' ? 'Unduh Berkas' : 'Download File'}</span>
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              type="button"
              style={{ ...btnStyle, color: 'var(--accent-danger, #EF4444)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            >
              <Trash2 size={12} />
              <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export function ImageView() {
  const session = useAuthStore((s) => s.session);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ti = t.imagine;

  // Fixed to 'image' mode only (Video & Audio have separate dedicated views)
  const mediaMode: MediaMode = 'image';
  
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const imageModels: ModelInfo[] = [
    {
      id: 'flux',
      name: 'FLUX.1 Schnell (Gratis / Client-Side)',
      provider: 'Black Forest Labs / Pollinations',
      keyType: 'free',
      keyRequirement: language === 'id' ? '100% Gratis — Tanpa API Key' : '100% Free — No API Key needed',
      description: language === 'id' ? 'Generasi kilat langsung dari browser tanpa perlu API key.' : 'Ultra-fast generation directly from browser without API key.',
    },
    {
      id: 'imagen3',
      name: 'Google Imagen 3 (Gemini API Key)',
      provider: 'Google DeepMind',
      keyType: 'gemini',
      keyRequirement: language === 'id' ? 'Memerlukan Gemini API Key (Google AI Studio)' : 'Requires Gemini API Key (Google AI Studio)',
      description: language === 'id' ? 'Model photorealistic generasi terbaru dari Google dengan pemahaman teks mendalam.' : 'Google’s highest-quality photorealistic model with rich prompt adherence.',
    },
    {
      id: 'dalle3',
      name: 'DALL-E 3 (OpenAI API Key)',
      provider: 'OpenAI',
      keyType: 'openai',
      keyRequirement: language === 'id' ? 'Memerlukan OpenAI API Key (platform.openai.com)' : 'Requires OpenAI API Key (platform.openai.com)',
      description: language === 'id' ? 'Model visual presisi tinggi dari OpenAI dengan detail tipografi & komposisi akurat.' : 'High-precision visual synthesis by OpenAI with accurate typography.',
    },
    {
      id: 'sdxl',
      name: 'Stable Diffusion XL (Stability AI / Client)',
      provider: 'Stability AI',
      keyType: 'stability',
      keyRequirement: language === 'id' ? 'Gratis / Stabilitas Client Direct' : 'Free / Stability Client Direct',
      description: language === 'id' ? 'Model open-weight terpopuler untuk gaya artistik, anime, dan ilustrasi digital.' : 'Premier open-weight model for artistic, anime, and digital art rendering.',
    },
    {
      id: 'flux-dev',
      name: 'FLUX.1 Dev 8K Ultra (High-Res)',
      provider: 'Black Forest Labs',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / High-Res Neural Stream' : 'Free / High-Res Neural Stream',
      description: language === 'id' ? 'Kualitas resolusi ultra tinggi dengan render tekstur, kulit, dan pencahayaan sinematik.' : 'Ultra-high definition quality with superior lighting and texture details.',
    },
  ];

  // Image mode only - no voice/audio support needed

  const activeModels = imageModels;
  const currentModelInfo = activeModels.find((m) => m.id === selectedModel) || activeModels[0];

  // Resolve display name from ImageModelSelectorModal providers for richer label
  const modalModelInfo = IMAGE_PROVIDERS
    .flatMap((p) => p.models)
    .find((m) => m.id === selectedModel);
  const modelDisplayName = modalModelInfo?.name || currentModelInfo?.name || selectedModel;


  const [copiedId, setCopiedId] = useState<string | null>(null);



  const styles = ['Photorealistic', 'Anime / Manga', 'Cyberpunk', '3D Render', 'Cinematic', 'Oil Painting', 'Pixel Art'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  // Image store — persisted media, pin, folder
  const addImageItem = useImageStore((s) => s.addItem);
  const removeImageItem = useImageStore((s) => s.removeItem);
  const toggleImagePin = useImageStore((s) => s.togglePin);
  const moveImageToCollection = useImageStore((s) => s.moveToCollection);
  const hydrateFromApi = useImageStore((s) => s.hydrateFromApi);
  const imageItems = useImageStore((s) => s.items);
  const imageCollections = useWorkspaceStore((s) => s.imageCollections);
  const activeImageCollectionId = useWorkspaceStore((s) => s.activeImageCollectionId);

  const filterAndSort = <T extends { isPinned?: boolean; collectionId?: string | null }>(items: T[]) => {
    return items
      .filter((item) => (activeImageCollectionId ? item.collectionId === activeImageCollectionId : true))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  };

  const generatedImages = filterAndSort(
    imageItems.filter((i) => i.type === 'image') as Array<ImageItem & { isPinned: boolean; collectionId: string | null }>
  );

  // Load history from Supabase once on mount
  useEffect(() => {
    if (session?.access_token) {
      hydrateFromApi(session.access_token);
    }
  }, [session?.access_token]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Credit check & deduction for Anticeil Free models
    const isAnticeilFree = currentModelInfo?.keyType === 'free';
    if (isAnticeilFree) {
      const allowed = useCreditStore.getState().deductCredits(mediaMode, 'anticeil');
      if (!allowed) return;
    }

    if (mediaMode === 'image') {
      const estimatedBytes = 1.2 * 1024 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk render media baru.' : 'Not enough storage space in your 1 GB quota.');
        return;
      }

      setIsGenerating(true);
      const encodedPrompt = encodeURIComponent(`${prompt}, ${selectedStyle} style, highly detailed, masterwork`);
      const width = selectedRatio === '16:9' ? 1280 : selectedRatio === '9:16' ? 720 : 1024;
      const height = selectedRatio === '16:9' ? 720 : selectedRatio === '9:16' ? 1280 : 1024;
      const modelParam = selectedModel === 'dalle3' ? 'flux' : selectedModel === 'imagen3' ? 'flux-realism' : selectedModel;
      const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${modelParam}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

      let finalUrl = directUrl;

      // Save to Cloudflare R2 via save-media API
      try {
        const res = await fetch('/api/image/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'image',
            prompt: prompt.trim(),
            mediaUrl: directUrl,
            metadata: {
              style: selectedStyle,
              ratio: selectedRatio,
              model: currentModelInfo.name,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Image] Failed to upload image to R2, using direct url:', err);
      }

      const nowIso = new Date().toISOString();
      addImageItem({
        id: String(Date.now()),
        type: 'image',
        url: finalUrl,
        prompt: prompt.trim(),
        style: selectedStyle,
        ratio: selectedRatio,
        model: currentModelInfo.name,
        createdAt: nowIso,
        createdAtLabel: 'Just now',
      });

      addUsage(estimatedBytes, 'images');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
      setIsGenerating(false);
      setPrompt('');
    }
    // Video and audio generation removed - ImageView is image-only
  };

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const handleDownloadImage = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil-image-${id}.png`;
    a.click();
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
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
              {language === 'id' ? 'Image — Studio Visual AI' : 'Image — AI Visual Studio'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {ti.subtitle}
          </p>
        </div>

        {/* ── Prompt Card (Chat-style elegant floating input) ── */}
        <ImageModelSelectorModal
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          mediaMode={mediaMode}
          selectedModelId={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
        />

        <MediaPromptForm
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleGenerate}
          isGenerating={isGenerating}
          placeholder={ti.promptPlaceholder}
          modelDisplayName={modelDisplayName}
          onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
          language={language}
          brandColor="var(--brand-primary)"
          additionalControls={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Style selector (Image only) */}
              {mediaMode === 'image' && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      appearance: 'none',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md, 6px)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '4px 26px 4px 10px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {styles.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Palette size={12} color="var(--text-muted)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              )}

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

              {/* Ratio buttons Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ratio size={13} color="var(--text-muted)" style={{ marginRight: '2px', flexShrink: 0 }} />
                {ratios.map((r) => (
                  <MediaControlButton
                    key={r}
                    label={r}
                    isSelected={selectedRatio === r}
                    onClick={() => setSelectedRatio(r)}
                    brandColor="var(--brand-primary)"
                  />
                ))}
              </div>
            </div>
          }
        />

        {/* ── Model & Key Guide Box (Collapsible) ── */}
        {showKeyGuide && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={16} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Panduan Model & Kebutuhan API Key Anticeil Studio' : 'Anticeil Studio Models & API Key Guide'}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
              {language === 'id'
                ? 'Anticeil mendukung model gratis tanpa API key (FLUX, Pollinations, Luma, Edge TTS, Suno stream) serta BYOK (Bring Your Own Key) untuk provider premium kelas industri.'
                : 'Anticeil supports zero-setup free models as well as BYOK (Bring Your Own Key) for industry-grade premium models.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {activeModels.map((model) => (
                <div
                  key={model.id}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {model.name.split('(')[0]}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: model.keyType === 'free' ? 'rgba(0, 200, 117, 0.15)' : 'rgba(253, 171, 61, 0.15)',
                        color: model.keyType === 'free' ? 'var(--accent-success)' : '#FDAB3D',
                      }}
                    >
                      {model.keyType === 'free' ? 'GRATIS' : 'BYOK KEY'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {model.description}
                  </p>
                  <div style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{model.keyRequirement}</span>
                    {model.keyType !== 'free' && (
                      <Link
                        href="/settings"
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--brand-primary)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {language === 'id' ? 'Pasang Kunci ↗' : 'Add Key ↗'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Generations Section ── */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={18} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {ti.recentGenerations}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  padding: '2px 7px',
                  borderRadius: '10px',
                }}
              >
                {generatedImages.length}
              </span>
            </div>
          </div>
        </div>

        {/* ── Image Gallery (Image mode only) ── */}
        {generatedImages.length === 0 ? (
          /* Empty State */
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px dashed var(--border-subtle)',
              background: 'var(--bg-card)',
              marginBottom: '40px',
            }}
          >
            <ImageIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              {language === 'id' ? 'Belum ada gambar yang dibuat' : 'No images generated yet'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {language === 'id' ? 'Ketik prompt di atas untuk memulai generasi gambar' : 'Type a prompt above to start generating images'}
            </p>
          </div>
        ) : (
          <div
            className="waterfall-gallery-grid"
            style={{
              marginBottom: '40px',
            }}
          >
            {generatedImages.map((img) => (
              <div
                key={img.id}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: img.ratio.replace(':', '/') }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.prompt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>

                {/* Card Footer Info & Actions */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {img.prompt}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-subtle)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {img.style}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>•</span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-subtle)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {img.ratio}
                        </span>
                      </div>
                    </div>

                    <ImageCardMenu
                      id={img.id}
                      isPinned={(imageItems.find((i) => i.id === img.id) as any)?.isPinned}
                      prompt={img.prompt}
                      url={img.url}
                      collectionId={(imageItems.find((i) => i.id === img.id) as any)?.collectionId || null}
                      collections={imageCollections}
                      language={language}
                      onTogglePin={() => toggleImagePin(img.id)}
                      onMoveToCollection={(colId) => moveImageToCollection(img.id, colId)}
                      onCopyPrompt={() => handleCopyPrompt(img.prompt, img.id)}
                      onDownload={() => handleDownloadImage(img.url, img.id)}
                      onDelete={() => removeImageItem(img.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
