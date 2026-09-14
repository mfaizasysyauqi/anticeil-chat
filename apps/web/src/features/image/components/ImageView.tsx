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
  ArrowUpRight,
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
import { DropdownSelect } from '../../../shared/components/DropdownSelect';
import { MediaDetailModal } from '../../../shared/components/MediaDetailModal';
import { useMediaEditorStore } from '../../media/store/useMediaEditorStore';
import { MediaCanvasPanel } from '../../media/components/MediaCanvasPanel';

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
export interface MediaCardMenuProps {
  id: string;
  isPinned?: boolean;
  prompt: string;
  url: string;
  type?: 'image' | 'video' | 'audio';
  collectionId?: string | null;
  collections?: Array<{ id: string; name: string }>;
  language: string;
  onTogglePin?: () => void;
  onMoveToCollection?: (collectionId: string | null) => void;
  onCopyPrompt?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function MediaCardMenu({
  id,
  isPinned = false,
  prompt,
  url,
  type = 'image',
  collectionId,
  collections = [],
  language,
  onTogglePin = () => {},
  onMoveToCollection = () => {},
  onCopyPrompt,
  onDownload,
  onDelete,
}: MediaCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [showFolderSub, setShowFolderSub] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const accentColor = type === 'video' ? '#fb7185' : type === 'audio' ? '#60a5fa' : 'var(--rail-media-color)';

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
          background: isPinned ? `${accentColor}26` : 'var(--bg-subtle)',
          border: `1px solid ${isPinned ? `${accentColor}66` : 'var(--border-subtle)'}`,
          color: isPinned ? accentColor : 'var(--text-muted)',
          borderRadius: '6px',
          padding: '4px 6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          transition: 'all 0.15s ease',
        }}
      >
        {isPinned && <Pin size={11} fill={accentColor} color={accentColor} />}
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
            <Pin size={12} fill={isPinned ? accentColor : 'none'} color={isPinned ? accentColor : undefined} />
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
                    <span>{language === 'id' ? 'Keluarkan dari folder' : 'Remove from folder'}</span>
                  </button>
                )}
                {collections.length === 0 ? (
                  <div style={{ padding: '6px 8px', fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {language === 'id' ? 'Belum ada folder' : 'No folders'}
                  </div>
                ) : (
                  collections.map((c) => (
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
                  ))
                )}
              </div>
            )}
          </div>

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
              style={{
                ...btnStyle,
                color: 'var(--accent-danger, #ef4444)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            >
              <Trash2 size={12} color="#ef4444" />
              <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export const ImageCardMenu = MediaCardMenu;

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
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

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

  // Media detail modal state (gallery card clicks only — not auto-opened after generation)
  const [selectedMediaItem, setSelectedMediaItem] = useState<(typeof imageItems)[0] | null>(null);

  // Media editor store — used to show generated image in the shared canvas panel
  const {
    createProject,
    addRevision,
    activeProjectId,
    projects,
    isCanvasOpen,
    setIsCanvasOpen,
    viewMode,
  } = useMediaEditorStore();
  const activeProject = projects.find((p) => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);
  const activeRevision =
    activeProject?.revisions.find((r) => r.id === activeProject.activeRevisionId) ||
    activeProject?.revisions[activeProject.revisions.length - 1] ||
    null;
  const prevRevision =
    activeRevision && activeProject
      ? (activeProject.revisions[
          activeProject.revisions.findIndex((r) => r.id === activeRevision.id) - 1
        ] ?? null)
      : null;

  // Load history from Supabase once on mount
  useEffect(() => {
    if (session?.access_token) {
      hydrateFromApi(session.access_token);
    }
  }, [session?.access_token]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    // Credit check for Anticeil Free models (do not deduct if unable to afford)
    const isAnticeilFree = currentModelInfo?.keyType === 'free';
    if (isAnticeilFree) {
      const allowed = useCreditStore.getState().canAfford(mediaMode, 'anticeil');
      if (!allowed) {
        useCreditStore.getState().setLimitModalOpen(true, mediaMode);
        return;
      }
    }

    if (mediaMode === 'image') {
      const estimatedBytes = 1.2 * 1024 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan Anda tidak mencukupi untuk render media baru.' : 'Not enough storage space in your quota.');
        return;
      }

      let creditDeducted = false;
      setIsGenerating(true);

      try {
        if (isAnticeilFree) {
          useCreditStore.getState().deductCredits(mediaMode, 'anticeil');
          creditDeducted = true;
        }

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
        const newItem = {
          id: String(Date.now()),
          type: 'image' as const,
          url: finalUrl,
          prompt: prompt.trim(),
          style: selectedStyle,
          ratio: selectedRatio,
          model: currentModelInfo.name,
          createdAt: nowIso,
          createdAtLabel: 'Just now',
          isPinned: false,
          collectionId: null,
        };
        addImageItem(newItem);
        // Open canvas panel instead of modal
        if (activeProject && activeRevision) {
          addRevision(activeProject.id, {
            prompt: prompt.trim(),
            url: finalUrl,
            revisionInstruction: '',
            model: currentModelInfo.name,
            style: selectedStyle,
            ratio: selectedRatio,
            seed: 0,
            revisedFromId: activeRevision.id,
          });
        } else {
          createProject({
            prompt: prompt.trim(),
            url: finalUrl,
            model: currentModelInfo.name,
            style: selectedStyle,
            ratio: selectedRatio,
            seed: 0,
          });
        }
        setIsCanvasOpen(true);

        addUsage(estimatedBytes, 'images');
        if (session?.access_token) {
          syncFromSupabase(session.access_token, true);
        }
        setPrompt('');
      } catch (err: unknown) {
        console.error('[Image Generation Error]', err);
        if (creditDeducted && isAnticeilFree) {
          useCreditStore.getState().refundCredits(mediaMode, 'anticeil');
        }
        alert(language === 'id' ? 'Gagal memproses gambar. Silakan coba lagi.' : 'Failed to generate image.');
      } finally {
        setIsGenerating(false);
      }
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

  const imageStarters = [
    {
      category: 'Cyberpunk',
      icon: Palette,
      color: '#A25DDC',
      badgeBg: 'rgba(162, 93, 220, 0.12)',
      title: language === 'id' ? 'Kota Cyberpunk Hujan Neon' : 'Rainy Cyberpunk Neon City',
      prompt:
        language === 'id'
          ? 'Pemandangan kota cyberpunk futuristik di malam hari dengan genangan air memantulkan lampu neon ungu dan mobil terbang melayang.'
          : 'Futuristic cyberpunk cityscape at night with wet streets reflecting purple neon lights and flying cars.',
      style: 'Cyberpunk',
      ratio: '16:9',
    },
    {
      category: 'Photorealistic',
      icon: Sparkles,
      color: '#0073EA',
      badgeBg: 'rgba(0, 115, 234, 0.12)',
      title: language === 'id' ? 'Potret Studio 8K Sinematik' : '8K Cinematic Studio Portrait',
      prompt:
        language === 'id'
          ? 'Foto potret close-up studio 8K ultra realistis dengan pencahayaan dramatis, detail tekstur kulit sempurna, dan kedalaman fokus bokeh.'
          : 'Ultra-realistic 8K close-up studio portrait with dramatic rim lighting, sharp facial details, and smooth bokeh depth.',
      style: 'Photorealistic',
      ratio: '1:1',
    },
    {
      category: '3D Render',
      icon: Wand2,
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      title: language === 'id' ? 'Kamar Gamer Isometrik 3D' : '3D Isometric Cozy Room',
      prompt:
        language === 'id'
          ? 'Desain kamar tidur gamer isometrik 3D estetik dengan setup monitor ultrawide, tanaman hias, rak buku, dan lampu warm cozy.'
          : 'Charming 3D isometric cozy gamer bedroom setup with ultrawide monitors, indoor plants, bookshelves, and warm ambient lighting.',
      style: '3D Render',
      ratio: '16:9',
    },
    {
      category: 'Anime / Fantasy',
      icon: Ratio,
      color: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.12)',
      title: language === 'id' ? 'Kuil Fantasi Mengambang di Langit' : 'Floating Fantasy Sky Temple',
      prompt:
        language === 'id'
          ? 'Kuil kuno megah mengambang di atas awan saat matahari terbenam dengan pohon sakura bercahaya dan efek cahaya mistis keemasan.'
          : 'Majestic ancient temple floating above clouds during sunset with glowing sakura petals and mystical golden hour rays.',
      style: 'Anime / Manga',
      ratio: '16:9',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left: gallery + prompt bar */}
      <div style={{ flex: 1, display: isCanvasOpen && viewMode === 'canvas' ? 'none' : 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <ImageModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        selectedModelId={selectedModel}
        onSelectModel={(id) => setSelectedModel(id)}
        mediaMode="image"
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
                  backgroundColor: '#A25DDC',
                }}
              />
              <span>
                {language === 'id'
                  ? '100% Neural Generation • Multi-Model Image Studio'
                  : '100% Neural Generation • Multi-Model Image Studio'}
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
              {ti.subtitle}
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
            {imageStarters.map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(card.prompt);
                    setSelectedStyle(card.style);
                    setSelectedRatio(card.ratio);
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
            ? 'Deskripsikan gambar yang ingin dibuat...'
            : 'Describe the image you want to generate...'
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
        brandColor="var(--rail-media-color)"
        additionalControls={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Style Selector */}
            <DropdownSelect
              value={selectedStyle}
              options={styles}
              onChange={setSelectedStyle}
              icon={<Palette size={13} color="var(--text-muted)" />}
              brandColor="var(--rail-media-color)"
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

            {/* Ratio Dropdown Selector */}
            <DropdownSelect
              value={selectedRatio}
              options={ratios}
              onChange={setSelectedRatio}
              icon={<Ratio size={13} color="var(--text-muted)" />}
              brandColor="var(--rail-media-color)"
            />
          </div>
        }
      />

      {/* Media Detail Modal — gallery card clicks only */}
      <MediaDetailModal
        item={selectedMediaItem}
        onClose={() => setSelectedMediaItem(null)}
        onDelete={(id) => { removeImageItem(id); setSelectedMediaItem(null); }}
        language={language as 'en' | 'id'}
      />
      </div>{/* end left column */}

      {/* Right: Canvas Panel — shows generated image inline (no modal) */}
      <MediaCanvasPanel
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        activeProject={activeProject}
        activeRevision={activeRevision}
        prevRevision={prevRevision}
        language={language as 'en' | 'id'}
      />
    </div>
  );
}
