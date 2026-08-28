'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Film, Check, Key } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface VideoModelInfo {
  id: string;
  name: string;
  provider: string;
  keyType: 'free' | 'openai' | 'custom';
  keyRequirement: string;
  description: string;
  badge?: string;
}

interface VideoModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export const VIDEO_MODELS: VideoModelInfo[] = [
  {
    id: 'luma',
    name: 'Luma Ray 2 (Dream Machine)',
    provider: 'Luma AI',
    keyType: 'free',
    keyRequirement: 'Gratis / Client Stream',
    description: 'Sintesis video dinamis dengan pergerakan kamera sinematik yang mulus.',
    badge: '100% Gratis',
  },
  {
    id: 'kling',
    name: 'Kling AI v1.6',
    provider: 'Kuaishou AI',
    keyType: 'free',
    keyRequirement: 'Gratis / Direct Stream',
    description: 'Generator video gerak realistis untuk animasi karakter dan lanskap.',
    badge: '100% Gratis',
  },
  {
    id: 'runway',
    name: 'Runway Gen-3 Alpha',
    provider: 'Runway ML',
    keyType: 'custom',
    keyRequirement: 'Memerlukan Runway API Key',
    description: 'Model video generatif tingkat profesional dengan kontrol presisi tinggi.',
  },
  {
    id: 'sora',
    name: 'OpenAI Sora',
    provider: 'OpenAI',
    keyType: 'openai',
    keyRequirement: 'Memerlukan OpenAI API Key',
    description: 'Model video fisika dunia nyata mutakhir dari OpenAI dengan simulasi kompleks.',
  },
  {
    id: 'pika',
    name: 'Pika 1.0',
    provider: 'Pika Labs',
    keyType: 'custom',
    keyRequirement: 'Memerlukan Pika API Key',
    description: 'Platform pembuatan video AI dengan editor timeline dan kontrol frame-by-frame.',
  },
];

export function VideoModelSelectorModal({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
}: VideoModelSelectorModalProps) {
  const language = useSettingsStore((s) => s.language);

  if (!isOpen) return null;

  const selectedModel = VIDEO_MODELS.find((m) => m.id === selectedModelId);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Film size={22} color="#fb7185" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Model Video & Motion' : 'Video & Motion Models'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id'
                  ? 'Pilih provider dan model generatif yang disesuaikan untuk tipe generasi ini.'
                  : 'Select a generative provider and model tailored for this generation type.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
              {language === 'id' ? 'PENYEDIA YANG DIDUKUNG' : 'SUPPORTED PROVIDERS'} ({VIDEO_MODELS.length})
            </h3>
          </div>

          {/* Models Grid */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {VIDEO_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    onClose();
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? '#fb7185' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(251, 113, 133, 0.08)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {model.name}
                        </h4>
                        {model.badge && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: '#10b981',
                              color: '#fff',
                            }}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                        {model.provider}
                      </p>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#fb7185',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    {model.description}
                  </p>

                  {/* Key Requirement */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: model.keyType === 'free' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      border: `1px solid ${model.keyType === 'free' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`,
                      width: 'fit-content',
                    }}
                  >
                    {model.keyType === 'free' ? (
                      <Check size={12} color="#10b981" />
                    ) : (
                      <Key size={12} color="#fbbf24" />
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: model.keyType === 'free' ? '#10b981' : '#fbbf24' }}>
                      {model.keyRequirement}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
