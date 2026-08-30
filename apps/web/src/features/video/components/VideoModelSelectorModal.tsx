'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Film, Check, KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export interface VideoModelInfo {
  id: string;
  name: string;
  description: string;
  keyType: 'free' | 'openai' | 'runway' | 'pika' | 'custom';
  keyRequirement: string;
  badge?: string;
  tags: string[];
}

export interface VideoProviderInfo {
  id: string;
  name: string;
  logoKey: string;
  badge?: string;
  description: string;
  models: VideoModelInfo[];
}

export const VIDEO_PROVIDERS: VideoProviderInfo[] = [
  {
    id: 'anticeil',
    name: 'Anticeil',
    logoKey: 'anticeil',
    badge: 'FREE',
    description: 'Model generasi video gratis — tanpa API key, langsung pakai.',
    models: [
      {
        id: 'luma',
        name: 'Luma Ray 2 (Anticeil Free)',
        description: 'Video sinematik 3D dengan pergerakan kamera dinamis — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Cinematic Camera', 'Realistis 3D', 'Fast Generation'],
      },
      {
        id: 'kling',
        name: 'Kling AI v1.6 Pro (Anticeil Free)',
        description: 'Generator video gerak realistis untuk simulasi karakter manusia dan panorama — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Karakter Realistis', 'Fisika Alami', 'High Framerate'],
      },
      {
        id: 'svd',
        name: 'Stable Video Diffusion (Anticeil Free)',
        description: 'Generator gerakan video dari gambar dengan FPS stabil — gratis via Anticeil.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['Image-to-Video', 'Smooth FPS', 'Neural Motion'],
      },
      {
        id: 'runway-gen3',
        name: 'Runway Gen-3 Alpha Turbo (Anticeil Relay)',
        description: 'Generasi video ultra-realistis via streaming relay Anticeil — gratis tanpa API key.',
        keyType: 'free',
        keyRequirement: '100% Gratis — Tanpa API Key',
        badge: 'FREE',
        tags: ['VFX Grade', 'Camera Director', 'Ultra Smooth'],
      },
    ],
  },
  {
    id: 'luma-ai',
    name: 'Luma AI',
    logoKey: 'luma',
    badge: 'FREE',
    description: 'Teknologi Dream Machine untuk sintesis video sinematik bergerak 3D.',
    models: [
      {
        id: 'luma',
        name: 'Luma Ray 2 (Dream Machine)',
        description: 'Sintesis video dinamis dengan pergerakan kamera sinematik mulus dan kedalaman 3D.',
        keyType: 'free',
        keyRequirement: 'Gratis / Client Fast Stream',
        tags: ['Cinematic Camera', 'Realistis 3D', 'Fast Generation'],
      },
    ],
  },
  {
    id: 'kuaishou-kling',
    name: 'Kuaishou Kling AI',
    logoKey: 'kuaishou-kling',
    badge: 'FREE',
    description: 'Mesin render video gerak fisik realistis beresolusi tinggi.',
    models: [
      {
        id: 'kling',
        name: 'Kling AI v1.6 Pro',
        description: 'Generator video gerak realistis untuk simulasi karakter manusia, hewan, dan panorama lanskap.',
        keyType: 'free',
        keyRequirement: 'Gratis / Direct Stream',
        tags: ['Karakter Realistis', 'Fisika Alami', 'High Framerate'],
      },
    ],
  },
  {
    id: 'runway-ml',
    name: 'Runway ML',
    logoKey: 'runway-ml',
    description: 'Platform video AI generatif standar industri perfilman dan visual FX.',
    models: [
      {
        id: 'runway',
        name: 'Runway Gen-3 Alpha Turbo',
        description: 'Generasi video ultra-realistis dengan kontrol arah pencahayaan dan sinematografi profesional.',
        keyType: 'runway',
        keyRequirement: 'Memerlukan Runway API Key',
        tags: ['VFX Grade', 'Camera Director', 'Ultra Smooth'],
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logoKey: 'openai',
    description: 'Model video simulasi dunia nyata dan fisika sinematik.',
    models: [
      {
        id: 'sora',
        name: 'OpenAI Sora Turbo',
        description: 'Model simulasi dunia nyata dan fisika sinematik dengan pergerakan objek dinamis.',
        keyType: 'openai',
        keyRequirement: 'Memerlukan OpenAI API Key',
        tags: ['World Physics', '1080p Cinema', 'Dynamic Motion'],
      },
    ],
  },
  {
    id: 'stability-ai',
    name: 'Stability AI',
    logoKey: 'stability-ai',
    badge: 'FREE',
    description: 'Model video sinematik open-weight untuk industri kreatif.',
    models: [
      {
        id: 'svd',
        name: 'Stable Video Diffusion',
        description: 'Generator gerakan video dari gambar dengan kontrol fps dan stabilitas frame tinggi.',
        keyType: 'free',
        keyRequirement: 'Gratis / Client Stream',
        tags: ['Image-to-Video', 'Smooth FPS', 'Neural Motion'],
      },
    ],
  },
  {
    id: 'pika-labs',
    name: 'Pika Labs',
    logoKey: 'pika-labs',
    description: 'Platform pembuatan video AI dengan kontrol timeline dan editing.',
    models: [
      {
        id: 'pika',
        name: 'Pika 1.0 Studio',
        description: 'Platform pembuatan video AI dengan editor timeline dan kontrol frame-by-frame untuk kreasi presisi tinggi.',
        keyType: 'pika',
        keyRequirement: 'Memerlukan Pika API Key',
        tags: ['Timeline Editor', 'Frame Control', 'Precision Edit'],
      },
    ],
  },
];

interface VideoModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export function VideoModelSelectorModal({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
}: VideoModelSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const openSettingsTab = useSettingsStore((s) => s.openSettingsTab);
  const language = useSettingsStore((s) => s.language);
  const hasConfiguredKey = useSettingsStore((s) => s.hasConfiguredKey);

  const KEY_TYPE_TO_PROVIDER: Record<string, string> = {
    openai: 'openai', runway: 'runway', pika: 'pika',
  };

  const providerKeyMissing = (provider: VideoProviderInfo) => {
    const nonFreeKeyType = provider.models.find((m) => m.keyType !== 'free')?.keyType;
    if (!nonFreeKeyType) return false; // all free
    const storeId = KEY_TYPE_TO_PROVIDER[nonFreeKeyType];
    if (!storeId) return false;
    return !hasConfiguredKey(storeId as any);
  };

  // Find provider containing the currently selected model
  const initialProvider = React.useMemo(() => {
    const found = VIDEO_PROVIDERS.find((p) => p.models.some((m) => m.id === selectedModelId));
    return found ? found.id : VIDEO_PROVIDERS[0]?.id || '';
  }, [selectedModelId]);

  const [activeProviderId, setActiveProviderId] = useState<string>(initialProvider);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const found = VIDEO_PROVIDERS.find((p) => p.models.some((m) => m.id === selectedModelId));
      if (found) {
        setActiveProviderId(found.id);
      } else if (VIDEO_PROVIDERS.length > 0) {
        setActiveProviderId(VIDEO_PROVIDERS[0].id);
      }
    }
  }, [isOpen, selectedModelId]);

  if (!isOpen || !mounted) return null;

  const currentProvider = VIDEO_PROVIDERS.find((p) => p.id === activeProviderId) || VIDEO_PROVIDERS[0];
  const currentModels = currentProvider?.models || [];

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
                background: 'rgba(251, 113, 133, 0.12)',
                color: '#fb7185',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={18} />
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
                  {language === 'id' ? 'Model Video & Animasi' : 'Video & Animation Models'}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    color: '#fb7185',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  🎬 {language === 'id' ? 'Mode Video' : 'Video Mode'}
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
              <KeyRound size={13} color="#fb7185" />
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
              gap: '4px',
              flexShrink: 0,
            }}
          >
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
              {language === 'id' ? 'Penyedia Layanan' : 'Supported Providers'} ({VIDEO_PROVIDERS.length})
            </div>

            {VIDEO_PROVIDERS.map((provider) => {
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
                    borderColor: active ? '#fb7185' : 'transparent',
                    background: active ? 'rgba(251, 113, 133, 0.08)' : 'transparent',
                    color: active ? '#fb7185' : 'var(--text-primary)',
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
                        {(provider.badge === 'FREE' || provider.models.every((m) => m.keyType === 'free')) && (
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
                      title={provider.models.every((m) => m.keyType === 'free') ? 'Free & Ready' : 'API Key Configured'}
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
                      border: `1.5px solid ${isSelected ? '#fb7185' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(251, 113, 133, 0.04)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 0 1px #fb7185' : 'none',
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
                            color: isSelected ? '#fb7185' : 'var(--text-primary)',
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
                                  : 'rgba(251, 113, 133, 0.08)',
                              color:
                                tag.includes('Gratis') || tag.includes('Free')
                                  ? 'var(--accent-success)'
                                  : '#fb7185',
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
                        border: `2px solid ${isSelected ? '#fb7185' : 'var(--border-strong)'}`,
                        background: isSelected ? '#fb7185' : 'transparent',
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
