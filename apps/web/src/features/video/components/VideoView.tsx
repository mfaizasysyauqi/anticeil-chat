'use client';

import React, { useState } from 'react';
import {
  Film,
  Wand2,
  Sparkles,
  ArrowUp,
  Ratio,
  Clock,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

export function VideoView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('1:1');

  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];
  const durations = ['1:1', '16:9', '9:16', '4:3', '3:2'];

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
                ? 'Jelaskan video yang ingin Anda buat secara detail (contoh: Drone terbang di atas hutan hujan tropis, 4K sinematik)...'
                : 'Describe the video you want to generate in detail (e.g. Drone flying over tropical rainforest, 4K cinematic)...'
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
            {/* Left: Model Selector + Options */}
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
                <Film size={13} color="#fb7185" />
                <span>Luma Ray 2</span>
              </button>

              {/* Ratio Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {ratios.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setSelectedRatio(ratio)}
                    className="clickable-pill"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedRatio === ratio ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                      color: selectedRatio === ratio ? '#fff' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: selectedRatio === ratio ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Duration Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {['1:1', '16:9', '9:16', '4:3', '3:2'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className="clickable-pill"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: selectedDuration === dur ? '#fb7185' : 'var(--bg-subtle)',
                      color: selectedDuration === dur ? '#fff' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: selectedDuration === dur ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {dur}
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
                background: isGenerating || !prompt.trim() ? 'var(--bg-subtle)' : '#fb7185',
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
