import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Table,
  Presentation,
  GraduationCap,
  Cpu,
  Sigma,
  Clock,
  ChevronRight,
  Folder,
  FolderOpen,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDocsStore, DocFormat } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { DOC_TEMPLATES } from '../data/docTemplates';

interface DocsLandingViewProps {
  onStartGenerate: (prompt: string, format: DocFormat) => void;
}

export function DocsLandingView({ onStartGenerate }: DocsLandingViewProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const selectedFormat = useDocsStore((s) => s.selectedFormat);
  const setSelectedFormat = useDocsStore((s) => s.setSelectedFormat);
  const createFromTemplate = useDocsStore((s) => s.createFromTemplate);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow: min 2 lines, max 7 lines (fontSize 14 * lineHeight 1.6 = 22.4px/line)
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const lineH = 14 * 1.6;
    const minH = lineH * 2;
    const maxH = lineH * 7;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minH), maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, []);
  const documents = useDocsStore((s) => s.documents);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const activeProjectId = useDocsStore((s) => s.activeProjectId);
  const setActiveProjectId = useDocsStore((s) => s.setActiveProjectId);
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const docFolders = useDocsStore((s) => s.folders);
  const language = useSettingsStore((s) => s.language);

  const activeProject = docFolders.find((p) => p.id === activeProjectId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStartGenerate(prompt.trim(), selectedFormat);
  };

  const formatOptions: { id: DocFormat; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'latex',
      label: language === 'id' ? 'Dokumen' : 'Document',
      icon: <FileText size={15} color="var(--brand-primary, #0073EA)" />,
      badge: 'Markdown & LaTeX',
    },
    {
      id: 'sheet',
      label: 'Spreadsheet',
      icon: <Table size={15} color="var(--accent-success, #10B981)" />,
      badge: 'Excel Formulas',
    },
    {
      id: 'slide',
      label: language === 'id' ? 'Slide Presentasi' : 'Presentation Slides',
      icon: <Presentation size={15} color="var(--brand-accent, #8B5CF6)" />,
      badge: 'Deck',
    },
  ];

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>📑</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {language === 'id' ? 'Docs & LaTeX — Studio Dokumen Ilmiah' : 'Docs & LaTeX — Scientific Document Studio'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {language === 'id'
              ? 'Hasilkan paper riset, formula matematis KaTeX, RFC arsitektur, dan spreadsheet interaktif secara mandiri.'
              : 'Generate research papers, KaTeX formulas, technical specifications, and interactive spreadsheets.'}
          </p>

          {/* Active Project Scope Pill */}
          {activeProject ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                background: 'rgba(0, 115, 234, 0.1)',
                border: '1px solid rgba(0, 115, 234, 0.25)',
                borderRadius: '20px',
                color: 'var(--brand-primary)',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '10px',
              }}
            >
              <FolderOpen size={13} />
              <span>{language === 'id' ? `Folder Proyek: ${activeProject.name}` : `Project Folder: ${activeProject.name}`}</span>
              <button
                type="button"
                onClick={() => setActiveProjectId(null)}
                title={language === 'id' ? 'Lihat Semua Proyek' : 'View All Projects'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : docFolders.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {language === 'id' ? 'Pilih folder dokumen:' : 'Select doc folder:'}
              </span>
              {docFolders.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProjectId(p.id)}
                  className="clickable-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Folder size={11} color="var(--text-muted)" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Main Input Card Container ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0,0,0,0.06))',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'border-color 0.2s ease',
            marginBottom: '28px',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onInput={autoGrow}
            placeholder={
              activeProject
                ? (language === 'id'
                    ? `Buatkan dokumen untuk proyek "${activeProject.name}" (misal: analisis arsitektur, laporan keuangan)...`
                    : `Draft a document for project "${activeProject.name}" (e.g. system design, financial sheet)...`)
                : (language === 'id'
                    ? 'Contoh: Buatkan paper riset tentang optimasi algoritma CNN dengan rumus matematika dan tabel perbandingan...'
                    : 'Example: Draft an academic paper on CNN optimization with mathematical formulas and metric tables...')
            }
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              resize: 'none',
              fontFamily: 'inherit',
              overflowY: 'hidden',
              minHeight: `${14 * 1.6 * 2}px`,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />

          {/* Bottom Card Bar: Format Pills + Submit Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-subtle)',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {/* Format Selection Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {formatOptions.map((opt) => {
                const isSelected = selectedFormat === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedFormat(opt.id)}
                    className="clickable-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1.5px solid var(--brand-primary)'
                        : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 650 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit / Generate Button */}
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: prompt.trim() ? 'var(--brand-primary)' : 'var(--border-subtle)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{language === 'id' ? 'Buat Dokumen' : 'Generate Document'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* ── Starter Templates Section ── */}
        <div style={{ marginBottom: '32px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <Sparkles size={15} color="var(--brand-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {language === 'id' ? 'Mulai dari Template Populer' : 'Start from Popular Templates'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              width: '100%',
            }}
          >
            {DOC_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  const newId = createFromTemplate(tpl.id, activeProjectId);
                  router.push('/docs/' + newId);
                }}
                className="clickable-card"
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {tpl.icon === 'GraduationCap' && <GraduationCap size={18} color="#0073EA" />}
                  {tpl.icon === 'Cpu' && <Cpu size={18} color="#10B981" />}
                  {tpl.icon === 'Sigma' && <Sigma size={18} color="#8B5CF6" />}
                  {tpl.icon === 'FileText' && <FileText size={18} color="#EC4899" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <h3 style={{ fontSize: '13.5px', fontWeight: 650, margin: 0, color: 'var(--text-primary)' }}>
                      {tpl.title}
                    </h3>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {tpl.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Documents Section (Scoped to active project) ── */}
        {mounted && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeProject
                    ? (language === 'id' ? `Dokumen Proyek (${activeProject.name})` : `Project Documents (${activeProject.name})`)
                    : (language === 'id' ? 'Dokumen Terakhir' : 'Recent Documents')}
                </span>
              </div>
            </div>

            {(() => {
              const projectDocs = activeProjectId
                ? documents.filter((d) => d.projectId === activeProjectId)
                : documents;

              if (projectDocs.length === 0) {
                return (
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px dashed var(--border-subtle)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    {activeProject
                      ? (language === 'id'
                          ? `Belum ada dokumen di folder proyek "${activeProject.name}". Buat dokumen baru dengan prompt di atas!`
                          : `No documents in project "${activeProject.name}" yet. Draft a new one using the prompt above!`)
                      : (language === 'id' ? 'Belum ada dokumen.' : 'No documents yet.')}
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {projectDocs.slice(0, 10).map((doc) => {
                    const docProject = docFolders.find((p) => p.id === doc.projectId);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (doc.projectId) setActiveProjectId(doc.projectId);
                          setActiveDocId(doc.id);
                          router.push('/docs/' + doc.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {doc.format === 'sheet' ? (
                            <Table size={16} color="#10B981" style={{ flexShrink: 0 }} />
                          ) : doc.format === 'slide' ? (
                            <Presentation size={16} color="#8B5CF6" style={{ flexShrink: 0 }} />
                          ) : (
                            <FileText size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {doc.title}
                          </span>
                          {docProject && !activeProjectId && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                background: 'rgba(0, 115, 234, 0.1)',
                                color: 'var(--brand-primary)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              📁 {docProject.name}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
