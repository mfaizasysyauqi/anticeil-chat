'use client';

import React, { useState } from 'react';
import {
  Music,
  Wand2,
  Sparkles,
  Mic,
  Radio,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

export function AudioView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioType, setAudioType] = useState<'speech' | 'music' | 'sfx'>('speech');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const audioTypes = [
    { id: 'speech' as const, label: language === 'id' ? 'Suara' : 'Speech', icon: <Mic size={14} /> },
    { id: 'music' as const, label: language === 'id' ? 'Musik' : 'Music', icon: <Music size={14} /> },
    { id: 'sfx' as const, label: language === 'id' ? 'Efek' : 'SFX', icon: <Radio size={14} /> },
  ];

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
            background: 'rgba(96, 165, 250, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            marginBottom: '16px',
          }}
        >
          <Music size={20} color="#60a5fa" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa' }}>
            {language === 'id' ? 'Audio — Studio AI Suara' : 'Audio — AI Sound Studio'}
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
          {language === 'id' ? 'Buat Audio AI' : 'Generate AI Audio'}
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
            ? 'Ciptakan suara, musik, dan efek audio dengan AI generatif'
            : 'Create speech, music, and sound effects with generative AI'}
        </p>
      </div>

      {/* Audio Type Selector */}
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '4px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {audioTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setAudioType(type.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '7px',
                background: audioType === type.id ? '#60a5fa' : 'transparent',
                border: 'none',
                color: audioType === type.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: audioType === type.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>
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
            audioType === 'speech'
              ? language === 'id'
                ? 'Tulis teks yang ingin diucapkan dengan suara natural...'
                : 'Write the text you want spoken with natural voice...'
              : audioType === 'music'
              ? language === 'id'
                ? 'Jelaskan musik yang ingin Anda ciptakan (contoh: Lagu pop ceria dengan gitar akustik dan piano)...'
                : 'Describe the music you want to create (e.g., Upbeat pop song with acoustic guitar and piano)...'
              : language === 'id'
              ? 'Jelaskan efek suara yang Anda butuhkan (contoh: Suara hujan deras dengan petir di kejauhan)...'
              : 'Describe the sound effect you need (e.g., Heavy rain with distant thunder)...'
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
          background: isGenerating ? 'var(--bg-subtle)' : '#60a5fa',
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
            <span>{language === 'id' ? 'Membuat Audio...' : 'Generating Audio...'}</span>
          </>
        ) : (
          <>
            <Mic size={16} />
            <span>{language === 'id' ? 'Buat Audio' : 'Generate Audio'}</span>
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
          <Sparkles size={18} color="#60a5fa" />
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            {language === 'id' ? 'Audio Terbaru' : 'Recent Audio'}
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
          <Music size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'id' ? 'Belum ada audio yang dibuat' : 'No audio generated yet'}
          </p>
        </div>
      </div>
    </div>
  );
}
