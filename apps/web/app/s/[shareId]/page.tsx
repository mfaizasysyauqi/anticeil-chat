'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Code2,
  Copy,
  Check,
  Download,
  Printer,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  AlertCircle,
  Table as TableIcon,
  Presentation,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { buildDocumentPreviewHtml } from '@/features/docs/utils/docPreviewBuilder';

interface ShareData {
  id: string;
  projectId: string;
  title: string;
  format: 'latex' | 'typst' | 'sheet' | 'slide' | 'markdown';
  previewData: string;
  sourceCode: string;
  files: Array<{ id: string; name: string; content: string }>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  viewCount: number;
}

export default function SharedDocViewPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = typeof params?.shareId === 'string' ? params.shareId : '';

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<'expired' | 'inactive' | 'not_found' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [expiredMetadata, setExpiredMetadata] = useState<{ title?: string; expiresAt?: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Slide Presenter State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    setLoading(true);

    fetch(`/api/docs/share/${shareId}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 410 || data?.error === 'expired') {
          setErrorStatus('expired');
          setExpiredMetadata({ title: data.title, expiresAt: data.expiresAt });
          setErrorMessage(data.message || 'Tautan berbagi ini telah kedaluwarsa.');
          return;
        }
        if (res.status === 403 || data?.error === 'inactive') {
          setErrorStatus('inactive');
          setErrorMessage(data.message || 'Tautan berbagi telah dinonaktifkan oleh pemilik dokumen.');
          return;
        }
        if (!res.ok || data?.error || (!data.share && !data.document)) {
          setErrorStatus('not_found');
          setErrorMessage(data?.message || 'Dokumen snapshot tidak ditemukan.');
          return;
        }

        if (data.type === 'snapshot' && data.share) {
          setShareData(data.share);
        } else if (data.document) {
          setShareData({
            id: shareId,
            projectId: data.document.id,
            title: data.document.title || 'Untitled Document',
            format: data.document.format || 'latex',
            previewData: '',
            sourceCode: data.document.content || '',
            files: data.document.files || [],
            createdAt: new Date(data.document.updatedAt).toISOString(),
            updatedAt: new Date(data.document.updatedAt).toISOString(),
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            viewCount: 1,
          });
        }
      })
      .catch((err) => {
        setErrorStatus('not_found');
        setErrorMessage(err.message || 'Gagal memuat dokumen.');
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  // Handle Copy Source Code
  const handleCopyCode = () => {
    if (!shareData?.sourceCode) return;
    navigator.clipboard.writeText(shareData.sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compile Preview HTML if not provided
  const compiledHtml = useMemo(() => {
    if (!shareData) return '';
    if (shareData.previewData && shareData.previewData.includes('<!DOCTYPE html>')) {
      return shareData.previewData;
    }
    try {
      return buildDocumentPreviewHtml({
        doc: {
          id: shareData.projectId,
          title: shareData.title,
          content: shareData.sourceCode,
          format: shareData.format,
          files: shareData.files.map((f) => ({ ...f, isMain: f.name === 'main.tex' || f.name === 'main.typ', createdAt: Date.now(), updatedAt: Date.now() })),
          updatedAt: Date.now(),
        },
        theme,
        language: 'id',
      });
    } catch {
      return shareData.previewData || shareData.sourceCode;
    }
  }, [shareData, theme]);

  // Slides extraction if format is slide
  const slides = useMemo(() => {
    if (!shareData || shareData.format !== 'slide') return [];
    const raw = shareData.sourceCode || '';
    const parts = raw.split(/\n---\n/);
    return parts.map((p) => p.trim()).filter(Boolean);
  }, [shareData]);

  // Slide navigation
  const nextSlide = () => setCurrentSlideIndex((i) => Math.min(slides.length - 1, i + 1));
  const prevSlide = () => setCurrentSlideIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (shareData?.format !== 'slide') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shareData?.format, slides.length]);

  // Expiry metadata details
  const expiryDetails = useMemo(() => {
    if (!shareData?.expiresAt) return null;
    const expiresMs = new Date(shareData.expiresAt).getTime();
    const nowMs = Date.now();
    const daysLeft = Math.max(0, Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24)));
    const formattedDate = new Date(shareData.expiresAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedUpdated = new Date(shareData.updatedAt || shareData.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return { daysLeft, formattedDate, formattedUpdated };
  }, [shareData?.expiresAt, shareData?.updatedAt, shareData?.createdAt]);

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0d14',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
            marginBottom: '16px',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}
        >
          <Sparkles size={22} />
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px' }}>Memuat Dokumen Snapshot...</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Anticeil View-Only Viewer</p>
      </div>
    );
  }

  // ── EXPIRED OR INACTIVE SCREEN ─────────────────────────────────────────────
  if (errorStatus) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0d14',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#131722',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: errorStatus === 'expired' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${errorStatus === 'expired' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: errorStatus === 'expired' ? '#F59E0B' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            {errorStatus === 'expired' ? <Clock size={26} /> : <AlertCircle size={26} />}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
            {errorStatus === 'expired'
              ? 'Tautan Berbagi Telah Kedaluwarsa'
              : errorStatus === 'inactive'
              ? 'Tautan Dinonaktifkan'
              : 'Dokumen Tidak Ditemukan'}
          </h2>

          <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 20px' }}>
            {errorStatus === 'expired'
              ? `Snapshot dokumen "${expiredMetadata?.title || 'ini'}" telah melewati masa aktif sharing. Hubungi pemilik dokumen untuk memperbarui link snapshot.`
              : errorMessage}
          </p>

          <button
            type="button"
            onClick={() => router.push('/docs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#3B82F6',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={15} />
            <span>Buka Anticeil Docs Studio</span>
          </button>
        </div>
      </div>
    );
  }

  if (!shareData) return null;

  // ── MAIN VIEWER ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#0a0d14',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Navbar ── */}
      <header
        style={{
          height: '48px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0e121b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        {/* Left: Brand + Title + Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onClick={() => router.push('/')}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
                fontWeight: 800,
                fontSize: '13px',
              }}
            >
              A
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>
              Anticeil
            </span>
          </div>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '13.5px',
                fontWeight: 650,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px',
              }}
              title={shareData.title}
            >
              {shareData.title}
            </h1>

            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexShrink: 0,
              }}
            >
              {shareData.format}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={11} />
              View-Only
            </span>
          </div>
        </div>

        {/* Center: Preview vs Code Toggle */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'preview' ? '#3B82F6' : 'transparent',
              color: activeTab === 'preview' ? '#ffffff' : '#94a3b8',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'code' ? '#3B82F6' : 'transparent',
              color: activeTab === 'code' ? '#ffffff' : '#94a3b8',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Code2 size={13} />
            <span>Source Code</span>
          </button>
        </div>

        {/* Right: Copy Code + Expiry Info + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {expiryDetails && (
            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginRight: '6px',
              }}
            >
              <Clock size={12} style={{ color: '#F59E0B' }} />
              <span>Sisa {expiryDetails.daysLeft} hari</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: copied ? '#10B981' : '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Salin Kode Sumber Dokumen"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/docs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#3B82F6',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={12} />
            <span>Buka di Studio</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main style={{ flex: 1, height: 'calc(100vh - 48px)', position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'preview' ? (
          /* Preview Mode */
          shareData.format === 'slide' ? (
            /* Slide Presenter Stage */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#000000',
                position: 'relative',
              }}
            >
              {/* Slide Screen Canvas */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '960px',
                    aspectRatio: '16 / 9',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '40px 48px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    overflowY: 'auto',
                    color: '#ffffff',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '18px' }}>
                    {slides[currentSlideIndex] || 'No slide content'}
                  </div>
                </div>
              </div>

              {/* Slide Navigation Controls */}
              <div
                style={{
                  height: '48px',
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  backdropFilter: 'blur(8px)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={currentSlideIndex === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentSlideIndex === 0 ? '#4b5563' : '#ffffff',
                    cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
                    padding: '4px',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                  Slide {currentSlideIndex + 1} / {slides.length || 1}
                </span>

                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={currentSlideIndex >= slides.length - 1}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentSlideIndex >= slides.length - 1 ? '#4b5563' : '#ffffff',
                    cursor: currentSlideIndex >= slides.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '4px',
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ) : (
            /* Document Iframe (LaTeX, Typst, Sheet, Markdown) */
            <iframe
              title="Doc Preview"
              srcDoc={compiledHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: theme === 'dark' ? '#0b0f19' : '#ffffff',
              }}
            />
          )
        ) : (
          /* Code Mode (Read-Only) */
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#0a0d14',
              padding: '20px',
              overflow: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {shareData.sourceCode}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
