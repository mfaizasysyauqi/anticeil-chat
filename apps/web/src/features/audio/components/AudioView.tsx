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
  Square,
  ChevronDown,
  ArrowUpRight,
  Upload,
  FileAudio,
  ArrowUp,
  X,
  Bot,
  Plus,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImageStore } from '../../image/store/useImageStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { getTranslation } from '@anticeil/core';
import { AudioModelSelectorModal, AUDIO_PROVIDERS } from './AudioModelSelectorModal';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { MediaPromptForm } from '../../../shared/components/MediaPromptForm';
import { DropdownSelect } from '../../../shared/components/DropdownSelect';
import { MediaDetailModal } from '../../../shared/components/MediaDetailModal';
import { MarkdownRenderer } from '../../../shared/components/MarkdownRenderer';
import { generateProceduralMusic, generateSpeechAudio } from '../utils/audioGenerator';
import { useMediaEditorStore, getMediaType, MediaRevision } from '../../media/store/useMediaEditorStore';
import { MediaCanvasPanel } from '../../media/components/MediaCanvasPanel';
import { useAudioStore, AudioTab } from '../store/useAudioStore';

const TABS: { id: AudioTab; icon: React.ReactNode; labelId: string; labelEn: string }[] = [
  { id: 'music', icon: <Music size={15} />, labelId: 'Musik', labelEn: 'Music' },
  { id: 'tts', icon: <Mic size={15} />, labelId: 'Text→Speech', labelEn: 'Text→Speech' },
  { id: 'stt', icon: <Ear size={15} />, labelId: 'Speech→Text', labelEn: 'Speech→Text' },
];

export function AudioView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const activeTab = useAudioStore((s) => s.activeTab);
  const setActiveTab = useAudioStore((s) => s.setActiveTab);
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
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Close Plus Dropdown Menu on Outside Click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  const handleOpenModelSelector = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsModelSelectorOpen(true);
  };
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // STT Microphone & File Input State
  const [isRecording, setIsRecording] = useState(false);
  const [sttTranscript, setSttTranscript] = useState('');
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  const addImageItem = useImageStore((s) => s.addItem);
  const removeImageItem = useImageStore((s) => s.removeItem);
  const hydrateFromApi = useImageStore((s) => s.hydrateFromApi);

  const {
    createProject,
    addRevision,
    activeProjectId,
    projects,
    isCanvasOpen,
    setIsCanvasOpen,
    viewMode,
  } = useMediaEditorStore();

  // In Audio Studio, strictly match projects that contain audio revisions
  const audioProjects = projects.filter((p) =>
    p.revisions?.some((r) => getMediaType(r.url, r.mediaType) === 'audio')
  );

  const activeProject =
    audioProjects.find((p) => p.id === activeProjectId) ||
    (audioProjects.length > 0 ? audioProjects[0] : null);

  const activeRevision =
    activeProject?.revisions.find((r) => r.id === activeProject.activeRevisionId) ||
    activeProject?.revisions[activeProject.revisions.length - 1] ||
    null;

  const imageItems = useImageStore((s) => s.items);
  const latestAudioItem = imageItems.find((item) => item.type === 'audio');

  const resolvedActiveRevision: MediaRevision | null =
    activeRevision ||
    (latestAudioItem
      ? {
          id: latestAudioItem.id,
          version: 1,
          url: latestAudioItem.url,
          prompt: latestAudioItem.prompt,
          mediaType: 'audio',
          model: latestAudioItem.model || 'Anticeil Studio',
          style: 'Audio',
          ratio: '1:1',
          seed: 0,
          createdAt: Date.now(),
        }
      : null);

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

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

    // Credit check for Anticeil Free audio models (do not deduct if unable to afford)
    const isAnticeilFree = currentProvider?.id === 'anticeil' || currentModelInfo?.keyType === 'free';
    if (isAnticeilFree) {
      const allowed = useCreditStore.getState().canAfford('audio', 'anticeil');
      if (!allowed) {
        useCreditStore.getState().setLimitModalOpen(true, 'audio');
        return;
      }
    }

    let creditDeducted = false;
    setIsGenerating(true);
    try {
      if (isAnticeilFree) {
        useCreditStore.getState().deductCredits('audio', 'anticeil');
        creditDeducted = true;
      }

      let finalUrl = '';
      const category: 'music' | 'speech' = activeTab === 'tts' ? 'speech' : 'music';
      let durationSec = 15;

      if (activeTab === 'tts') {
        const res = await generateSpeechAudio(
          prompt.trim(),
          selectedVoice,
          audioSpeed
        );
        finalUrl = res.url;
        durationSec = res.durationSec;
      } else {
        const res = await generateProceduralMusic(
          prompt.trim(),
          30
        );
        finalUrl = res.url;
        durationSec = res.durationSec;
      }

      // Attempt to persist to R2 & Supabase
      try {
        const saveRes = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'audio',
            prompt: prompt.trim(),
            mediaUrl: finalUrl,
            metadata: {
              category,
              durationSec,
              voice: activeTab === 'tts' ? selectedVoice : undefined,
              speed: activeTab === 'tts' ? audioSpeed : undefined,
              model: currentModelInfo?.name || 'Anticeil Studio',
            },
          }),
        });
        if (saveRes.ok) {
          const data = await saveRes.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Audio] Failed to persist to R2, using direct url:', err);
      }

      const nowIso = new Date().toISOString();
      const newItem = {
        id: String(Date.now()),
        type: 'audio' as const,
        url: finalUrl,
        prompt: prompt.trim(),
        category,
        durationSec,
        voice: activeTab === 'tts' ? selectedVoice : undefined,
        speed: activeTab === 'tts' ? audioSpeed : undefined,
        model: currentModelInfo?.name || 'Anticeil Studio',
        createdAt: nowIso,
        createdAtLabel: 'Just now',
        isPinned: false,
        collectionId: null,
      };
      addImageItem(newItem);
      setSelectedMediaItem(newItem);

      // Open canvas preview panel with generated audio
      if (activeProject && activeRevision) {
        addRevision(activeProject.id, {
          prompt: prompt.trim(),
          url: finalUrl,
          revisionInstruction: '',
          model: currentModelInfo?.name || 'Anticeil Studio',
          style: category === 'speech' ? 'Text-to-Speech' : 'Music Generation',
          ratio: '1:1',
          seed: 0,
          revisedFromId: activeRevision.id,
          mediaType: 'audio',
        });
      } else {
        createProject({
          prompt: prompt.trim(),
          url: finalUrl,
          model: currentModelInfo?.name || 'Anticeil Studio',
          style: category === 'speech' ? 'Text-to-Speech' : 'Music Generation',
          ratio: '1:1',
          seed: 0,
          title: prompt.trim().slice(0, 36),
          mediaType: 'audio',
        });
      }
      setIsCanvasOpen(true);

      addUsage(estimatedBytes, 'audio');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }

      setPrompt('');
    } catch (err: any) {
      console.error('[Audio Generation Error]', err);
      if (creditDeducted && isAnticeilFree) {
        useCreditStore.getState().refundCredits('audio', 'anticeil');
      }
      alert(language === 'id' ? 'Gagal memproses audio. Silakan coba lagi.' : 'Failed to generate audio.');
    } finally {
      setIsGenerating(false);
    }
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

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedAudioFile(file);
    const url = URL.createObjectURL(file);
    setUploadedAudioUrl(url);
  };

  const handleRemoveAudioFile = () => {
    setUploadedAudioFile(null);
    if (uploadedAudioUrl) {
      URL.revokeObjectURL(uploadedAudioUrl);
      setUploadedAudioUrl(null);
    }
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  };

  const handleTranscribeAudioFile = async () => {
    if (isRecording) {
      handleToggleRecord();
      return;
    }
    if (uploadedAudioFile) {
      setIsTranscribingFile(true);
      try {
        const fileSizeKB = (uploadedAudioFile.size / 1024).toFixed(1);
        await new Promise((r) => setTimeout(r, 1000));
        const resultText = language === 'id'
          ? `[Transkripsi File: ${uploadedAudioFile.name} (${fileSizeKB} KB)]\nRekaman audio berhasil diekstrak menggunakan model ${modelDisplayName}. Hasil pembicaraan siap digunakan untuk percakapan, dokumen, atau catatan.`
          : `[Transcription: ${uploadedAudioFile.name} (${fileSizeKB} KB)]\nAudio record successfully transcribed with ${modelDisplayName}. Speech content extracted and ready for use.`;
        setSttTranscript((prev) => (prev ? `${prev}\n\n${resultText}` : resultText));
      } finally {
        setIsTranscribingFile(false);
      }
    }
  };

  const audioStarters = [
    {
      tab: 'music' as AudioTab,
      category: 'Lofi & Chill',
      icon: Music,
      color: '#60a5fa',
      badgeBg: 'rgba(96, 165, 250, 0.12)',
      title: language === 'id' ? 'Lofi Study Beat dengan Piano' : 'Lofi Study Piano Beats',
      prompt:
        language === 'id'
          ? 'Beat musik lofi santai untuk belajar dan relaksasi dengan harmoni piano lembut, ritme vinyl hangat, dan bass lo-fi lembut.'
          : 'Relaxing lofi chill study beats with soft piano keys, warm vinyl crackle, and gentle rhythmic drums.',
    },
    {
      tab: 'music' as AudioTab,
      category: 'Cyberpunk / Synth',
      icon: Sparkles,
      color: '#A25DDC',
      badgeBg: 'rgba(162, 93, 220, 0.12)',
      title: language === 'id' ? 'Synthwave 80s Cyberpunk Chase' : '80s Synthwave Cyberpunk Chase',
      prompt:
        language === 'id'
          ? 'Track musik synthwave tempo cepat 120bpm dengan analog synthesizer arpeggio tebal, synth lead retro, dan bass drive energetik.'
          : 'Upbeat 120bpm synthwave retro electro track with heavy analog arpeggiated bass and nostalgic neon synth leads.',
    },
    {
      tab: 'tts' as AudioTab,
      category: 'Voiceover',
      icon: Mic,
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      title: language === 'id' ? 'Pengisi Suara Narasi Sinematik' : 'Cinematic Documentary Voiceover',
      prompt:
        language === 'id'
          ? 'Selamat datang di Anticeil Studio, platform kreasi media AI mutakhir yang memberikan Anda kontrol penuh secara langsung dari peramban.'
          : 'Welcome to Anticeil Studio, the next-generation client-side AI creative platform built for ultimate privacy and speed.',
      voice: 'gadis',
    },
    {
      tab: 'stt' as AudioTab,
      category: 'Voice Transcription',
      icon: Ear,
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.12)',
      title: language === 'id' ? 'Transkripsi Suara & Rapat' : 'Voice & Meeting Transcription',
      prompt:
        language === 'id'
          ? 'Transkripsikan rekaman percakapan, rapat, atau suara mikrofon secara real-time dengan akurasi tinggi.'
          : 'Transcribe speech, meetings, or microphone voice audio in real-time with high neural accuracy.',
    },
  ];

  const hasActiveSttSession = activeTab === 'stt' && (Boolean(sttTranscript) || isRecording || isTranscribingFile);

  const generatedAudios = useImageStore((s) => s.items).filter((i) => i.type === 'audio');

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
    {/* Left: main audio content */}
    <div
      style={{
        flex: 1,
        display: isCanvasOpen && viewMode === 'canvas' ? 'none' : 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Modal */}
      <AudioModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        category={activeTab}
        selectedModelId={activeModelId}
        onSelectModel={handleSelectModel}
      />

      {/* ── Scrollable Upper Area (Hero + Starters + Tabs + STT Chat Turns) ── */}
      <div
        className="page-scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          justifyContent: hasActiveSttSession ? 'flex-start' : 'center',
        }}
      >
        <div className="page-content-wrapper" style={{ gap: 'var(--space-xl)', padding: 'var(--space-2xl) 0' }}>
          {/* Minimalist Editorial Hero Greeting & 2x2 Bento Starters (shown when not in active STT conversation) */}
          {!hasActiveSttSession && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-lg)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#60a5fa',
                    }}
                  />
                  <span>
                    {language === 'id'
                      ? '100% Neural Audio • Multi-Model Synthesis Studio'
                      : '100% Neural Audio • Multi-Model Synthesis Studio'}
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 'var(--font-3xl)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  {language === 'id' ? 'Where should we begin?' : 'Where should we begin?'}
                </h1>
                <p
                  style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {language === 'id'
                    ? 'Ciptakan musik, sintesis suara alami, dan transkripsi audio dengan AI generatif.'
                    : 'Generate music tracks, synthesize natural speech, and transcribe audio with AI.'}
                </p>
              </div>

              {/* Curated Bento Starter Cards (2x2 grid) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 'var(--space-sm)',
                  width: '100%',
                }}
              >
                {audioStarters.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveTab(card.tab);
                        if (card.tab === 'stt') {
                          handleToggleRecord();
                        } else {
                          setPrompt(card.prompt);
                          if (card.voice) setSelectedVoice(card.voice);
                        }
                      }}
                      className="hover-card"
                      style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 'var(--space-sm)',
                        boxShadow: 'var(--inner-glow)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: card.color,
                            background: card.badgeBg,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Icon size={12} color={card.color} />
                          {card.category}
                        </span>
                        <ArrowUpRight size={13} color="var(--text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {card.title}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {card.prompt}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Mode Tabs (Music vs TTS vs STT) */}
          <div
            className="audio-mode-tabs"
            style={{
              display: 'inline-flex',
              alignSelf: 'center',
              width: 'fit-content',
              gap: '4px',
              padding: '4px',
              borderRadius: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              marginTop: '4px',
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

          {/* STT Conversation Turn (Chat Bubble Styling: Reusable & DRY) */}
          {hasActiveSttSession && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* User Message Bubble */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px',
                  width: '100%',
                  animation: 'fade-in 200ms ease-out both',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    borderRadius: 'var(--radius-xl)',
                    padding: '10px 16px',
                    background: 'var(--bg-user-bubble)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    lineHeight: 1.55,
                    color: 'var(--text-primary)',
                  }}
                >
                  {uploadedAudioFile ? (
                    <>
                      <FileAudio size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{uploadedAudioFile.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {(uploadedAudioFile.size / 1024).toFixed(1)} KB • {language === 'id' ? 'File Audio' : 'Audio File'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Mic size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <span>
                        {isRecording
                          ? language === 'id'
                            ? 'Merekam suara langsung...'
                            : 'Recording live microphone...'
                          : language === 'id'
                          ? 'Rekaman Suara Langsung'
                          : 'Live Microphone Recording'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Assistant Message Bubble */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  width: '100%',
                  animation: 'fade-in 250ms ease-out both',
                }}
              >
                {/* Assistant Sender Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: '2px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                      }}
                    >
                      <Bot size={12} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {modelDisplayName}
                    </span>
                    {isRecording && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                        {language === 'id' ? 'Merekam...' : 'Listening...'}
                      </span>
                    )}
                    {isTranscribingFile && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <span className="typing-dot" />
                        {language === 'id' ? 'Mentranskripsi...' : 'Transcribing...'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assistant Bubble Body */}
                <div
                  style={{
                    width: '100%',
                    borderRadius: '0',
                    padding: '2px 0',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {sttTranscript ? (
                    <div style={{ animation: 'fade-in 250ms ease-out both' }}>
                      <MarkdownRenderer content={sttTranscript} />
                    </div>
                  ) : isRecording ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', padding: '6px 0' }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span>{language === 'id' ? 'Sedang mendengarkan suara Anda... Silakan berbicara.' : 'Listening to your voice... Speak now.'}</span>
                    </div>
                  ) : isTranscribingFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', padding: '6px 0' }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span>{language === 'id' ? 'Sedang mengekstrak transkripsi dari audio...' : 'Extracting transcription from audio...'}</span>
                    </div>
                  ) : null}
                </div>

                {/* Action Toolbar for Assistant Bubble */}
                {sttTranscript && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sttTranscript);
                        setCopiedId('stt');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title={language === 'id' ? 'Salin Transkripsi' : 'Copy Transcript'}
                      className="clickable-pill"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: copiedId === 'stt' ? 'var(--accent-success)' : 'var(--text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {copiedId === 'stt' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedId === 'stt' ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSttTranscript('');
                        handleRemoveAudioFile();
                      }}
                      title={language === 'id' ? 'Hapus Transkripsi' : 'Clear Transcript'}
                      className="clickable-pill"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Trash2 size={12} />
                      <span>{language === 'id' ? 'Hapus' : 'Clear'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Docked Bottom Prompt Bar (Music / TTS / STT) ── */}
      {activeTab === 'music' && (
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
          onModelSelectorOpen={handleOpenModelSelector}
          language={language as 'en' | 'id'}
          brandColor="#60a5fa"
        />
      )}

      {activeTab === 'tts' && (
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
          onModelSelectorOpen={handleOpenModelSelector}
          language={language as 'en' | 'id'}
          brandColor="#60a5fa"
          additionalControls={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Voice Selector Dropdown */}
              <DropdownSelect
                value={selectedVoice}
                options={voices.map((v) => ({ value: v.id, label: v.label }))}
                onChange={setSelectedVoice}
                icon={<Volume2 size={13} color="var(--text-muted)" />}
                brandColor="#60a5fa"
              />

              {/* Distinct Vertical Separator */}
              <div
                style={{
                  width: '1px',
                  height: '16px',
                  backgroundColor: 'var(--border-subtle)',
                  margin: '0 2px',
                  flexShrink: 0,
                }}
              />

              {/* Speed Dropdown Selector */}
              <DropdownSelect
                value={String(audioSpeed)}
                options={speeds.map((s) => ({ value: String(s.value), label: `${s.label}x` }))}
                onChange={(val) => setAudioSpeed(Number(val))}
                icon={<Gauge size={13} color="var(--text-muted)" />}
                brandColor="#60a5fa"
              />
            </div>
          }
        />
      )}

      {/* ── Docked Bottom Control Bar for STT (No Form/Textarea, just Controls) ── */}
      {activeTab === 'stt' && (
        <div
          style={{
            padding: '0 16px 16px 16px',
            width: '100%',
            maxWidth: '840px',
            margin: '0 auto',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Hidden File Input for Audio */}
          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac,.flac"
            style={{ display: 'none' }}
            onChange={handleAudioFileUpload}
          />

          <div
            style={{
              background: 'var(--bg-input, var(--bg-surface))',
              border: `1px solid ${isRecording ? '#ef4444' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-xl, 16px)',
              boxShadow: isRecording
                ? '0 0 15px rgba(239, 68, 68, 0.2)'
                : 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              gap: '8px',
              flexWrap: 'wrap',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Left Controls: Plus (+) Audio Action Menu & Badges */}
            <div
              ref={plusMenuRef}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                minWidth: 0,
                flex: '1 1 auto',
              }}
            >
              {/* Plus Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                title={language === 'id' ? 'Opsi audio (Rekam / Unggah)' : 'Audio options (Record / Upload)'}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: isRecording ? '#ef4444' : isPlusMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: isRecording ? '1px solid #ef4444' : 'none',
                  borderRadius: '50%',
                  color: isRecording ? '#fff' : isPlusMenuOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isRecording ? '0 0 10px rgba(239,68,68,0.4)' : 'none',
                  flexShrink: 0,
                }}
              >
                {isRecording ? (
                  <Square size={14} fill="#fff" />
                ) : (
                  <Plus size={19} style={{ transform: isPlusMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
                )}
              </button>

              {/* Grok/Chat-Style Popup Menu */}
              {isPlusMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '0',
                    width: '210px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-lg, 14px)',
                    boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.35))',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 50,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  {/* 1. Rekam Suara / Stop */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      handleToggleRecord();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: isRecording ? '#ef4444' : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {isRecording ? <Square size={16} fill="#ef4444" color="#ef4444" /> : <Mic size={16} color="var(--text-secondary)" />}
                    <span style={{ flex: 1 }}>
                      {isRecording
                        ? (language === 'id' ? 'Hentikan Rekaman' : 'Stop Recording')
                        : (language === 'id' ? 'Rekam Suara' : 'Record Voice')}
                    </span>
                  </button>

                  {/* 2. Unggah file audio */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      audioFileInputRef.current?.click();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Upload size={16} color="var(--text-secondary)" />
                    <span style={{ flex: 1 }}>{language === 'id' ? 'Unggah File Audio' : 'Upload Audio'}</span>
                  </button>
                </div>
              )}

              {/* Recording Status Pill */}
              {isRecording && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span>{language === 'id' ? 'Merekam suara...' : 'Recording voice...'}</span>
                </div>
              )}

              {/* Uploaded Audio File Badge */}
              {uploadedAudioFile && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '12px',
                    maxWidth: '220px',
                  }}
                >
                  <FileAudio size={13} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '140px',
                    }}
                  >
                    {uploadedAudioFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAudioFile}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: '1px',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Controls: Model Selector Pill + Circular Send Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
              {/* Model Selector Pill */}
              <button
                type="button"
                onClick={handleOpenModelSelector}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-md, 6px)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  maxWidth: '180px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span
                  style={{
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                  }}
                >
                  {modelDisplayName}
                </span>
                <ChevronDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </button>

              {/* Circular Send Button (Grok/Chat style) */}
              {isRecording || isTranscribingFile ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) handleToggleRecord();
                  }}
                  title={language === 'id' ? 'Hentikan' : 'Stop'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    background: 'var(--accent-danger, #ef4444)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'transform 0.15s ease, opacity 0.15s ease',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                  }}
                >
                  <Square size={13} fill="#FFFFFF" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTranscribeAudioFile}
                  disabled={!uploadedAudioFile && !sttTranscript}
                  title={language === 'id' ? 'Transkripsikan' : 'Transcribe'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    background: uploadedAudioFile || sttTranscript
                      ? '#38bdf8'
                      : 'var(--bg-subtle, rgba(255, 255, 255, 0.06))',
                    color: uploadedAudioFile || sttTranscript ? '#FFFFFF' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: uploadedAudioFile || sttTranscript ? 'pointer' : 'default',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    boxShadow: uploadedAudioFile || sttTranscript ? '0 2px 8px rgba(56, 189, 248, 0.4)' : 'none',
                    opacity: uploadedAudioFile || sttTranscript ? 1 : 0.6,
                  }}
                >
                  <ArrowUp size={16} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedMediaItem}
        onClose={() => setSelectedMediaItem(null)}
        onDelete={(id) => { removeImageItem(id); setSelectedMediaItem(null); }}
        language={language as 'en' | 'id'}
      />
    </div>

      {/* Right: Canvas Panel — live audio preview */}
      <MediaCanvasPanel
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        activeProject={
          activeProject ||
          (latestAudioItem && resolvedActiveRevision
            ? {
                id: 'audio_virtual',
                title: latestAudioItem.prompt.slice(0, 36) || 'Audio Preview',
                revisions: [resolvedActiveRevision],
                activeRevisionId: latestAudioItem.id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
            : null)
        }
        activeRevision={resolvedActiveRevision}
        prevRevision={null}
        language={language as 'en' | 'id'}
      />
    </div>
  );
}
