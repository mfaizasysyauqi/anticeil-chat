'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Copy,
  Trash2,
  Check,
  Image as ImageIcon,
  Film,
  Music,
  Pin,
  FolderInput,
  FolderMinus,
  Folder,
  ChevronDown,
} from 'lucide-react';
import { useImageStore, ImageMediaItem } from '../../features/image/store/useImageStore';
import { useWorkspaceStore } from '../../features/storage/store/useWorkspaceStore';

interface MediaDetailModalProps {
  item: ImageMediaItem | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  language?: 'en' | 'id';
}

export function MediaDetailModal({
  item,
  onClose,
  onDelete,
  language = 'id',
}: MediaDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const togglePin = useImageStore((s) => s.togglePin);
  const moveToCollection = useImageStore((s) => s.moveToCollection);
  const liveItems = useImageStore((s) => s.items);
  const imageCollections = useWorkspaceStore((s) => s.imageCollections);

  // Live item from store
  const currentItem = item ? liveItems.find((i) => i.id === item.id) || item : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setIsFolderMenuOpen(false);
      }
    };
    if (isFolderMenuOpen) document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [isFolderMenuOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, handleClose]);

  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  if (!currentItem || !mounted) return null;

  const isImage = currentItem.type === 'image';
  const isVideo = currentItem.type === 'video';
  const isAudio = currentItem.type === 'audio';
  const accentColor = isVideo ? '#fb7185' : isAudio ? '#60a5fa' : '#A25DDC';

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentItem.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(currentItem.url);
      const blob = await res.blob();
      const ext = isVideo ? 'mp4' : isAudio ? 'mp3' : 'png';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anticeil-${currentItem.type}-${currentItem.id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentItem.url, '_blank');
    }
  };

  const handleDelete = () => {
    onDelete?.(currentItem.id);
    handleClose();
  };

  const TypeIcon = isVideo ? Film : isAudio ? Music : ImageIcon;

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          maxWidth: '880px', width: '100%', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <TypeIcon size={15} color={accentColor} />
          <span style={{ flex: 1, fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentItem.prompt}
          </span>
          {currentItem.isPinned && <Pin size={12} color={accentColor} />}
          <button
            type="button" onClick={handleClose}
            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '16px', minHeight: 0 }}>
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentItem.url} alt={currentItem.prompt} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '10px', objectFit: 'contain', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
          )}
          {isVideo && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={currentItem.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
          )}
          {isAudio && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}22, ${accentColor}08)`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={32} color={accentColor} />
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio src={currentItem.url} controls autoPlay style={{ width: '100%', maxWidth: '480px' }} />
            </div>
          )}
        </div>

        {/* Metadata chips */}
        <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {currentItem.style && <MetaChip label={currentItem.style} />}
          {currentItem.ratio && <MetaChip label={currentItem.ratio} />}
          {currentItem.model && <MetaChip label={currentItem.model} />}
          {currentItem.voice && <MetaChip label={currentItem.voice} />}
          {currentItem.category && <MetaChip label={currentItem.category} />}
          {currentItem.durationSec != null && <MetaChip label={`${currentItem.durationSec}s`} />}
          {currentItem.collectionId && (
            <MetaChip
              label={`📁 ${imageCollections.find((c) => c.id === currentItem.collectionId)?.name || 'Folder'}`}
            />
          )}
          <MetaChip label={currentItem.createdAtLabel} dim />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Copy Prompt */}
          <ActionButton
            onClick={handleCopyPrompt}
            icon={copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            label={copied ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin Prompt' : 'Copy Prompt')}
            accent={copied ? '#10b981' : undefined}
          />

          {/* Download */}
          <ActionButton
            onClick={handleDownload}
            icon={<Download size={14} />}
            label={language === 'id' ? 'Unduh' : 'Download'}
          />

          {/* Pin / Unpin */}
          <ActionButton
            onClick={() => togglePin(currentItem.id)}
            icon={<Pin size={14} fill={currentItem.isPinned ? accentColor : 'none'} color={currentItem.isPinned ? accentColor : 'currentColor'} />}
            label={currentItem.isPinned ? (language === 'id' ? 'Lepas Sematan' : 'Unpin') : (language === 'id' ? 'Sematkan' : 'Pin')}
            accent={currentItem.isPinned ? accentColor : undefined}
          />

          {/* Move to Folder Dropdown */}
          <div style={{ position: 'relative' }} ref={folderMenuRef}>
            <ActionButton
              onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
              icon={<FolderInput size={14} />}
              label={language === 'id' ? 'Pindah ke folder' : 'Move to folder'}
            />

            {isFolderMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '4px',
                  minWidth: '170px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 999999999,
                }}
              >
                {currentItem.collectionId && (
                  <button
                    type="button"
                    onClick={() => {
                      moveToCollection(currentItem.id, null);
                      setIsFolderMenuOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 9px',
                      borderRadius: '5px', border: 'none', background: 'transparent',
                      color: 'var(--accent-warning, #eab308)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <FolderMinus size={12} />
                    <span>{language === 'id' ? 'Keluarkan dari folder' : 'Remove from folder'}</span>
                  </button>
                )}

                {imageCollections.length === 0 ? (
                  <div style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {language === 'id' ? 'Belum ada folder' : 'No folders'}
                  </div>
                ) : (
                  imageCollections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        moveToCollection(currentItem.id, c.id);
                        setIsFolderMenuOpen(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 9px',
                        borderRadius: '5px', border: 'none',
                        background: currentItem.collectionId === c.id ? 'rgba(162, 93, 220, 0.15)' : 'transparent',
                        color: currentItem.collectionId === c.id ? '#A25DDC' : 'var(--text-primary)',
                        fontSize: '11.5px', cursor: 'pointer', textAlign: 'left', fontWeight: currentItem.collectionId === c.id ? 650 : 400,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentItem.collectionId === c.id ? 'rgba(162, 93, 220, 0.15)' : 'transparent')}
                    >
                      <Folder size={12} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Delete */}
          {onDelete && (
            <ActionButton
              onClick={handleDelete}
              icon={<Trash2 size={14} />}
              label={language === 'id' ? 'Hapus' : 'Delete'}
              danger
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function MetaChip({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '5px', background: 'var(--bg-subtle)', color: dim ? 'var(--text-muted)' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
      {label}
    </span>
  );
}

function ActionButton({ onClick, icon, label, danger, accent }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean; accent?: string; }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`, background: danger ? 'rgba(239,68,68,0.06)' : 'var(--bg-main)', color: danger ? '#ef4444' : accent || 'var(--text-primary)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
    >
      {icon}{label}
    </button>
  );
}


