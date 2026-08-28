'use client';

import React, { useState } from 'react';
import {
  Film,
  Wand2,
  Sparkles,
  Play,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

export function VideoView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            borderRadius: '12px',
            background: 'rgba(251, 113, 133, 0.1)',
            border: '1px solid rgba(251, 113, 133, 0.2)',
            marginBottom: '16px',
          }}
        >
          <Film size={20} color="#fb7185" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fb7185' }}>
            {language === 'id' ? 'Video — Studio AI Visual' : 'Video — AI Visual Studio'}
          </span>
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: '0 0 12px 0',
            color: 'var(--text-primary)',
          }}
        >
          {language === 'id' ? 'Buat Video AI' : 'Generate AI Video'}
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {language === 'id'
            ? 'Ubah teks menjadi video berkualitas tinggi dengan AI generatif'
            : 'Transform text into high-quality videos with generative AI'}
        </p>
      </div>

      {/* Prompt Input */}
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          marginBottom: '24px',
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            language === 'id'
              ? 'Jelaskan video yang ingin Anda buat (contoh: Drone shot dari pantai tropis saat matahari terbenam, ombak yang tenang, kelapa melambai)...'
              : 'Describe the video you want to create (e.g., Drone shot of tropical beach at sunset, calm waves, swaying palms)...'
          }
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: 1.6,
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 24px',
          borderRadius: '10px',
          background: isGenerating ? 'var(--bg-subtle)' : '#fb7185',
          border: 'none',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
          opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {isGenerating ? (
          <>
            <Wand2 size={16} className="animate-spin" />
            <span>{language === 'id' ? 'Membuat Video...' : 'Generating Video...'}</span>
          </>
        ) : (
          <>
            <Play size={16} />
            <span>{language === 'id' ? 'Buat Video' : 'Generate Video'}</span>
          </>
        )}
      </button>

      {/* Recent Generations */}
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          marginTop: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={18} color="#fb7185" />
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            {language === 'id' ? 'Video Terbaru' : 'Recent Videos'}
          </h2>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            0
          </span>
        </div>

        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <Film size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'id' ? 'Belum ada video yang dibuat' : 'No videos generated yet'}
          </p>
        </div>
      </div>
    </div>
  );
}
