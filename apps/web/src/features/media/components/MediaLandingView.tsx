'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Eye,
  Download,
  Check,
  Copy,
  GitBranch,
  SplitSquareVertical,
  Palette,
  Ratio,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useMediaEditorStore, MediaRevision } from '../store/useMediaEditorStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useImageStore } from '../../image/store/useImageStore';
import { PromptBar } from '../../../shared/components/PromptBar';
import { AIChatBubble } from '../../../shared/components/AIChatBubble';
import { AgentTimelineStep } from '../../../shared/components/AgentStepTimeline';
import { ImageModelSelectorModal, IMAGE_PROVIDERS } from '../../image/components/ImageModelSelectorModal';
import { MediaCanvasPanel } from './MediaCanvasPanel';
import { synthesizeContextualPrompt } from '../utils/promptContextSynthesizer';

export function MediaLandingView() {
  const { language } = useSettingsStore();
  const [prompt, setPrompt] = useState('');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('flux');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    projects,
    activeProjectId,
    createProject,
    addRevision,
    setActiveProject,
    setActiveRevision,
    setComparisonMode,
    isGenerating,
    setIsGenerating,
    isCanvasOpen,
    setIsCanvasOpen,
    viewMode,
  } = useMediaEditorStore();

  const addImageItem = useImageStore((s) => s.addItem);
  const session = useAuthStore((s) => s.session);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  const activeProject = activeProjectId ? (projects.find((p) => p.id === activeProjectId) || null) : null;
  const activeRevision =
    activeProject?.revisions.find((r) => r.id === activeProject.activeRevisionId) ||
    activeProject?.revisions[activeProject.revisions.length - 1] ||
    null;

  const currentActiveIdx = activeProject && activeRevision ? activeProject.revisions.findIndex((r) => r.id === activeRevision.id) : -1;
  const prevRevision = currentActiveIdx > 0 && activeProject ? activeProject.revisions[currentActiveIdx - 1] : null;

  const canFit = useStorageStore((s) => s.canFit);
  const addUsage = useStorageStore((s) => s.addUsage);

  const modalModelInfo = IMAGE_PROVIDERS
    .flatMap((p) => p.models)
    .find((m) => m.id === selectedModel);
  const modelDisplayName = modalModelInfo?.name || selectedModel;
  const shortModelName = modalModelInfo?.name?.split('(')[0]?.trim() || selectedModel;

  const styles = ['Photorealistic', 'Anime / Manga', 'Cyberpunk', '3D Render', 'Cinematic', 'Oil Painting'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  const starterCards = [
    {
      category: 'Cyberpunk',
      icon: Palette,
      color: '#A25DDC',
      badgeBg: 'rgba(162, 93, 220, 0.12)',
      title: language === 'id' ? 'Kota Cyberpunk Hujan Neon' : 'Rainy Cyberpunk Neon City',
      prompt: language === 'id'
        ? 'Pemandangan kota cyberpunk futuristik di malam hari dengan genangan air memantulkan lampu neon ungu dan mobil terbang melayang.'
        : 'Futuristic cyberpunk cityscape at night with wet streets reflecting purple neon lights and flying cars.',
      style: 'Cyberpunk',
      ratio: '16:9',
    },
    {
      category: 'Photorealistic',
      icon: Sparkles,
      color: '#0073EA',
      badgeBg: 'rgba(0, 115, 234, 0.12)',
      title: language === 'id' ? 'Potret Studio 8K Sinematik' : '8K Cinematic Studio Portrait',
      prompt: language === 'id'
        ? 'Foto potret close-up studio 8K ultra realistis dengan pencahayaan dramatis, detail tekstur kulit sempurna, dan kedalaman fokus bokeh.'
        : 'Ultra-realistic 8K close-up studio portrait with dramatic rim lighting, sharp facial details, and smooth bokeh depth.',
      style: 'Photorealistic',
      ratio: '1:1',
    },
    {
      category: '3D Render',
      icon: Wand2,
      color: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      title: language === 'id' ? 'Kamar Gamer Isometrik 3D' : '3D Isometric Cozy Room',
      prompt: language === 'id'
        ? 'Desain kamar tidur gamer isometrik 3D estetik dengan setup monitor ultrawide, tanaman hias, rak buku, dan lampu warm cozy.'
        : 'Charming 3D isometric cozy gamer bedroom setup with ultrawide monitors, indoor plants, bookshelves, and warm ambient lighting.',
      style: '3D Render',
      ratio: '16:9',
    },
    {
      category: 'Anime / Fantasy',
      icon: Ratio,
      color: '#EC4899',
      badgeBg: 'rgba(236, 72, 153, 0.12)',
      title: language === 'id' ? 'Kuil Fantasi Mengambang di Langit' : 'Floating Fantasy Sky Temple',
      prompt: language === 'id'
        ? 'Kuil kuno megah mengambang di atas awan saat matahari terbenam dengan pohon sakura bercahaya dan efek cahaya mistis keemasan.'
        : 'Majestic ancient temple floating above clouds during sunset with glowing sakura petals and mystical golden hour rays.',
      style: 'Anime / Manga',
      ratio: '16:9',
    },
  ];

  const quickRevisions = [
    { labelId: 'Ubah jadi Warna Biru', labelEn: 'Turn into Blue Theme', prompt: 'buat agar jadi warna biru' },
    { labelId: 'Tambahkan Kacamata', labelEn: 'Add Sunglasses', prompt: 'tambahkan kacamata hitam keren' },
    { labelId: 'Pencahayaan Golden Hour', labelEn: 'Golden Hour Lighting', prompt: 'ubah pencahayaan jadi golden hour sunset dramatis' },
    { labelId: 'Gaya Cyberpunk Neon', labelEn: 'Cyberpunk Neon Style', prompt: 'ubah ke gaya cyberpunk dengan lampu neon malam hari' },
    { labelId: 'Detail Hyperrealistic 8K', labelEn: 'Hyperrealistic 8K Details', prompt: 'tambahkan detail tekstur ultra tajam 8k' },
    { labelId: 'Ubah ke Anime Style', labelEn: 'Anime Art Style', prompt: 'ubah gayanya menjadi anime aesthetic' },
  ];

  // Auto-open canvas when an active project exists
  useEffect(() => {
    if (activeProject && activeRevision && viewMode !== 'coeditor') {
      setIsCanvasOpen(true);
    }
  }, [activeProject?.id, activeRevision?.id, viewMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeProject?.revisions.length, isGenerating]);

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setTimeout(() => {
      setPrompt(`${prompt.trim()}, highly detailed, professional art direction, masterpiece composition, volumetric lighting, 8k resolution`);
      setIsEnhancing(false);
    }, 450);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const rawPrompt = (textToSend !== undefined ? textToSend : prompt).trim();
    if (!rawPrompt || isGenerating) return;

    const estimatedBytes = 1.2 * 1024 * 1024;
    if (!canFit(estimatedBytes)) {
      alert(language === 'id' ? 'Kapasitas penyimpanan Anda tidak mencukupi.' : 'Not enough storage space.');
      return;
    }

    const allowed = useCreditStore.getState().canAfford('image', 'anticeil');
    if (!allowed) {
      useCreditStore.getState().setLimitModalOpen(true, 'image');
      return;
    }

    setIsGenerating(true);
    setPrompt('');
    setIsCanvasOpen(true);

    try {
      useCreditStore.getState().deductCredits('image', 'anticeil');

      // Synthesize prompt with root subject context reading
      const synthResult = synthesizeContextualPrompt(rawPrompt, activeRevision, {
        allRevisions: activeProject?.revisions || [],
        currentStyle: selectedStyle,
        currentRatio: selectedRatio,
        currentModel: selectedModel,
        language: language === 'en' ? 'en' : 'id',
      });

      const effectivePrompt = synthResult.finalPrompt;
      const effectiveStyle = synthResult.detectedStyle || selectedStyle;
      const effectiveRatio = selectedRatio;

      const width = effectiveRatio === '16:9' ? 1280 : effectiveRatio === '9:16' ? 720 : effectiveRatio === '4:3' ? 1024 : 1024;
      const height = effectiveRatio === '16:9' ? 720 : effectiveRatio === '9:16' ? 1280 : effectiveRatio === '4:3' ? 768 : 1024;
      const seed = Math.floor(Math.random() * 1000000);

      const encodedPrompt = encodeURIComponent(effectivePrompt);
      const modelParam = selectedModel === 'dalle3' ? 'flux' : selectedModel === 'imagen3' ? 'flux-realism' : selectedModel;
      const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${modelParam}&nologo=true&seed=${seed}`;

      let finalUrl = directUrl;

      try {
        const res = await fetch('/api/image/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'image',
            prompt: rawPrompt,
            mediaUrl: directUrl,
            metadata: {
              style: effectiveStyle,
              ratio: effectiveRatio,
              model: selectedModel,
              fullPrompt: effectivePrompt,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            finalUrl = data.url;
            addUsage(data.size || estimatedBytes, 'images');
          }
        }
      } catch (err) {
        console.warn('[Media] Save-media fallback to direct url:', err);
      }

      if (activeProject && activeRevision) {
        // Add Revision to existing project
        addRevision(activeProject.id, {
          prompt: effectivePrompt,
          url: finalUrl,
          revisionInstruction: rawPrompt,
          model: selectedModel,
          style: effectiveStyle,
          ratio: effectiveRatio,
          seed,
          revisedFromId: activeRevision.id,
        });
      } else {
        // Create brand new project
        createProject({
          prompt: effectivePrompt,
          url: finalUrl,
          model: selectedModel,
          style: effectiveStyle,
          ratio: effectiveRatio,
          seed,
          title: rawPrompt.slice(0, 36),
        });
      }

      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
    } catch (err) {
      console.error(err);
      alert(language === 'id' ? 'Gagal meng-generate media.' : 'Failed to generate media.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-main)',
        position: 'relative',
      }}
    >
      {/* ── Left / Center Chat Stream ── */}
      <div
        style={{
          flex: 1,
          height: '100%',
          display: isCanvasOpen && viewMode === 'canvas' ? 'none' : 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Messages Stream Container */}
        <div
          ref={scrollRef}
          className="page-scroll-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '860px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        >
          {/* Welcome Card & Inspiration Bento if no revisions */}
          {(!activeProject || activeProject.revisions.length === 0) && !isGenerating && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px 16px 20px',
                color: 'var(--text-muted)',
                margin: 'auto 0',
              }}
            >
              {/* Minimalist Editorial Hero Greeting */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--font-xs, 12px)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#A25DDC',
                  }}
                />
                <span>
                  {language === 'id'
                    ? '100% Neural Generation • Multi-Model Image Studio'
                    : '100% Neural Generation • Multi-Model Image Studio'}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'var(--font-3xl, 26px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {language === 'id' ? 'Where should we begin?' : 'Where should we begin?'}
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-md, 13.5px)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  maxWidth: '520px',
                  margin: '0 auto 24px',
                }}
              >
                {language === 'id'
                  ? 'Hasilkan gambar & ilustrasi definisi tinggi langsung dari browser Anda dengan model multimodal dan revisi kontekstual.'
                  : 'Generate high-definition images directly from your browser with multimodal models and contextual revisions.'}
              </p>

              {/* Curated Bento Starter Cards (2x2 grid) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '720px',
                  textAlign: 'left',
                }}
              >
                {starterCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPrompt(card.prompt);
                        setSelectedStyle(card.style);
                        setSelectedRatio(card.ratio);
                      }}
                      className="hover-card"
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-lg, 12px)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                        boxShadow: 'var(--inner-glow, none)',
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
                            borderRadius: 'var(--radius-full, 9999px)',
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
            </div>
          )}

          {/* Active Project Revisions Conversation Thread (DRY using AIChatBubble) */}
          {activeProject?.revisions.map((rev, idx) => {
            const isLatest = idx === activeProject.revisions.length - 1;
            const isCurrentlySelected = activeRevision?.id === rev.id;
            const parentRev = rev.revisedFromId ? activeProject.revisions.find((r) => r.id === rev.revisedFromId) : null;
            const userPromptText = rev.revisionInstruction || rev.prompt;

            const revSteps: AgentTimelineStep[] = parentRev
              ? [
                  {
                    id: `step_ctx_${rev.id}`,
                    type: 'analyzed',
                    title: language === 'id'
                      ? `Membaca konteks visual v${parentRev.version}`
                      : `Reading visual context from v${parentRev.version}`,
                    status: 'done',
                    content: language === 'id'
                      ? `Menjaga subjek & karakteristik visual dari v${parentRev.version}`
                      : `Preserving visual subject & characteristics from v${parentRev.version}`,
                  },
                  {
                    id: `step_apply_${rev.id}`,
                    type: 'design',
                    title: language === 'id'
                      ? `Menerapkan revisi: "${rev.revisionInstruction || rev.prompt}"`
                      : `Applying revision instruction: "${rev.revisionInstruction || rev.prompt}"`,
                    status: 'done',
                    content: language === 'id'
                      ? `Prompt sintesis visual: "${rev.prompt}"`
                      : `Synthesized visual prompt: "${rev.prompt}"`,
                  },
                  {
                    id: `step_render_${rev.id}`,
                    type: 'done',
                    title: language === 'id'
                      ? `Render v${rev.version} (${rev.ratio}, ${rev.style}) selesai`
                      : `Rendered v${rev.version} (${rev.ratio}, ${rev.style}) completed`,
                    status: 'done',
                  },
                ]
              : [
                  {
                    id: `step_analyze_${rev.id}`,
                    type: 'analyzed',
                    title: language === 'id' ? 'Analisis prompt & komposisi visual' : 'Analyzing prompt & visual composition',
                    status: 'done',
                    content: rev.prompt,
                  },
                  {
                    id: `step_style_${rev.id}`,
                    type: 'design',
                    title: language === 'id'
                      ? `Penerapan style ${rev.style} & rasio ${rev.ratio}`
                      : `Applying style ${rev.style} & aspect ratio ${rev.ratio}`,
                    status: 'done',
                  },
                  {
                    id: `step_gen_${rev.id}`,
                    type: 'done',
                    title: language === 'id' ? `Render visual selesai (${rev.model})` : `Visual generation complete (${rev.model})`,
                    status: 'done',
                  },
                ];

            return (
              <div key={rev.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {/* 1. User Prompt Bubble (Official Reusable AIChatBubble with exact styling & time/copy toolbar) */}
                <AIChatBubble
                  role="user"
                  content={userPromptText}
                  timestamp={rev.createdAt}
                  language={language === 'id' ? 'id' : 'en'}
                  variant="coauthor"
                  versions={activeProject.revisions.map((r) => r.revisionInstruction || r.prompt)}
                  versionIndex={idx}
                  onNavigateVersion={(direction) => {
                    const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
                    if (targetIdx >= 0 && targetIdx < activeProject.revisions.length) {
                      setActiveRevision(activeProject.id, activeProject.revisions[targetIdx].id);
                      setIsCanvasOpen(true);
                    }
                  }}
                  onCopy={() => handleCopyText(userPromptText, `usr_${rev.id}`)}
                />

                {/* 2. AI Response Bubble (Official Reusable AIChatBubble with agent step timeline & rich preview card) */}
                <AIChatBubble
                  role="assistant"
                  content=""
                  assistantName="AI Co-Editor"
                  assistantColor="var(--rail-media-color)"
                  language={language === 'id' ? 'id' : 'en'}
                  timestamp={rev.createdAt}
                  variant="assistant"
                  agentSteps={revSteps}
                  extraContent={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                      {/* Interactive Media Pill Card with Thumbnail & Clean Action Buttons */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: `1px solid ${isCurrentlySelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                          boxShadow: isCurrentlySelected ? '0 0 0 1px var(--brand-primary), var(--shadow-md)' : 'var(--shadow-sm)',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            padding: '10px 12px',
                            gap: '8px',
                          }}
                        >
                          {/* Left: Thumbnail & Concise Title / Metadata */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px', flex: 1 }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setActiveRevision(activeProject.id, rev.id);
                                setIsCanvasOpen(true);
                              }}
                            >
                              <img src={rev.url} alt={`v${rev.version}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {activeProject.title} (v{rev.version})
                                </span>
                                {parentRev && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '10px',
                                      fontWeight: 500,
                                      color: 'var(--text-muted)',
                                      backgroundColor: 'var(--bg-subtle)',
                                      padding: '1px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-subtle)',
                                      flexShrink: 0,
                                    }}
                                    title={language === 'id' ? `Bercabang dari v${parentRev.version}` : `Branched from v${parentRev.version}`}
                                  >
                                    <GitBranch size={9} />
                                    <span>{language === 'id' ? `dari v${parentRev.version}` : `from v${parentRev.version}`}</span>
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: '2px',
                                }}
                              >
                                {rev.style} • {rev.ratio} • {shortModelName}
                              </div>
                            </div>
                          </div>

                          {/* Right / Wrapped: Action Buttons (Responsive flexWrap, no overflow) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRevision(activeProject.id, rev.id);
                                setIsCanvasOpen(true);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 650,
                                backgroundColor: isCurrentlySelected ? 'var(--brand-primary)' : 'rgba(0, 115, 234, 0.12)',
                                color: isCurrentlySelected ? '#ffffff' : 'var(--brand-primary)',
                                border: isCurrentlySelected ? 'none' : '1px solid rgba(0, 115, 234, 0.25)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title={language === 'id' ? 'Tampilkan di Canvas' : 'View in Canvas'}
                            >
                              <Eye size={12} />
                              <span>{language === 'id' ? 'Lihat di Canvas' : 'View in Canvas'}</span>
                            </button>


                          </div>
                        </div>

                        {/* Synthesized Visual Prompt Detail Footer */}
                        <div
                          style={{
                            padding: '6px 14px 8px',
                            borderTop: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                            title={rev.prompt}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {language === 'id' ? 'Prompt Visual: ' : 'Visual Prompt: '}
                            </span>
                            {rev.prompt}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyText(rev.prompt, `prm_${rev.id}`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10.5px',
                              fontWeight: 500,
                              color: copiedId === `prm_${rev.id}` ? '#10B981' : 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {copiedId === `prm_${rev.id}` ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedId === `prm_${rev.id}` ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Contextual Quick Revision Suggestions under latest message */}
                      {isLatest && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {quickRevisions.map((qr, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => handleSendPrompt(qr.prompt)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: 'var(--bg-subtle)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              className="hover-subtle"
                            >
                              + {language === 'id' ? qr.labelId : qr.labelEn}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            );
          })}

          {/* Generating Indicator in Chat using standard AIChatBubble */}
          {isGenerating && (
            <AIChatBubble
              role="assistant"
              content=""
              assistantName="AI Co-Editor"
              assistantColor="var(--rail-media-color)"
              language={language === 'id' ? 'id' : 'en'}
              isStreaming={true}
              agentSteps={
                activeRevision
                  ? [
                      {
                        id: 'gen_step_ctx',
                        type: 'analyzed',
                        title: language === 'id'
                          ? `Membaca konteks visual v${activeRevision.version}...`
                          : `Reading visual context v${activeRevision.version}...`,
                        status: 'done',
                      },
                      {
                        id: 'gen_step_render',
                        type: 'design',
                        title: language === 'id'
                          ? 'Mensintesis modifikasi visual & merender revisi baru...'
                          : 'Synthesizing visual modification & rendering new revision...',
                        status: 'running',
                      },
                    ]
                  : [
                      {
                        id: 'gen_step_analyze',
                        type: 'analyzed',
                        title: language === 'id'
                          ? 'Menganalisis prompt visual & komposisi...'
                          : 'Analyzing visual prompt & composition...',
                        status: 'running',
                      },
                    ]
              }
            />
          )}
        </div>

        {/* Docked Bottom PromptBar Container (DRY matching DocsStudio & Chat) */}
        <div
          style={{
            width: '100%',
            padding: '8px 16px 14px',
            backgroundColor: 'var(--bg-main)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'center',
            flexShrink: 0,
            zIndex: 10,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: '860px', width: '100%' }}>
            <PromptBar
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={() => handleSendPrompt()}
              isGenerating={isGenerating}
              onStop={() => setIsGenerating(false)}
              placeholder={
                activeRevision
                  ? (language === 'id'
                      ? `Revisi v${activeRevision.version} (misal: "buat agar jadi warna biru", "tambah kacamata")...`
                      : `Revise v${activeRevision.version} (e.g. "make it blue", "add sunglasses")...`)
                  : (language === 'id'
                      ? 'Deskripsikan gambar/media yang ingin dibuat...'
                      : 'Describe the image/media you want to generate...')
              }
              modelDisplayName={shortModelName}
              onModelSelectorOpen={() => setIsModelModalOpen(true)}
              leftControls={
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Aspect Ratio Selector Pill */}
                  <select
                    value={selectedRatio}
                    onChange={(e) => setSelectedRatio(e.target.value)}
                    style={{
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {ratios.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {/* Style Selector Pill */}
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {styles.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {/* Enhance Prompt Button */}
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--brand-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isEnhancing || !prompt.trim() ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      opacity: isEnhancing || !prompt.trim() ? 0.5 : 1,
                      padding: '2px 6px',
                    }}
                    title={language === 'id' ? 'Perkaya prompt dengan AI' : 'Enhance prompt with AI'}
                  >
                    <Wand2 size={12} />
                    <span>{isEnhancing ? '...' : 'Enhance'}</span>
                  </button>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* ── Right Canvas Panel (Live Preview, Before/After Slider, Downloads) ── */}
      <MediaCanvasPanel
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        activeProject={activeProject}
        activeRevision={activeRevision}
        prevRevision={prevRevision}
        language={language}
      />

      {/* Model Selector Modal */}
      <ImageModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        mediaMode="image"
        selectedModelId={selectedModel}
        onSelectModel={(modelId) => {
          setSelectedModel(modelId);
          setIsModelModalOpen(false);
        }}
      />
    </div>
  );
}
