'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload, Trash2, File, Image, FileText, Music, ExternalLink } from 'lucide-react';
import type { WorkspaceFile } from '../../storage/store/useWorkspaceStore';
import { useFileUpload } from '../../storage/hooks/useFileUpload';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FolderFileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  files: WorkspaceFile[];
  onFileAdded: (file: WorkspaceFile) => void;
  onFileRemoved: (fileId: string) => void;
  /** R2 category hint to guide presigned URL key generation */
  acceptTypes?: string;
  language?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function FileIcon({ contentType, size = 16 }: { contentType: string; size?: number }) {
  if (contentType.startsWith('image/')) return <Image size={size} color="#A25DDC" />;
  if (contentType.startsWith('audio/')) return <Music size={size} color="#F59E0B" />;
  if (contentType.includes('pdf') || contentType.includes('word') || contentType.includes('text'))
    return <FileText size={size} color="#EF4444" />;
  return <File size={size} color="var(--text-muted)" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FolderFileDrawer({
  isOpen,
  onClose,
  folderName,
  files,
  onFileAdded,
  onFileRemoved,
  acceptTypes = '*/*',
  language = 'id',
}: FolderFileDrawerProps) {
  const { pickAndUpload } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(() => {
    setUploadError(null);
    setIsUploading(true);

    pickAndUpload({
      accept: acceptTypes,
      multiple: true,
      onFile: (file) => {
        onFileAdded(file);
      },
      onError: (err) => {
        setUploadError(err.message);
      },
    });

    // isUploading is purely visual — native picker is synchronous-blocking
    setTimeout(() => setIsUploading(false), 500);
  }, [pickAndUpload, acceptTypes, onFileAdded]);

  if (!isOpen) return null;

  const totalSize = files.reduce((a, f) => a + f.size, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '340px',
          maxWidth: '90vw',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {folderName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {files.length} {language === 'id' ? 'berkas' : 'files'} · {formatBytes(totalSize)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Upload Button */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1.5px dashed var(--border-strong)',
              background: isUploading ? 'var(--bg-subtle)' : 'transparent',
              color: 'var(--brand-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={14} />
            <span>{isUploading ? (language === 'id' ? 'Mengunggah...' : 'Uploading...') : (language === 'id' ? 'Unggah Berkas' : 'Upload Files')}</span>
          </button>

          {uploadError && (
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--accent-danger)', padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px' }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* File List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {files.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '10px',
                color: 'var(--text-muted)',
              }}
            >
              <Upload size={28} opacity={0.4} />
              <span style={{ fontSize: '12px' }}>
                {language === 'id' ? 'Belum ada berkas di sini' : 'No files yet'}
              </span>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileIcon contentType={file.contentType} size={16} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {file.name}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{formatBytes(file.size)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {file.publicUrl && (
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={language === 'id' ? 'Buka berkas' : 'Open file'}
                      style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onFileRemoved(file.id)}
                    title={language === 'id' ? 'Hapus berkas' : 'Delete file'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
