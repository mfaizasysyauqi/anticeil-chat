'use client';

import React, { useState } from 'react';
import { Music, Mic, Ear, Sparkles, Volume2, Gauge } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { AudioModelSelectorModal, AUDIO_PROVIDERS } from './AudioModelSelectorModal';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { MediaControlButton } from '../../../shared/components/MediaControlButton';

type AudioTab = 'music' | 'tts' | 'stt';

const TABS: { id: AudioTab; icon: React.ReactNode; labelId: string; labelEn: string }[] = [
  { id: 'music', icon: <Music size={15} />, labelId: 'Musik', labelEn: 'Music' },
  { id: 'tts', icon: <Mic size={15} />, labelId: 'Text→Speech', labelEn: 'Text→Speech' },
  { id: 'stt', icon: <Ear size={15} />, labelId: 'Speech→Text', labelEn: 'Speech→Text' },
];

export function AudioView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<AudioTab>('music');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('gadis');
  const [audioSpeed, setAudioSpeed] = useState(1.0);

  // Model state separated per category/tab
  const [selectedMusicModel, setSelectedMusicModel] = useState('udio');
  const [selectedTtsModel, setSelectedTtsModel] = useState('microsoft-tts');
  const [selectedSttModel, setSelectedSttModel] = useState('whisper-free');

  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const activeModelId =
    activeTab === 'music'
      ? selectedMusicModel
      : activeTab === 'tts'
      ? selectedTtsModel
      : selectedSttModel;

  const handleSelectModel = (id: string) => {
    if (activeTab === 'music') setSelectedMusicModel(id);
    else if (activeTab === 'tts') setSelectedTtsModel(id);
    else setSelectedSttModel(id);
  };

  const currentProvider = AUDIO_PROVIDERS.find((p) =>
    p.models.some((m) => m.id === activeModelId)
  );
  const currentModelInfo = currentProvider?.models.find((m) => m.id === activeModelId);
  const modelDisplayName = currentModelInfo?.name || activeModelId;

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

    // Credit check & deduction for Anticeil Free audio models
    const isAnticeilFree = currentProvider?.id?.startsWith('anticeil') || currentModelInfo?.keyType === 'free' || currentModelInfo?.keyType === 'microsoft';
    if (isAnticeilFree) {
      const allowed = useCreditStore.getState().deductCredits('audio', 'anticeil');
      if (!allowed) return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
              {language === 'id' ? 'Audio — Studio AI' : 'Audio — AI Studio'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {language === 'id'
              ? 'Ciptakan musik, sintesis suara, dan transkripsi audio dengan AI generatif.'
              : 'Generate music, synthesize speech, and transcribe audio with generative AI.'}
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            width: 'fit-content',
            gap: '4px',
            padding: '4px',
            borderRadius: '12px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 650 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.12))' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {tab.icon}
                {language === 'id' ? tab.labelId : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Modal */}
        <AudioModelSelectorModal
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          category={activeTab}
          selectedModelId={activeModelId}
          onSelectModel={handleSelectModel}
        />

        {/* Music Tab */}
        {activeTab === 'music' && (
          <>
            <MediaPromptForm
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              placeholder={
                language === 'id'
                  ? 'Deskripsikan musik yang ingin dibuat...'
                  : 'Describe the music you want to generate...'
              }
              modelDisplayName={modelDisplayName}
              onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
              language={language}
              brandColor="#60a5fa"
            />
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Music size={18} color="#60a5fa" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  {language === 'id' ? 'Musik yang Dibuat' : 'Generated Music'}
                </h2>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 7px', borderRadius: '10px' }}>0</span>
              </div>
              <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-subtle)', background: 'var(--bg-card)' }}>
                <Music size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{language === 'id' ? 'Belum ada musik yang dibuat' : 'No music generated yet'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{language === 'id' ? 'Ketik prompt di atas untuk mulai' : 'Type a prompt above to start'}</p>
              </div>
            </div>
          </>
        )}

        {/* Text → Speech Tab */}
        {activeTab === 'tts' && (
          <>
            <MediaPromptForm
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              placeholder={
                language === 'id'
                  ? 'Ketik teks yang ingin disuarakan...'
                  : 'Type the text to synthesize...'
              }
              modelDisplayName={modelDisplayName}
              onModelSelectorOpen={() => setIsModelSelectorOpen(true)}
              language={language}
              brandColor="#60a5fa"
              additionalControls={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Voice Selector Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Volume2 size={13} color="var(--text-muted)" style={{ marginRight: '2px', flexShrink: 0 }} />
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md, 6px)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#60a5fa';
                        e.currentTarget.style.background = 'var(--bg-surface)';
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
                  </div>

                  {/* Distinct Vertical Separator */}
                  <div
                    style={{
                      width: '1px',
                      height: '18px',
                      backgroundColor: 'var(--border-strong, rgba(0,0,0,0.15))',
                      margin: '0 2px',
                      flexShrink: 0,
                    }}
                  />

                  {/* Speed Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={13} color="var(--text-muted)" style={{ marginRight: '2px', flexShrink: 0 }} />
                    {speeds.map((speed) => (
                      <MediaControlButton
                        key={speed.value}
                        label={`${speed.label}x`}
                        isSelected={audioSpeed === speed.value}
                        onClick={() => setAudioSpeed(speed.value)}
                        brandColor="#60a5fa"
                      />
                    ))}
                  </div>
                </div>
              }
            />
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Mic size={18} color="#60a5fa" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{language === 'id' ? 'Suara yang Dibuat' : 'Generated Speech'}</h2>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 7px', borderRadius: '10px' }}>0</span>
              </div>
              <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-subtle)', background: 'var(--bg-card)' }}>
                <Mic size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{language === 'id' ? 'Belum ada suara yang dibuat' : 'No speech generated yet'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{language === 'id' ? 'Ketik teks di atas untuk mulai' : 'Type text above to start'}</p>
              </div>
            </div>
          </>
        )}

        {/* Speech → Text Tab */}
        {activeTab === 'stt' && (
          <div>
            {/* STT Model Selector Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(96, 165, 250, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {language === 'id' ? 'Engine Transkripsi AI' : 'AI Transcription Engine'}
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {modelDisplayName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  color: '#60a5fa',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                  e.currentTarget.style.background = 'rgba(96,165,250,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                }}
              >
                <span>⚙️ {language === 'id' ? 'Ganti Model' : 'Switch Model'}</span>
              </button>
            </div>

            <div
              style={{ border: '2px dashed var(--border-subtle)', borderRadius: '16px', padding: '56px 24px', textAlign: 'center', background: 'var(--bg-card)', transition: 'border-color 0.2s ease', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60a5fa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <Ear size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{language === 'id' ? 'Upload atau rekam audio' : 'Upload or record audio'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>{language === 'id' ? 'Mendukung MP3, WAV, M4A, OGG hingga 25MB' : 'Supports MP3, WAV, M4A, OGG up to 25MB'}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" style={{ padding: '9px 20px', borderRadius: '9px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  📁 {language === 'id' ? 'Pilih File' : 'Choose File'}
                </button>
                <button type="button" style={{ padding: '9px 20px', borderRadius: '9px', border: '1px solid rgba(96,165,250,0.4)', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.18)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.1)'; }}>
                  🎙️ {language === 'id' ? 'Rekam Sekarang' : 'Record Now'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Ear size={18} color="#60a5fa" />
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{language === 'id' ? 'Hasil Transkripsi' : 'Transcription Result'}</h2>
              </div>
              <div style={{ minHeight: '120px', borderRadius: '12px', border: '1px dashed var(--border-subtle)', background: 'var(--bg-card)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>{language === 'id' ? 'Transkripsi akan muncul di sini setelah audio diproses' : 'Transcription will appear here after audio is processed'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
