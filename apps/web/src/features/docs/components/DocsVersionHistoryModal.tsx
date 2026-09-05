import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  History,
  RotateCcw,
  Tag,
  Clock,
  FileText,
  Search,
  Check,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Filter,
  ChevronRight,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import {
  useDocsStore,
  DocItem,
  DocHistorySnapshot,
  DocSubFile,
} from '../store/useDocsStore';

interface DocsVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc: DocItem | null;
  language?: 'id' | 'en';
  isCloudUser?: boolean; // Starter or Pro tier
}

type DiffLineType = 'added' | 'removed' | 'unchanged';

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Compute line-by-line LCS diff
function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const m = oldLines.length;
  const n = newLines.length;

  // Max diff matrix safety cap to avoid freezing on massive files (> 2000 lines)
  if (m * n > 1500000) {
    // Fast block diff fallback
    const res: DiffLine[] = [];
    oldLines.forEach((l, i) => res.push({ type: 'removed', content: l, oldLineNumber: i + 1 }));
    newLines.forEach((l, i) => res.push({ type: 'added', content: l, newLineNumber: i + 1 }));
    return res;
  }

  // Standard LCS Table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        content: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        content: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'removed',
        content: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  return result;
}

function formatRelativeTime(timestamp: number, lang: 'id' | 'en'): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return lang === 'id' ? 'Baru saja' : 'Just now';
  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return lang === 'id' ? `${mins} mnt lalu` : `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return lang === 'id' ? `${hours} jam lalu` : `${hours}h ago`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return lang === 'id' ? 'Kemarin' : 'Yesterday';
  if (days < 7) return lang === 'id' ? `${days} hari lalu` : `${days}d ago`;

  const d = new Date(timestamp);
  return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocsVersionHistoryModal({
  isOpen,
  onClose,
  activeDoc,
  language = 'id',
  isCloudUser = false,
}: DocsVersionHistoryModalProps) {
  const {
    docSnapshots,
    createDocSnapshot,
    restoreDocSnapshot,
    updateDocSnapshotLabel,
    deleteDocSnapshot,
    syncSnapshotsToCloud,
  } = useDocsStore();

  const docId = activeDoc?.id || '';
  const snapshots: DocHistorySnapshot[] = useMemo(() => {
    return (docSnapshots[docId] || []).slice().sort((a, b) => b.timestamp - a.timestamp);
  }, [docSnapshots, docId]);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [filterNamedOnly, setFilterNamedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [diffMode, setDiffMode] = useState<'split' | 'unified' | 'preview'>('unified');
  const [selectedSubFileId, setSelectedSubFileId] = useState<string | null>(null);

  // Modal dialogs inside version history
  const [isLabelingCurrent, setIsLabelingCurrent] = useState(false);
  const [currentVersionLabel, setCurrentVersionLabel] = useState('');
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editLabelInput, setEditLabelInput] = useState('');
  const [restoreConfirmSnap, setRestoreConfirmSnap] = useState<DocHistorySnapshot | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Auto-select latest snapshot when opened or changed
  useEffect(() => {
    if (isOpen && snapshots.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(snapshots[0].id);
    }
  }, [isOpen, snapshots, selectedSnapshotId]);

  // Selected snapshot object
  const selectedSnapshot = useMemo(() => {
    if (!selectedSnapshotId) return snapshots[0] || null;
    return snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0] || null;
  }, [snapshots, selectedSnapshotId]);

  // Filtered list of snapshots
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s) => {
      if (filterNamedOnly && !s.isNamed && !s.label) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = s.label?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchAuthor = s.authorName?.toLowerCase().includes(q) || s.authorEmail?.toLowerCase().includes(q);
        return matchLabel || matchDesc || matchAuthor;
      }
      return true;
    });
  }, [snapshots, filterNamedOnly, searchQuery]);

  // Handle sub-file selection
  const snapshotFiles = selectedSnapshot?.doc?.files || [];
  const currentFiles = activeDoc?.files || [];

  const effectiveSubFileId = useMemo(() => {
    if (selectedSubFileId && (snapshotFiles.some((f) => f.id === selectedSubFileId) || currentFiles.some((f) => f.id === selectedSubFileId))) {
      return selectedSubFileId;
    }
    return snapshotFiles.find((f) => f.isMain)?.id || snapshotFiles[0]?.id || currentFiles.find((f) => f.isMain)?.id || currentFiles[0]?.id || null;
  }, [selectedSubFileId, snapshotFiles, currentFiles]);

  // Snapshot content vs current content for diffing
  const snapshotContent = useMemo(() => {
    if (!selectedSnapshot) return '';
    if (snapshotFiles.length > 0) {
      const file = snapshotFiles.find((f) => f.id === effectiveSubFileId) || snapshotFiles.find((f) => f.isMain) || snapshotFiles[0];
      return file ? file.content : selectedSnapshot.doc.content || '';
    }
    return selectedSnapshot.doc.content || '';
  }, [selectedSnapshot, snapshotFiles, effectiveSubFileId]);

  const currentContent = useMemo(() => {
    if (!activeDoc) return '';
    if (currentFiles.length > 0) {
      const file = currentFiles.find((f) => f.id === effectiveSubFileId) || currentFiles.find((f) => f.isMain) || currentFiles[0];
      return file ? file.content : activeDoc.content || '';
    }
    return activeDoc.content || '';
  }, [activeDoc, currentFiles, effectiveSubFileId]);

  // Computed line diff
  const diffLines = useMemo(() => {
    return computeLineDiff(snapshotContent, currentContent);
  }, [snapshotContent, currentContent]);

  const diffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    diffLines.forEach((l) => {
      if (l.type === 'added') added++;
      else if (l.type === 'removed') removed++;
      else unchanged++;
    });
    return { added, removed, unchanged };
  }, [diffLines]);

  if (!isOpen || !activeDoc) return null;

  const handleCreateNamedSnapshot = () => {
    const label = currentVersionLabel.trim() || (language === 'id' ? 'Versi Tersimpan' : 'Saved Version');
    createDocSnapshot(docId, label, label, true, { name: 'You' });
    setCurrentVersionLabel('');
    setIsLabelingCurrent(false);
  };

  const handlePerformRestore = (snapshot: DocHistorySnapshot) => {
    const ok = restoreDocSnapshot(docId, snapshot.id);
    if (ok) {
      setRestoreConfirmSnap(null);
      onClose();
    }
  };

  const handleDownloadSnapshot = () => {
    if (!selectedSnapshot) return;
    const blob = new Blob([snapshotContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${activeDoc.title.replace(/\s+/g, '_')}_${selectedSnapshot.label || 'snapshot'}.txt`;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(snapshotContent);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1240px',
          height: '90vh',
          maxHeight: '850px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-xl, 0 25px 60px -15px rgba(0, 0, 0, 0.5))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            height: '56px',
            padding: '0 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 115, 234, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
                flexShrink: 0,
              }}
            >
              <History size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {language === 'id' ? 'Riwayat & Versi Dokumen' : 'History & Versioning'}
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}
                >
                  {activeDoc.format}
                </span>
              </div>
              <p
                style={{
                  fontSize: '11.5px',
                  margin: 0,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {activeDoc.title} • {snapshots.length} {language === 'id' ? 'snapshot tersimpan' : 'snapshots recorded'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Label Current Version Button */}
            <button
              type="button"
              onClick={() => setIsLabelingCurrent(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 115, 234, 0.12)',
                border: '1px solid rgba(0, 115, 234, 0.3)',
                color: 'var(--brand-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={language === 'id' ? 'Simpan versi bernama saat ini' : 'Label current version as checkpoint'}
            >
              <Tag size={13} />
              <span>{language === 'id' ? 'Beri Nama Versi Ini' : 'Label Current Version'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={language === 'id' ? 'Tutup (Esc)' : 'Close (Esc)'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body: 2 Columns (Timeline List Left + Diff Inspector Right) ── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* ── Left Column: Snapshot Timeline List (320px) ── */}
          <div
            style={{
              width: '340px',
              borderRight: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-main)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {/* Filter & Search Bar */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0 8px',
                  height: '32px',
                }}
              >
                <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={language === 'id' ? 'Cari riwayat atau label...' : 'Search history or label...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Toggle Filter: All vs Named Only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setFilterNamedOnly(false)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    fontSize: '11px',
                    fontWeight: !filterNamedOnly ? 650 : 500,
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: !filterNamedOnly ? 'var(--bg-subtle)' : 'transparent',
                    color: !filterNamedOnly ? 'var(--brand-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {language === 'id' ? 'Semua Aktivitas' : 'All Activity'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterNamedOnly(true)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    fontSize: '11px',
                    fontWeight: filterNamedOnly ? 650 : 500,
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: filterNamedOnly ? 'var(--bg-subtle)' : 'transparent',
                    color: filterNamedOnly ? '#F59E0B' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Tag size={11} />
                  <span>{language === 'id' ? 'Versi Bernama' : 'Named Only'}</span>
                </button>
              </div>
            </div>

            {/* Snapshot List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {filteredSnapshots.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <History size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {filterNamedOnly
                      ? language === 'id'
                        ? 'Belum ada versi yang diberi nama'
                        : 'No named versions yet'
                      : language === 'id'
                      ? 'Belum ada rekaman riwayat'
                      : 'No history snapshots yet'}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', opacity: 0.8 }}>
                    {language === 'id'
                      ? 'Simpan versi bernama untuk membuat checkpoint permanen.'
                      : 'Create a named version to preserve important milestones.'}
                  </p>
                </div>
              ) : (
                filteredSnapshots.map((snap) => {
                  const isSelected = selectedSnapshot?.id === snap.id;
                  const isEditingThis = editingSnapshotId === snap.id;

                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshotId(snap.id)}
                      style={{
                        padding: '10px 12px',
                        marginBottom: '6px',
                        borderRadius: '8px',
                        border: isSelected
                          ? '1px solid var(--brand-primary)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected
                          ? 'rgba(0, 115, 234, 0.08)'
                          : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-strong)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      {/* Top row: Label or Checkpoint name + Timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          {snap.isNamed || snap.label ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#F59E0B',
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                flexShrink: 0,
                              }}
                            >
                              🏷️ {snap.label || 'Named'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', fontWeight: 650, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {snap.description || 'Checkpoint'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatRelativeTime(snap.timestamp, language)}
                        </span>
                      </div>

                      {/* Editing Label Inline Form */}
                      {isEditingThis ? (
                        <div
                          style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editLabelInput}
                            onChange={(e) => setEditLabelInput(e.target.value)}
                            placeholder="e.g. v1.0 Final Draft"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateDocSnapshotLabel(docId, snap.id, editLabelInput);
                                setEditingSnapshotId(null);
                              }
                              if (e.key === 'Escape') setEditingSnapshotId(null);
                            }}
                            style={{
                              flex: 1,
                              padding: '3px 6px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-strong)',
                              background: 'var(--bg-main)',
                              color: 'var(--text-primary)',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateDocSnapshotLabel(docId, snap.id, editLabelInput);
                              setEditingSnapshotId(null);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '2px' }}
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSnapshotId(null)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>
                            {snap.totalWords ? `${snap.totalWords} ${language === 'id' ? 'kata' : 'words'}` : ''}
                            {snap.authorName ? ` • ${snap.authorName}` : ''}
                          </span>

                          {/* Quick snapshot action icons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSnapshotId(snap.id);
                                setEditLabelInput(snap.label || '');
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title={language === 'id' ? 'Beri label / Ubah nama' : 'Label / Rename'}
                            >
                              <Tag size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(language === 'id' ? 'Hapus snapshot riwayat ini?' : 'Delete this snapshot?')) {
                                  deleteDocSnapshot(docId, snap.id);
                                  if (selectedSnapshotId === snap.id) setSelectedSnapshotId(null);
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                              title={language === 'id' ? 'Hapus snapshot' : 'Delete snapshot'}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Free Tier Notice Banner at Bottom */}
            <div
              style={{
                padding: '12px 14px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color={isCloudUser ? '#10B981' : '#F59E0B'} />
                <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--text-primary)' }}>
                  {isCloudUser
                    ? language === 'id'
                      ? 'Cloud Version History Aktif'
                      : 'Cloud Version History Active'
                    : language === 'id'
                    ? 'Browser History (Free Tier)'
                    : 'Browser History (Free Tier)'}
                </span>
              </div>
              <p style={{ fontSize: '10.5px', margin: 0, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {isCloudUser
                  ? language === 'id'
                    ? 'Versi dokumen tersinkronisasi otomatis ke cloud & multi-perangkat.'
                    : 'Document versions automatically sync across devices and cloud.'
                  : language === 'id'
                  ? 'Menyimpan 10 snapshot terbaru di browser. Upgrade ke Starter/Pro untuk 30 hari riwayat cloud & sinkronisasi multi-device.'
                  : 'Retains 10 recent local snapshots. Upgrade to Starter/Pro for 30-day cloud history & multi-device sync.'}
              </p>
              {!isCloudUser && (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('open-pricing-dialog'));
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sparkles size={12} color="#F59E0B" />
                  <span>{language === 'id' ? 'Upgrade ke Starter / Pro' : 'Upgrade to Starter / Pro'}</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Right Column: Diff Visualizer & Restore Controls ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            {/* Top Inspector Bar */}
            <div
              style={{
                height: '52px',
                padding: '0 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                backgroundColor: 'var(--bg-main)',
                flexShrink: 0,
              }}
            >
              {/* Sub-file Selector (if multi-file doc) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {snapshotFiles.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={13} color="var(--text-muted)" />
                    <select
                      value={effectiveSubFileId || ''}
                      onChange={(e) => setSelectedSubFileId(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {snapshotFiles.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} {f.isMain ? '(main)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Diff Stats Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}
                  >
                    +{diffStats.added}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#EF4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}
                  >
                    -{diffStats.removed}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {diffStats.unchanged} {language === 'id' ? 'baris sama' : 'unchanged'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Mode Selector + Restore Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setDiffMode('unified')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: diffMode === 'unified' ? 650 : 500,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: diffMode === 'unified' ? 'var(--bg-surface)' : 'transparent',
                      color: diffMode === 'unified' ? 'var(--brand-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Diff View
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffMode('preview')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: diffMode === 'preview' ? 650 : 500,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: diffMode === 'preview' ? 'var(--bg-surface)' : 'transparent',
                      color: diffMode === 'preview' ? 'var(--brand-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {language === 'id' ? 'Isi Snapshot' : 'Snapshot Content'}
                  </button>
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyContent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '30px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  title={language === 'id' ? 'Salin teks snapshot' : 'Copy snapshot text'}
                >
                  {copiedNotification ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  <span>{copiedNotification ? (language === 'id' ? 'Disalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadSnapshot}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '30px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  title={language === 'id' ? 'Unduh teks snapshot' : 'Download snapshot file'}
                >
                  <Download size={12} />
                  <span>{language === 'id' ? 'Unduh' : 'Download'}</span>
                </button>

                {/* RESTORE BUTTON */}
                {selectedSnapshot && (
                  <button
                    type="button"
                    onClick={() => setRestoreConfirmSnap(selectedSnapshot)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      backgroundColor: '#16a34a',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 650,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                    title={language === 'id' ? 'Kembalikan dokumen ke versi ini' : 'Restore document to this version'}
                  >
                    <RotateCcw size={13} strokeWidth={2.4} />
                    <span>{language === 'id' ? 'Kembalikan Versi Ini' : 'Restore this version'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Diff Content Pane */}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-editor, #0f172a)', padding: '12px 0', fontFamily: 'var(--font-mono, monospace)', fontSize: '12.5px', lineHeight: 1.6 }}>
              {diffMode === 'preview' ? (
                /* Raw Snapshot Content View */
                <pre style={{ margin: 0, padding: '0 16px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {snapshotContent || (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {language === 'id' ? '(Dokumen kosong pada versi ini)' : '(Document was empty at this version)'}
                    </span>
                  )}
                </pre>
              ) : (
                /* Unified Line Diff Visualizer */
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {diffLines.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Tidak ada perbedaan dengan versi aktif' : 'Identical to current working version'}
                    </div>
                  ) : (
                    diffLines.map((line, idx) => {
                      const isAdded = line.type === 'added';
                      const isRemoved = line.type === 'removed';

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            backgroundColor: isAdded
                              ? 'rgba(16, 185, 129, 0.15)'
                              : isRemoved
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'transparent',
                            borderLeft: isAdded
                              ? '3px solid #10B981'
                              : isRemoved
                              ? '3px solid #EF4444'
                              : '3px solid transparent',
                            padding: '1px 8px',
                          }}
                        >
                          {/* Line Number Column */}
                          <div
                            style={{
                              width: '50px',
                              textAlign: 'right',
                              paddingRight: '12px',
                              color: 'var(--text-muted)',
                              opacity: 0.5,
                              userSelect: 'none',
                              fontSize: '11px',
                              flexShrink: 0,
                            }}
                          >
                            {line.oldLineNumber || line.newLineNumber || ''}
                          </div>

                          {/* Diff Prefix (+ / - / space) */}
                          <div
                            style={{
                              width: '16px',
                              textAlign: 'center',
                              color: isAdded ? '#10B981' : isRemoved ? '#EF4444' : 'var(--text-muted)',
                              fontWeight: 700,
                              userSelect: 'none',
                              flexShrink: 0,
                            }}
                          >
                            {isAdded ? '+' : isRemoved ? '-' : ' '}
                          </div>

                          {/* Line Content */}
                          <div
                            style={{
                              flex: 1,
                              color: isAdded
                                ? '#34D399'
                                : isRemoved
                                ? '#F87171'
                                : 'var(--text-primary)',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                            }}
                          >
                            {line.content || ' '}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Modal 1: Label Current Version Dialog ── */}
      {isLabelingCurrent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsLabelingCurrent(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Beri Nama Versi Saat Ini' : 'Label Current Version'}
              </h3>
            </div>

            <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)' }}>
              {language === 'id'
                ? 'Checkpoint bernama memudahkan Anda melacak revisi penting seperti draf seminar, revisi pembimbing, atau rilis final.'
                : 'Named checkpoints allow you to bookmark critical milestones like thesis drafts or publication submissions.'}
            </p>

            <input
              type="text"
              placeholder={language === 'id' ? 'e.g. v1.0 Siap Ujian, Revisi Bab 3' : 'e.g. v1.0 Submission Draft'}
              value={currentVersionLabel}
              onChange={(e) => setCurrentVersionLabel(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNamedSnapshot();
                if (e.key === 'Escape') setIsLabelingCurrent(false);
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsLabelingCurrent(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateNamedSnapshot}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                {language === 'id' ? 'Simpan Label' : 'Save Checkpoint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Modal 2: Restore Confirmation Dialog ── */}
      {restoreConfirmSnap && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setRestoreConfirmSnap(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '14px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(22, 163, 74, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                }}
              >
                <RotateCcw size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {language === 'id' ? 'Kembalikan ke Versi Ini?' : 'Restore to this version?'}
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {restoreConfirmSnap.label || restoreConfirmSnap.description} • {formatRelativeTime(restoreConfirmSnap.timestamp, language)}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontWeight: 650, marginBottom: '4px' }}>
                <ShieldCheck size={14} />
                <span>{language === 'id' ? 'Cadangan Otomatis Aman' : 'Automatic Safety Backup'}</span>
              </div>
              {language === 'id'
                ? 'Kami akan secara otomatis membuat cadangan (backup snapshot) dari dokumen Anda saat ini sebelum memulihkan versi lama. Anda tidak akan kehilangan pekerjaan terbaru.'
                : 'An automatic safety snapshot of your current state will be created before reverting. You can always jump back.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setRestoreConfirmSnap(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handlePerformRestore(restoreConfirmSnap)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                }}
              >
                {language === 'id' ? 'Ya, Kembalikan Versi' : 'Yes, Restore Version'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
