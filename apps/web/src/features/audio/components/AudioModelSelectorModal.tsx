'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Music, Check, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export interface AudioModelInfo {
  id: string;
  name: string;
  description: string;
  keyType: 'free' | 'openai' | 'gemini' | 'elevenlabs' | 'suno' | 'udio' | 'microsoft';
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
  category: 'speech' | 'music';
  models: AudioModelInfo[];
}

export const AUDIO_PROVIDERS: AudioProviderInfo[] = [
  {
    id: 'microsoft-azure',
    name: 'Microsoft Azure Speech',
    logoKey: 'microsoft-azure',
    badge: '100% Gratis',
    description: 'Sintesis suara vokal manusia neural alami dengan dukungan lebih dari 100 bahasa.',
    category: 'speech',
    models: [
      {
        id: 'microsoft-tts',
        name: 'Microsoft Edge Neural TTS',
        description: 'Sintesis suara manusia alami bahasa Indonesia (Gadis, Ardi) dan global dengan aksen presisi.',
        keyType: 'microsoft',
        keyRequirement: '100% Gratis via Edge Neural Engine',
        tags: ['Bahasa Indonesia', 'Natural Neural', '100% Gratis'],
      },
    ],
  },
  {
    id: 'google-deepmind',
    name: 'Google DeepMind',
    logoKey: 'gemini',
    description: 'Teknologi sintesis vokal ekspresif dari Google AI Studio & DeepMind.',
    category: 'speech',
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
    id: 'openai',
    name: 'OpenAI',
    logoKey: 'openai',
    description: 'Model sintesis suara narasi fidelitas tinggi kualitas studio.',
    category: 'speech',
    models: [
      {
        id: 'openai-tts',
        name: 'OpenAI TTS-1 HD',
        description: 'Sintesis vokal narasi fidelitas tinggi kualitas studio (Alloy, Echo, Onyx, Shimmer).',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['Studio Quality', '6 Preset Vokal', 'Lossless Output'],
      },
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    logoKey: 'elevenlabs',
    badge: 'Best Voice',
    description: 'Pemimpin teknologi sintesis suara dan kloning vokal emosional paling alami di dunia.',
    category: 'speech',
    models: [
      {
        id: 'elevenlabs',
        name: 'ElevenLabs Turbo v2.5',
        description: 'Sintesis vokal manusia ultra-realistis dengan emosi mendalam, jeda nafas, dan nada dinamis.',
        keyType: 'elevenlabs',
        keyRequirement: 'Memerlukan ElevenLabs API Key',
        tags: ['Voice Cloning', 'Ekspresi Emosional', 'Multi-Language'],
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
        keyRequirement: 'Gratis / Audio Stream Engine',
        tags: ['Full Song & Vocal', 'Lirik Otomatis', 'Studio Arranger'],
      },
    ],
  },
  {
    id: 'udio-ai',
    name: 'Udio AI',
    logoKey: 'udio-ai',
    description: 'Produksi audio & musik fidelitas tinggi dengan ragam genre dan mastering instrumen.',
    category: 'music',
    models: [
      {
        id: 'udio',
        name: 'Udio Music v1.5 Studio Master',
        description: 'Komposisi musik fidelitas tinggi dengan ragam genre, vokal stereo, dan dinamika kaya.',
        keyType: 'udio',
        keyRequirement: 'Gratis / Direct Audio Synth',
        tags: ['Stereo Master', 'Instrumen Akustik', 'Dinamika Kaya'],
      },
    ],
  },
];

interface AudioModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export function AudioModelSelectorModal({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
}: AudioModelSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const language = useSettingsStore((s) => s.language);

  // Find provider containing the currently selected model
  const initialProvider = React.useMemo(() => {
    const found = AUDIO_PROVIDERS.find((p) => p.models.some((m) => m.id === selectedModelId));
    return found ? found.id : AUDIO_PROVIDERS[0]?.id || '';
  }, [selectedModelId]);

  const [activeProviderId, setActiveProviderId] = useState<string>(initialProvider);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const found = AUDIO_PROVIDERS.find((p) => p.models.some((m) => m.id === selectedModelId));
      if (found) {
        setActiveProviderId(found.id);
      } else if (AUDIO_PROVIDERS.length > 0) {
        setActiveProviderId(AUDIO_PROVIDERS[0].id);
      }
    }
  }, [isOpen, selectedModelId]);

  if (!isOpen || !mounted) return null;

  const currentProvider = AUDIO_PROVIDERS.find((p) => p.id === activeProviderId) || AUDIO_PROVIDERS[0];
  const currentModels = currentProvider?.models || [];

  // Organize providers by category
  const speechProviders = AUDIO_PROVIDERS.filter((p) => p.category === 'speech');
  const musicProviders = AUDIO_PROVIDERS.filter((p) => p.category === 'music');

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
              <Music size={18} />
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
                  {language === 'id' ? 'Model Audio, Vokal & Musik' : 'Audio, Speech & Music Models'}
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
                  🎵 {language === 'id' ? 'Mode Audio' : 'Audio Mode'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id'
                  ? 'Pilih provider dan model generatif yang disesuaikan khusus untuk fitur ini.'
                  : 'Select a generative provider and model tailored for this generation type.'}
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
            {/* Speech Providers Section */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '6px 8px 4px 8px',
                }}
              >
                {language === 'id' ? 'Suara & Narasi' : 'Speech & Narration'} ({speechProviders.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {speechProviders.map((provider) => {
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
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: active ? 700 : 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {provider.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {provider.models.length} {language === 'id' ? 'model' : 'models'}
                          </div>
                        </div>
                      </div>

                      {hasActiveModel && (
                        <span
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

            {/* Music Providers Section */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '6px 8px 4px 8px',
                  marginTop: '4px',
                }}
              >
                {language === 'id' ? 'Musik & Komposisi' : 'Music & Composition'} ({musicProviders.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {musicProviders.map((provider) => {
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
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: active ? 700 : 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {provider.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {provider.models.length} {language === 'id' ? 'model' : 'models'}
                          </div>
                        </div>
                      </div>

                      {hasActiveModel && (
                        <span
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
                  • {currentModels.length}{' '}
                  {language === 'id' ? 'model tersedia' : 'models available'}
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
                          color:
                            model.keyType === 'free' || model.keyType === 'microsoft' || model.keyType === 'suno' || model.keyType === 'udio'
                              ? 'var(--accent-success)'
                              : 'var(--accent-warning, #d97706)',
                          fontWeight: 550,
                        }}
                      >
                        {model.keyType === 'free' || model.keyType === 'microsoft' || model.keyType === 'suno' || model.keyType === 'udio' ? (
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
