'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Share2,
  X,
  Copy,
  Check,
  Globe,
  Clock,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
  Eye,
  AlertCircle,
  FileCode,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { DocItem } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { buildDocumentPreviewHtml } from '../utils/docPreviewBuilder';

export interface DocShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
}

export interface ShareMetadata {
  id: string;
  projectId: string;
  title: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isActive: boolean;
  viewCount?: number;
}

export function DocShareModal({ isOpen, onClose, doc }: DocShareModalProps) {
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const theme = useSettingsStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);

  const [shareInfo, setShareInfo] = useState<ShareMetadata | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 30>(14);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const shareUrl = useMemo(() => {
    if (!shareInfo?.id) return '';
    if (typeof window === 'undefined') return `https://anticeil.com/s/${shareInfo.id}`;
    return `${window.location.origin}/s/${shareInfo.id}`;
  }, [shareInfo?.id]);

  // Sisa hari & formatting tanggal
  const expiryDetails = useMemo(() => {
    if (!shareInfo?.expiresAt) return null;
    const expiresMs = new Date(shareInfo.expiresAt).getTime();
    const nowMs = Date.now();
    const diffMs = expiresMs - nowMs;
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

    const formattedDate = new Date(shareInfo.expiresAt).toLocaleDateString(
      language === 'id' ? 'id-ID' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

    const formattedUpdated = new Date(shareInfo.updatedAt || shareInfo.createdAt).toLocaleDateString(
      language === 'id' ? 'id-ID' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    );

    return { daysLeft, isExpired, formattedDate, formattedUpdated };
  }, [shareInfo?.expiresAt, shareInfo?.updatedAt, shareInfo?.createdAt, language]);

  // Load share status on open
  useEffect(() => {
    if (!isOpen || !doc?.id) return;
    setFeedback(null);
    setCopied(false);

    // 1. Check local cache
    const cacheKey = `anticeil_doc_share_${doc.id}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id && new Date(parsed.expiresAt).getTime() > Date.now()) {
          setShareInfo(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 2. Fetch fresh status from server
    setIsLoading(true);
    fetch('/api/docs/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', projectId: doc.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.share) {
          setShareInfo(data.share);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data.share));
          } catch {}
        } else if (data?.share === null) {
          setShareInfo(null);
          try {
            localStorage.removeItem(cacheKey);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen, doc?.id]);

  const compilePreview = useCallback(() => {
    if (!doc) return '';
    try {
      return buildDocumentPreviewHtml({ doc, theme, language });
    } catch {
      return doc.content || '';
    }
  }, [doc, theme, language]);

  // Action 1: Create Share Link
  const handleCreateShare = async () => {
    if (!doc) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const previewData = compilePreview();
      const res = await fetch('/api/docs/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          projectId: doc.id,
          userId: user?.id,
          title: doc.title || 'Untitled Document',
          format: doc.format || 'latex',
          previewData,
          sourceCode: doc.content || '',
          files: (doc.files || []).map((f) => ({ id: f.id, name: f.name, content: f.content })),
          durationDays: selectedDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal membuat link share');
      }

      setShareInfo(data.share);
      try {
        localStorage.setItem(`anticeil_doc_share_${doc.id}`, JSON.stringify(data.share));
      } catch {}

      setFeedback({
        type: 'success',
        text: language === 'id' ? 'Link Share View-Only berhasil dibuat!' : 'Share link created successfully!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error creating share link' });
    } finally {
      setIsLoading(false);
    }
  };

  // Action 2: Update Shared Version (Overwrite snapshot on same share_id, keeping same expiry)
  const handleUpdateShare = async () => {
    if (!doc || !shareInfo?.id) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      const previewData = compilePreview();
      const res = await fetch('/api/docs/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          shareId: shareInfo.id,
          projectId: doc.id,
          userId: user?.id,
          title: doc.title || 'Untitled Document',
          format: doc.format || 'latex',
          previewData,
          sourceCode: doc.content || '',
          files: (doc.files || []).map((f) => ({ id: f.id, name: f.name, content: f.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memperbarui snapshot');
      }

      setShareInfo(data.share);
      try {
        localStorage.setItem(`anticeil_doc_share_${doc.id}`, JSON.stringify(data.share));
      } catch {}

      setFeedback({
        type: 'success',
        text: language === 'id' ? 'Shared version updated successfully' : 'Shared version updated successfully',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating shared version' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Action 3: Disable Share Link
  const handleDisableShare = async () => {
    if (!doc) return;
    if (!confirm(language === 'id' ? 'Apakah Anda yakin ingin menonaktifkan link share ini?' : 'Are you sure you want to disable this share link?')) {
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      await fetch('/api/docs/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', projectId: doc.id, shareId: shareInfo?.id }),
      });

      setShareInfo(null);
      try {
        localStorage.removeItem(`anticeil_doc_share_${doc.id}`);
      } catch {}

      setFeedback({
        type: 'success',
        text: language === 'id' ? 'Link share telah dinonaktifkan.' : 'Share link has been disabled.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error disabling share link' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !doc) return null;

  const isShared = Boolean(shareInfo?.id && shareInfo?.isActive && !expiryDetails?.isExpired);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'docs-fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-surface, #131722)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
              }}
            >
              <Share2 size={18} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 650,
                  color: 'var(--text-primary, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {language === 'id' ? 'Bagikan Dokumen (View-Only)' : 'Share Document (View-Only)'}
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: isShared ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: isShared ? '#10B981' : 'var(--text-muted, #94a3b8)',
                    border: `1px solid ${isShared ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  {isShared ? (language === 'id' ? 'Aktif' : 'Active') : 'Free Tier'}
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                {doc.title || 'Untitled Document'} • {doc.format?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="hover-subtle"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Feedback Toast */}
          {feedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor:
                  feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: feedback.type === 'success' ? '#10B981' : '#EF4444',
                border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              }}
            >
              <Check size={14} />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Banner Peringatan Snapshot vs Real-time */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={16} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary, #cbd5e1)' }}>
              <strong>{language === 'id' ? 'Snapshot Berbagi:' : 'Sharing Snapshot:'}</strong>{' '}
              {language === 'id'
                ? 'Tautan ini membagikan snapshot dokumen saat ini. Jika Anda mengedit dokumen di editor lokal, tekan "Update Shared Version" untuk memperbarui isi link yang sama.'
                : 'This link shares a static snapshot of your document. When you make local edits, click "Update Shared Version" to overwrite the same link.'}
            </div>
          </div>

          {/* If Link is already shared */}
          {isShared && shareInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Share URL Input Box */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--text-muted, #94a3b8)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {language === 'id' ? 'Tautan View-Only Publik' : 'Public View-Only Link'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-main, #0b0f19)',
                      border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.15))',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      backgroundColor: copied ? '#10B981' : '#3B82F6',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Status & Expiry Info Card */}
              {expiryDetails && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{language === 'id' ? 'Terakhir Diupdate' : 'Last Updated'}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary, #ffffff)', marginTop: '2px' }}>
                      {expiryDetails.formattedUpdated}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{language === 'id' ? 'Masa Berlaku' : 'Expires In'}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#F59E0B', marginTop: '2px' }}>
                      {expiryDetails.daysLeft} {language === 'id' ? 'Hari Lagi' : 'Days Left'}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 400 }}>
                        ({expiryDetails.formattedDate})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Update Snapshot, Open Link, Disable Link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleUpdateShare}
                  disabled={isUpdating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#3B82F6',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                  <span>
                    {isUpdating
                      ? language === 'id'
                        ? 'Memperbarui Snapshot...'
                        : 'Updating Snapshot...'
                      : language === 'id'
                      ? 'Update Shared Version'
                      : 'Update Shared Version'}
                  </span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => window.open(shareUrl, '_blank')}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    className="hover-subtle"
                  >
                    <ExternalLink size={13} />
                    <span>{language === 'id' ? 'Buka Halaman' : 'Open Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisableShare}
                    disabled={isLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#EF4444',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                    className="hover-subtle"
                  >
                    <Trash2 size={13} />
                    <span>{language === 'id' ? 'Nonaktifkan' : 'Disable'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Link not created yet — Duration selector & Create button */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary, #ffffff)',
                    marginBottom: '8px',
                  }}
                >
                  {language === 'id' ? 'Pilih Masa Aktif Link Share:' : 'Select Share Link Duration:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {([7, 14, 30] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedDuration(days)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        border:
                          selectedDuration === days
                            ? '1.5px solid #3B82F6'
                            : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                        backgroundColor:
                          selectedDuration === days ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        color: selectedDuration === days ? '#3B82F6' : 'var(--text-primary, #ffffff)',
                        fontSize: '12.5px',
                        fontWeight: selectedDuration === days ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>{days} {language === 'id' ? 'Hari' : 'Days'}</div>
                      {days === 14 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                          (Default)
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Globe size={14} style={{ color: '#3B82F6' }} />
                <span>
                  {language === 'id'
                    ? 'Siapa saja yang memiliki tautan dapat melihat preview dan menyalin kode sumber tanpa perlu login.'
                    : 'Anyone with the link can view preview and copy source code without logging in.'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCreateShare}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#3B82F6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Share2 size={15} />
                <span>
                  {isLoading
                    ? language === 'id'
                      ? 'Membuat Link...'
                      : 'Creating Link...'
                    : language === 'id'
                    ? 'Buat Link Share (Gratis)'
                    : 'Create Share Link (Free)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
