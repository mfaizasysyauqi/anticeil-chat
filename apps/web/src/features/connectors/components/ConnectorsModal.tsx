'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plug,
  Check,
  Key,
  Shield,
  ExternalLink,
  Sparkles,
  Trash2,
  Lock,
  Layers,
  FileText,
  Mail,
  Calendar,
  FolderOpen,
} from 'lucide-react';
import { useConnectorsStore } from '../store/useConnectorsStore';
import { ConnectorId, getTranslation } from '@chatbyok/core';
import { ConnectorBrandIcon } from './ConnectorLogos';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectorsModal({ isOpen, onClose }: ConnectorsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const connectors = useConnectorsStore((s) => s.connectors);
  const activeConnectorIds = useConnectorsStore((s) => s.activeConnectorIds);
  const toggleActiveConnector = useConnectorsStore((s) => s.toggleActiveConnector);
  const setAccessToken = useConnectorsStore((s) => s.setAccessToken);
  const toggleSandboxMode = useConnectorsStore((s) => s.toggleSandboxMode);
  const disconnectConnector = useConnectorsStore((s) => s.disconnectConnector);

  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const tc = t.connectors;

  const [selectedConnectorId, setSelectedConnectorId] = useState<ConnectorId>('gmail');
  const [tokenInput, setTokenInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen || !mounted) return null;

  const current = connectors[selectedConnectorId];
  const isActiveInChat = activeConnectorIds.includes(selectedConnectorId);

  const handleSaveToken = () => {
    if (!tokenInput.trim()) {
      setStatusMessage('⚠️ ' + tc.tokenPlaceholder);
      return;
    }
    setAccessToken(selectedConnectorId, tokenInput.trim(), emailInput.trim() || undefined);
    setStatusMessage('✅ ' + tc.saveToken);
    setTokenInput('');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleToggleSandbox = (val: boolean) => {
    toggleSandboxMode(selectedConnectorId, val);
    setStatusMessage(val ? '🧪 ' + tc.sandboxTitle : tc.tokenTitle);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-subtle, rgba(99, 102, 241, 0.12))',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plug size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {tc.title}
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0',
                }}
              >
                {tc.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="clickable-pill"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - 2 Columns (Sidebar + Main Panel) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            minHeight: '440px',
            overflow: 'hidden',
          }}
        >
          {/* Left Sidebar: Connector List */}
          <div
            style={{
              width: '260px',
              borderRight: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-main)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '6px 8px',
              }}
            >
              {tc.availableConnectors}
            </div>

            {Object.values(connectors).map((conn) => {
              const isSelected = conn.id === selectedConnectorId;
              const isAttached = activeConnectorIds.includes(conn.id);
              const isConnected = conn.status === 'connected';

              return (
                <button
                  key={conn.id}
                  onClick={() => setSelectedConnectorId(conn.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected
                      ? '1px solid var(--brand-primary)'
                      : '1px solid transparent',
                    backgroundColor: isSelected
                      ? 'var(--brand-subtle, rgba(99, 102, 241, 0.12))'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--brand-primary)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ConnectorBrandIcon id={conn.id} size={20} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conn.name}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {conn.isSandboxMode
                          ? tc.demoSandbox
                          : isConnected
                          ? tc.liveToken
                          : tc.disconnected}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isAttached && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--accent-success-subtle, rgba(16, 185, 129, 0.15))',
                          color: 'var(--accent-success)',
                        }}
                      >
                        {tc.activeInChat}
                      </span>
                    )}
                    {isConnected && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-success)',
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Main Panel: Detail & Configuration */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Connector Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ConnectorBrandIcon id={current.id} size={28} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {current.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: '3px 0 0 0',
                      }}
                    >
                      {current.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleActiveConnector(current.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isActiveInChat
                      ? '1px solid var(--accent-success)'
                      : '1px solid var(--border-strong)',
                    backgroundColor: isActiveInChat
                      ? 'var(--accent-success-subtle, rgba(16, 185, 129, 0.12))'
                      : 'var(--bg-subtle)',
                    color: isActiveInChat
                      ? 'var(--accent-success)'
                      : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isActiveInChat ? tc.activeInChat : tc.attachToChat}
                </button>
              </div>

              {/* Status Alert Notification */}
              {statusMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--brand-subtle, rgba(99, 102, 241, 0.1))',
                    border: '1px solid var(--brand-primary)',
                    color: 'var(--brand-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {statusMessage}
                </div>
              )}

              {/* Sandbox vs Live Mode Switch Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Sparkles size={15} color="#f59e0b" />
                    {tc.sandboxTitle}
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {tc.sandboxDesc}
                  </p>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={current.isSandboxMode}
                    onChange={(e) => handleToggleSandbox(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--brand-primary)',
                    }}
                  />
                </label>
              </div>

              {/* Live BYOK Token Configuration */}
              {!current.isSandboxMode && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Key size={14} color="var(--brand-primary)" />
                    {tc.tokenTitle}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    {tc.tokenSubtitle}
                  </p>

                  <input
                    type="password"
                    placeholder={tc.tokenPlaceholder}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />

                  <input
                    type="email"
                    placeholder={tc.emailPlaceholder}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '4px',
                    }}
                  >
                    <a
                      href="https://developers.google.com/oauthplayground"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--brand-primary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <span>Get Token from OAuth Playground</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      type="button"
                      onClick={handleSaveToken}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--brand-primary)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {tc.saveToken}
                    </button>
                  </div>
                </div>
              )}

              {/* Scopes & Permissions Card */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Shield size={13} />
                  {tc.permissionsTitle}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {current.scopes.map((scope) => (
                    <span
                      key={scope}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                marginTop: '16px',
              }}
            >
              {current.status === 'connected' ? (
                <button
                  type="button"
                  onClick={() => disconnectConnector(current.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-danger)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  <span>{tc.disconnect}</span>
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {tc.disconnected}
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tc.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
