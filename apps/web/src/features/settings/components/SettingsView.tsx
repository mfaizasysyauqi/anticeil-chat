'use client';

import React, { useState, useRef } from 'react';
import {
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
  Laptop,
  Globe,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  PROVIDER_DEFINITIONS,
  LLMProviderId,
  getTranslation,
} from '@anticeil/core';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../../chat/store/useChatStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useCreditStore } from '../../credits/store/useCreditStore';
import { ConnectorsModal } from '../../connectors/components/ConnectorsModal';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';
import { KeyLimitDialog } from './KeyLimitDialog';

export function SettingsView() {
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);
  const clearAllKeys = useSettingsStore((s) => s.clearAllKeys);
  const importApiKeys = useSettingsStore((s) => s.importApiKeys);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const sessions = useChatStore((s) => s.sessions);
  const messages = useChatStore((s) => s.messages);
  const tier = useAuthStore((s) => s.tier);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);
  const t = getTranslation(language);

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [importNotice, setImportNotice] = useState('');
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftKeys, setDraftKeys] = useState<Record<string, { apiKey?: string; baseUrl?: string }>>({});
  const [keyLimitDialog, setKeyLimitDialog] = useState<{
    isOpen: boolean;
    newProviderId?: LLMProviderId;
    newKey?: string;
    newUrl?: string;
    existingProviderId?: LLMProviderId;
    existingProviderName?: string;
    newProviderName?: string;
  } | null>(null);

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDraftKeyChange = (providerId: string, value: string) => {
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        apiKey: value,
      },
    }));
  };

  const handleDraftBaseUrlChange = (providerId: string, baseUrl: string) => {
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        baseUrl,
      },
    }));
  };

  const handleSaveProvider = (providerId: LLMProviderId, forceReplace = false) => {
    const draft = draftKeys[providerId];
    const savedKey = apiKeys[providerId]?.apiKey || '';
    const savedUrl = apiKeys[providerId]?.baseUrl;

    const keyToSave = draft?.apiKey !== undefined ? draft.apiKey : savedKey;
    const urlToSave = draft?.baseUrl !== undefined ? draft.baseUrl : savedUrl;

    const res = setApiKey(providerId, keyToSave, urlToSave, forceReplace);

    if (res && !res.success && res.reason === 'FREE_LIMIT_EXCEEDED' && res.activeProviderId) {
      const existingName = PROVIDER_DEFINITIONS.find((p) => p.id === res.activeProviderId)?.name || res.activeProviderId;
      const newName = PROVIDER_DEFINITIONS.find((p) => p.id === providerId)?.name || providerId;
      setKeyLimitDialog({
        isOpen: true,
        newProviderId: providerId,
        newKey: keyToSave,
        newUrl: urlToSave,
        existingProviderId: res.activeProviderId,
        existingProviderName: existingName,
        newProviderName: newName,
      });
      return;
    }

    setSavedStatus((prev) => ({ ...prev, [providerId]: true }));
    setDraftKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [providerId]: false }));
    }, 2500);
  };

  const handleConfirmReplaceKey = () => {
    if (!keyLimitDialog?.newProviderId) return;
    handleSaveProvider(keyLimitDialog.newProviderId, true);
    setKeyLimitDialog(null);
  };

  const handleDeleteKey = (providerId: LLMProviderId) => {
    const provName = PROVIDER_DEFINITIONS.find((p) => p.id === providerId)?.name || providerId;
    if (confirm(language === 'id' ? `Hapus kunci API untuk ${provName}?` : `Delete API key for ${provName}?`)) {
      clearApiKey(providerId);
      setDraftKeys((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      setImportNotice(language === 'id' ? `Kunci API ${provName} telah dihapus.` : `API key for ${provName} removed.`);
      setTimeout(() => setImportNotice(''), 3000);
    }
  };

  const handleCancelProvider = (providerId: LLMProviderId) => {
    setDraftKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
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
          setImportNotice('✓ Backup data & API keys successfully restored!');
          setTimeout(() => setImportNotice(''), 3500);
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
    if (confirm('Are you sure you want to clear all stored API keys from this device?')) {
      clearAllKeys();
      setImportNotice('All API keys cleared from this browser.');
      setTimeout(() => setImportNotice(''), 3000);
    }
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h1
            style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              marginBottom: 'var(--space-xs)',
              color: 'var(--text-primary)',
            }}
          >
            {t.settings.title}
          </h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>
            {t.settings.subtitle}
          </p>
        </div>

        {/* Security & Local Persistence Notice Card */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.07)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--accent-success)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.settings.privacyTitle}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-success)',
                }}
              >
                {t.settings.privacyBadge}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {t.settings.privacyDescription}
            </p>
          </div>
        </div>

        {/* 0. Appearance & Language Configuration */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              {language === 'id' ? '🎨 Tampilan & Bahasa' : '🎨 Appearance & Language'}
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
              {language === 'id' ? 'Sesuaikan tema warna antarmuka dan preferensi bahasa aplikasi.' : 'Customize your visual theme and global language preferences.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* Theme Card */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {theme === 'system' ? <Laptop size={16} color="#0073EA" /> : theme === 'dark' ? <Moon size={16} color="#579BFC" /> : <Sun size={16} color="#FDAB3D" />}
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t.common.theme}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: theme === 'system' ? 'var(--bg-surface)' : 'transparent',
                    color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {language === 'id' ? 'Sistem' : 'System'}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: theme === 'light' ? 'var(--bg-surface)' : 'transparent',
                    color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {t.common.light}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: theme === 'dark' ? 'var(--bg-surface)' : 'transparent',
                    color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {t.common.dark}
                </button>
              </div>
            </div>

            {/* Language Card */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t.common.language}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: language === 'en' ? 'var(--brand-primary)' : 'transparent',
                    color: language === 'en' ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: language === 'id' ? 'var(--brand-primary)' : 'transparent',
                    color: language === 'id' ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Indonesia
                </button>
              </div>
            </div>
          </div>
        </div>

        {importNotice && (
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--accent-success)',
              color: 'var(--accent-success)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: 'var(--space-md)',
            }}
          >
            {importNotice}
          </div>
        )}

        {/* Hidden Import File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          style={{ display: 'none' }}
        />

        {/* Free Tier 1-Key Limit Callout */}
        {tier === 'free' && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                {language === 'id'
                  ? 'Paket Free Community: Maksimal 1 API Key aktif. Semua model dari provider tersebut dapat digunakan secara bebas tanpa batasan.'
                  : 'Free Community Plan: Max 1 active API Key. All models from the configured provider are fully available without restriction.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPricingModalOpen(true)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'var(--brand-primary, #0073ea)',
                color: '#fff',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 650,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {language === 'id' ? 'Upgrade Multi-Key ↗' : 'Upgrade Multi-Key ↗'}
            </button>
          </div>
        )}

        {/* Provider Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          {PROVIDER_DEFINITIONS.map((provider) => {
            const config = apiKeys[provider.id];
            const isVisible = visibleKeys[provider.id];
            const isSaved = savedStatus[provider.id];

            const savedKey = config?.apiKey || '';
            const savedBaseUrl =
              provider.id === 'omniroute'
                ? (!config?.baseUrl || config?.baseUrl?.includes('openrouter.ai') ? 'http://localhost:20128/v1' : config.baseUrl)
                : provider.id === 'custom'
                ? (config?.baseUrl?.includes('openrouter.ai') ? 'http://localhost:1234/v1' : (config?.baseUrl || 'http://localhost:1234/v1'))
                : (config?.baseUrl || '');

            const currentKey = draftKeys[provider.id]?.apiKey !== undefined ? draftKeys[provider.id]!.apiKey! : savedKey;
            const currentBaseUrl = draftKeys[provider.id]?.baseUrl !== undefined ? draftKeys[provider.id]!.baseUrl! : savedBaseUrl;

            const isKeyDirty = currentKey !== savedKey;
            const isUrlDirty = draftKeys[provider.id]?.baseUrl !== undefined && draftKeys[provider.id]!.baseUrl !== savedBaseUrl;
            const isDirty = isKeyDirty || isUrlDirty;
            const hasKey = provider.requiresApiKey
              ? Boolean(config?.apiKey && config.apiKey.length > 5)
              : true;

            return (
              <div
                key={provider.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--inner-glow, 0 1px 3px rgba(0,0,0,0.05))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ProviderBrandLogo provider={provider.id as any} size={20} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>
                      {provider.name}
                    </span>
                    {hasKey && (
                      <span
                        style={{
                          fontSize: 'var(--font-xs)',
                          fontWeight: 600,
                          padding: '2px 8px',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Boolean(savedKey?.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(provider.id)}
                        title={language === 'id' ? 'Hapus Kunci API' : 'Delete API Key'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 650,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={11} />
                        <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
                      </button>
                    )}

                    <a
                      href={provider.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--brand-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)',
                      }}
                    >
                      <span>{t.settings.getApiKey}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* Anticeil Built-in Description */}
                {provider.id === 'anticeil' && (
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                    {language === 'id'
                      ? 'Provider bawaan gratis yang siap dipakai langsung tanpa API key. Menggunakan model pilihan dari Google Gemini & Groq Cloud LPU.'
                      : 'Default built-in free provider that is ready to use without an API key. Powered by Google Gemini & Groq Cloud LPU.'}
                  </p>
                )}

                {/* API Key Input Field */}
                {provider.requiresApiKey && (
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <div
                      style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type={isVisible ? 'text' : 'password'}
                        name={`anticeil-apikey-${provider.id}`}
                        id={`anticeil-apikey-${provider.id}`}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        placeholder={`Enter ${provider.name} API Key...`}
                        value={currentKey}
                        onChange={(e) => handleDraftKeyChange(provider.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveProvider(provider.id);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 36px 9px var(--space-md)',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--font-base)',
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
                          padding: 'var(--space-xs)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Base URL (Optional for Ollama/Custom/OpenAI) */}
                {(provider.id === 'ollama' || provider.id === 'omniroute' || provider.id === 'custom') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    <label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      Base URL Endpoint
                    </label>
                    <input
                      type="text"
                      name={`anticeil-baseurl-${provider.id}`}
                      id={`anticeil-baseurl-${provider.id}`}
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder={provider.defaultBaseUrl}
                      value={currentBaseUrl}
                      onChange={(e) => handleDraftBaseUrlChange(provider.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveProvider(provider.id);
                        }
                      }}
                      style={{
                        padding: '8px var(--space-md)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--font-sm)',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                )}

                {isDirty ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveProvider(provider.id)}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--brand-primary, #0073ea)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 650,
                        cursor: 'pointer',
                      }}
                    >
                      {language === 'id' ? 'Simpan' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelProvider(provider.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {language === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                ) : isSaved ? (
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-success)' }}>
                    ✓ {t.settings.savedCachedLocally}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Connectors Section */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
            marginBottom: '24px',
            boxShadow: 'var(--inner-glow, 0 1px 3px rgba(0,0,0,0.05))',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>🔌</span>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t.connectors.title}
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
              {t.connectors.settingsDesc}
            </p>
          </div>

          <button
            onClick={() => setIsConnectorsModalOpen(true)}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: 'var(--brand-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#FFFFFF',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 115, 234, 0.35)',
            }}
          >
            <span>{t.connectors.manageConnectors}</span>
          </button>
        </div>

        {/* Backup, Import & Clear Storage Section */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '40px',
            boxShadow: 'var(--inner-glow, 0 1px 3px rgba(0,0,0,0.05))',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              {t.settings.dataBackup}
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
              {t.settings.dataBackupSubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleExportData}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px var(--space-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              <span>{t.settings.exportBackupJson}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px var(--space-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Upload size={14} />
              <span>{t.settings.importBackupJson}</span>
            </button>

            <button
              onClick={handleClearAll}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px var(--space-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-danger)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Trash2 size={14} />
              <span>{t.settings.clearAllStoredKeys}</span>
            </button>
          </div>
        </div>
      </div>

      <ConnectorsModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
      />

      {/* Free Tier API Key Limit Modal Dialog */}
      <KeyLimitDialog
        dialogData={keyLimitDialog}
        language={language}
        onClose={() => setKeyLimitDialog(null)}
        onConfirmReplace={handleConfirmReplaceKey}
        onUpgrade={() => {
          setKeyLimitDialog(null);
          setPricingModalOpen(true);
        }}
      />
    </div>
  );
}
