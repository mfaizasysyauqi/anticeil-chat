'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Layers,
  Plus,
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Palette,
  Ratio,
  Trash2,
  SlidersHorizontal,
  Lightbulb,
  Check,
} from 'lucide-react';
import { useMediaEditorStore, MediaProject, MediaRevision } from '../store/useMediaEditorStore';
import { ImageModelSelectorModal, IMAGE_PROVIDERS } from '../../image/components/ImageModelSelectorModal';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { useAuthStore } from '../../auth/store/useAuthStore';

interface MediaCoEditorPanelProps {
  activeProject: MediaProject | null;
  activeRevision: MediaRevision | null;
  language?: 'id' | 'en';
}

const QUICK_REVISIONS = [
  { labelId: 'Pencahayaan Golden Hour', labelEn: 'Golden Hour Lighting', promptSuffix: ', warm golden hour sunlight, dramatic lens flare, warm cinematic glow' },
  { labelId: 'Gaya Cyberpunk Neon', labelEn: 'Cyberpunk Neon Style', promptSuffix: ', futuristic cyberpunk theme, vivid neon lights, glowing cyan and magenta reflections, rain-slicked surface' },
  { labelId: 'Detail Hyperrealistic 8K', labelEn: 'Hyperrealistic 8K', promptSuffix: ', ultra-high definition, 8K resolution, intricate textures, photorealistic depth of field' },
  { labelId: 'Ubah ke Gaya Anime', labelEn: 'Anime Art Style', promptSuffix: ', Japanese anime aesthetic, Makoto Shinkai style, vibrant cel-shaded illustration' },
  { labelId: 'Suasana Malam Dramatis', labelEn: 'Dramatic Night Mood', promptSuffix: ', night time atmosphere, dark moody sky, glowing moonlight, high contrast shadows' },
  { labelId: '3D Isometric Render', labelEn: '3D Isometric Render', promptSuffix: ', isometric 3D render, blender 3D style, clean clay material, studio soft lighting' },
];

export function MediaCoEditorPanel({
  activeProject,
  activeRevision,
  language = 'id',
}: MediaCoEditorPanelProps) {
  const {
    projects,
    activeProjectId,
    createProject,
    addRevision,
    setActiveProject,
    setActiveRevision,
    isGenerating,
    setIsGenerating,
    deleteProject,
  } = useMediaEditorStore();

  const [prompt, setPrompt] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const { theme } = useSettingsStore();
  const session = useAuthStore((s) => s.session);
  const canFit = useStorageStore((s) => s.canFit);
  const addUsage = useStorageStore((s) => s.addUsage);

  const styles = ['Photorealistic', 'Anime / Manga', 'Cyberpunk', '3D Render', 'Cinematic', 'Oil Painting', 'Minimalist'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  const modalModelInfo = IMAGE_PROVIDERS
    .flatMap((p) => p.models)
    .find((m) => m.id === selectedModel);
  const modelDisplayName = modalModelInfo?.name || selectedModel;

  // AI Prompt Enhancer
  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setTimeout(() => {
      const enhanced = `${prompt.trim()}, highly detailed, professional art direction, masterpiece composition, volumetric lighting, 8k resolution`;
      setPrompt(enhanced);
      setIsEnhancing(false);
    }, 600);
  };

  const handleApplyQuickRevision = (suffix: string, instructionLabel: string) => {
    if (activeRevision) {
      setRevisionNote(instructionLabel);
      setPrompt(`${activeRevision.prompt}${suffix}`);
    } else {
      setPrompt((prev) => (prev ? `${prev}${suffix}` : suffix.replace(/^, /, '')));
    }
  };

  const handleStartNewProject = () => {
    setActiveProject(null);
    setPrompt('');
    setRevisionNote('');
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Check storage quota
    const estimatedBytes = 1.2 * 1024 * 1024;
    if (!canFit(estimatedBytes)) {
      alert(language === 'id' ? 'Kapasitas penyimpanan Anda tidak mencukupi.' : 'Not enough storage space in your quota.');
      return;
    }

    // Check credit if free tier
    const allowed = useCreditStore.getState().canAfford('image', 'anticeil');
    if (!allowed) {
      useCreditStore.getState().setLimitModalOpen(true, 'image');
      return;
    }

    setIsGenerating(true);

    try {
      useCreditStore.getState().deductCredits('image', 'anticeil');

      const width = selectedRatio === '16:9' ? 1280 : selectedRatio === '9:16' ? 720 : selectedRatio === '4:3' ? 1024 : selectedRatio === '3:2' ? 1080 : 1024;
      const height = selectedRatio === '16:9' ? 720 : selectedRatio === '9:16' ? 1280 : selectedRatio === '4:3' ? 768 : selectedRatio === '3:2' ? 720 : 1024;
      const seed = Math.floor(Math.random() * 1000000);

      const encodedPrompt = encodeURIComponent(`${prompt}, ${selectedStyle} style, masterwork`);
      const modelParam = selectedModel === 'dalle3' ? 'flux' : selectedModel === 'imagen3' ? 'flux-realism' : selectedModel;
      const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${modelParam}&nologo=true&seed=${seed}`;

      let finalUrl = directUrl;

      // Persist to R2 storage if endpoint is available
      try {
        const res = await fetch('/api/image/save-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: directUrl,
            prompt,
            style: selectedStyle,
            ratio: selectedRatio,
            model: selectedModel,
            type: 'image',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.url) {
            finalUrl = data.url;
            addUsage(data.size || estimatedBytes);
          }
        }
      } catch {
        // fallback to directUrl
      }

      if (activeProject && activeRevision) {
        // Add Revision to existing project
        addRevision(activeProject.id, {
          prompt,
          url: finalUrl,
          revisionInstruction: revisionNote || (language === 'id' ? 'Revisi visual' : 'Visual revision'),
          model: selectedModel,
          style: selectedStyle,
          ratio: selectedRatio,
          seed,
          revisedFromId: activeRevision.id,
        });
        setRevisionNote('');
      } else {
        // Create brand new project
        createProject({
          prompt,
          url: finalUrl,
          model: selectedModel,
          style: selectedStyle,
          ratio: selectedRatio,
          seed,
        });
      }
    } catch (err) {
      console.error('Media generation error:', err);
      alert(language === 'id' ? 'Gagal meng-generate media. Silakan coba lagi.' : 'Failed to generate media. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ── Top Header / Project Switcher ── */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 115, 234, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
            }}
          >
            <Sparkles size={13} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            AI Co-Editor
          </span>
        </div>

        <button
          type="button"
          onClick={handleStartNewProject}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '5px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
          title={language === 'id' ? 'Mulai projek media baru' : 'Start new media project'}
        >
          <Plus size={12} />
          <span>{language === 'id' ? 'Projek Baru' : 'New Project'}</span>
        </button>
      </div>

      {/* ── Projects Dropdown / History Drawer if projects exist ── */}
      {projects.length > 1 && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '10px', fontWeight: 650, color: 'var(--text-muted)', marginBottom: '4px' }}>
            {language === 'id' ? 'PILIH PROJEK AKTIF' : 'ACTIVE PROJECT'}
          </div>
          <select
            value={activeProjectId || ''}
            onChange={(e) => setActiveProject(e.target.value || null)}
            style={{
              width: '100%',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.revisions.length} versi)
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* ── Revision Chain Summary if Project Active ── */}
        {activeProject && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 115, 234, 0.05)',
              border: '1px solid rgba(0, 115, 234, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                {language === 'id' ? 'Alur Revisi Aktif' : 'Active Revision Chain'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                v{activeRevision?.version || 1} of {activeProject.revisions.length}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {activeRevision?.revisionInstruction
                ? `Revisi: "${activeRevision.revisionInstruction}"`
                : `Konsep Awal: "${activeProject.revisions[0]?.prompt.slice(0, 80)}..."`}
            </div>
          </div>
        )}

        {/* ── Quick Revision Suggestions ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 650, color: 'var(--text-muted)', marginBottom: '8px' }}>
            <Lightbulb size={12} color="var(--brand-primary)" />
            <span>{language === 'id' ? 'Saran Revisi Cepat' : 'Quick Revision Suggestions'}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {QUICK_REVISIONS.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyQuickRevision(qr.promptSuffix, language === 'id' ? qr.labelId : qr.labelEn)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '10.5px',
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
        </div>

        {/* ── Model & Ratio Settings ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Model Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              {language === 'id' ? 'Model Generator' : 'Generator Model'}
            </label>
            <button
              type="button"
              onClick={() => setIsModelModalOpen(true)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span>{modelDisplayName}</span>
              <SlidersHorizontal size={12} color="var(--text-muted)" />
            </button>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              {language === 'id' ? 'Aspek Rasio' : 'Aspect Ratio'}
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {ratios.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRatio(r)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: selectedRatio === r ? 700 : 500,
                    backgroundColor: selectedRatio === r ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: selectedRatio === r ? '#ffffff' : 'var(--text-primary)',
                    border: `1px solid ${selectedRatio === r ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              {language === 'id' ? 'Gaya Visual' : 'Visual Style'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {styles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStyle(s)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: selectedStyle === s ? 700 : 500,
                    backgroundColor: selectedStyle === s ? 'rgba(0, 115, 234, 0.15)' : 'var(--bg-subtle)',
                    color: selectedStyle === s ? 'var(--brand-primary)' : 'var(--text-primary)',
                    border: `1px solid ${selectedStyle === s ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Prompt & Revision Input ── */}
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          {activeProject && (
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '2px' }}>
                {language === 'id' ? 'Catatan Perubahan Revisi (Opsional):' : 'Revision Change Note (Optional):'}
              </label>
              <input
                type="text"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder={language === 'id' ? 'Contoh: Ubah warna rambut, tambah latar belakang...' : 'e.g. Change hair color, add sunset...'}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {activeProject ? (language === 'id' ? 'Prompt Media Lengkap:' : 'Full Media Prompt:') : (language === 'id' ? 'Deskripsi / Prompt Media:' : 'Prompt Description:')}
              </label>

              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--brand-primary)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: isEnhancing || !prompt.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  opacity: isEnhancing || !prompt.trim() ? 0.5 : 1,
                }}
                title={language === 'id' ? 'Perkaya prompt dengan AI secara otomatis' : 'Auto-enhance prompt with AI'}
              >
                <Wand2 size={11} />
                <span>{isEnhancing ? (language === 'id' ? 'Memperkaya...' : 'Enhancing...') : (language === 'id' ? 'Enhance Prompt' : 'Enhance Prompt')}</span>
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeProject
                  ? (language === 'id' ? 'Deskripsikan instruksi revisi media...' : 'Describe revision instructions...')
                  : (language === 'id' ? 'Ketik deskripsi gambar/media yang ingin dibuat...' : 'Type a description of the media you want to generate...')
              }
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                lineHeight: '1.45',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
              opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'opacity 0.15s ease',
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>{language === 'id' ? 'Sedang Merender...' : 'Rendering...'}</span>
              </>
            ) : activeProject ? (
              <>
                <Sparkles size={13} />
                <span>{language === 'id' ? `Buat Revisi (v${(activeRevision?.version || 1) + 1})` : `Generate Revision (v${(activeRevision?.version || 1) + 1})`}</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>{language === 'id' ? 'Generate Media Baru' : 'Generate New Media'}</span>
              </>
            )}
          </button>
        </form>
      </div>

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
