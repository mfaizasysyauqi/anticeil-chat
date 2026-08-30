'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Music, Mic, Ear, Check, KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export type AudioCategory = 'music' | 'tts' | 'stt';

export interface AudioModelInfo {
  id: string;
  name: string;
  description: string;
  keyType: 'free' | 'openai' | 'gemini' | 'elevenlabs' | 'suno' | 'udio' | 'microsoft' | 'groq' | 'deepgram' | 'assemblyai';
  keyRequirement: string;
  badge?: string;
  tags: string[];
}

export interface AudioProviderInfo {
  id: string;
  name: string;
  logoKey: string;
  badge?: string;
  description: string;
  category: AudioCategory;
  models: AudioModelInfo[];
}

export const AUDIO_PROVIDERS: AudioProviderInfo[] = [
  // ─── MUSIC & COMPOSITION ───────────────────────────────────────────
  {
    id: 'anticeil-music',
    name: 'Anticeil',
    logoKey: 'anticeil',
    badge: 'FREE',
    description: 'Model musik AI gratis — tanpa API key, langsung pakai.',
    category: 'music',
    models: [
      {
        id: 'udio',
        name: 'Udio Music v1.5 (Anticeil Free)',
        description: 'Komposisi musik fidelitas tinggi berbagai genre — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Stereo Master', 'Instrumen Akustik', 'Dinamika Kaya'],
      },
      {
        id: 'suno-free',
        name: 'Suno v4 AI Music (Anticeil Free)',
        description: 'Menciptakan lagu utuh lengkap dengan lirik & vokal — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Full Song & Vocal', 'Lirik Otomatis', '100% Gratis'],
      },
      {
        id: 'musicgen-stereo',
        name: 'Meta MusicGen 3.3B (Anticeil Free)',
        description: 'Model aransemen musik instrumen terbuka dari Meta AI — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Open Source', 'Stereo 32kHz', 'Meta AI'],
      },
    ],
  },
  {
    id: 'suno-ai',
    name: 'Suno AI',
    logoKey: 'suno-ai',
    badge: 'AI Music',
    description: 'Studio komposisi lagu AI lengkap dengan vokal, lirik, dan aransemen instrumen.',
    category: 'music',
    models: [
      {
        id: 'suno',
        name: 'Suno v4 AI Music Studio',
        description: 'Menciptakan lagu utuh mulai dari lofi, pop, jazz, hingga rock berdasarkan deskripsi teks.',
        keyType: 'suno',
        keyRequirement: 'Memerlukan Suno API Key / Web Engine',
        tags: ['Full Song & Vocal', 'Lirik Otomatis', 'Studio Arranger'],
      },
      {
        id: 'suno-v3.5',
        name: 'Suno v3.5 Composition Engine',
        description: 'Model komposisi lagu yang cepat dan stabil untuk berbagai variasi genre.',
        keyType: 'suno',
        keyRequirement: 'Memerlukan Suno API Key',
        tags: ['Fast Gen', 'Multi-Genre', 'Vocal Stems'],
      },
    ],
  },
  {
    id: 'udio-ai',
    name: 'Udio AI',
    logoKey: 'udio',
    badge: 'High Fidelity',
    description: 'Produksi audio & musik fidelitas tinggi dengan ragam genre dan mastering instrumen.',
    category: 'music',
    models: [
      {
        id: 'udio-v1.5',
        name: 'Udio Music v1.5 Studio Master',
        description: 'Komposisi musik fidelitas tinggi dengan ragam genre, vokal stereo, dan dinamika kaya.',
        keyType: 'udio',
        keyRequirement: 'Memerlukan Udio API Key',
        tags: ['Stereo Master', 'Instrumen Akustik', 'Dinamika Kaya'],
      },
    ],
  },
  {
    id: 'google-deepmind-music',
    name: 'Google DeepMind',
    logoKey: 'gemini',
    description: 'Model generasi audio dan tekstur melodi eksperimental dari Google AI Studio.',
    category: 'music',
    models: [
      {
        id: 'musiclm',
        name: 'Google MusicLM / Lyria',
        description: 'Generasi melodi dan tekstur musikal berkualitas tinggi berbasis model difusi audio Google.',
        keyType: 'gemini',
        keyRequirement: 'Memerlukan Gemini API Key',
        tags: ['Lyria Synth', 'HD Audio', 'DeepMind Research'],
      },
    ],
  },
  {
    id: 'meta-musicgen',
    name: 'Meta AudioCraft',
    logoKey: 'huggingface',
    badge: 'FREE',
    description: 'Model aransemen musik transformer terbuka dari Meta AI Research.',
    category: 'music',
    models: [
      {
        id: 'musicgen-stereo',
        name: 'MusicGen Stereo 3.3B',
        description: 'Model aransemen musik terbuka berkualitas tinggi dengan kendali melodi dan instrumen.',
        keyType: 'free',
        keyRequirement: 'Gratis via HuggingFace Inference',
        tags: ['Open Source', 'Stereo 32kHz', 'Meta AI'],
      },
    ],
  },

  // ─── SPEECH & NARRATION (TTS) ──────────────────────────────────────
  {
    id: 'anticeil-tts',
    name: 'Anticeil',
    logoKey: 'anticeil',
    badge: 'FREE',
    description: 'Model sintesis suara gratis tanpa API key — langsung pakai.',
    category: 'tts',
    models: [
      {
        id: 'microsoft-tts',
        name: 'Microsoft Edge Neural TTS (Anticeil Free)',
        description: 'Sintesis suara vokal alami Bahasa Indonesia (Gadis, Ardi) & global — gratis via Anticeil.',
        keyType: 'microsoft',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Bahasa Indonesia', 'Natural Neural', '100% Gratis'],
      },
      {
        id: 'fish-speech',
        name: 'Fish Speech v1.5 (Anticeil Free)',
        description: 'Zero-shot voice cloning dan konversi vokal alami latensi rendah — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Zero-Shot Clone', 'Low Latency', '100% Gratis'],
      },
    ],
  },
  {
    id: 'microsoft-azure',
    name: 'Microsoft Azure Speech',
    logoKey: 'azure',
    badge: 'FREE',
    description: 'Sintesis suara vokal manusia neural alami dengan dukungan lebih dari 100 bahasa.',
    category: 'tts',
    models: [
      {
        id: 'azure-neural-tts',
        name: 'Microsoft Azure Neural Speech Studio',
        description: 'Sintesis suara manusia alami bahasa Indonesia dan global dengan aksen presisi tinggi.',
        keyType: 'microsoft',
        keyRequirement: '100% Gratis via Edge Neural Engine',
        tags: ['Bahasa Indonesia', 'Natural Neural', '100% Gratis'],
      },
    ],
  },
  {
    id: 'openai-tts',
    name: 'OpenAI',
    logoKey: 'openai',
    description: 'Model sintesis suara narasi fidelitas tinggi kualitas studio.',
    category: 'tts',
    models: [
      {
        id: 'openai-tts',
        name: 'OpenAI TTS-1 HD',
        description: 'Sintesis vokal narasi fidelitas tinggi kualitas studio (Alloy, Echo, Onyx, Shimmer, Nova, Fable).',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['Studio Quality', '6 Preset Vokal', 'Lossless Output'],
      },
      {
        id: 'openai-tts-standard',
        name: 'OpenAI TTS-1 Standard',
        description: 'Model sintesis vokal cepat dengan latensi rendah untuk aplikasi interaktif real-time.',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['Low Latency', 'Fast Stream', 'Standard Voice'],
      },
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    logoKey: 'elevenlabs',
    badge: 'Best Voice',
    description: 'Pemimpin teknologi sintesis suara dan kloning vokal emosional paling alami di dunia.',
    category: 'tts',
    models: [
      {
        id: 'elevenlabs',
        name: 'ElevenLabs Turbo v2.5',
        description: 'Sintesis vokal manusia ultra-realistis dengan emosi mendalam, jeda nafas, dan nada dinamis.',
        keyType: 'elevenlabs',
        keyRequirement: 'Memerlukan ElevenLabs API Key',
        tags: ['Voice Cloning', 'Ekspresi Emosional', 'Multi-Language'],
      },
      {
        id: 'elevenlabs-multilingual',
        name: 'ElevenLabs Multilingual v2',
        description: 'Kualitas vokal sinematik dalam 29+ bahasa dengan intonasi natural dan aksen asli.',
        keyType: 'elevenlabs',
        keyRequirement: 'Memerlukan ElevenLabs API Key',
        tags: ['29+ Bahasa', 'Cinema Quality', 'Rich Emotion'],
      },
    ],
  },
  {
    id: 'google-deepmind-tts',
    name: 'Google DeepMind',
    logoKey: 'gemini',
    description: 'Teknologi sintesis vokal ekspresif dari Google AI Studio & DeepMind.',
    category: 'tts',
    models: [
      {
        id: 'google-tts',
        name: 'Google Cloud TTS (Journey & Chirp HD)',
        description: 'Sintesis suara vokal ekspresif manusia dengan intonasi natural dari DeepMind.',
        keyType: 'gemini',
        keyRequirement: 'Memerlukan Gemini / Google Cloud Key',
        tags: ['Journey Voice', 'Chirp HD', 'Multilingual Speech'],
      },
    ],
  },
  {
    id: 'fish-audio',
    name: 'Fish Audio',
    logoKey: 'fishaudio',
    category: 'tts',
    description: 'Model vokal open source zero-shot voice conversion dan TTS.',
    models: [
      {
        id: 'fish-speech',
        name: 'Fish Speech v1.5',
        description: 'Zero-shot voice cloning dan konversi vokal berkualitas tinggi dengan latensi super rendah.',
        keyType: 'free',
        keyRequirement: 'Gratis / Open Source Engine',
        tags: ['Zero-Shot Clone', 'Low Latency', 'Open Weights'],
      },
    ],
  },

  // ─── SPEECH TO TEXT (STT) ──────────────────────────────────────────
  {
    id: 'anticeil-stt',
    name: 'Anticeil',
    logoKey: 'anticeil',
    badge: 'FREE',
    description: 'Transkripsi audio & pengenalan suara gratis tanpa API key.',
    category: 'stt',
    models: [
      {
        id: 'whisper-free',
        name: 'Whisper Large v3 Turbo (Anticeil Free)',
        description: 'Transkripsi audio akurasi tinggi ke teks dalam 100+ bahasa — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Multilingual', 'Timestamp Akurat', '100% Gratis'],
      },
    ],
  },
  {
    id: 'openai-stt',
    name: 'OpenAI',
    logoKey: 'openai',
    description: 'Model transkripsi suara OpenAI Whisper standar industri global.',
    category: 'stt',
    models: [
      {
        id: 'openai-whisper',
        name: 'OpenAI Whisper Large v3',
        description: 'Transkripsi audio paling akurat dengan pemisahan kalimat, tanda baca, dan deteksi bahasa otomatis.',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['State-of-the-art', '100+ Bahasa', 'Word Timestamps'],
      },
      {
        id: 'openai-whisper-turbo',
        name: 'OpenAI Whisper Turbo',
        description: 'Transkripsi ultra-cepat dengan optimasi latensi rendah untuk file audio panjang.',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['High Speed', 'Low Latency', 'Cost Efficient'],
      },
    ],
  },
  {
    id: 'groq-stt',
    name: 'Groq AI',
    logoKey: 'groq',
    badge: 'Ultra Fast',
    description: 'Inference engine Whisper tercepat di dunia ditenagai oleh Groq LPU™.',
    category: 'stt',
    models: [
      {
        id: 'groq-whisper',
        name: 'Groq Whisper Large v3 LPU',
        description: 'Transkripsi instan dengan kecepatan hingga 216x real-time (sub-detik untuk rekaman suara).',
        keyType: 'groq',
        keyRequirement: 'Memerlukan Groq API Key',
        tags: ['216x Real-Time', 'LPU Speed', 'High Precision'],
      },
    ],
  },
  {
    id: 'google-cloud-stt',
    name: 'Google Cloud',
    logoKey: 'gemini',
    description: 'Speech-to-Text v2 tingkat enterprise dengan model Gemini Chirp.',
    category: 'stt',
    models: [
      {
        id: 'google-stt',
        name: 'Google Cloud Speech v2 (Chirp 2)',
        description: 'Model speech recognition universal Google dengan diarisasi pembicara & filter kebisingan latar.',
        keyType: 'gemini',
        keyRequirement: 'Memerlukan Gemini / Google Cloud Key',
        tags: ['Chirp 2', 'Speaker Diarization', 'Noise Robust'],
      },
    ],
  },
  {
    id: 'deepgram-stt',
    name: 'Deepgram',
    logoKey: 'deepgram',
    badge: 'High Accuracy',
    description: 'Platform speech AI enterprise dengan model deep learning Nova-2.',
    category: 'stt',
    models: [
      {
        id: 'deepgram-nova',
        name: 'Deepgram Nova-2 Speech AI',
        description: 'Transkripsi akurasi tertinggi dengan biaya terendah untuk meeting, podcast, dan percakapan.',
        keyType: 'deepgram',
        keyRequirement: 'Memerlukan Deepgram API Key',
        tags: ['Nova-2 Arch', 'Smart Formatting', 'Fast Inference'],
      },
    ],
  },
  {
    id: 'assemblyai-stt',
    name: 'AssemblyAI',
    logoKey: 'assemblyai',
    category: 'stt',
    description: 'Model Speech-to-Text canggih dengan pemahaman konteks audio dan sentimen.',
    models: [
      {
        id: 'assemblyai-universal',
        name: 'AssemblyAI Universal-2',
        description: 'Transkripsi percakapan cerdas dengan deteksi entitas, auto-formatting, dan analisis audio.',
        keyType: 'assemblyai',
        keyRequirement: 'Memerlukan AssemblyAI API Key',
        tags: ['Universal-2', 'Entity Detection', 'Audio Intelligence'],
      },
    ],
  },
];

interface AudioModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: AudioCategory;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export function AudioModelSelectorModal({
  isOpen,
  onClose,
  category = 'music',
  selectedModelId,
  onSelectModel,
}: AudioModelSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const language = useSettingsStore((s) => s.language);
  const hasConfiguredKey = useSettingsStore((s) => s.hasConfiguredKey);

  const KEY_TYPE_TO_PROVIDER: Record<string, string> = {
    openai: 'openai', gemini: 'gemini', elevenlabs: 'elevenlabs',
    suno: 'suno', udio: 'udio', groq: 'groq',
    deepgram: 'deepgram', assemblyai: 'assemblyai',
  };

  const providerKeyMissing = (provider: AudioProviderInfo) => {
    const nonFreeKeyType = provider.models.find(
      (m) => m.keyType !== 'free' && m.keyType !== 'microsoft'
    )?.keyType;
    if (!nonFreeKeyType) return false;
    const storeId = KEY_TYPE_TO_PROVIDER[nonFreeKeyType];
    if (!storeId) return false;
    return !hasConfiguredKey(storeId as any);
  };

  // Filter providers strictly according to the active tab category
  const filteredProviders = React.useMemo(() => {
    if (!category) return AUDIO_PROVIDERS;
    return AUDIO_PROVIDERS.filter((p) => p.category === category);
  }, [category]);

  // Find provider containing the currently selected model within the filtered list
  const initialProvider = React.useMemo(() => {
    const found = filteredProviders.find((p) => p.models.some((m) => m.id === selectedModelId));
    return found ? found.id : filteredProviders[0]?.id || '';
  }, [filteredProviders, selectedModelId]);

  const [activeProviderId, setActiveProviderId] = useState<string>(initialProvider);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const found = filteredProviders.find((p) => p.models.some((m) => m.id === selectedModelId));
      if (found) {
        setActiveProviderId(found.id);
      } else if (filteredProviders.length > 0) {
        setActiveProviderId(filteredProviders[0].id);
      }
    }
  }, [isOpen, category, selectedModelId, filteredProviders]);

  if (!isOpen || !mounted) return null;

  const currentProvider =
    filteredProviders.find((p) => p.id === activeProviderId) || filteredProviders[0];
  const currentModels = currentProvider?.models || [];

  // Header meta based on category
  const headerMeta = {
    music: {
      icon: <Music size={18} />,
      title: language === 'id' ? 'Model Musik & Komposisi AI' : 'AI Music & Composition Models',
      badge: `🎵 ${language === 'id' ? 'Mode Musik' : 'Music Mode'}`,
      subtitle:
        language === 'id'
          ? 'Pilih provider dan model generatif musik untuk studio kreasi audio.'
          : 'Select a generative music provider and model tailored for music creation.',
      sidebarTitle: language === 'id' ? 'Provider Musik' : 'Music Providers',
    },
    tts: {
      icon: <Mic size={18} />,
      title: language === 'id' ? 'Model Text-to-Speech (TTS)' : 'Text-to-Speech (TTS) Models',
      badge: `🎙️ ${language === 'id' ? 'Mode Suara (TTS)' : 'TTS Voice Mode'}`,
      subtitle:
        language === 'id'
          ? 'Pilih engine sintesis vokal manusia neural alami dengan berbagai aksen & bahasa.'
          : 'Select a neural speech synthesis engine supporting natural voices and languages.',
      sidebarTitle: language === 'id' ? 'Provider Suara' : 'Speech Providers',
    },
    stt: {
      icon: <Ear size={18} />,
      title: language === 'id' ? 'Model Transkripsi Speech-to-Text' : 'Speech-to-Text (STT) Models',
      badge: `👂 ${language === 'id' ? 'Mode Transkripsi (STT)' : 'STT Transcription Mode'}`,
      subtitle:
        language === 'id'
          ? 'Pilih model pengenalan suara dan transkripsi audio fidelitas tinggi.'
          : 'Select a high-fidelity speech recognition and audio-to-text transcription model.',
      sidebarTitle: language === 'id' ? 'Provider Transkripsi' : 'STT Providers',
    },
  }[category] || {
    icon: <Music size={18} />,
    title: language === 'id' ? 'Model Audio & Suara AI' : 'Audio & Speech Models',
    badge: `🎵 ${language === 'id' ? 'Mode Audio' : 'Audio Mode'}`,
    subtitle:
      language === 'id'
        ? 'Pilih provider dan model generatif audio yang sesuai.'
        : 'Select an audio generative provider and model.',
    sidebarTitle: language === 'id' ? 'Provider' : 'Providers',
  };

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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(96, 165, 250, 0.12)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {headerMeta.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {headerMeta.title}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    color: '#60a5fa',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {headerMeta.badge}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {headerMeta.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                setSettingsOpen(true);
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
              <KeyRound size={13} color="#60a5fa" />
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Providers List */}
          <div
            style={{
              width: '240px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'var(--bg-main)',
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '6px 8px 6px 8px',
                }}
              >
                {headerMeta.sidebarTitle} ({filteredProviders.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredProviders.map((provider) => {
                  const active = provider.id === activeProviderId;
                  const hasActiveModel = provider.models.some((m) => m.id === selectedModelId);

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setActiveProviderId(provider.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: active ? '#60a5fa' : 'transparent',
                        background: active ? 'rgba(96, 165, 250, 0.08)' : 'transparent',
                        color: active ? '#60a5fa' : 'var(--text-primary)',
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
                              {provider.id.startsWith('anticeil') ? 'Anticeil' : provider.name}
                            </div>
                            {(provider.badge === 'FREE' ||
                              provider.models.every((m) => m.keyType === 'free' || m.keyType === 'microsoft')) && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(16,185,129,0.15)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16,185,129,0.3)',
                                  flexShrink: 0,
                                }}
                              >
                                FREE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {provider.models.length} {language === 'id' ? 'model' : 'models'}
                          </div>
                        </div>
                      </div>

                      {providerKeyMissing(provider) ? (
                        <span title="API Key missing" style={{ display: 'inline-flex', flexShrink: 0 }}>
                          <AlertCircle size={13} color="var(--accent-warning)" />
                        </span>
                      ) : (
                        <span
                          title={
                            provider.models.every((m) => m.keyType === 'free' || m.keyType === 'microsoft')
                              ? 'Free & Ready'
                              : 'API Key Configured'
                          }
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--accent-success, #10b981)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Models List for Current Provider */}
          <div
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
                const isFree =
                  model.keyType === 'free' ||
                  model.keyType === 'microsoft' ||
                  model.badge === 'FREE';

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
                      border: `1.5px solid ${isSelected ? '#60a5fa' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(96, 165, 250, 0.04)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 1px #60a5fa' : 'none',
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
                            color: isSelected ? '#60a5fa' : 'var(--text-primary)',
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
                                  : 'rgba(96, 165, 250, 0.08)',
                              color:
                                tag.includes('Gratis') || tag.includes('Free')
                                  ? 'var(--accent-success)'
                                  : '#60a5fa',
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
                          color: isFree
                            ? 'var(--accent-success)'
                            : 'var(--accent-warning, #d97706)',
                          fontWeight: 550,
                        }}
                      >
                        {isFree ? (
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
                        border: `2px solid ${isSelected ? '#60a5fa' : 'var(--border-strong)'}`,
                        background: isSelected ? '#60a5fa' : 'transparent',
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
