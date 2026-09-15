'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, KeyRound, CheckCircle2, Eye, EyeOff, ExternalLink, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

interface ApiKeyEntry {
  providerId: string;
  label: string;
  placeholder: string;
  helpText: string;
  helpUrl?: string;
  helpUrlLabel?: string;
  capability: ('image' | 'audio')[];
}

const API_KEY_ENTRIES: ApiKeyEntry[] = [
  {
    providerId: 'gemini',
    label: 'Google Gemini / AI Studio API Key',
    placeholder: 'AIza...',
    helpText: 'Diperlukan untuk Imagen 3, Google TTS. Dapatkan gratis di Google AI Studio.',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpUrlLabel: 'aistudio.google.com',
    capability: ['image', 'audio'],
  },
  {
    providerId: 'openai',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    helpText: 'Diperlukan untuk DALL-E 3 (image) dan TTS-1 HD (audio).',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpUrlLabel: 'platform.openai.com',
    capability: ['image', 'audio'],
  },
  {
    providerId: 'stability',
    label: 'Stability AI API Key',
    placeholder: 'sk-...',
    helpText: 'Diperlukan untuk Stable Diffusion XL via Stability API.',
    helpUrl: 'https://platform.stability.ai/account/keys',
    helpUrlLabel: 'platform.stability.ai',
    capability: ['image'],
  },
  {
    providerId: 'elevenlabs',
    label: 'ElevenLabs API Key',
    placeholder: 'el_...',
    helpText: 'Diperlukan untuk ElevenLabs voice synthesis (Turbo v2.5 & Multilingual v2).',
    helpUrl: 'https://elevenlabs.io/app/settings/api-keys',
    helpUrlLabel: 'elevenlabs.io',
    capability: ['audio'],
  },
];

interface MediaApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'image' | 'audio';
}

export function MediaApiKeyModal({ isOpen, onClose, mode }: MediaApiKeyModalProps) {
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const language = useSettingsStore((s) => s.language);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const filtered = API_KEY_ENTRIES.filter((e) => e.capability.includes(mode));

  const handleSave = (entry: ApiKeyEntry) => {
    const val = (inputs[entry.providerId] || '').trim();
    if (!val) return;
    setApiKey(entry.providerId as any, val);
    setSaved((prev) => ({ ...prev, [entry.providerId]: true }));
    setInputs((prev) => ({ ...prev, [entry.providerId]: '' }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [entry.providerId]: false })), 2500);
  };

  const hasExistingKey = (providerId: string): boolean => {
    const keys = apiKeys as any;
    const val = keys?.[providerId]?.key || keys?.[providerId] || '';
    return typeof val === 'string' && val.length > 0;
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          margin: '0 16px',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border-strong)',
          backgroundColor: 'var(--bg-main)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '10px',
              background: 'var(--brand-subtle)',
              border: '1px solid var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={16} color="var(--brand-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'id'
                  ? `API Key untuk ${mode === 'image' ? 'Gambar AI' : 'Audio AI'}`
                  : `API Keys for ${mode === 'image' ? 'Image AI' : 'Audio AI'}`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {language === 'id'
                  ? 'Model gratis tidak memerlukan key'
                  : 'Free models require no key'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Key List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((entry) => {
            const existing = hasExistingKey(entry.providerId);
            const isVisible = showKey[entry.providerId];
            const inputVal = inputs[entry.providerId] || '';
            const isSaved = saved[entry.providerId];

            return (
              <div
                key={entry.providerId}
                style={{
                  borderRadius: 'var(--radius-lg, 12px)',
                  border: `1px solid ${existing ? 'rgba(0,200,117,0.3)' : 'var(--border-strong)'}`,
                  backgroundColor: existing ? 'rgba(0,200,117,0.04)' : 'var(--bg-subtle)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Provider header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ProviderBrandLogo provider={entry.providerId} size={20} />
                    <span style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                      {entry.label}
                    </span>
                  </div>
                  {existing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600 }}>
                      <CheckCircle2 size={13} />
                      <span>{language === 'id' ? 'Tersimpan' : 'Saved'}</span>
                    </div>
                  )}
                </div>

                {/* Help text */}
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {entry.helpText}{' '}
                  {entry.helpUrl && (
                    <a
                      href={entry.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--brand-primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                    >
                      {entry.helpUrlLabel}
                      <ExternalLink size={10} />
                    </a>
                  )}
                </p>

                {/* Input + Save */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type={isVisible ? 'text' : 'password'}
                      placeholder={existing
                        ? (language === 'id' ? 'Ganti key...' : 'Replace key...')
                        : entry.placeholder}
                      value={inputVal}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [entry.providerId]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSave(entry); }}
                      style={{
                        width: '100%',
                        padding: '8px 36px 8px 11px',
                        fontSize: '12.5px',
                        fontFamily: 'monospace',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((prev) => ({ ...prev, [entry.providerId]: !prev[entry.providerId] }))}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSave(entry)}
                    disabled={!inputVal.trim()}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 650,
                      cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
                      backgroundColor: isSaved
                        ? 'var(--accent-success)'
                        : inputVal.trim()
                        ? 'var(--brand-primary)'
                        : 'var(--bg-surface)',
                      color: inputVal.trim() ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isSaved ? (language === 'id' ? 'Tersimpan ✓' : 'Saved ✓') : (language === 'id' ? 'Simpan' : 'Save')}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Free models note */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '11px 14px',
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'rgba(0,200,117,0.06)',
            border: '1px solid rgba(0,200,117,0.2)',
          }}>
            <AlertCircle size={14} color="var(--accent-success)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {language === 'id'
                ? 'Model berlabel FREE (FLUX, SDXL, Microsoft TTS, Fish Speech, dll.) tidak memerlukan API key — langsung dapat digunakan.'
                : 'Models labeled FREE (FLUX, SDXL, Microsoft TTS, Fish Speech, etc.) require no API key — ready to use immediately.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
