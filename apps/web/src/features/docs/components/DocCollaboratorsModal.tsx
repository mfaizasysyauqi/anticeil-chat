'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  X,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  Mail,
  UserCheck,
  Check,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { DocItem, useDocsStore } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { createClient } from '../../../shared/utils/supabase/client';

export interface DocCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
}

export function DocCollaboratorsModal({ isOpen, onClose, doc }: DocCollaboratorsModalProps) {
  const language = useSettingsStore((s) => (s.language === 'id' ? 'id' : 'en'));
  const user = useAuthStore((s) => s.user);

  const addDocCollaborator = useDocsStore((s) => s.addDocCollaborator);
  const removeDocCollaborator = useDocsStore((s) => s.removeDocCollaborator);
  const updateDocCollaboratorRole = useDocsStore((s) => s.updateDocCollaboratorRole);

  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const collaborators = useMemo(() => {
    return doc?.collaborators || [];
  }, [doc?.collaborators]);

  if (!isOpen || !doc) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback({
        type: 'error',
        text: language === 'id' ? 'Format email tidak valid.' : 'Invalid email format.',
      });
      return;
    }

    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      setFeedback({
        type: 'error',
        text: language === 'id' ? 'Pengguna ini sudah menjadi kolaborator.' : 'User is already a collaborator.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      addDocCollaborator(doc.id, email, selectedRole);

      // Also persist to Supabase if client is available
      try {
        const supabase = createClient();
        if (supabase) {
          await supabase.from('document_collaborators').upsert({
            id: `collab_${doc.id}_${email.replace(/[^a-z0-9]/g, '_')}`,
            document_id: doc.id,
            email,
            role: selectedRole,
            created_at: new Date().toISOString(),
          });
        }
      } catch {}

      setEmailInput('');
      setFeedback({
        type: 'success',
        text: language === 'id' ? `Undangan dikirim ke ${email}.` : `Invitation sent to ${email}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menambahkan kolaborator' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(language === 'id' ? `Hapus akses untuk ${email}?` : `Remove access for ${email}?`)) {
      return;
    }

    removeDocCollaborator(doc.id, email);

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase
          .from('document_collaborators')
          .delete()
          .eq('document_id', doc.id)
          .eq('email', email);
      }
    } catch {}
  };

  const handleRoleChange = async (email: string, newRole: 'viewer' | 'editor') => {
    updateDocCollaboratorRole(doc.id, email, newRole);

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase
          .from('document_collaborators')
          .update({ role: newRole })
          .eq('document_id', doc.id)
          .eq('email', email);
      }
    } catch {}
  };

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
          maxWidth: '500px',
          backgroundColor: 'var(--bg-surface, #131722)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
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
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B5CF6',
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 650, color: 'var(--text-primary, #ffffff)' }}>
                {language === 'id' ? 'Kolaborator Dokumen' : 'Document Collaborators'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                {doc.title || 'Untitled Document'}
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
                padding: '9px 12px',
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
              {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Invite Form */}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Mail
                size={14}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              />
              <input
                type="email"
                placeholder={language === 'id' ? 'Masukkan email kolaborator...' : 'Enter collaborator email...'}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-main, #0b0f19)',
                  border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'viewer' | 'editor')}
              style={{
                padding: '0 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-main, #0b0f19)',
                border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.15))',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '12px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="viewer">{language === 'id' ? 'Viewer' : 'Viewer'}</option>
              <option value="editor">{language === 'id' ? 'Editor' : 'Editor'}</option>
            </select>

            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                borderRadius: '8px',
                backgroundColor: '#3B82F6',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: isSubmitting || !emailInput.trim() ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !emailInput.trim() ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              <Plus size={14} />
              <span>{language === 'id' ? 'Undang' : 'Invite'}</span>
            </button>
          </form>

          {/* Collaborator List */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text-muted, #94a3b8)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {language === 'id' ? 'Daftar Akses' : 'Access List'}
            </label>

            <div
              style={{
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Owner Row */}
              <div
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom:
                    collaborators.length > 0 ? '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      color: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    <Crown size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                      {user?.email || doc.ownerEmail || 'You (Local Owner)'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                      {language === 'id' ? 'Pemilik Dokumen' : 'Document Owner'}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#F59E0B',
                  }}
                >
                  Owner
                </span>
              </div>

              {/* Invited Collaborators */}
              {collaborators.map((c) => (
                <div
                  key={c.email}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {c.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>
                        {c.email}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                        {new Date(c.invitedAt || Date.now()).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={c.role}
                      onChange={(e) => handleRoleChange(c.email, e.target.value as 'viewer' | 'editor')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                        color: 'var(--text-primary, #ffffff)',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemove(c.email)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="hover-subtle"
                      title={language === 'id' ? 'Hapus Kolaborator' : 'Remove Collaborator'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
