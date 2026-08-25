'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  KeyRound,
  Palette,
  Database,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Lock,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  PROVIDER_DEFINITIONS,
  LLMProviderId,
  getTranslation,
} from '@anticeil/core';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../../chat/store/useChatStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useStorageStore, formatStorageBytes } from '../../storage/store/useStorageStore';
import { StorageMeter } from '../../storage/components/StorageMeter';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'keys' | 'appearance' | 'plan' | 'backup';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('keys');

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearAllKeys = useSettingsStore((s) => s.clearAllKeys);
  const importApiKeys = useSettingsStore((s) => s.importApiKeys);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const sessions = useChatStore((s) => s.sessions);
  const messages = useChatStore((s) => s.messages);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const t = getTranslation(language);

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [statusNotice, setStatusNotice] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confirmWord = language === 'id' ? 'HAPUS' : 'DELETE';

  const executeDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        await signOut();
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/register?deleted=true';
        }
      } else {
        setDeleteError(data.error || 'Failed to delete account');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Unexpected error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKeyChange = (providerId: LLMProviderId, value: string) => {
    setApiKey(providerId, value);
    setSavedStatus((prev) => ({ ...prev, [providerId]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [providerId]: false }));
    }, 2000);
  };

  const handleBaseUrlChange = (providerId: LLMProviderId, baseUrl: string) => {
    setApiKey(providerId, apiKeys[providerId]?.apiKey || '', baseUrl);
  };

  const handleExportData = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      sessions,
      messages,
      apiKeys,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.apiKeys) {
          importApiKeys(parsed.apiKeys);
          setStatusNotice('✓ ' + (language === 'id' ? 'Kunci API & cadangan berhasil dipulihkan!' : 'API keys & backup restored!'));
          setTimeout(() => setStatusNotice(''), 3500);
        } else {
          alert('Invalid backup JSON format: missing apiKeys field.');
        }
      } catch (err) {
        alert('Failed parsing backup file. Make sure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = () => {
    if (confirm(language === 'id' ? 'Apakah Anda yakin ingin menghapus semua kunci API dari perangkat ini?' : 'Are you sure you want to clear all stored API keys from this device?')) {
      clearAllKeys();
      setStatusNotice(language === 'id' ? 'Semua kunci API telah dihapus dari browser ini.' : 'All API keys cleared from this browser.');
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: 'keys', label: language === 'id' ? 'Kunci API (BYOK)' : 'API Keys (BYOK)', icon: KeyRound },
    { id: 'appearance', label: language === 'id' ? 'Tampilan & Bahasa' : 'Appearance & Language', icon: Palette },
    { id: 'plan', label: language === 'id' ? 'Tingkatkan Paket' : 'Plan & Upgrades', icon: Zap },
    { id: 'backup', label: language === 'id' ? 'Cadangan Data & Privasi' : 'Backup & Privacy', icon: Database },
  ];

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
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.3))',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'rgba(0, 115, 234, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {tabs.find((tab) => tab.id === activeTab)?.label ?? t.settings.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                {activeTab === 'keys' && (language === 'id' ? 'Masukkan kunci API resmi Anda — tersimpan aman di browser lokal.' : 'Enter your official API keys — stored safely in local browser memory.')}
                {activeTab === 'appearance' && (language === 'id' ? 'Sesuaikan tema visual dan preferensi bahasa antarmuka.' : 'Customize visual theme and interface language preference.')}
                {activeTab === 'plan' && (language === 'id' ? 'Paket Anticeil — 100% BYOK gratis tanpa kuota dan biaya langganan.' : 'Anticeil plan — 100% BYOK, free forever with no quotas or subscription fees.')}
                {activeTab === 'backup' && (language === 'id' ? 'Ekspor, impor, atau hapus konfigurasi dan riwayat lokal Anda.' : 'Export, import, or wipe your local configuration and chat history.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm, 6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Two-Column Navigation & Content Layout */}
        <div className="modal-responsive-body">
          {/* Left Column: Categories List */}
          <div className="modal-responsive-sidebar">
            <div className="modal-responsive-sidebar-title" style={{ padding: '4px 8px 6px 8px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {language === 'id' ? 'Kategori Pengaturan' : 'Settings Categories'}
            </div>

            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="modal-responsive-sidebar-item clickable-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: 'none',
                    background: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <TabIcon size={15} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Tab Content */}
          <div
            className="modal-responsive-content"
            style={{
              background: 'var(--bg-surface)',
            }}
          >
            {/* Status notice */}
            {statusNotice && (
              <div
                style={{
                  background: 'rgba(0, 200, 117, 0.12)',
                  border: '1px solid var(--accent-success)',
                  color: 'var(--accent-success)',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {statusNotice}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
             * TAB 1: API KEYS
             * ───────────────────────────────────────────────────────────── */}
            {activeTab === 'keys' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Security Badge */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.07)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-lg, 10px)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <ShieldCheck size={18} color="var(--accent-success)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {t.settings.privacyDescription}
                  </p>
                </div>

                {/* Providers List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {PROVIDER_DEFINITIONS.map((provider) => {
                    const config = apiKeys[provider.id];
                    const isVisible = visibleKeys[provider.id];
                    const isSaved = savedStatus[provider.id];
                    const hasKey = provider.requiresApiKey
                      ? Boolean(config?.apiKey && config.apiKey.length > 5)
                      : true;

                    return (
                      <div
                        key={provider.id}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md, 10px)',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <ProviderBrandLogo provider={provider.id as any} size={18} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                              {provider.name}
                            </span>
                            {hasKey && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  color: 'var(--accent-success)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Check size={10} /> {t.settings.activeCached}
                              </span>
                            )}
                          </div>

                          <a
                            href={provider.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--brand-primary)',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{t.settings.getApiKey}</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>

                        {/* API Key Input */}
                        {provider.requiresApiKey && (
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type={isVisible ? 'text' : 'password'}
                              name={`anticeil-apikey-${provider.id}`}
                              id={`anticeil-apikey-${provider.id}`}
                              autoComplete="new-password"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              data-form-type="other"
                              placeholder={`Enter ${provider.name} API Key...`}
                              value={config?.apiKey || ''}
                              onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 34px 8px 12px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-strong)',
                                borderRadius: 'var(--radius-sm, 6px)',
                                color: 'var(--text-primary)',
                                fontSize: '12.5px',
                                outline: 'none',
                                fontFamily: 'monospace',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => toggleVisibility(provider.id)}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        )}

                        {/* Base URL (Optional for Ollama / Custom) */}
                        {(provider.id === 'ollama' || provider.id === 'custom') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Base URL Endpoint
                            </label>
                            <input
                              type="text"
                              placeholder={provider.defaultBaseUrl}
                              value={config?.baseUrl || ''}
                              onChange={(e) => handleBaseUrlChange(provider.id, e.target.value)}
                              style={{
                                padding: '7px 12px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm, 6px)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                outline: 'none',
                                fontFamily: 'monospace',
                              }}
                            />
                          </div>
                        )}

                        {isSaved && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-success)' }}>
                            ✓ {t.settings.savedCachedLocally}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
             * TAB 2: APPEARANCE & LANGUAGE
             * ───────────────────────────────────────────────────────────── */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Theme Card */}
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md, 10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      {theme === 'dark' ? <Moon size={16} color="#579BFC" /> : <Sun size={16} color="#FDAB3D" />}
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.common.theme}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {language === 'id' ? 'Pilih palet warna gelap atau terang.' : 'Choose between dark or light visual interface.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: theme === 'light' ? 'var(--brand-primary)' : 'transparent',
                        color: theme === 'light' ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t.common.light}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: theme === 'dark' ? 'var(--brand-primary)' : 'transparent',
                        color: theme === 'dark' ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t.common.dark}
                    </button>
                  </div>
                </div>

                {/* Language Card */}
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md, 10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <Globe size={16} color="var(--brand-primary)" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.common.language}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {language === 'id' ? 'Preferensi bahasa antarmuka aplikasi.' : 'Global application language preference.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: language === 'en' ? 'var(--brand-primary)' : 'transparent',
                        color: language === 'en' ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('id')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: language === 'id' ? 'var(--brand-primary)' : 'transparent',
                        color: language === 'id' ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Indonesia
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
             * TAB 3: PLAN & UPGRADES (BYOK UNLIMITED)
             * ───────────────────────────────────────────────────────────── */}
            {activeTab === 'plan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Active Free Plan Banner */}
                <div
                  style={{
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, rgba(0, 115, 234, 0.1), rgba(162, 93, 220, 0.1))',
                    border: '1px solid rgba(0, 115, 234, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="var(--brand-primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {language === 'id' ? 'Paket Aktif: Free Community' : 'Active Plan: Free Community'}
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(0, 200, 117, 0.15)',
                      border: '1px solid var(--accent-success)',
                      color: 'var(--accent-success)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 9px',
                      borderRadius: '9999px',
                    }}
                  >
                    FREE FOREVER
                  </span>
                </div>

                {/* 3 Pricing Cards */}
                {[
                  {
                    id: 'free',
                    name: language === 'id' ? 'Free Community' : 'Free Community',
                    badge: language === 'id' ? '100% Gratis Selamanya' : '100% Free Forever',
                    price: language === 'id' ? 'Rp0' : '$0',
                    period: language === 'id' ? 'selamanya' : 'forever',
                    active: true,
                    popular: false,
                    color: 'var(--accent-success)',
                    features: language === 'id' ? [
                      'Akses BYOK Tanpa Batas (OpenAI, Claude, Gemini, DeepSeek, Groq)',
                      'AI Gratis Bawaan (Pool Multi-Key Gemini Flash & Groq LPU)',
                      '1 GB Cloudflare R2 Storage (Penyimpanan Cloud Privat)',
                      '100 Eksekusi Cloud Otomatisasi & Webhook / bln (Unlimited di Desktop)',
                      'Scheduler Otomatisasi Standar & Manual Trigger',
                      'Canvas Interaktif & Viewer Dokumen Multi-Format (PDF, Excel, Docs)',
                      'Maksimal 25 MB upload per berkas',
                    ] : [
                      'Unlimited Direct BYOK (OpenAI, Claude, Gemini, DeepSeek, Groq)',
                      'Built-in Unlimited AI (Gemini Flash & Groq LPU Key Pool)',
                      '1 GB Cloudflare R2 Cloud Storage (Private & Secure)',
                      '100 Cloud Automation Runs & Webhooks / mo (Unlimited on Desktop)',
                      'Standard Scheduler & Manual Triggers',
                      'Interactive Canvas & Multi-Format Document Viewer (PDF, Excel, Docs)',
                      'Max 25 MB file upload per document',
                    ],
                    cta: language === 'id' ? '✓ Paket Anda Sekarang' : '✓ Your Current Plan',
                  },
                  {
                    id: 'pro',
                    name: 'Pro Power User',
                    badge: language === 'id' ? 'Paling Populer' : 'Most Popular',
                    price: language === 'id' ? 'Rp109.000' : '$7',
                    period: language === 'id' ? 'per bulan' : 'per month',
                    active: false,
                    popular: true,
                    color: 'var(--brand-primary)',
                    features: language === 'id' ? [
                      'Semua fitur Free, ditambah:',
                      '25 GB Cloudflare R2 Storage (Nol Biaya Egress Bandwidth)',
                      '2.500 Eksekusi Cloud Automasi 24/7 (Cloudflare Worker Cron Scheduler)',
                      'Jadwal Otomatisasi 24/7 Multi-Interval (Berjalan Tanpa Perlu Buka Tab)',
                      'Runner Browser Agent Realtime (Bot Web & Form Otomatis)',
                      'Sinkronisasi Cloud Mulus (Web, Desktop Tauri, & Mobile Expo)',
                      'Imagine AI Visual Studio Penuh dengan Resolusi Tinggi',
                      'Ekspor Arsip Lengkap ZIP Sekali Klik, Maks 50 MB / file',
                    ] : [
                      'Everything in Free, plus:',
                      '25 GB Cloudflare R2 Storage (Zero Egress Download Fees)',
                      '2,500 Cloud Automation Runs 24/7 (Cloudflare Worker Cron Scheduler)',
                      '24/7 Multi-Interval Automated Scheduling (Runs Without Keeping Tabs Open)',
                      'Realtime Agent Browser Runner (Autonomous Form & Web Bot)',
                      'Seamless Cloud Sync across Web, Desktop (Tauri), & Mobile',
                      'Full Imagine AI Visual Studio with High-Res Generation',
                      'One-Click Full ZIP Archive Export, Max 50 MB / file',
                    ],
                    cta: language === 'id' ? 'Upgrade ke Pro →' : 'Upgrade to Pro →',
                  },
                  {
                    id: 'team',
                    name: language === 'id' ? 'Team & Enterprise' : 'Team & Enterprise',
                    badge: language === 'id' ? 'Skala & Kolaborasi' : 'Scale & Security',
                    price: language === 'id' ? 'Rp299.000' : '$19',
                    period: language === 'id' ? 'per pengguna / bulan' : 'per user / mo',
                    active: false,
                    popular: false,
                    color: '#A25DDC',
                    features: language === 'id' ? [
                      'Semua fitur Pro, ditambah:',
                      '100 GB Cloudflare R2 Shared Team Storage',
                      '10.000 Eksekusi Cloud Automasi 24/7 (Dedicated Worker Cron & Webhooks)',
                      'Folder Kolaboratif & Workspace Tim Bersama',
                      'Hub Terpusat untuk Team MCP Connectors & Custom Tools',
                      'Custom Domain & Autentikasi SSO Khusus (SAML / OIDC)',
                      'Dasbor Analitik Admin & Audit Penggunaan Token',
                      'Jaminan SLA Uptime 99.9% & Dukungan Khusus',
                    ] : [
                      'Everything in Pro, plus:',
                      '100 GB Cloudflare R2 Shared Team Storage',
                      '10,000 Cloud Automation Runs 24/7 (Dedicated Worker Cron & Webhooks)',
                      'Collaborative Folders & Shared Team Workspaces',
                      'Centralized Hub for Team MCP Connectors & Custom Tools',
                      'Custom Domain & Dedicated SSO Authentication (SAML / OIDC)',
                      'Admin Analytics Dashboard & Token Usage Auditing',
                      'SLA 99.9% Uptime Guarantee & Dedicated Support',
                    ],
                    cta: language === 'id' ? 'Hubungi Sales →' : 'Contact Sales →',
                  },
                ].map((tier) => (
                  <div
                    key={tier.id}
                    style={{
                      padding: '16px',
                      background: tier.active
                        ? 'rgba(0, 200, 117, 0.06)'
                        : tier.popular
                        ? 'rgba(0, 115, 234, 0.07)'
                        : 'var(--bg-main)',
                      border: `1.5px solid ${
                        tier.active
                          ? 'rgba(0, 200, 117, 0.35)'
                          : tier.popular
                          ? 'rgba(0, 115, 234, 0.35)'
                          : 'var(--border-subtle)'
                      }`,
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative',
                    }}
                  >
                    {tier.popular && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '14px',
                          background: 'linear-gradient(135deg, #0073EA, #784BD1)',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                        }}
                      >
                        ★ {tier.badge}
                      </div>
                    )}

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {tier.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '26px', fontWeight: 800, color: tier.color, letterSpacing: '-0.03em' }}>
                            {tier.price}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            / {tier.period}
                          </span>
                        </div>
                      </div>
                      {!tier.popular && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: tier.active ? 'var(--accent-success)' : 'var(--text-muted)',
                            background: tier.active ? 'rgba(0,200,117,0.12)' : 'var(--bg-surface)',
                            border: `1px solid ${tier.active ? 'rgba(0,200,117,0.3)' : 'var(--border-subtle)'}`,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            flexShrink: 0,
                          }}
                        >
                          {tier.active ? (language === 'id' ? 'Aktif' : 'Active') : tier.badge}
                        </span>
                      )}
                    </div>

                    {/* Feature List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {tier.features.map((feat, fi) => (
                        <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          <Check size={12} color={tier.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      type="button"
                      disabled={tier.active}
                      onClick={() => { if (!tier.active) window.open('/', '_blank'); }}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: tier.active ? 'default' : 'pointer',
                        background: tier.active
                          ? 'rgba(0, 200, 117, 0.1)'
                          : tier.popular
                          ? 'var(--brand-primary)'
                          : 'var(--bg-surface)',
                        color: tier.active
                          ? 'var(--accent-success)'
                          : tier.popular
                          ? '#FFFFFF'
                          : 'var(--text-primary)',
                        border: tier.active
                          ? '1px solid rgba(0,200,117,0.3)'
                          : tier.popular
                          ? 'none'
                          : '1px solid var(--border-strong)',
                        transition: 'all 0.15s ease',
                      } as React.CSSProperties}
                    >
                      {tier.cta}
                    </button>
                  </div>
                ))}

                {/* Bottom Guarantee */}
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                  🛡️ {language === 'id'
                    ? 'Garansi 14 Hari Uang Kembali • Batal Kapan Saja • Bebas Ekspor Data'
                    : '14-Day Money-Back Guarantee • Cancel Anytime • No Lock-In'}
                </p>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
             * TAB 4: BACKUP & STORAGE
             * ───────────────────────────────────────────────────────────── */}
            {activeTab === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Storage Quota Widget */}
                <StorageMeterPanel language={language} />

                {/* Data Backup Card */}
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md, 10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                      {t.settings.dataBackup}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {t.settings.dataBackupSubtitle}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="clickable-pill"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={13} />
                      <span>{t.settings.exportBackupJson}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="clickable-pill"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={13} />
                      <span>{t.settings.importBackupJson}</span>
                    </button>
                  </div>

                  {/* Hidden Input for file import */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Danger Zone: Clear Keys */}
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-md, 10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-danger)', margin: '0 0 2px 0' }}>
                      {t.settings.clearAllStoredKeys}
                    </h3>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                      {language === 'id'
                        ? 'Menghapus seluruh kunci API yang tersimpan di memori browser ini.'
                        : 'Wipe all locally stored API keys from this browser cache.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid var(--accent-danger)',
                      borderRadius: 'var(--radius-sm, 6px)',
                      color: 'var(--accent-danger)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>{t.settings.clearAllStoredKeys}</span>
                  </button>
                </div>

                {/* Danger Zone: Permanent Account Deletion */}
                {user && (
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1.5px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent-danger)', margin: '0 0 2px 0' }}>
                        {language === 'id' ? 'Hapus Akun Permanen' : 'Permanently Delete Account'}
                      </h3>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, maxWidth: '460px', lineHeight: 1.4 }}>
                        {language === 'id'
                          ? 'Menghapus akun Anda, profil, seluruh riwayat percakapan, dan file storage secara permanen dari server. Anda dapat mendaftar kembali kapan saja.'
                          : 'Permanently wipe your account, profile, all chat history, and uploaded storage files from the server. You can register again at any time.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); setDeleteError(''); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: 'var(--accent-danger)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm, 6px)',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Trash2 size={14} />
                      <span>{language === 'id' ? 'Hapus Akun Saya' : 'Delete My Account'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.connectors.close}
          </button>
        </div>
      </div>
    </div>
  );

  const deleteConfirmModal = showDeleteConfirm ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={() => setShowDeleteConfirm(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-surface)',
          border: '1.5px solid rgba(239,68,68,0.35)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={18} color="var(--accent-danger)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {language === 'id' ? 'Hapus Akun Permanen' : 'Permanently Delete Account'}
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            {language === 'id'
              ? 'Tindakan ini tidak dapat dibatalkan. Seluruh data akun, profil, riwayat obrolan, dan file yang diunggah akan dihapus permanen dari server.'
              : 'This action cannot be undone. Your account, profile, all chat history, and uploaded files will be permanently deleted from the server.'}
          </p>
        </div>

        {/* Input */}
        <div style={{ padding: '18px 22px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {language === 'id'
              ? <>Untuk mengonfirmasi, ketik <code style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>HAPUS</code> di bawah ini:</>  
              : <>To confirm, type <code style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>DELETE</code> below:</>}
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={confirmWord}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && deleteConfirmText === confirmWord) executeDeleteAccount(); }}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              border: deleteConfirmText === confirmWord
                ? '1.5px solid var(--accent-danger)'
                : '1.5px solid var(--border-strong)',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border 0.15s ease',
            }}
          />
          {deleteError && (
            <p style={{ fontSize: '11.5px', color: 'var(--accent-danger)', margin: 0 }}>
              {deleteError}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={executeDeleteAccount}
              disabled={deleteConfirmText !== confirmWord || isDeletingAccount}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                background: deleteConfirmText === confirmWord ? 'var(--accent-danger)' : 'rgba(239,68,68,0.3)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: deleteConfirmText === confirmWord && !isDeletingAccount ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                boxShadow: deleteConfirmText === confirmWord ? '0 2px 8px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              {isDeletingAccount ? (
                <span>{language === 'id' ? 'Menghapus...' : 'Deleting...'}</span>
              ) : (
                <><Trash2 size={14} /><span>{language === 'id' ? 'Ya, Hapus Akun' : 'Yes, Delete Account'}</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showDeleteConfirm && createPortal(deleteConfirmModal, document.body)}
    </>
  );
}

// ── Storage Meter Panel (reusable inside Settings backup tab) ──────────────
function StorageMeterPanel({ language }: { language: string }) {
  const usedBytes = useStorageStore((s) => s.usedBytes);
  const limitBytes = useStorageStore((s) => s.limitBytes);
  const breakdown = useStorageStore((s) => s.breakdown);
  const sources = useStorageStore((s) => s.sources);
  const fileCount = useStorageStore((s) => s.fileCount);
  const lastSyncedAt = useStorageStore((s) => s.lastSyncedAt);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);
  const isSyncing = useStorageStore((s) => s.isSyncing);
  const session = useAuthStore((s) => s.session);

  // Auto-sync on mount + poll every 30s while panel is visible
  useEffect(() => {
    if (!session?.access_token) return;
    // Immediate sync on open (force)
    syncFromSupabase(session.access_token, true);
    const interval = setInterval(() => {
      syncFromSupabase(session.access_token, true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [session?.access_token, syncFromSupabase]);

  const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const isNearLimit = percentage >= 85;
  const barColor = percentage >= 98 ? '#EF4444' : isNearLimit ? '#F59E0B' : 'var(--brand-primary)';

  const breakdownItems = [
    { label: language === 'id' ? 'Chat & Percakapan' : 'Chat & Conversations', bytes: breakdown.chat ?? 0, color: '#0073EA' },
    { label: language === 'id' ? 'Otomasi & Alur Kerja' : 'Automations & Workflows', bytes: breakdown.automations ?? 0, color: '#F59E0B' },
    { label: language === 'id' ? 'Dokumen & PDF' : 'Docs & PDFs', bytes: breakdown.docs, color: '#8B5CF6' },
    { label: language === 'id' ? 'Gambar & Studio' : 'Images & Studio', bytes: breakdown.images, color: '#EC4899' },
    { label: language === 'id' ? 'Audio' : 'Audio', bytes: breakdown.audio, color: '#10B981' },
    { label: language === 'id' ? 'Basis Data' : 'Database', bytes: breakdown.database, color: '#3ECF8E' },
    { label: language === 'id' ? 'Lainnya' : 'Other', bytes: breakdown.other, color: '#6B7280' },
  ].filter((item) => item.bytes > 0);

  const syncedLabel = lastSyncedAt
    ? (language === 'id' ? 'Diperbarui: ' : 'Updated: ') +
      new Date(lastSyncedAt).toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : language === 'id' ? 'Memuat...' : 'Loading...';

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
            {language === 'id' ? 'Kapasitas Penyimpanan Ruang Kerja' : 'Workspace Storage Quota'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'id'
              ? `${fileCount} item/berkas tersimpan — Paket Gratis 1 GB`
              : `${fileCount} items/files stored — Free Plan 1 GB`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Live indicator */}
          <span
            title={isSyncing ? (language === 'id' ? 'Memperbarui...' : 'Refreshing...') : (language === 'id' ? 'Data langsung' : 'Live data')}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isSyncing ? '#F59E0B' : '#3ECF8E',
              display: 'inline-block',
              animation: isSyncing ? 'pulse 1s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '999px',
            background: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: barColor,
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <span>{formatStorageBytes(usedBytes)} {language === 'id' ? 'terpakai' : 'used'}</span>
          <span>{formatStorageBytes(Math.max(0, limitBytes - usedBytes))} {language === 'id' ? 'tersisa dari' : 'free of'} {formatStorageBytes(limitBytes)}</span>
        </div>
      </div>

      {/* Infrastructure Sources: Cloudflare R2 & Supabase Database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Cloudflare R2
            </span>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: sources?.isR2Available === false ? '#EF4444' : '#F38020',
            }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatStorageBytes(sources?.r2Bytes ?? 0)}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            {language === 'id' ? 'Berkas & Media Storage' : 'Object & Media Storage'}
          </span>
        </div>

        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Supabase Database
            </span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3ECF8E' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatStorageBytes(sources?.databaseBytes ?? breakdown.database ?? 0)}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            {language === 'id' ? 'Tabel & Dokumen Teks' : 'Tables & Document Records'}
          </span>
        </div>

        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {language === 'id' ? 'Data Lokal' : 'Local Data'}
            </span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0073EA' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatStorageBytes(sources?.localBytes ?? 0)}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            {language === 'id' ? 'Chat, Otomasi & Pengaturan' : 'Chat, Automations & Settings'}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      {breakdownItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {language === 'id' ? 'Rincian Per Fitur' : 'Per-Feature Breakdown'}
          </span>
          {breakdownItems.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {formatStorageBytes(item.bytes)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Live status footer — no manual sync button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isSyncing ? '#F59E0B' : '#3ECF8E',
            flexShrink: 0,
            animation: isSyncing ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {isSyncing
            ? (language === 'id' ? 'Memperbarui penggunaan...' : 'Updating usage...')
            : syncedLabel}
        </span>
      </div>
    </div>
  );
}

