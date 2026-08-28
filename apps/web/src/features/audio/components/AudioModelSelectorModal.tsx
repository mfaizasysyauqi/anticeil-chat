'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Music, Check, Key } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface AudioModelInfo {
  id: string;
  name: string;
  provider: string;
  keyType: 'free' | 'openai' | 'gemini' | 'elevenlabs' | 'custom';
  keyRequirement: string;
  description: string;
  badge?: string;
  category: 'speech' | 'music' | 'both';
}

interface AudioModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export const AUDIO_MODELS: AudioModelInfo[] = [
  {
    id: 'microsoft-tts',
    name: 'Microsoft Edge Neural TTS',
    provider: 'Microsoft Azure AI',
    keyType: 'free',
    keyRequirement: 'Gratis via Edge Neural Engine',
    description: 'Sintesis suara manusia alami bahasa Indonesia (Gadis, Ardi) dan global dengan aksen presisi.',
    badge: '100% Gratis',
    category: 'speech',
  },
  {
    id: 'google-tts',
    name: 'Google Cloud TTS (Journey & Chirp)',
    provider: 'Google Cloud AI / DeepMind',
    keyType: 'gemini',
    keyRequirement: 'Memerlukan Gemini / Google Cloud Key',
    description: 'Sintesis vokal ekspresif generasi terbaru dari Google DeepMind (Journey, Studio, Chirp HD).',
    category: 'speech',
  },
  {
    id: 'openai-tts',
    name: 'OpenAI TTS-1 HD',
    provider: 'OpenAI',
    keyType: 'openai',
    keyRequirement: 'Memerlukan OpenAI API Key',
    description: 'Sintesis narasi & suara fidelitas tinggi dari OpenAI (Alloy, Echo, Onyx, Shimmer).',
    category: 'speech',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs Turbo v2.5',
    provider: 'ElevenLabs',
    keyType: 'elevenlabs',
    keyRequirement: 'Memerlukan ElevenLabs API Key',
    description: 'Kloning suara dan sintesis vokal paling emosional dan natural di dunia.',
    category: 'speech',
  },
  {
    id: 'suno',
    name: 'Suno v4',
    provider: 'Suno AI',
    keyType: 'free',
    keyRequirement: 'Gratis / Audio Stream',
    description: 'Menciptakan lagu lengkap dengan lirik, vokal, dan aransemen instrumen.',
    badge: '100% Gratis',
    category: 'music',
  },
  {
    id: 'udio',
    name: 'Udio Music v1.5',
    provider: 'Udio AI',
    keyType: 'free',
    keyRequirement: 'Gratis / Music Stream',
    description: 'Generator musik AI dengan kontrol gaya, tempo, dan mood yang mendalam.',
    badge: '100% Gratis',
    category: 'music',
  },
];

export function AudioModelSelectorModal({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
}: AudioModelSelectorModalProps) {
  const language = useSettingsStore((s) => s.language);

  if (!isOpen) return null;

  const selectedModel = AUDIO_MODELS.find((m) => m.id === selectedModelId);
  const speechModels = AUDIO_MODELS.filter((m) => m.category === 'speech');
  const musicModels = AUDIO_MODELS.filter((m) => m.category === 'music');

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
            <Music size={22} color="#60a5fa" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Audio, Speech & Music Models' : 'Audio, Speech & Music Models'}
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
          {/* Speech Models Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
              {language === 'id' ? 'PENYEDIA SUARA & NARASI' : 'SPEECH & NARRATION PROVIDERS'} ({speechModels.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {speechModels.map((model) => {
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
                      border: `2px solid ${isSelected ? '#60a5fa' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(96, 165, 250, 0.08)' : 'var(--bg-card)',
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
                            background: '#60a5fa',
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

          {/* Music Models Section */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
              {language === 'id' ? 'PENYEDIA MUSIK & SFX' : 'MUSIC & SFX PROVIDERS'} ({musicModels.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {musicModels.map((model) => {
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
                      border: `2px solid ${isSelected ? '#60a5fa' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(96, 165, 250, 0.08)' : 'var(--bg-card)',
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
                            background: '#60a5fa',
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
      </div>
    </div>,
    document.body
  );
}
