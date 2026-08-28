'use client';

import React, { useState } from 'react';
import {
  Music,
  Wand2,
  Mic,
  Radio,
  ArrowUp,
  Volume2,
  ChevronDown,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { AudioModelSelectorModal, AUDIO_PROVIDERS } from './AudioModelSelectorModal';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { MediaControlButton } from '../../../shared/components/MediaControlButton';

export function AudioView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('gadis');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [selectedModel, setSelectedModel] = useState('microsoft-tts');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  // Find current provider and model for display name
  const currentProvider = AUDIO_PROVIDERS.find((p) =>
    p.models.some((m) => m.id === selectedModel)
  );
  const currentModelInfo = currentProvider?.models.find((m) => m.id === selectedModel);
  const modelDisplayName = currentModelInfo?.name || selectedModel;

  const voices = [
    { id: 'gadis', label: 'Gadis Indonesia' },
    { id: 'pria', label: 'Pria Indonesia' },
    { id: 'girl', label: 'Girl English' },
    { id: 'man', label: 'Man English' },
  ];

  const speeds = [
    { value: 0.75, label: '0.75' },
    { value: 1.0, label: '1.0' },
    { value: 1.25, label: '1.25' },
    { value: 1.5, label: '1.5' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setPrompt('');
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🎵</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {language === 'id' ? 'Audio — Studio Sintesis Suara' : 'Audio — Voice Synthesizer Studio'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {language === 'id'
              ? 'Ciptakan suara narasi, musik, dan efek audio dengan AI generatif berkualitas tinggi.'
              : 'Generate voice narration, music, and sound effects with high-quality generative AI.'}
          </p>
        </div>

        {/* ── Prompt Card (Chat-style elegant floating input) ── */}
        <AudioModelSelectorModal
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          selectedModelId={selectedModel}
          onSelectModel={(id) => setSelectedModel(id)}
        />

        <MediaPromptForm
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleGenerate}
          isGenerating={isGenerating}
          placeholder={
            language === 'id'
              ? 'Ketik narasi atau musik yang ingin disuarakan (contoh: Selamat datang di Anticeil AI, asisten produktivitas cerdas masa depan)...'
              : 'Type the narration or music prompt you want to voice (e.g. Welcome to Anticeil AI, your privacy-first intelligent assistant)...'
          }
          modelDisplayName={modelDisplayName}
          onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
          language={language}
          brandColor="#60a5fa"
          additionalControls={
            <>
              {/* Voice Selector Dropdown */}
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>

              {/* Separator between Voice and Speed */}
              <div
                style={{
                  width: '1px',
                  height: '24px',
                  background: 'var(--border-subtle)',
                  flexShrink: 0,
                }}
              />

              {/* Speed Selector */}
              {speeds.map((speed) => (
                <MediaControlButton
                  key={speed.value}
                  label={`${speed.label}x`}
                  isSelected={audioSpeed === speed.value}
                  onClick={() => setAudioSpeed(speed.value)}
                  brandColor="#60a5fa"
                />
              ))}
            </>
          }
        />

        {/* ── Recent Generations Section ── */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Music size={18} color="#60a5fa" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              {language === 'id' ? 'Audio & Sintesis Suara' : 'Audio & Voice Synthesizer Studio'}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              0
            </span>
          </div>

          {/* Empty State */}
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px dashed var(--border-subtle)',
              background: 'var(--bg-card)',
            }}
          >
            <Music size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              {language === 'id' ? 'Belum ada audio yang dibuat' : 'No audio generated yet'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {language === 'id' ? 'Ketik prompt di atas untuk memulai generasi audio' : 'Type a prompt above to start generating audio'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
