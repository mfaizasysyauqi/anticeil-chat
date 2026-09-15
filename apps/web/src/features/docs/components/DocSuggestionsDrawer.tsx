'use client';

import React, { useState, useMemo } from 'react';
import {
  Check,
  X,
  Trash2,
  Edit3,
  GitPullRequest,
  CheckCheck,
  XCircle,
  Clock,
  User,
  AlertCircle,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useDocsStore, DocSuggestion } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface DocSuggestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  docId?: string;
}

export function DocSuggestionsDrawer({ isOpen, onClose, docId: propDocId }: DocSuggestionsDrawerProps) {
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const targetDocId = propDocId || activeDocId;

  const documents = useDocsStore((s) => s.documents);
  const reviewMode = useDocsStore((s) => s.reviewMode);
  const setReviewMode = useDocsStore((s) => s.setReviewMode);
  const acceptSuggestion = useDocsStore((s) => s.acceptSuggestion);
  const rejectSuggestion = useDocsStore((s) => s.rejectSuggestion);
  const deleteSuggestion = useDocsStore((s) => s.deleteSuggestion);
  const acceptAllSuggestions = useDocsStore((s) => s.acceptAllSuggestions);
  const rejectAllSuggestions = useDocsStore((s) => s.rejectAllSuggestions);

  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const currentDoc = useMemo(() => {
    return documents.find((d) => d.id === targetDocId) || null;
  }, [documents, targetDocId]);

  const allSuggestions = useMemo(() => {
    return currentDoc?.suggestions || [];
  }, [currentDoc?.suggestions]);

  const filteredSuggestions = useMemo(() => {
    if (filter === 'all') return allSuggestions;
    return allSuggestions.filter((s) => s.status === filter);
  }, [allSuggestions, filter]);

  const pendingCount = useMemo(() => {
    return allSuggestions.filter((s) => s.status === 'pending').length;
  }, [allSuggestions]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '360px',
        backgroundColor: 'var(--bg-surface, #131722)',
        borderLeft: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.3)',
        animation: 'docs-fadeIn 0.15s ease-out',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitPullRequest size={16} style={{ color: '#8B5CF6' }} />
          <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 650, color: 'var(--text-primary, #ffffff)' }}>
            {language === 'id' ? 'Track Changes & Saran' : 'Track Changes & Suggestions'}
          </h3>
          {pendingCount > 0 && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#8B5CF6',
                border: '1px solid rgba(139, 92, 246, 0.35)',
              }}
            >
              {pendingCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hover-subtle"
        >
          <X size={16} />
        </button>
      </div>

      {/* Suggesting Mode Toggle Bar */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
          backgroundColor: reviewMode === 'reviewing' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Edit3 size={14} style={{ color: reviewMode === 'reviewing' ? '#8B5CF6' : 'var(--text-muted, #94a3b8)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
            {reviewMode === 'reviewing'
              ? language === 'id'
                ? 'Suggesting Mode (Aktif)'
                : 'Suggesting Mode (Active)'
              : language === 'id'
              ? 'Direct Editing Mode'
              : 'Direct Editing Mode'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setReviewMode(reviewMode === 'reviewing' ? 'editing' : 'reviewing')}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 650,
            border: `1px solid ${reviewMode === 'reviewing' ? '#8B5CF6' : 'var(--border-subtle, rgba(255, 255, 255, 0.15))'}`,
            backgroundColor: reviewMode === 'reviewing' ? '#8B5CF6' : 'transparent',
            color: reviewMode === 'reviewing' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {reviewMode === 'reviewing'
            ? language === 'id'
              ? 'Matikan'
              : 'Turn Off'
            : language === 'id'
            ? 'Aktifkan Saran'
            : 'Enable Suggesting'}
        </button>
      </div>

      {/* Filter Tabs & Bulk Actions */}
      <div
        style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 7px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: filter === f ? 700 : 500,
                backgroundColor: filter === f ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: filter === f ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? (language === 'id' ? 'Semua' : 'All') : f}
            </button>
          ))}
        </div>

        {/* Bulk Accept / Reject */}
        {pendingCount > 1 && targetDocId && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => acceptAllSuggestions(targetDocId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title={language === 'id' ? 'Terima semua saran pending' : 'Accept all pending suggestions'}
            >
              <CheckCheck size={11} />
              <span>{language === 'id' ? 'Terima Semua' : 'Accept All'}</span>
            </button>

            <button
              type="button"
              onClick={() => rejectAllSuggestions(targetDocId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title={language === 'id' ? 'Tolak semua saran pending' : 'Reject all pending suggestions'}
            >
              <XCircle size={11} />
              <span>{language === 'id' ? 'Tolak Semua' : 'Reject All'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Suggestion List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSuggestions.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <GitPullRequest size={28} style={{ opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
              {language === 'id' ? 'Tidak ada saran perubahan.' : 'No suggestions found.'}
            </p>
            <p style={{ margin: 0, fontSize: '11.5px', maxWidth: '240px', lineHeight: 1.4 }}>
              {language === 'id'
                ? 'Aktifkan Suggesting Mode untuk mencatat revisi dan diff teks.'
                : 'Enable Suggesting Mode to track revisions and diffs.'}
            </p>
          </div>
        ) : (
          filteredSuggestions.map((sug) => {
            const isPending = sug.status === 'pending';
            const isAccepted = sug.status === 'accepted';
            const isRejected = sug.status === 'rejected';

            const typeLabel =
              sug.type === 'add'
                ? language === 'id' ? 'Penambahan' : 'Insertion'
                : sug.type === 'delete'
                ? language === 'id' ? 'Penghapusan' : 'Deletion'
                : language === 'id' ? 'Penggantian' : 'Substitution';

            const typeColor =
              sug.type === 'add' ? '#10B981' : sug.type === 'delete' ? '#EF4444' : '#3B82F6';

            return (
              <div
                key={sug.id}
                style={{
                  borderRadius: '10px',
                  border: `1px solid ${
                    isPending
                      ? 'var(--border-subtle, rgba(255, 255, 255, 0.1))'
                      : isAccepted
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(239, 68, 68, 0.25)'
                  }`,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Header Card: Author, Time, Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#8B5CF6',
                      }}
                    >
                      {sug.authorName?.charAt(0) || 'U'}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                      {sug.authorName || 'Collaborator'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: `${typeColor}15`,
                        color: typeColor,
                        border: `1px solid ${typeColor}35`,
                      }}
                    >
                      {typeLabel}
                    </span>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: isAccepted
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isRejected
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(255, 255, 255, 0.06)',
                        color: isAccepted ? '#10B981' : isRejected ? '#EF4444' : 'var(--text-muted, #94a3b8)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {sug.status}
                    </span>
                  </div>
                </div>

                {/* Line range info */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileCode size={11} />
                  <span>
                    {language === 'id' ? `Baris ${sug.fromLine} - ${sug.toLine}` : `Lines ${sug.fromLine} - ${sug.toLine}`}
                  </span>
                </div>

                {/* Diff Representation */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-main, #0b0f19)',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    lineHeight: 1.5,
                  }}
                >
                  {sug.originalText && (
                    <div style={{ color: '#EF4444', textDecoration: 'line-through', opacity: 0.85, wordBreak: 'break-word' }}>
                      - {sug.originalText}
                    </div>
                  )}
                  {sug.suggestedText && (
                    <div style={{ color: '#10B981', fontWeight: 600, wordBreak: 'break-word' }}>
                      + {sug.suggestedText}
                    </div>
                  )}
                </div>

                {/* Actions: Accept / Reject Buttons */}
                {isPending && targetDocId && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => rejectSuggestion(targetDocId, sug.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#EF4444',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      className="hover-subtle"
                    >
                      <X size={12} />
                      <span>{language === 'id' ? 'Tolak' : 'Reject'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => acceptSuggestion(targetDocId, sug.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#10B981',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={12} />
                      <span>{language === 'id' ? 'Terima' : 'Accept'}</span>
                    </button>
                  </div>
                )}

                {/* Delete button if already resolved */}
                {!isPending && targetDocId && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => deleteSuggestion(targetDocId, sug.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted, #94a3b8)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      className="hover-subtle"
                    >
                      <Trash2 size={11} />
                      <span>{language === 'id' ? 'Hapus Riwayat' : 'Delete'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
