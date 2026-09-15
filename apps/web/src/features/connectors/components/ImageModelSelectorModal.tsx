'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Zap,
  Sparkles,
  Sliders,
  RotateCw,
  Eye,
  KeyRound,
  Film,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export type ImageCapability = 'image' | 'video' | 'audio';

export interface ImageModelItem {
  id: string;
  name: string;
  description: string;
  keyType: 'free' | 'gemini' | 'openai' | 'stability' | 'elevenlabs' | 'suno' | 'microsoft';
  keyRequirement: string;
  badge?: string;
  tags: string[];
  capability: ImageCapability;
}

export interface ImageProviderItem {
  id: string;
  name: string;
  logoKey: string;
  badge?: string;
  description: string;
  capabilities: ImageCapability[];
  models: ImageModelItem[];
}

export const IMAGE_PROVIDERS: ImageProviderItem[] = [
  {
    id: 'anticeil',
    name: 'Anticeil',
    logoKey: 'anticeil',
    badge: 'FREE',
    description: 'Model generatif gratis untuk gambar, video, dan audio — tanpa API key.',
    capabilities: ['image', 'video', 'audio'],
    models: [
      {
        id: 'flux',
        name: 'FLUX.1 Schnell (Anticeil Free)',
        description: 'Generasi visual kilat resolusi tinggi langsung di peramban — gratis, tanpa API key.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Client Direct', 'Ultra Cepat', 'Photorealistic'],
        capability: 'image',
      },
      {
        id: 'flux-dev',
        name: 'FLUX.1 Dev 8K Ultra (Anticeil Free)',
        description: 'Detail visual tingkat master dengan akurasi pencahayaan dan tekstur — gratis.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['8K Ultra', 'Superior Lighting', 'Precision Detail'],
        capability: 'image',
      },
      {
        id: 'sdxl',
        name: 'Stable Diffusion XL Turbo (Anticeil Free)',
        description: 'Generasi visual artistik, konsep seni, dan anime super cepat — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Artistic Styles', 'Anime & Concept Art', 'Fast Stream'],
        capability: 'image',
      },
      {
        id: 'luma',
        name: 'Luma Ray 2 (Anticeil Free)',
        description: 'Video sinematik bergerak 3D dengan kamera dinamis — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Cinematic Camera', 'Realistis 3D', 'Fast Generation'],
        capability: 'video',
      },
      {
        id: 'kling',
        name: 'Kling AI v1.6 Pro (Anticeil Free)',
        description: 'Generator video gerak fisik realistis untuk simulasi karakter — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Karakter Realistis', 'Fisika Alami', 'High Framerate'],
        capability: 'video',
      },
      {
        id: 'svd',
        name: 'Stable Video Diffusion (Anticeil Free)',
        description: 'Generator gerakan video dari gambar dengan FPS stabil — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Image-to-Video', 'Smooth FPS', 'Neural Motion'],
        capability: 'video',
      },
      {
        id: 'microsoft-tts',
        name: 'Microsoft Edge Neural TTS (Anticeil Free)',
        description: 'Sintesis suara vokal alami Bahasa Indonesia & global — gratis via Anticeil.',
        keyType: 'microsoft',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Bahasa Indonesia', 'Natural Neural', '100% Gratis'],
        capability: 'audio',
      },
      {
        id: 'fish-speech',
        name: 'Fish Speech v1.5 (Anticeil Free)',
        description: 'Zero-shot voice cloning dan konversi vokal ultra-responsif — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Zero-Shot Clone', 'Low Latency', '100% Gratis'],
        capability: 'audio',
      },
      {
        id: 'suno-free',
        name: 'Suno v4 AI Music (Anticeil Free)',
        description: 'Menciptakan lagu utuh lengkap dengan lirik & vokal — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Full Song & Vocal', 'Lirik Otomatis', '100% Gratis'],
        capability: 'audio',
      },
      {
        id: 'udio',
        name: 'Udio Music v1.5 (Anticeil Free)',
        description: 'Komposisi musik fidelitas tinggi berbagai genre — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Stereo Master', 'Instrumen Akustik', 'Dinamika Kaya'],
        capability: 'audio',
      },
    ],
  },
  {
    id: 'black-forest-labs',
    name: 'Black Forest Labs',
    logoKey: 'black-forest-labs',
    badge: 'FREE',
    description: 'Pionir model difusi visual generasi baru berkecepatan tinggi tanpa batas.',
    capabilities: ['image'],
    models: [
      {
        id: 'flux',
        name: 'FLUX.1 Schnell',
        description: 'Generasi visual kilat beresolusi tinggi langsung di peramban tanpa perlu API Key.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        tags: ['Client Direct', 'Ultra Cepat', 'Photorealistic'],
        capability: 'image',
      },
      {
        id: 'flux-dev',
        name: 'FLUX.1 Dev 8K Ultra',
        description: 'Detail visual tingkat master dengan akurasi pencahayaan, tekstur kulit, dan rendering teks.',
        keyType: 'free',
        keyRequirement: '100% Gratis / High-Res Stream',
        tags: ['8K Ultra', 'Superior Lighting', 'Precision Detail'],
        capability: 'image',
      },
    ],
  },
  {
    id: 'google-deepmind',
    name: 'Google DeepMind',
    logoKey: 'gemini',
    description: 'Teknologi AI multimodal tercanggih dari Google AI Studio & DeepMind.',
    capabilities: ['image', 'audio'],
    models: [
      {
        id: 'imagen3',
        name: 'Google Imagen 3',
        description: 'Model photorealistic generasi terbaru dari Google dengan pemahaman instruksi prompt yang sangat akurat.',
        keyType: 'gemini',
        keyRequirement: 'Memerlukan Gemini API Key',
        tags: ['Photorealistic', 'Google AI Studio', 'Deep Prompt Adherence'],
        capability: 'image',
      },
      {
        id: 'google-tts',
        name: 'Google Cloud TTS (Journey & Chirp HD)',
        description: 'Sintesis suara vokal ekspresif manusia dengan intonasi natural dari DeepMind.',
        keyType: 'gemini',
        keyRequirement: 'Memerlukan Gemini / Google Cloud Key',
        tags: ['Journey Voice', 'Chirp HD', 'Multilingual Speech'],
        capability: 'audio',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logoKey: 'openai',
    description: 'Ekosistem model generatif visual, video, dan audio mutakhir dari OpenAI.',
    capabilities: ['image', 'video', 'audio'],
    models: [
      {
        id: 'dalle3',
        name: 'DALL-E 3 HD',
        description: 'Model visual presisi tinggi dari OpenAI dengan rendering tipografi dan komposisi kompleks yang konsisten.',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['DALL-E 3', 'Tipografi Akurat', 'HD Resolution'],
        capability: 'image',
      },
      {
        id: 'sora',
        name: 'OpenAI Sora Turbo',
        description: 'Model simulasi dunia nyata dan fisika sinematik dengan pergerakan objek dinamis.',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['World Physics', '1080p Cinema', 'Dynamic Motion'],
        capability: 'video',
      },
      {
        id: 'openai-tts',
        name: 'OpenAI TTS-1 HD',
        description: 'Sintesis vokal narasi fidelitas tinggi kualitas studio (Alloy, Echo, Onyx, Shimmer).',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['Studio Quality', '6 Preset Vokal', 'Lossless Output'],
        capability: 'audio',
      },
    ],
  },
  {
    id: 'stability-ai',
    name: 'Stability AI',
    logoKey: 'stability-ai',
    description: 'Koleksi model open-weight visual dan video sinematik industri kreatif.',
    capabilities: ['image', 'video'],
    models: [
      {
        id: 'sdxl',
        name: 'Stable Diffusion XL Turbo',
        description: 'Model generasi gambar untuk gaya artistik, ilustrasi digital, konsep seni, dan anime.',
        keyType: 'stability',
        keyRequirement: 'Gratis / Stability Client Direct',
        tags: ['Artistic Styles', 'Anime & Concept Art', 'Fast Stream'],
        capability: 'image',
      },
      {
        id: 'svd',
        name: 'Stable Video Diffusion',
        description: 'Generator gerakan video dari gambar dengan kontrol fps dan stabilitas frame tinggi.',
        keyType: 'free',
        keyRequirement: 'Gratis / Client Stream',
        tags: ['Image-to-Video', 'Smooth FPS', 'Neural Motion'],
        capability: 'video',
      },
    ],
  },
  {
    id: 'luma-ai',
    name: 'Luma AI',
    logoKey: 'luma',
    badge: 'FREE',
    description: 'Teknologi Dream Machine untuk sintesis video sinematik bergerak 3D.',
    capabilities: ['video'],
    models: [
      {
        id: 'luma',
        name: 'Luma Ray 2 (Dream Machine)',
        description: 'Sintesis video dinamis dengan pergerakan kamera sinematik mulus dan kedalaman 3D.',
        keyType: 'free',
        keyRequirement: 'Gratis / Client Fast Stream',
        tags: ['Cinematic Camera', 'Realistis 3D', 'Fast Generation'],
        capability: 'video',
      },
    ],
  },
  {
    id: 'kuaishou-kling',
    name: 'Kuaishou Kling AI',
    logoKey: 'kuaishou-kling',
    badge: 'FREE',
    description: 'Mesin render video gerak fisik realistis beresolusi tinggi.',
    capabilities: ['video'],
    models: [
      {
        id: 'kling',
        name: 'Kling AI v1.6 Pro',
        description: 'Generator video gerak realistis untuk simulasi karakter manusia, hewan, dan panorama lanskap.',
        keyType: 'free',
        keyRequirement: 'Gratis / Direct Stream',
        tags: ['Karakter Realistis', 'Fisika Alami', 'High Framerate'],
        capability: 'video',
      },
    ],
  },
  {
    id: 'runway-ml',
    name: 'Runway ML',
    logoKey: 'runway-ml',
    description: 'Platform video AI generatif standar industri perfilman dan visual FX.',
    capabilities: ['video'],
    models: [
      {
        id: 'runway-gen3',
        name: 'Runway Gen-3 Alpha Turbo',
        description: 'Generasi video ultra-realistis dengan kontrol arah pencahayaan dan sinematografi profesional.',
        keyType: 'free',
        keyRequirement: 'Gratis / Cloud Relay Stream',
        tags: ['VFX Grade', 'Camera Director', 'Ultra Smooth'],
        capability: 'video',
      },
    ],
  },
  {
    id: 'microsoft-azure',
    name: 'Microsoft Azure Speech',
    logoKey: 'microsoft-azure',
    badge: 'FREE',
    description: 'Sintesis suara vokal manusia neural alami dengan dukungan lebih dari 100 bahasa.',
    capabilities: ['audio'],
    models: [
      {
        id: 'microsoft-tts',
        name: 'Microsoft Edge Neural TTS',
        description: 'Sintesis suara manusia alami bahasa Indonesia (Gadis, Ardi) dan global dengan aksen presisi.',
        keyType: 'microsoft',
        keyRequirement: '100% Gratis via Edge Neural Engine',
        tags: ['Bahasa Indonesia', 'Natural Neural', '100% Gratis'],
        capability: 'audio',
      },
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    logoKey: 'elevenlabs',
    badge: 'Best Voice',
    description: 'Pemimpin teknologi sintesis suara dan kloning vokal emosional paling alami di dunia.',
    capabilities: ['audio'],
    models: [
      {
        id: 'elevenlabs',
        name: 'ElevenLabs Turbo v2.5',
        description: 'Sintesis vokal manusia ultra-realistis dengan emosi mendalam, jeda nafas, dan nada dinamis.',
        keyType: 'elevenlabs',
        keyRequirement: 'Memerlukan ElevenLabs API Key',
        tags: ['Voice Cloning', 'Ekspresi Emosional', 'Multi-Language'],
        capability: 'audio',
      },
    ],
  },
  {
    id: 'suno-ai',
    name: 'Suno AI',
    logoKey: 'suno-ai',
    badge: 'AI Music',
    description: 'Studio komposisi lagu AI lengkap dengan vokal, lirik, dan aransemen instrumen.',
    capabilities: ['audio'],
    models: [
      {
        id: 'suno',
        name: 'Suno v4 AI Music Studio',
        description: 'Menciptakan lagu utuh mulai dari lofi, pop, jazz, hingga rock berdasarkan deskripsi teks.',
        keyType: 'suno',
        keyRequirement: 'Gratis / Audio Stream Engine',
        tags: ['Full Song & Vocal', 'Lirik Otomatis', 'Studio Arranger'],
        capability: 'audio',
      },
    ],
  },
  {
    id: 'udio-ai',
    name: 'Udio AI',
    logoKey: 'udio-ai',
    description: 'Produksi audio & musik fidelitas tinggi dengan ragam genre dan mastering instrumen.',
    capabilities: ['audio'],
    models: [
      {
        id: 'udio',
        name: 'Udio Music v1.5 Studio Master',
        description: 'Komposisi musik fidelitas tinggi dengan ragam genre, vokal stereo, dan dinamika kaya.',
        keyType: 'free',
        keyRequirement: 'Gratis / Direct Audio Synth',
        tags: ['Stereo Master', 'Instrumen Akustik', 'Dinamika Kaya'],
        capability: 'audio',
      },
    ],
  },
];

interface ImageModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaMode: ImageCapability;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export function ImageModelSelectorModal({
  isOpen,
  onClose,
  mediaMode,
  selectedModelId,
  onSelectModel,
}: ImageModelSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const openSettingsTab = useSettingsStore((s) => s.openSettingsTab);
  const language = useSettingsStore((s) => s.language);
  const hasConfiguredKey = useSettingsStore((s) => s.hasConfiguredKey);

  const KEY_TYPE_TO_PROVIDER: Record<string, string> = {
    openai: 'openai', gemini: 'gemini', stability: 'stability',
    elevenlabs: 'elevenlabs', suno: 'suno', runway: 'runway',
  };

  const providerKeyMissing = (provider: ImageProviderItem) => {
    const nonFreeKeyType = provider.models.find(
      (m) => m.keyType !== 'free' && m.keyType !== 'microsoft' && m.capability === mediaMode
    )?.keyType;
    if (!nonFreeKeyType) return false;
    const storeId = KEY_TYPE_TO_PROVIDER[nonFreeKeyType];
    if (!storeId) return false;
    return !hasConfiguredKey(storeId as any);
  };

  // Filter providers that strictly support the current mediaMode
  const filteredProviders = React.useMemo(() => {
    return IMAGE_PROVIDERS.filter((provider) =>
      provider.capabilities.includes(mediaMode)
    );
  }, [mediaMode]);

  // Find provider containing the currently selected model
  const initialProvider = React.useMemo(() => {
    const found = filteredProviders.find((p) =>
      p.models.some((m) => m.id === selectedModelId && m.capability === mediaMode)
    );
    return found ? found.id : filteredProviders[0]?.id || '';
  }, [filteredProviders, selectedModelId, mediaMode]);

  const [activeProviderId, setActiveProviderId] = useState<string>(initialProvider);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const found = filteredProviders.find((p) =>
        p.models.some((m) => m.id === selectedModelId && m.capability === mediaMode)
      );
      if (found) {
        setActiveProviderId(found.id);
      } else if (filteredProviders.length > 0) {
        setActiveProviderId(filteredProviders[0].id);
      }
    }
  }, [isOpen, mediaMode, selectedModelId, filteredProviders]);

  if (!isOpen || !mounted) return null;

  const currentProvider =
    filteredProviders.find((p) => p.id === activeProviderId) || filteredProviders[0];

  const currentModels =
    currentProvider?.models.filter((m) => m.capability === mediaMode) || [];

  const modeTitle =
    mediaMode === 'image'
      ? language === 'id'
        ? 'Model Gambar & Visual'
        : 'Image & Visual Models'
      : mediaMode === 'video'
      ? language === 'id'
        ? 'Model Video & Animasi'
        : 'Video & Animation Models'
      : language === 'id'
      ? 'Model Audio, Vokal & Musik'
      : 'Audio, Speech & Music Models';

  const modeBadgeText =
    mediaMode === 'image'
      ? language === 'id'
        ? '🖼️ Mode Gambar'
        : '🖼️ Image Mode'
      : mediaMode === 'video'
      ? language === 'id'
        ? '🎬 Mode Video'
        : '🎬 Video Mode'
      : language === 'id'
      ? '🎵 Mode Audio'
      : '🎵 Audio Mode';

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-responsive-container"
        style={{
          width: '100%',
          maxWidth: '920px',
          height: '580px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(162, 93, 220, 0.12)',
                color: '#A25DDC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {mediaMode === 'image' ? (
                <ImageIcon size={18} />
              ) : mediaMode === 'video' ? (
                <Film size={18} />
              ) : (
                <Music size={18} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {modeTitle}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    color: 'var(--brand-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {modeBadgeText}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {language === 'id'
                  ? 'Pilih provider dan model generatif yang disesuaikan khusus untuk fitur ini.'
                  : 'Select a generative provider and model tailored for this generation type.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                openSettingsTab('keys');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <KeyRound size={13} color="var(--brand-primary)" />
              <span>{language === 'id' ? 'Atur API Key' : 'Manage API Keys'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Providers + Right Models */}
        <div className="modal-responsive-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Providers List */}
          <div
            className="modal-responsive-sidebar"
            style={{
              width: '240px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'var(--bg-main)',
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            <div
              className="modal-responsive-sidebar-title"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '6px 8px 4px 8px',
              }}
            >
              {language === 'id' ? 'Penyedia Layanan' : 'Supported Providers'} (
              {filteredProviders.length})
            </div>

            {filteredProviders.map((provider) => {
              const active = provider.id === activeProviderId;
              const hasActiveModel = provider.models.some((m) => m.id === selectedModelId);

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setActiveProviderId(provider.id)}
                  className="modal-responsive-sidebar-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: active ? 'var(--brand-primary)' : 'transparent',
                    background: active ? 'rgba(0, 115, 234, 0.08)' : 'transparent',
                    color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ProviderBrandLogo provider={provider.logoKey} size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: active ? 700 : 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {provider.id === 'anticeil' ? 'Anticeil' : provider.name}
                        </div>
                        {(provider.badge === 'FREE' ||
                          provider.models
                            .filter((m) => m.capability === mediaMode)
                            .every((m) => m.keyType === 'free' || m.keyType === 'microsoft')) && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              background: 'rgba(0, 200, 117, 0.12)',
                              color: 'var(--accent-success)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          >
                            FREE
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '140px',
                        }}
                      >
                        {provider.models.filter((m) => m.capability === mediaMode).length}{' '}
                        {language === 'id' ? 'model' : 'models'}
                      </div>
                    </div>
                  </div>

                  {hasActiveModel && (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--brand-primary)',
                        flexShrink: 0,
                        marginLeft: '4px',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Models List for Current Provider */}
          <div
            className="modal-responsive-content"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {currentProvider?.name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  • {currentModels.length} {language === 'id' ? 'model tersedia' : 'models available'}
                </span>
              </div>

              {currentProvider?.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(0, 200, 117, 0.12)',
                    color: 'var(--accent-success)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {currentProvider.badge}
                </span>
              )}
            </div>

            {/* Model Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentModels.map((model) => {
                const isSelected = selectedModelId === model.id;

                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      onClose();
                    }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `1.5px solid ${
                        isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'
                      }`,
                      background: isSelected ? 'rgba(0, 115, 234, 0.04)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 1px var(--brand-primary)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-strong)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      }
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Model Title & Tags */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                          }}
                        >
                          {model.name}
                        </span>

                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {model.id}
                        </span>

                        {model.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '10px',
                              fontWeight: 650,
                              padding: '1.5px 6px',
                              borderRadius: '4px',
                              background:
                                tag.includes('Gratis') || tag.includes('Free')
                                  ? 'rgba(0, 200, 117, 0.1)'
                                  : 'rgba(0, 115, 234, 0.08)',
                              color:
                                tag.includes('Gratis') || tag.includes('Free')
                                  ? 'var(--accent-success)'
                                  : 'var(--brand-primary)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          margin: '0 0 8px 0',
                          lineHeight: 1.45,
                        }}
                      >
                        {model.description}
                      </p>

                      {/* Requirement note */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          color:
                            model.keyType === 'free'
                              ? 'var(--accent-success)'
                              : 'var(--accent-warning, #d97706)',
                          fontWeight: 550,
                        }}
                      >
                        {model.keyType === 'free' ? (
                          <CheckCircle2 size={12} color="var(--accent-success)" />
                        ) : (
                          <Lock size={12} color="var(--accent-warning, #d97706)" />
                        )}
                        <span>{model.keyRequirement}</span>
                      </div>
                    </div>

                    {/* Radio / Selection Check */}
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${
                          isSelected ? 'var(--brand-primary)' : 'var(--border-strong)'
                        }`,
                        background: isSelected ? 'var(--brand-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
