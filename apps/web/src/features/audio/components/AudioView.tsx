'use client';

import React, { useState } from 'react';
import {
  Music,
  Wand2,
  Mic,
  Radio,
  ArrowUp,
  Volume2,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

export function AudioView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('gadis');
  const [audioSpeed, setAudioSpeed] = useState(1.0);

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
              language === 'id'
                ? 'Ketik narasi atau musik yang ingin disuarakan (contoh: Selamat datang di Anticeil AI, asisten produktivitas cerdas masa depan)...'
                : 'Type the narration or music prompt you want to voice (e.g. Welcome to Anticeil AI, your privacy-first intelligent assistant)...'
            }
            rows={3}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              marginBottom: '8px',
            }}
          />

          {/* Control Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            {/* Left: Model Selector + Voice Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Model Selector Button */}
              <button
                type="button"
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Mic size={13} color="#60a5fa" />
                <span>Microsoft Edge Neural TTS</span>
              </button>

              {/* Voice Selector Dropdown */}
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>

              {/* Speed Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {speeds.map((speed) => (
                  <button
                    key={speed.value}
                    type="button"
                    onClick={() => setAudioSpeed(speed.value)}
                    className="clickable-pill"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: audioSpeed === speed.value ? '#60a5fa' : 'var(--bg-subtle)',
                      color: audioSpeed === speed.value ? '#fff' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: audioSpeed === speed.value ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Generate Button */}
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: isGenerating || !prompt.trim() ? 'var(--bg-subtle)' : '#60a5fa',
                color: '#fff',
                cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {isGenerating ? <Wand2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </div>
        </form>

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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
              100% {language === 'id' ? 'Gratis' : 'Free'} • {language === 'id' ? 'Sintesis Neural Sisi-Klien' : 'Client-Side Neural Synthesis'}
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
