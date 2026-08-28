'use client';

import React, { useState } from 'react';
import {
  Film,
  Wand2,
  Sparkles,
  ArrowUp,
  Ratio,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { VideoModelSelectorModal, VIDEO_PROVIDERS } from './VideoModelSelectorModal';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { MediaControlButton } from '../../../shared/components/MediaControlButton';

export function VideoView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('3:2');
  const [selectedModel, setSelectedModel] = useState('luma');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];
  const durations = ['3s', '5s', '10s'];

  // Find current provider and model for display name
  const currentProvider = VIDEO_PROVIDERS.find((p) =>
    p.models.some((m) => m.id === selectedModel)
  );
  const currentModelInfo = currentProvider?.models.find((m) => m.id === selectedModel);
  const modelDisplayName = currentModelInfo?.name || selectedModel;

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
            <span style={{ fontSize: '24px' }}>🎬</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {language === 'id' ? 'Video — Studio AI Visual' : 'Video — AI Visual Studio'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {language === 'id'
              ? 'Buat video berkualitas tinggi dari deskripsi teks dengan AI generatif.'
              : 'Generate high-resolution video art, concept designs, and motion content directly from your client.'}
          </p>
        </div>

        {/* ── Prompt Card (Chat-style elegant floating input) ── */}
        <VideoModelSelectorModal
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
              ? 'Jelaskan video yang ingin Anda buat secara detail (contoh: Drone terbang di atas hutan hujan tropis, 4K sinematik)...'
              : 'Describe the video you want to generate in detail (e.g. Drone flying over tropical rainforest, 4K cinematic)...'
          }
          modelDisplayName={modelDisplayName}
          onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
          language={language}
          brandColor="#fb7185"
          additionalControls={
            <>
              {/* Ratio Selector */}
              {ratios.map((ratio) => (
                <MediaControlButton
                  key={ratio}
                  label={ratio}
                  isSelected={selectedRatio === ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  brandColor="#fb7185"
                />
              ))}

              {/* Separator between Ratio and Duration */}
              <div
                style={{
                  width: '1px',
                  height: '24px',
                  background: 'var(--border-subtle)',
                  flexShrink: 0,
                }}
              />

              {/* Duration Chips */}
              {durations.map((dur) => (
                <MediaControlButton
                  key={dur}
                  label={dur}
                  isSelected={selectedDuration === dur}
                  onClick={() => setSelectedDuration(dur)}
                  brandColor="#fb7185"
                />
              ))}
            </>
          }
        />

        {/* ── Recent Generations Section ── */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Film size={18} color="#fb7185" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              {language === 'id' ? 'Generasi Video Terbaru' : 'Recent Video Generations'}
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
            <Film size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
              {language === 'id' ? 'Belum ada video yang dibuat' : 'No videos generated yet'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {language === 'id' ? 'Ketik prompt di atas untuk memulai generasi video' : 'Type a prompt above to start generating videos'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
