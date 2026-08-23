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
  const t = getTranslation(language);

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [statusNotice, setStatusNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    badge: language === 'id' ? '100% Gratis' : '100% Free',
                    price: '$0',
                    period: language === 'id' ? 'selamanya' : 'forever',
                    active: true,
                    popular: false,
                    color: 'var(--accent-success)',
                    features: language === 'id' ? [
                      'AI Gratis Bawaan (Pool Multi-Key Gemini Flash & Groq LPU)',
                      'Akses BYOK Mandiri (OpenAI, Claude, DeepSeek jika punya key)',
                      '1 GB Cloud Storage + Unlimited Penyimpanan Lokal',
                      '100 Eksekusi Cloud Automasi / bln (Unlimited di Desktop)',
                      'Canvas Interaktif & Viewer Dokumen Multi-Format',
                      'Maks 25 MB upload per dokumen',
                    ] : [
                      'Built-in Free AI (Gemini Flash & Groq LPU Key Pool)',
                      'Direct BYOK Access (OpenAI, Claude, DeepSeek with own key)',
                      '1 GB Cloud Storage + Unlimited Local Storage',
                      '100 Cloud Automation Runs / mo (Unlimited on Desktop)',
                      'Interactive Canvas & Multi-Format Document Viewer',
                      'Max 25 MB file upload per document',
                    ],
                    cta: language === 'id' ? '✓ Paket Anda Sekarang' : '✓ Your Current Plan',
                  },
                  {
                    id: 'pro',
                    name: 'Pro Power User',
                    badge: language === 'id' ? 'Paling Populer' : 'Most Popular',
                    price: '$7',
                    period: language === 'id' ? 'per bulan' : 'per month',
                    active: false,
                    popular: true,
                    color: 'var(--brand-primary)',
                    features: language === 'id' ? [
                      '25 GB Cloudflare R2 Storage (Nol Biaya Egress)',
                      '2.500 Eksekusi Cloud Automasi / bln (+$3/2.5rb)',
                      'Browser Agent Realtime (Bot Web & Form Otomatis)',
                      'Sinkronisasi Cloud Mulus (Web, Desktop, Mobile)',
                      'Imagine AI Visual Studio Resolusi Tinggi',
                      'Ekspor Arsip ZIP Lengkap, Maks 50 MB / file',
                    ] : [
                      '25 GB Cloudflare R2 Storage (Zero Egress Fees)',
                      '2,500 Cloud Automation Runs / mo (+$3/2.5k)',
                      'Realtime Agent Browser Runner (Web & Form Bot)',
                      'Seamless Cloud Sync (Web, Desktop, Mobile)',
                      'Full Imagine AI Visual Studio High-Res',
                      'Full ZIP Export, Max 50 MB file upload',
                    ],
                    cta: language === 'id' ? 'Upgrade ke Pro →' : 'Upgrade to Pro →',
                  },
                  {
                    id: 'team',
                    name: language === 'id' ? 'Team & Enterprise' : 'Team & Enterprise',
                    badge: language === 'id' ? 'Untuk Tim' : 'For Teams',
                    price: '$19',
                    period: language === 'id' ? 'per pengguna / bln' : 'per user / mo',
                    active: false,
                    popular: false,
                    color: '#A25DDC',
                    features: language === 'id' ? [
                      '100 GB Cloudflare R2 Shared Team Storage',
                      '10.000 Eksekusi Cloud Automasi / bln (Shared Webhook)',
                      'Workspace Kolaboratif & Shared MCP Connectors',
                      'Custom Domain & SSO Auth (SAML / OIDC)',
                      'Dasbor Analitik Admin & Audit Token',
                      'SLA 99.9% Uptime & Dukungan Khusus',
                    ] : [
                      '100 GB Cloudflare R2 Shared Team Storage',
                      '10,000 Cloud Automation Runs / mo (Shared Webhook)',
                      'Collaborative Workspaces & Shared MCP Connectors',
                      'Custom Domain & SSO Auth (SAML / OIDC)',
                      'Admin Analytics Dashboard & Token Auditing',
                      'SLA 99.9% Uptime & Dedicated Support',
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

  return createPortal(modalContent, document.body);
}
