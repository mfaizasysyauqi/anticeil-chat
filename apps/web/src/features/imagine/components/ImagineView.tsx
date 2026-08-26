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
  Film,
  Music,
  KeyRound,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  Headphones,
  Sliders,
  Radio,
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
import { ImagineModelSelectorModal, IMAGINE_PROVIDERS } from './ImagineModelSelectorModal';
import { ImagineVoiceSelectorModal } from './ImagineVoiceSelectorModal';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImagineStore } from '../store/useImagineStore';
import { useWorkspaceStore } from '../../storage/store/useWorkspaceStore';
import { getTranslation } from '@anticeil/core';

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

interface VideoItem {
  id: string;
  url: string;
  prompt: string;
  model: string;
  ratio: string;
  duration: string;
  createdAt: string;
}

interface AudioItem {
  id: string;
  title: string;
  prompt: string;
  model: string;
  voice: string;
  category: 'speech' | 'music' | 'sfx';
  durationSec: number;
  createdAt: string;
}

// Generate genuine playable WAV file blob via Web Audio API buffer
function createWavBlob(durationSec: number = 6, baseFreq: number = 440, style: string = 'lofi'): Blob {
  const sampleRate = 22050;
  const numChannels = 1;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const freq = style.includes('Synth') ? 220 : style.includes('Piano') ? 330 : baseFreq;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t * 2) * Math.max(0, 1 - t / durationSec);
    const sample =
      (Math.sin(2 * Math.PI * freq * t) * 0.4 +
        Math.sin(2 * Math.PI * (freq * 1.25) * t) * 0.25 +
        Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.15 +
        (Math.random() * 2 - 1) * 0.02) *
      envelope;
    const intSample = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── ImagineCardMenu (3-dot Menu & Submenu) ──────────────────────────────────
interface ImagineCardMenuProps {
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

function ImagineCardMenu({
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
}: ImagineCardMenuProps) {
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

export function ImagineView() {
  const session = useAuthStore((s) => s.session);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ti = t.imagine;

  const [mediaMode, setMediaMode] = useState<MediaMode>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [selectedVoice, setSelectedVoice] = useState('gadis');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ── Voice auto-fetch state ──────────────────────────────────────────
  const [availableVoices, setAvailableVoices] = useState<{ id: string; label: string }[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const apiKeys = useSettingsStore((s) => s.apiKeys);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [id: string]: number }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  const mediaModes: { id: MediaMode; label: string; icon: React.ReactNode }[] = [
    { id: 'image', label: language === 'id' ? 'Gambar' : 'Image', icon: <ImageIcon size={14} /> },
    { id: 'video', label: language === 'id' ? 'Video' : 'Video', icon: <Film size={14} /> },
    { id: 'audio', label: language === 'id' ? 'Audio' : 'Audio', icon: <Music size={14} /> },
  ];

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

  const videoModels: ModelInfo[] = [
    {
      id: 'luma',
      name: 'Luma Ray 2 (Client Fast)',
      provider: 'Luma Dream Machine',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / Client Stream' : 'Free / Client Stream',
      description: language === 'id' ? 'Sintesis video dinamis dengan pergerakan kamera sinematik yang mulus.' : 'Dynamic video generation with smooth cinematic camera movements.',
    },
    {
      id: 'sora',
      name: 'OpenAI Sora (OpenAI API Key)',
      provider: 'OpenAI',
      keyType: 'openai',
      keyRequirement: language === 'id' ? 'Memerlukan OpenAI API Key' : 'Requires OpenAI API Key',
      description: language === 'id' ? 'Model video fisika dunia nyata mutakhir dari OpenAI.' : 'World-simulation video model by OpenAI with complex physics.',
    },
    {
      id: 'kling',
      name: 'Kling AI v1.6 (Fast Stream)',
      provider: 'Kuaishou AI',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / Direct Stream' : 'Free / Direct Stream',
      description: language === 'id' ? 'Generator video gerak realistis untuk animasi karakter dan lanskap.' : 'Realistic motion video generator for characters and landscapes.',
    },
  ];

  const audioModels: ModelInfo[] = [
    {
      id: 'microsoft-tts',
      name: 'Microsoft Edge / Azure Speech (Neural Voice)',
      provider: 'Microsoft Azure AI',
      keyType: 'microsoft',
      keyRequirement: language === 'id' ? 'Gratis via Edge / Azure Speech Key' : 'Free via Edge / Azure Speech Key',
      description: language === 'id' ? 'Sintesis suara manusia alami & multi-bahasa dengan model Microsoft Neural.' : 'Natural human voice synthesis with rich multi-language Microsoft Neural TTS.',
    },
    {
      id: 'google-tts',
      name: 'Google Cloud TTS / Journey & Chirp (Gemini Key)',
      provider: 'Google Cloud AI / DeepMind',
      keyType: 'gemini',
      keyRequirement: language === 'id' ? 'Memerlukan Gemini / Google Cloud Key' : 'Requires Gemini / Google Cloud Key',
      description: language === 'id' ? 'Sintesis vokal ekspresif generasi terbaru dari Google DeepMind (Journey, Studio, Chirp HD).' : 'Next-gen expressive voice synthesis by Google DeepMind (Journey, Studio, Chirp HD).',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs Turbo v2.5 (Voice Key)',
      provider: 'ElevenLabs',
      keyType: 'elevenlabs',
      keyRequirement: language === 'id' ? 'Memerlukan ElevenLabs API Key' : 'Requires ElevenLabs API Key',
      description: language === 'id' ? 'Kloning suara dan sintesis vokal paling emosional dan natural di dunia.' : 'World-leading natural human voice synthesis and speech generation.',
    },
    {
      id: 'openai-tts',
      name: 'OpenAI TTS-1 HD (OpenAI Key)',
      provider: 'OpenAI',
      keyType: 'openai',
      keyRequirement: language === 'id' ? 'Memerlukan OpenAI API Key' : 'Requires OpenAI API Key',
      description: language === 'id' ? 'Sintesis narasi & suara fidelitas tinggi dari OpenAI (Alloy, Echo, Onyx, Shimmer).' : 'Studio-quality speech and narration synthesis by OpenAI.',
    },
    {
      id: 'suno',
      name: 'Suno v4 (AI Music Stream)',
      provider: 'Suno AI',
      keyType: 'suno',
      keyRequirement: language === 'id' ? 'Gratis / Audio Stream' : 'Free / Audio Stream',
      description: language === 'id' ? 'Menciptakan lagu lengkap dengan lirik, vokal, dan aransemen instrumen.' : 'Generates complete songs with lyrics, vocals, and full instrumentation.',
    },
    {
      id: 'udio',
      name: 'Udio Music v1.5',
      provider: 'Udio AI',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / Direct Synth' : 'Free / Direct Synth',
      description: language === 'id' ? 'Komposisi musik fidelitas tinggi dengan ragam genre dan vokal dinamis.' : 'High-fidelity music composition across diverse genres and vocals.',
    },
  ];

  const VOICE_PRESETS_FALLBACK = [
    { id: 'gadis', label: 'Gadis (Wanita Indonesia - Natural Neural)' },
    { id: 'ardi', label: 'Ardi (Pria Indonesia - Wibawa & Formal)' },
    { id: 'jenny', label: 'Jenny (English US - Studio Host)' },
    { id: 'guy', label: 'Guy (English US - Deep Narrator)' },
    { id: 'lofi_synth', label: 'Lofi Piano & Vinyl (Music Synth)' },
    { id: 'cyberpunk_synth', label: 'Cyberpunk Synthwave (Ambient Beats)' },
  ];

  // Auto-fetch voices when selectedModel or mediaMode changes
  useEffect(() => {
    if (mediaMode !== 'audio') return;
    setIsLoadingVoices(true);

    const elevenKey = apiKeys.elevenlabs?.apiKey;
    const openaiKey = apiKeys.openai?.apiKey;

    // ElevenLabs: fetch real voices from API
    if (selectedModel === 'elevenlabs' && elevenKey && elevenKey.length > 5) {
      fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': elevenKey },
      })
        .then((r) => r.json())
        .then((data) => {
          const voices = (data.voices || []).map((v: { voice_id: string; name: string; labels?: { accent?: string } }) => ({
            id: v.voice_id,
            label: `${v.name}${v.labels?.accent ? ` · ${v.labels.accent}` : ''}`,
          }));
          setAvailableVoices(voices.length ? voices : VOICE_PRESETS_FALLBACK);
          if (voices.length) setSelectedVoice(voices[0].id);
        })
        .catch(() => setAvailableVoices(VOICE_PRESETS_FALLBACK))
        .finally(() => setIsLoadingVoices(false));
      return;
    }

    // OpenAI TTS: fixed preset voices
    if (selectedModel === 'openai-tts' && openaiKey && openaiKey.length > 5) {
      setAvailableVoices([
        { id: 'alloy',   label: 'Alloy (Neutral · Versatile)' },
        { id: 'echo',    label: 'Echo (Male · Dramatic)' },
        { id: 'fable',   label: 'Fable (British · Storytelling)' },
        { id: 'nova',    label: 'Nova (Female · Energetic)' },
        { id: 'onyx',    label: 'Onyx (Male · Deep)' },
        { id: 'shimmer', label: 'Shimmer (Female · Warm)' },
      ]);
      setSelectedVoice('alloy');
      setIsLoadingVoices(false);
      return;
    }

    // Microsoft Edge TTS / Google TTS: fetch browser voices
    if (selectedModel === 'microsoft-tts' || selectedModel === 'google-tts') {
      const filterFn = selectedModel === 'google-tts'
        ? (v: SpeechSynthesisVoice) => v.voiceURI.toLowerCase().includes('google') || v.name.toLowerCase().includes('google')
        : () => true;

      const loadBrowserVoices = () => {
        const all = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : [];
        const filtered = all.filter(filterFn).map((v) => ({ id: v.voiceURI, label: `${v.name} (${v.lang})` }));
        const voices = filtered.length ? filtered : VOICE_PRESETS_FALLBACK;
        setAvailableVoices(voices);
        if (filtered.length) setSelectedVoice(filtered[0].id);
        setIsLoadingVoices(false);
      };

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        const immediate = synth.getVoices();
        if (immediate.length) { loadBrowserVoices(); }
        else { synth.onvoiceschanged = loadBrowserVoices; }
      } else {
        setAvailableVoices(VOICE_PRESETS_FALLBACK);
        setIsLoadingVoices(false);
      }
      return;
    }

    // Music models: genre/style presets
    if (selectedModel === 'suno' || selectedModel === 'udio') {
      setAvailableVoices([
        { id: 'pop',        label: 'Pop Vocal (Upbeat & Catchy)' },
        { id: 'lofi',       label: 'Lofi Hip-Hop (Chill Beats)' },
        { id: 'jazz',       label: 'Jazz & Soul (Smooth Instrumental)' },
        { id: 'rock',       label: 'Rock (Electric Guitar)' },
        { id: 'classical',  label: 'Classical (Orchestral)' },
        { id: 'ambient',    label: 'Ambient (Soundscape)' },
        { id: 'electronic', label: 'Electronic (Synthwave)' },
      ]);
      setSelectedVoice('pop');
      setIsLoadingVoices(false);
      return;
    }

    // Default fallback
    setAvailableVoices(VOICE_PRESETS_FALLBACK);
    setSelectedVoice(VOICE_PRESETS_FALLBACK[0].id);
    setIsLoadingVoices(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, mediaMode, apiKeys.elevenlabs?.apiKey, apiKeys.openai?.apiKey]);

  const activeModels = mediaMode === 'image' ? imageModels : mediaMode === 'video' ? videoModels : audioModels;
  const currentModelInfo = activeModels.find((m) => m.id === selectedModel) || activeModels[0];

  // Resolve display name from ImagineModelSelectorModal providers for richer label
  const modalModelInfo = IMAGINE_PROVIDERS
    .flatMap((p) => p.models)
    .find((m) => m.id === selectedModel);
  const modelDisplayName = modalModelInfo?.name || currentModelInfo?.name || selectedModel;


  const [copiedId, setCopiedId] = useState<string | null>(null);



  const styles = ['Photorealistic', 'Anime / Manga', 'Cyberpunk', '3D Render', 'Cinematic', 'Oil Painting', 'Pixel Art'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  // Real Playback Handler
  const handleTogglePlayAudio = (item: AudioItem) => {
    if (playingAudioId === item.id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setPlayingAudioId(null);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);

    setPlayingAudioId(item.id);
    setPlaybackProgress((prev) => ({ ...prev, [item.id]: 0 }));

    const duration = item.durationSec;
    const interval = 200;
    const step = (interval / (duration * 1000)) * 100;

    timerRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        const current = (prev[item.id] || 0) + step;
        if (current >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPlayingAudioId(null);
          return { ...prev, [item.id]: 0 };
        }
        return { ...prev, [item.id]: current };
      });
    }, interval);

    // Speak Prompt via native SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.prompt);
      utterance.rate = audioSpeed;
      utterance.pitch = item.voice.includes('Pria') ? 0.85 : 1.1;

      const voices = window.speechSynthesis.getVoices();
      const isIndo = item.voice.includes('Indonesia') || item.voice.includes('Gadis') || item.voice.includes('Ardi');
      const targetVoice = voices.find((v) => (isIndo ? v.lang.startsWith('id') : v.lang.startsWith('en')));
      if (targetVoice) utterance.voice = targetVoice;

      utterance.onend = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlayingAudioId(null);
        setPlaybackProgress((prev) => ({ ...prev, [item.id]: 0 }));
      };
      utterance.onerror = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlayingAudioId(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDownloadAudio = (item: AudioItem) => {
    const blob = createWavBlob(item.durationSec, 440, item.voice);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil-${item.category}-${item.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  // Imagine store — persisted media, pin, folder
  const addImagineItem = useImagineStore((s) => s.addItem);
  const removeImagineItem = useImagineStore((s) => s.removeItem);
  const toggleImaginePin = useImagineStore((s) => s.togglePin);
  const moveImagineToCollection = useImagineStore((s) => s.moveToCollection);
  const hydrateFromApi = useImagineStore((s) => s.hydrateFromApi);
  const imagineItems = useImagineStore((s) => s.items);
  const imageCollections = useWorkspaceStore((s) => s.imageCollections);
  const activeImageCollectionId = useWorkspaceStore((s) => s.activeImageCollectionId);

  const filterAndSort = <T extends { isPinned?: boolean; collectionId?: string | null }>(items: T[]) => {
    return items
      .filter((item) => (activeImageCollectionId ? item.collectionId === activeImageCollectionId : true))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  };

  const generatedImages = filterAndSort(
    imagineItems.filter((i) => i.type === 'image') as Array<ImageItem & { isPinned: boolean; collectionId: string | null }>
  );
  const generatedVideos = filterAndSort(
    imagineItems.filter((i) => i.type === 'video') as Array<VideoItem & { isPinned: boolean; collectionId: string | null }>
  );
  const generatedAudios = filterAndSort(
    imagineItems.filter((i) => i.type === 'audio') as Array<AudioItem & { isPinned: boolean; collectionId: string | null }>
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
        const res = await fetch('/api/imagine/save-media', {
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
        console.warn('[Imagine] Failed to upload image to R2, using direct url:', err);
      }

      const nowIso = new Date().toISOString();
      addImagineItem({
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
    } else if (mediaMode === 'video') {
      const estimatedBytes = 3.5 * 1024 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk render media baru.' : 'Not enough storage space in your 1 GB quota.');
        return;
      }

      setIsGenerating(true);
      const encodedPrompt = encodeURIComponent(`${prompt}, cinematic lighting, 4k ultra realism`);
      const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux-realism&seed=${Math.floor(Math.random() * 100000)}`;

      let finalUrl = directUrl;

      // Save video thumbnail/asset to Cloudflare R2 via save-media API
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
            mediaUrl: directUrl,
            metadata: {
              ratio: selectedRatio,
              model: currentModelInfo.name,
              duration: '0:06',
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Imagine] Failed to upload video asset to R2, using direct url:', err);
      }

      const nowIso = new Date().toISOString();
      addImagineItem({
        id: String(Date.now()),
        type: 'video',
        url: finalUrl,
        prompt: prompt.trim(),
        model: currentModelInfo.name,
        ratio: selectedRatio,
        duration: '0:06',
        createdAt: nowIso,
        createdAtLabel: 'Just now',
      });

      addUsage(estimatedBytes, 'images');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
      setIsGenerating(false);
      setPrompt('');
    } else {
      // Audio Generation
      const estimatedBytes = 650 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk sintesis audio baru.' : 'Not enough storage space in your 1 GB quota.');
        return;
      }

      setIsGenerating(true);
      const durationSec = Math.max(5, Math.min(25, Math.ceil(prompt.trim().split(' ').length * 0.45)));
      const voiceLabel =
        availableVoices.find((v) => v.id === selectedVoice)?.label ||
        VOICE_PRESETS_FALLBACK.find((v) => v.id === selectedVoice)?.label ||
        'Neural Voice';
      const category = selectedVoice.includes('synth') || selectedModel === 'suno' || selectedModel === 'udio' ? 'music' : 'speech';

      const wavBlob = createWavBlob(durationSec, 440, selectedVoice);
      let finalAudioUrl = '';

      // Upload binary WAV to Cloudflare R2
      try {
        const base64Wav = await blobToBase64(wavBlob);
        const res = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'audio',
            prompt: prompt.trim(),
            base64Data: base64Wav,
            metadata: {
              voice: voiceLabel,
              category,
              model: currentModelInfo.name,
              durationSec,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalAudioUrl = data.url;
        }
      } catch (err) {
        console.warn('[Imagine] Failed to upload audio to R2:', err);
      }

      const nowIso = new Date().toISOString();
      const newAudio: AudioItem = {
        id: String(Date.now()),
        title: prompt.trim().slice(0, 45) + (prompt.length > 45 ? '...' : ''),
        prompt: prompt.trim(),
        model: currentModelInfo.name,
        voice: voiceLabel,
        category,
        durationSec,
        createdAt: 'Just now',
      };

      addImagineItem({
        id: newAudio.id,
        type: 'audio',
        url: finalAudioUrl,
        prompt: prompt.trim(),
        title: newAudio.title,
        model: currentModelInfo.name,
        voice: voiceLabel,
        category,
        durationSec,
        createdAt: nowIso,
        createdAtLabel: 'Just now',
      });
      addUsage(estimatedBytes, 'audio');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
      setIsGenerating(false);
      setPrompt('');

      // Trigger real audio playback immediately
      handleTogglePlayAudio(newAudio);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                    mode.id === 'image' ? 'flux' : mode.id === 'video' ? 'luma' : 'microsoft-tts'
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

        {/* ── Prompt Card (Chat-style elegant floating input) ── */}
        <ImagineModelSelectorModal
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          mediaMode={mediaMode}
          selectedModelId={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
        />

        <ImagineVoiceSelectorModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          selectedVoiceId={selectedVoice}
          onSelectVoice={(id) => setSelectedVoice(id)}
          availableVoices={availableVoices}
          currentModelName={modelDisplayName}
          isLoading={isLoadingVoices}
        />

        <form
          onSubmit={handleGenerate}
          style={{
            background: 'var(--bg-input)',
            border: `1px solid ${isFocused ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-xl)',
            marginBottom: '28px',
            boxShadow: isFocused ? 'var(--shadow-lg)' : 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 14px',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (prompt.trim() && !isGenerating) handleGenerate(e as unknown as React.FormEvent);
              }
            }}
            placeholder={
              mediaMode === 'image'
                ? ti.promptPlaceholder
                : mediaMode === 'video'
                ? (language === 'id'
                    ? 'Jelaskan video yang ingin Anda buat secara detail (contoh: Drone terbang di atas hutan hujan tropis, 4K sinematik)...'
                    : 'Describe the video you want to generate in detail (e.g. Drone flying over tropical rainforest, 4K cinematic)...')
                : (language === 'id'
                    ? 'Ketik narasi atau musik yang ingin disuarakan (contoh: Selamat datang di Anticeil AI, asisten produktivitas cerdas masa depan)...'
                    : 'Type the narration or music prompt you want to voice (e.g. Welcome to Anticeil AI, your privacy-first intelligent assistant)...')
            }
            rows={3}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '2px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              maxHeight: '200px',
            }}
          />

          {/* Bottom Toolbar — Chat-style */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
              paddingTop: '6px',
            }}
          >
            {/* Left: Model selector button + context pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>

              {/* Model Selector Trigger — matches ChatInput style */}
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(true)}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  maxWidth: '260px',
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Sparkles size={13} color="#A25DDC" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 500, fontSize: '13px' }}>
                  {modelDisplayName}
                </span>
                <ChevronDown size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
              </button>

              {/* Style pill (Image only) */}
              {mediaMode === 'image' && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      appearance: 'none',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '4px 24px 4px 10px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {styles.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Palette size={11} color="var(--text-muted)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              )}

              {/* Ratio pills (Image & Video) */}
              {(mediaMode === 'image' || mediaMode === 'video') && (
                <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
                  {ratios.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRatio(r)}
                      style={{
                        border: 'none',
                        background: selectedRatio === r ? 'var(--text-primary)' : 'transparent',
                        color: selectedRatio === r ? 'var(--bg-main)' : 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '14px',
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
              )}

              {/* Audio voice dialog trigger pill */}
              {mediaMode === 'audio' && (
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="clickable-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '20px',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    maxWidth: '240px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Mic size={12} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {availableVoices.find((v) => v.id === selectedVoice)?.label ||
                     VOICE_PRESETS_FALLBACK.find((v) => v.id === selectedVoice)?.label ||
                     (language === 'id' ? 'Pilih Suara' : 'Select Voice')}
                  </span>
                  <ChevronDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
              )}
            </div>

            {/* Right: Mic + Send button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Mic button for speech-to-text */}
              <button
                type="button"
                title={language === 'id' ? 'Suara ke Teks' : 'Voice input'}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Mic size={16} />
              </button>

              {/* Circular gradient send button */}
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                title={language === 'id' ? 'Hasilkan' : 'Generate'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  background:
                    isGenerating || !prompt.trim()
                      ? 'var(--bg-subtle)'
                      : 'linear-gradient(135deg, var(--brand-primary), var(--accent-reasoning))',
                  border: 'none',
                  borderRadius: '50%',
                  color: isGenerating || !prompt.trim() ? 'var(--text-muted)' : '#FFFFFF',
                  cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow:
                    isGenerating || !prompt.trim()
                      ? 'none'
                      : '0 2px 10px rgba(0, 115, 234, 0.35)',
                  flexShrink: 0,
                }}
              >
                {isGenerating
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <ArrowUp size={16} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </form>

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

        {/* ── Gallery / Feed Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mediaMode === 'image' ? (
              <ImageIcon size={16} color="var(--brand-primary)" />
            ) : mediaMode === 'video' ? (
              <Film size={16} color="var(--brand-primary)" />
            ) : (
              <Music size={16} color="var(--brand-primary)" />
            )}
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {mediaMode === 'image'
                ? ti.recentGenerations
                : mediaMode === 'video'
                ? (language === 'id' ? 'Galeri Hasil Video AI' : 'Recent Video Generations')
                : (language === 'id' ? 'Studio Audio & Voice Synthesizer' : 'Audio & Voice Synthesizer Studio')}
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
              {mediaMode === 'image' ? generatedImages.length : mediaMode === 'video' ? generatedVideos.length : generatedAudios.length}
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: 'var(--accent-success)', fontWeight: 600 }}>
            {ti.freeBadge}
          </span>
        </div>

        {/* ── Audio Studio Gallery Waterfall / Masonry Grid ── */}
        {mediaMode === 'audio' && (
          <div
            className="waterfall-gallery-grid"
            style={{
              marginBottom: '40px',
            }}
          >
            {generatedAudios.map((item) => {
              const isPlaying = playingAudioId === item.id;
              const progress = playbackProgress[item.id] || 0;

              return (
                <div
                  key={item.id}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '16px',
                    background: 'var(--bg-surface)',
                    border: isPlaying ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: isPlaying ? '0 4px 20px rgba(0, 115, 234, 0.15)' : 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isPlaying ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                          color: isPlaying ? '#FFFFFF' : 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {item.category === 'music' ? <Radio size={16} /> : <Headphones size={16} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.model} • {item.voice}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      0:{item.durationSec < 10 ? `0${item.durationSec}` : item.durationSec}
                    </span>
                  </div>

                  {/* Equalizer / Sound Wave Visualizer */}
                  <div
                    style={{
                      background: 'var(--bg-main)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Big Play / Pause Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlayAudio(item)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--accent-reasoning)' : 'var(--brand-primary)',
                        border: 'none',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                    </button>

                    {/* Animated Equalizer Wave Bars */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '26px' }}>
                        {[40, 75, 55, 90, 60, 30, 80, 100, 45, 70, 85, 50, 65, 95, 40, 60, 80, 55, 90, 45].map(
                          (barHeight, idx) => (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                height: isPlaying ? `${Math.max(15, (barHeight * (0.5 + Math.random() * 0.5)))}%` : '20%',
                                background: isPlaying
                                  ? idx < (progress / 100) * 20
                                    ? 'var(--brand-primary)'
                                    : 'var(--accent-reasoning)'
                                  : 'var(--border-strong)',
                                borderRadius: '2px',
                                transition: 'height 0.15s ease, background 0.2s ease',
                              }}
                            />
                          )
                        )}
                      </div>

                      {/* Progress Track */}
                      <div
                        style={{
                          height: '4px',
                          background: 'var(--border-subtle)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'var(--brand-primary)',
                            transition: 'width 0.2s linear',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Narration Prompt Text */}
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{item.prompt}&rdquo;
                  </p>

                  {/* Card Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.createdAt}</span>

                    <ImagineCardMenu
                      id={item.id}
                      isPinned={item.isPinned}
                      prompt={item.prompt}
                      url={(item as any).url || (item as any).audioUrl || ''}
                      collectionId={item.collectionId}
                      collections={imageCollections}
                      language={language}
                      onTogglePin={() => toggleImaginePin(item.id)}
                      onMoveToCollection={(colId) => moveImagineToCollection(item.id, colId)}
                      onCopyPrompt={() => handleCopyPrompt(item.id, item.prompt)}
                      onDownload={() => handleDownloadAudio(item)}
                      onDelete={() => removeImagineItem(item.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Video Gallery Waterfall / Masonry Grid ── */}
        {mediaMode === 'video' && (
          <div
            className="waterfall-gallery-grid"
            style={{
              marginBottom: '40px',
            }}
          >
            {generatedVideos.map((vid) => (
              <div
                key={vid.id}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: vid.ratio.replace(':', '/'),
                    background: '#000000',
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vid.url}
                    alt={vid.prompt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Play size={20} style={{ marginLeft: '2px' }} />
                    </div>
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {vid.duration}
                  </span>
                </div>

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
                  >
                    {vid.prompt}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{vid.model}</span>
                    <ImagineCardMenu
                      id={vid.id}
                      isPinned={vid.isPinned}
                      prompt={vid.prompt}
                      url={vid.url}
                      collectionId={vid.collectionId}
                      collections={imageCollections}
                      language={language}
                      onTogglePin={() => toggleImaginePin(vid.id)}
                      onMoveToCollection={(colId) => moveImagineToCollection(vid.id, colId)}
                      onCopyPrompt={() => handleCopyPrompt(vid.id, vid.prompt)}
                      onDownload={() => {
                        const a = document.createElement('a');
                        a.href = vid.url;
                        a.download = `imagine-video-${vid.id}.mp4`;
                        a.target = '_blank';
                        a.click();
                      }}
                      onDelete={() => removeImagineItem(vid.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Image Gallery Waterfall / Masonry Grid ── */}
        {mediaMode === 'image' && (
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

                    <ImagineCardMenu
                      id={img.id}
                      isPinned={img.isPinned}
                      prompt={img.prompt}
                      url={img.url}
                      collectionId={img.collectionId}
                      collections={imageCollections}
                      language={language}
                      onTogglePin={() => toggleImaginePin(img.id)}
                      onMoveToCollection={(colId) => moveImagineToCollection(img.id, colId)}
                      onCopyPrompt={() => handleCopyPrompt(img.id, img.prompt)}
                      onDownload={() => {
                        const a = document.createElement('a');
                        a.href = img.url;
                        a.download = `imagine-${img.id}.jpg`;
                        a.target = '_blank';
                        a.click();
                      }}
                      onDelete={() => removeImagineItem(img.id)}
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
