'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plug,
  Shield,
  Trash2,
  CheckCircle2,
  LogIn,
  AlertCircle,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useConnectorsStore } from '../store/useConnectorsStore';
import { ConnectorId, getTranslation } from '@anticeil/core';
import { ConnectorBrandIcon } from './ConnectorLogos';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { ImageModelSelectorModal } from '../../image/components/ImageModelSelectorModal';
import { VideoModelSelectorModal } from '../../video/components/VideoModelSelectorModal';
import { AudioModelSelectorModal } from '../../audio/components/AudioModelSelectorModal';

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Which API-route provider name to use for each connector
const OAUTH_PROVIDER: Partial<Record<ConnectorId, string>> = {
  gmail: 'google',
  calendar: 'google',
  google_drive: 'google',
  notion: 'notion',
  github: 'github',
};

// Human-readable provider label shown on the button
const PROVIDER_LABEL: Partial<Record<ConnectorId, string>> = {
  gmail: 'Google',
  calendar: 'Google',
  google_drive: 'Google',
  notion: 'Notion',
  github: 'GitHub',
};

// Canonical connector display order (Anticeil Media first, followed by Google & integrations)
const CONNECTOR_ORDER: ConnectorId[] = [
  'anticeil_image',
  'anticeil_video',
  'anticeil_audio',
  'gmail',
  'calendar',
  'google_drive',
  'notion',
  'github',
  'custom_webhook',
];

// Helpful links for getting tokens
const TOKEN_LINKS: Partial<Record<ConnectorId, { url: string; label: string }>> = {
  notion: {
    url: 'https://www.notion.so/profile/integrations',
    label: 'notion.so/profile/integrations',
  },
  github: {
    url: 'https://github.com/settings/tokens',
    label: 'github.com/settings/tokens',
  },
};

export function ConnectorsModal({ isOpen, onClose }: ConnectorsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const connectors = useConnectorsStore((s) => s.connectors);
  const activeConnectorIds = useConnectorsStore((s) => s.activeConnectorIds);
  const toggleActiveConnector = useConnectorsStore((s) => s.toggleActiveConnector);
  const updateConnector = useConnectorsStore((s) => s.updateConnector);
  const disconnectConnector = useConnectorsStore((s) => s.disconnectConnector);
  const disconnectAllGoogle = useConnectorsStore((s) => s.disconnectAllGoogle);
  const setAccessToken = useConnectorsStore((s) => s.setAccessToken);
  const lastOAuthError = useConnectorsStore((s) => s.lastOAuthError);
  const setLastOAuthError = useConnectorsStore((s) => s.setLastOAuthError);

  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const tc = t.connectors;

  const [selectedConnectorId, setSelectedConnectorId] = useState<ConnectorId>('anticeil_image');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [tokenSuccessMsg, setTokenSuccessMsg] = useState<string | null>(null);
  const [isMediaModelModalOpen, setIsMediaModelModalOpen] = useState(false);

  if (!isOpen || !mounted) return null;

  const current = connectors[selectedConnectorId];
  const isActiveInChat = activeConnectorIds.includes(selectedConnectorId);
  const isConnected = current.status === 'connected';
  const provider = OAUTH_PROVIDER[selectedConnectorId];
  const providerLabel = PROVIDER_LABEL[selectedConnectorId];
  const isGoogleService = ['gmail', 'calendar', 'google_drive'].includes(selectedConnectorId);
  const isAnticeilMedia = ['anticeil_image', 'anticeil_video', 'anticeil_audio'].includes(selectedConnectorId);

  const handleConnectOAuth = () => {
    if (!provider) return;
    setIsRedirecting(true);
    setLastOAuthError(null);
    window.location.href = `/api/connectors/oauth/${provider}`;
  };

  const handleSaveManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;

    let email = accountEmailInput.trim() || undefined;
    let name: string | undefined = undefined;

    if (selectedConnectorId === 'notion') {
      name = 'Notion Workspace';
      email = email || 'notion-integration@internal';
    } else if (selectedConnectorId === 'github') {
      name = 'GitHub User';
      email = email || 'github-token@user';
    } else if (isGoogleService) {
      name = 'Google Account';
      email = email || 'google-user@oauth';
    }

    if (isGoogleService) {
      // Connect all 3 google services with the provided token
      setAccessToken('gmail', token, email, name);
      setAccessToken('calendar', token, email, name);
      setAccessToken('google_drive', token, email, name);
    } else {
      setAccessToken(selectedConnectorId, token, email, name);
    }

    setManualToken('');
    setAccountEmailInput('');
    setShowManualInput(false);
    setTokenSuccessMsg(tc.tokenSaved || 'Token berhasil dihubungkan!');
    setLastOAuthError(null);
    setTimeout(() => setTokenSuccessMsg(null), 4000);
  };

  const handleDisconnect = () => {
    disconnectConnector(selectedConnectorId);
    setTokenSuccessMsg(null);
  };

  const handleDisconnectAllGoogle = () => {
    disconnectAllGoogle();
    setTokenSuccessMsg(null);
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
        className="modal-responsive-container"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '780px',
          width: '100%',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
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
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {tc.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
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

        {/* OAuth Error Banner */}
        {lastOAuthError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 18px',
              backgroundColor: 'var(--accent-danger-subtle, rgba(239, 68, 68, 0.1))',
              borderBottom: '1px solid var(--accent-danger, #ef4444)',
              color: 'var(--accent-danger, #ef4444)',
              fontSize: '12px',
              lineHeight: 1.5,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ flex: 1 }}>{lastOAuthError}</span>
            <button
              onClick={() => setLastOAuthError(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: 0,
                lineHeight: 1,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {tokenSuccessMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              backgroundColor: 'var(--accent-success-subtle, rgba(16, 185, 129, 0.12))',
              borderBottom: '1px solid var(--accent-success, #10b981)',
              color: 'var(--accent-success, #10b981)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{tokenSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-responsive-body" style={{ minHeight: '380px' }}>
          {/* Left Sidebar: Connector List */}
          <div className="modal-responsive-sidebar">
            <div
              className="modal-responsive-sidebar-title"
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

            {CONNECTOR_ORDER.map((id) => connectors[id]).filter(Boolean).map((conn) => {
              const isSelected = conn.id === selectedConnectorId;
              const isAttached = activeConnectorIds.includes(conn.id);
              const connected = conn.status === 'connected';

              return (
                <button
                  key={conn.id}
                  onClick={() => {
                    setSelectedConnectorId(conn.id);
                    setShowManualInput(false);
                    setTokenSuccessMsg(null);
                  }}
                  className="modal-responsive-sidebar-item"
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
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
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
                        {connected ? tc.liveToken : tc.disconnected}
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
                    {connected && (
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

          {/* Right Main Panel */}
          <div
            className="modal-responsive-content"
            style={{
              backgroundColor: 'var(--bg-surface)',
              justifyContent: 'space-between',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Connector Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
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
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {current.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                      {current.description}
                    </p>
                  </div>
                </div>

                {/* Attach to Chat toggle */}
                {isConnected && (
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
                      color: isActiveInChat ? 'var(--accent-success)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isActiveInChat ? tc.activeInChat : tc.attachToChat}
                  </button>
                )}
              </div>

              {/* Connected Account Info */}
              {isConnected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--accent-success)',
                    backgroundColor: 'var(--accent-success-subtle, rgba(16, 185, 129, 0.08))',
                  }}
                >
                  <CheckCircle2 size={16} color="var(--accent-success)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-success)' }}>
                      {tc.connectedAs}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {current.account?.name
                        ? `${current.account.name} — ${current.account.email}`
                        : current.account?.email || (language === 'id' ? 'Layanan Media Bawaan Anticeil (Siap Digunakan)' : 'Built-in Anticeil Media Service (Ready)')}
                    </div>
                  </div>
                </div>
              )}

              {/* Anticeil Media Model Selection Card */}
              {isAnticeilMedia && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg, 12px)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="var(--brand-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {language === 'id' ? 'Model AI Terpilih' : 'Selected AI Model'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Model untuk tool calling' : 'Tool calling model'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMediaModelModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Sliders size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {current.selectedModelId || (language === 'id' ? 'Pilih Model AI...' : 'Select AI Model...')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                      <span>{language === 'id' ? 'Pilih Model' : 'Select Model'}</span>
                      <ChevronDown size={14} />
                    </div>
                  </button>
                </div>
              )}

              {/* OAuth Connect Card (when disconnected) */}
              {!isConnected && provider && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {tc.oauthDescription}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleConnectOAuth}
                      disabled={isRedirecting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isRedirecting ? 'var(--bg-subtle)' : 'var(--brand-primary)',
                        border: 'none',
                        color: isRedirecting ? 'var(--text-muted)' : '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: isRedirecting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <LogIn size={15} />
                      <span>
                        {isRedirecting
                          ? tc.connectingOAuth
                          : `${tc.connectWithOAuth} ${providerLabel}`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Reconnect / Change Account button (when connected) */}
              {isConnected && provider && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleConnectOAuth}
                    disabled={isRedirecting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isRedirecting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <LogIn size={13} />
                    <span>{isRedirecting ? tc.connectingOAuth : tc.reconnect}</span>
                  </button>
                </div>
              )}

              {/* Direct Token / API Key Input Section (Accordion) */}
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-subtle)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} />
                    {tc.manualTokenOption || 'Atau Masukkan Token / API Key Secara Manual'}
                  </span>
                  {showManualInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showManualInput && (
                  <form
                    onSubmit={handleSaveManualToken}
                    style={{
                      padding: '12px 14px 16px 14px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Helper text with links */}
                    {selectedConnectorId === 'notion' && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {tc.tokenHelperNotion ||
                          'Buat Integrasi Internal di notion.so/profile/integrations lalu salin Secret Token (secret_... atau ntn_...).'}{' '}
                        {TOKEN_LINKS.notion && (
                          <a
                            href={TOKEN_LINKS.notion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--brand-primary)',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {TOKEN_LINKS.notion.label}
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </p>
                    )}

                    {selectedConnectorId === 'github' && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {tc.tokenHelperGithub ||
                          'Buat Personal Access Token di github.com/settings/tokens dengan izin "repo" dan "read:user".'}{' '}
                        {TOKEN_LINKS.github && (
                          <a
                            href={TOKEN_LINKS.github.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--brand-primary)',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {TOKEN_LINKS.github.label}
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </p>
                    )}

                    {isGoogleService && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {tc.tokenHelperGoogle ||
                          'Atau tempel Access Token Google yang valid secara manual.'}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="password"
                        name={`connector-token-${selectedConnectorId}`}
                        id={`connector-token-${selectedConnectorId}`}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        placeholder={
                          selectedConnectorId === 'notion'
                            ? 'secret_... atau ntn_...'
                            : selectedConnectorId === 'github'
                            ? 'ghp_...'
                            : tc.tokenInputPlaceholder || 'Tempel token akses di sini...'
                        }
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-strong)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="submit"
                        disabled={!manualToken.trim()}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: manualToken.trim()
                            ? 'var(--brand-primary)'
                            : 'var(--bg-subtle)',
                          color: manualToken.trim() ? '#FFFFFF' : 'var(--text-muted)',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: manualToken.trim() ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tc.saveToken || 'Simpan & Hubungkan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

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
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              {/* Disconnect actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: '1px solid var(--accent-danger-subtle, rgba(239, 68, 68, 0.3))',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        color: 'var(--accent-danger, #ef4444)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{tc.disconnect}</span>
                    </button>

                    {isGoogleService && (
                      <button
                        type="button"
                        onClick={handleDisconnectAllGoogle}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {tc.disconnectAllGoogle || 'Putuskan Semua Google'}
                      </button>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {tc.disconnected}
                  </span>
                )}
              </div>

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

      {isMediaModelModalOpen && current.id === 'anticeil_image' && (
        <ImageModelSelectorModal
          isOpen={isMediaModelModalOpen}
          onClose={() => setIsMediaModelModalOpen(false)}
          mediaMode="image"
          selectedModelId={current.selectedModelId || 'imagen-3.0-generate-002'}
          onSelectModel={(modelId) => {
            updateConnector('anticeil_image', { selectedModelId: modelId });
            setIsMediaModelModalOpen(false);
          }}
        />
      )}

      {isMediaModelModalOpen && current.id === 'anticeil_video' && (
        <VideoModelSelectorModal
          isOpen={isMediaModelModalOpen}
          onClose={() => setIsMediaModelModalOpen(false)}
          selectedModelId={current.selectedModelId || 'luma-dream-machine'}
          onSelectModel={(modelId) => {
            updateConnector('anticeil_video', { selectedModelId: modelId });
            setIsMediaModelModalOpen(false);
          }}
        />
      )}

      {isMediaModelModalOpen && current.id === 'anticeil_audio' && (
        <AudioModelSelectorModal
          isOpen={isMediaModelModalOpen}
          onClose={() => setIsMediaModelModalOpen(false)}
          selectedModelId={current.selectedModelId || 'eleven_multilingual_v2'}
          onSelectModel={(modelId) => {
            updateConnector('anticeil_audio', { selectedModelId: modelId });
            setIsMediaModelModalOpen(false);
          }}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
