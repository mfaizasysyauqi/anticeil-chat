'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Mic,
  Ear,
  Sparkles,
  Volume2,
  Gauge,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Trash2,
  Pin,
  Square,
  ChevronDown,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImageStore, ImageMediaItem } from '../../image/store/useImageStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { getTranslation } from '@anticeil/core';
import { AudioModelSelectorModal, AUDIO_PROVIDERS } from './AudioModelSelectorModal';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { MediaControlButton } from '../../../shared/components/MediaControlButton';
import { MediaDetailModal } from '../../../shared/components/MediaDetailModal';
import { MediaCardMenu } from '../../image/components/ImageView';
import { useWorkspaceStore } from '../../storage/store/useWorkspaceStore';
import { generateProceduralMusic, generateSpeechAudio } from '../utils/audioGenerator';

type AudioTab = 'music' | 'tts' | 'stt';

const TABS: { id: AudioTab; icon: React.ReactNode; labelId: string; labelEn: string }[] = [
  { id: 'music', icon: <Music size={15} />, labelId: 'Musik', labelEn: 'Music' },
  { id: 'tts', icon: <Mic size={15} />, labelId: 'Text→Speech', labelEn: 'Text→Speech' },
  { id: 'stt', icon: <Ear size={15} />, labelId: 'Speech→Text', labelEn: 'Speech→Text' },
];

export function AudioView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const session = useAuthStore((s) => s.session);

  const [activeTab, setActiveTab] = useState<AudioTab>('music');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('gadis');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);

  // Model state separated per category/tab
  const [selectedMusicModel, setSelectedMusicModel] = useState('udio');
  const [selectedTtsModel, setSelectedTtsModel] = useState('microsoft-tts');
  const [selectedSttModel, setSelectedSttModel] = useState('whisper-free');

  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // STT Microphone State
  const [isRecording, setIsRecording] = useState(false);
  const [sttTranscript, setSttTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  const addImageItem = useImageStore((s) => s.addItem);
  const removeImageItem = useImageStore((s) => s.removeItem);
  const toggleImagePin = useImageStore((s) => s.togglePin);
  const moveImageToCollection = useImageStore((s) => s.moveToCollection);
  const hydrateFromApi = useImageStore((s) => s.hydrateFromApi);
  const imageItems = useImageStore((s) => s.items);
  const imageCollections = useWorkspaceStore((s) => s.imageCollections);

  const generatedAudios = imageItems
    .filter((i) => i.type === 'audio')
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const musicTracks = generatedAudios.filter((i) => i.category === 'music' || !i.category);
  const speechAudios = generatedAudios.filter((i) => i.category === 'speech');

  // Load history from Supabase once on mount
  useEffect(() => {
    if (session?.access_token) {
      hydrateFromApi(session.access_token);
    }
  }, [session?.access_token]);

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
    { id: 'gadis', label: 'Gadis Indonesia (Natural)' },
    { id: 'pria', label: 'Pria Indonesia (Deep)' },
    { id: 'girl', label: 'Girl English (Clear)' },
    { id: 'man', label: 'Man English (Warm)' },
  ];

  const speeds = [
    { value: 0.75, label: '0.75' },
    { value: 1.0, label: '1.0' },
    { value: 1.25, label: '1.25' },
    { value: 1.5, label: '1.5' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Approx 1.5 MB storage check
    const estimatedBytes = 1.5 * 1024 * 1024;
    if (!canFit(estimatedBytes)) {
      alert(
        language === 'id'
          ? 'Kapasitas penyimpanan Anda tidak mencukupi untuk file audio baru.'
          : 'Not enough storage space in your quota.'
      );
      return;
    }

    // Credit check & deduction for Anticeil Free audio models
    const isAnticeilFree =
      currentProvider?.id?.startsWith('anticeil') ||
      currentModelInfo?.keyType === 'free' ||
      currentModelInfo?.keyType === 'microsoft';
    if (isAnticeilFree) {
      const allowed = useCreditStore.getState().deductCredits('audio', 'anticeil');
      if (!allowed) return;
    }

    setIsGenerating(true);
    try {
      let audioResult: { url: string; blob: Blob; durationSec: number };
      const category = activeTab === 'music' ? 'music' : 'speech';

      if (activeTab === 'music') {
        audioResult = await generateProceduralMusic(prompt.trim(), 10);
      } else {
        audioResult = await generateSpeechAudio(prompt.trim(), selectedVoice, audioSpeed);
      }

      let finalUrl = audioResult.url;

      // Attempt R2 / Supabase persistence
      try {
        const res = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'audio',
            prompt: prompt.trim(),
            mediaUrl: audioResult.url,
            metadata: {
              category,
              voice: selectedVoice,
              durationSec: audioResult.durationSec,
              model: currentModelInfo?.name || (activeTab === 'music' ? 'Udio' : 'Microsoft TTS'),
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Audio] Failed to upload audio to R2, using direct blob url:', err);
      }

      const nowIso = new Date().toISOString();
      addImageItem({
        id: String(Date.now()),
        type: 'audio',
        url: finalUrl,
        prompt: prompt.trim(),
        title: prompt.slice(0, 32) + (prompt.length > 32 ? '...' : ''),
        voice: selectedVoice,
        category,
        durationSec: audioResult.durationSec,
        model: currentModelInfo?.name || (activeTab === 'music' ? 'Udio AI' : 'Microsoft Edge TTS'),
        createdAt: nowIso,
        createdAtLabel: 'Just now',
      });

      addUsage(estimatedBytes, 'audio');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }

      setPrompt('');
    } catch (err: any) {
      console.error('[Audio Generation Error]', err);
      alert(language === 'id' ? 'Gagal memproses audio. Silakan coba lagi.' : 'Failed to generate audio.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayToggle = (id: string, url: string) => {
    let audio = audioElementsRef.current[id];
    if (!audio) {
      audio = new Audio(url);
      audioElementsRef.current[id] = audio;
      audio.onended = () => {
        setPlayingAudioId((curr) => (curr === id ? null : curr));
      };
    }

    if (playingAudioId === id) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Pause any other playing audio
      Object.values(audioElementsRef.current).forEach((a) => a.pause());
      audio.play();
      setPlayingAudioId(id);
    }
  };

  const handleCopyPrompt = (pText: string, id: string) => {
    navigator.clipboard.writeText(pText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAudio = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil-audio-${id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // STT Handlers
  const handleToggleRecord = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          language === 'id'
            ? 'Browser Anda tidak mendukung Speech Recognition API. Silakan gunakan Google Chrome atau Microsoft Edge.'
            : 'Your browser does not support Speech Recognition API. Please use Google Chrome or Microsoft Edge.'
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language === 'id' ? 'id-ID' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript + ' ';
        }
        setSttTranscript(text.trim());
      };
      recognition.onerror = (e: any) => {
        console.warn('[STT Error]', e);
        setIsRecording(false);
      };
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const renderAudioList = (items: ImageMediaItem[], emptyIcon: React.ReactNode, emptyText: string) => {
    if (items.length === 0) {
      return (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)' }}>
            {emptyIcon}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{emptyText}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'id' ? 'Ketik prompt di atas untuk mulai' : 'Type a prompt above to start'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item) => {
          const isPlaying = playingAudioId === item.id;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                gap: '12px',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.06))',
              }}
            >
              {/* Play Button & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                <button
                  type="button"
                  onClick={() => handlePlayToggle(item.id, item.url)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isPlaying ? '#60a5fa' : 'rgba(96, 165, 250, 0.15)',
                    color: isPlaying ? '#fff' : '#60a5fa',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  title={isPlaying ? 'Jeda' : 'Putar Audio'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                </button>

                <div style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedMediaItem(item)}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 650,
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={item.prompt}
                  >
                    {item.prompt}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{item.model || 'Anticeil Studio'}</span>
                    {item.durationSec && <span>• {item.durationSec}s</span>}
                    {item.voice && <span>• {item.voice}</span>}
                  </div>
                </div>
              </div>

              {/* Animated Waveform Visualizer when playing */}
              <div className="audio-waveform-visualizer" style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px', padding: '0 8px' }}>
                {[12, 18, 10, 22, 14, 20, 8, 16].map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '3px',
                      height: isPlaying ? `${Math.max(4, h + Math.sin(idx) * 4)}px` : '4px',
                      backgroundColor: isPlaying ? '#60a5fa' : 'var(--border-strong, #444)',
                      borderRadius: '2px',
                      transition: 'height 0.15s ease',
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MediaCardMenu
                  id={item.id}
                  isPinned={item.isPinned}
                  prompt={item.prompt}
                  url={item.url}
                  type="audio"
                  collectionId={item.collectionId || null}
                  collections={imageCollections}
                  language={language}
                  onTogglePin={() => toggleImagePin(item.id)}
                  onMoveToCollection={(colId) => moveImageToCollection(item.id, colId)}
                  onCopyPrompt={() => handleCopyPrompt(item.prompt, item.id)}
                  onDownload={() => handleDownloadAudio(item.url, item.id)}
                  onDelete={() => removeImageItem(item.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
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
              ? 'Ciptakan musik, sintesis suara, dan transkripsi audio dengan AI generatif — gratis tanpa API key.'
              : 'Generate music, synthesize speech, and transcribe audio with generative AI.'}
          </p>
        </div>

        {/* Mode Tabs (Music vs TTS vs STT) */}
        <div
          className="audio-mode-tabs"
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
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
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
                  ? 'Deskripsikan musik yang ingin dibuat (misal: Lofi chill beat with piano)...'
                  : 'Describe the music you want to generate (e.g. Lofi chill beat with piano)...'
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
                  {musicTracks.length}
                </span>
              </div>
              {renderAudioList(
                musicTracks,
                <Music size={40} />,
                language === 'id' ? 'Belum ada musik yang dibuat' : 'No music generated yet'
              )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                  {/* Voice Selector Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <Volume2 size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        style={{
                          appearance: 'none',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md, 6px)',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '4px 22px 4px 10px',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {voices.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={11}
                        color="var(--text-muted)"
                        style={{
                          position: 'absolute',
                          right: '7px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
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
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  {language === 'id' ? 'Suara yang Dibuat' : 'Generated Speech'}
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
                  {speechAudios.length}
                </span>
              </div>
              {renderAudioList(
                speechAudios,
                <Mic size={40} />,
                language === 'id' ? 'Belum ada suara yang dibuat' : 'No speech generated yet'
              )}
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

            {/* Microphone Recording Card */}
            <div
              style={{
                border: `2px dashed ${isRecording ? '#ef4444' : 'var(--border-subtle)'}`,
                borderRadius: '16px',
                padding: '40px 24px',
                textAlign: 'center',
                background: isRecording ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
              }}
            >
              <Ear size={44} color={isRecording ? '#ef4444' : 'var(--text-muted)'} style={{ margin: '0 auto 14px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {isRecording
                  ? language === 'id'
                    ? 'Sedang Mendengarkan & Merekam Suara...'
                    : 'Listening & Recording Audio...'
                  : language === 'id'
                  ? 'Mulai Rekam Suara atau Bicara'
                  : 'Start Speaking or Recording'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                {language === 'id'
                  ? 'Transkripsi real-time via Web Speech AI engine — tanpa API key.'
                  : 'Real-time speech to text transcription via Web Speech AI engine.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: isRecording ? '1px solid #ef4444' : '1px solid rgba(96,165,250,0.4)',
                    background: isRecording ? '#ef4444' : 'rgba(96,165,250,0.1)',
                    color: isRecording ? '#fff' : '#60a5fa',
                    fontSize: '13.5px',
                    fontWeight: 650,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isRecording ? (
                    <>
                      <Square size={14} fill="#fff" />
                      <span>{language === 'id' ? 'Hentikan Rekaman' : 'Stop Recording'}</span>
                    </>
                  ) : (
                    <>
                      <Mic size={15} />
                      <span>{language === 'id' ? 'Mulai Rekam Suara' : 'Start Recording'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transcription Result Box */}
            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Ear size={18} color="#60a5fa" />
                  <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                    {language === 'id' ? 'Hasil Transkripsi' : 'Transcription Result'}
                  </h2>
                </div>

                {sttTranscript && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sttTranscript);
                      setCopiedId('stt');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: copiedId === 'stt' ? '#10B981' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {copiedId === 'stt' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === 'stt' ? 'Tersalin' : 'Salin Teks'}</span>
                  </button>
                )}
              </div>

              <div
                style={{
                  minHeight: '120px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: sttTranscript ? 'flex-start' : 'center',
                  justifyContent: sttTranscript ? 'flex-start' : 'center',
                }}
              >
                {sttTranscript ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {sttTranscript}
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                    {language === 'id'
                      ? 'Transkripsi akan muncul di sini secara real-time saat Anda berbicara'
                      : 'Transcription will appear here in real-time as you speak'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedMediaItem}
        onClose={() => setSelectedMediaItem(null)}
        onDelete={(id) => { removeImageItem(id); setSelectedMediaItem(null); }}
        language={language as 'en' | 'id'}
      />
    </div>
  );
}
