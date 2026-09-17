'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Zap,
  Sparkles,
  Brain,
  Sliders,
  DollarSign,
  AlertCircle,
  RotateCw,
  Eye,
  EyeOff,
  FileText,
  Palette,
  Globe,
  Video,
  KeyRound,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  PROVIDER_DEFINITIONS,
  LLMProviderId,
  LLMModel,
  ReasoningEffort,
  getTranslation,
  isModelActiveAndAvailable,
} from '@anticeil/core';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';

export interface ModelSelectorModalProps {
  onClose: () => void;
  targetCapability?: 'text' | 'image' | 'audio' | 'video';
  currentProviderId?: LLMProviderId;
  currentModelId?: string;
  onSelectModel?: (providerId: LLMProviderId, modelId: string) => void;
}

export function ModelSelectorModal({
  onClose,
  targetCapability = 'text',
  currentProviderId: propProviderId,
  currentModelId: propModelId,
  onSelectModel,
}: ModelSelectorModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModelId = useSettingsStore((s) => s.activeModelId);

  const currentProviderId = propProviderId || activeSession?.providerId || activeProviderId || 'openai';
  const currentModelId = propModelId || activeSession?.modelId || activeModelId;

  // Filter providers to only those matching the target capability
  const filteredProviders = PROVIDER_DEFINITIONS.filter((provider) => {
    if (targetCapability === 'text' || !targetCapability) {
      // Chat: only show providers whose category is chat or custom (gateway/local)
      return provider.category === 'chat' || provider.category === 'custom';
    }
    if (targetCapability === 'audio') {
      return provider.category === 'audio';
    }
    if (targetCapability === 'image') {
      return provider.category === 'image';
    }
    if (targetCapability === 'video') {
      return provider.category === 'video';
    }
    return true;
  });

  const initialProvider = filteredProviders.some((p) => p.id === currentProviderId)
    ? currentProviderId
    : filteredProviders[0]?.id || 'anticeil';

  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderId>(initialProvider);

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setCustomHeaders = useSettingsStore((s) => s.setCustomHeaders);
  const setReasoningEffort = useSettingsStore((s) => s.setReasoningEffort);
  const testConnection = useSettingsStore((s) => s.testConnection);
  const testConnectionStatus = useSettingsStore((s) => s.testConnectionStatus);

  const [draftKeys, setDraftKeys] = useState<
    Record<
      string,
      {
        apiKey?: string;
        baseUrl?: string;
        customHeaders?: Array<{ key: string; value: string }>;
        reasoningEffort?: ReasoningEffort;
      }
    >
  >({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [isConfigExpanded, setIsConfigExpanded] = useState<Record<string, boolean>>({});

  const updateSession = useChatStore((s) => s.updateSession);
  const setActiveProviderAndModel = useSettingsStore((s) => s.setActiveProviderAndModel);
  const hasConfiguredKey = useSettingsStore((s) => s.hasConfiguredKey);
  const getModelsForProvider = useSettingsStore((s) => s.getModelsForProvider);
  const refreshModels = useSettingsStore((s) => s.refreshModels);
  const isLoadingModels = useSettingsStore((s) => s.isLoadingModels);
  const dynamicModels = useSettingsStore((s) => s.dynamicModels);
  const disabledModelIds = useSettingsStore((s) => s.disabledModelIds) || [];

  const isCurrentProviderLoading = Boolean(isLoadingModels[selectedProviderId]);
  const rawModels = getModelsForProvider(selectedProviderId);
  const seenModelIds = new Set<string>();
  const disabledSet = new Set(disabledModelIds.map((id) => id.toLowerCase()));
  const models = rawModels.filter((m) => {
    if (!m || !m.id || seenModelIds.has(m.id)) return false;
    seenModelIds.add(m.id);

    const clean = m.id.toLowerCase().replace(/^models\//, '');
    if (disabledSet.has(clean)) return false;
    if (!isModelActiveAndAvailable(m)) return false;

    if (targetCapability === 'text' || !targetCapability) {
      // Keep only models that can do text/chat; exclude pure media-gen models
      if (m.capabilities?.text === false) return false;
      if (m.capabilities?.video && !m.capabilities?.text) return false;
      if (m.capabilities?.imageGen && !m.capabilities?.text) return false;
    }
    return true;
  });

  const [modelSearchQuery, setModelSearchQuery] = useState('');

  useEffect(() => {
    setModelSearchQuery('');
  }, [selectedProviderId]);

  const filteredModels = models.filter((m) => {
    if (!modelSearchQuery.trim()) return true;
    const q = modelSearchQuery.toLowerCase().trim();
    return (
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  const isLiveFetched = Boolean(dynamicModels[selectedProviderId] && dynamicModels[selectedProviderId]!.length > 0);
  const hasKey = hasConfiguredKey(selectedProviderId);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const fetchedProvidersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (hasKey && !dynamicModels[selectedProviderId] && !fetchedProvidersRef.current.has(selectedProviderId)) {
      fetchedProvidersRef.current.add(selectedProviderId);
      refreshModels(selectedProviderId);
    }
  }, [selectedProviderId, hasKey, dynamicModels, refreshModels]);

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

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

  const handleAddCustomHeader = (providerId: string) => {
    const currentHeaders = draftKeys[providerId]?.customHeaders !== undefined
      ? draftKeys[providerId]!.customHeaders!
      : Object.entries(apiKeys[providerId as LLMProviderId]?.customHeaders || {}).map(([key, value]) => ({ key, value }));
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        customHeaders: [...currentHeaders, { key: '', value: '' }],
      },
    }));
  };

  const handleUpdateCustomHeader = (providerId: string, index: number, field: 'key' | 'value', val: string) => {
    const currentHeaders = draftKeys[providerId]?.customHeaders !== undefined
      ? [...draftKeys[providerId]!.customHeaders!]
      : Object.entries(apiKeys[providerId as LLMProviderId]?.customHeaders || {}).map(([key, value]) => ({ key, value }));
    if (currentHeaders[index]) {
      currentHeaders[index] = { ...currentHeaders[index], [field]: val };
    }
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        customHeaders: currentHeaders,
      },
    }));
  };

  const handleRemoveCustomHeader = (providerId: string, index: number) => {
    const currentHeaders = draftKeys[providerId]?.customHeaders !== undefined
      ? [...draftKeys[providerId]!.customHeaders!]
      : Object.entries(apiKeys[providerId as LLMProviderId]?.customHeaders || {}).map(([key, value]) => ({ key, value }));
    currentHeaders.splice(index, 1);
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        customHeaders: currentHeaders,
      },
    }));
  };

  const handleReasoningEffortChange = (providerId: string, effort: ReasoningEffort) => {
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        reasoningEffort: effort,
      },
    }));
  };

  const handleSaveInlineProvider = (providerId: LLMProviderId) => {
    const draft = draftKeys[providerId];
    const savedKey = apiKeys[providerId]?.apiKey || '';
    const savedUrl = apiKeys[providerId]?.baseUrl;

    const keyToSave = draft?.apiKey !== undefined ? draft.apiKey : savedKey;
    const urlToSave = draft?.baseUrl !== undefined ? draft.baseUrl : savedUrl;

    setApiKey(providerId, keyToSave, urlToSave, true);

    if (draft?.customHeaders !== undefined) {
      const headersMap: Record<string, string> = {};
      for (const h of draft.customHeaders) {
        if (h.key.trim()) {
          headersMap[h.key.trim()] = h.value;
        }
      }
      setCustomHeaders(providerId, headersMap);
    }
    if (draft?.reasoningEffort !== undefined) {
      setReasoningEffort(providerId, draft.reasoningEffort);
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

  const handleSelectModel = (model: LLMModel) => {
    setActiveProviderAndModel(model.providerId, model.id);
    if (onSelectModel) {
      onSelectModel(model.providerId, model.id);
    } else if (activeSession) {
      updateSession(activeSession.id, {
        providerId: model.providerId,
        modelId: model.id,
      });
    }
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-responsive-container"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {t.models.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live Refresh Models Button */}
            <button
              onClick={() => refreshModels(selectedProviderId)}
              disabled={isCurrentProviderLoading}
              title="Fetch live active models from provider API"
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isCurrentProviderLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <RotateCw
                size={12}
                style={{
                  animation: isCurrentProviderLoading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{isCurrentProviderLoading ? '...' : t.models.syncModels}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body: Responsive Layout (Provider & Models) */}
        <div className="modal-responsive-body">
          {/* Provider Tabs */}
          <div className="modal-responsive-sidebar">
            {filteredProviders.map((provider) => {
              const isSelected = provider.id === selectedProviderId;
              const providerHasKey = hasConfiguredKey(provider.id);
              const badgeInfo = (() => {
                if (provider.id === 'anticeil') {
                  return { text: 'FREE', color: 'var(--accent-success, #10b981)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
                }
                if (provider.id === 'ollama') {
                  return { text: 'LOCAL', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.3)' };
                }
                if (provider.id === 'omniroute') {
                  return { text: 'GATEWAY', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.3)' };
                }
                if (provider.id === 'custom') {
                  return { text: 'CUSTOM', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)' };
                }
                return null;
              })();

              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProviderId(provider.id)}
                  className="modal-responsive-sidebar-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ProviderBrandLogo provider={provider.id as any} size={16} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {provider.name}
                    </span>
                    {badgeInfo && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: badgeInfo.bg,
                          color: badgeInfo.color,
                          border: `1px solid ${badgeInfo.border}`,
                          letterSpacing: '0.04em',
                          flexShrink: 0,
                        }}
                      >
                        {badgeInfo.text}
                      </span>
                    )}
                  </div>
                  {providerHasKey ? (
                    <span
                      title={provider.id === 'anticeil' ? 'Free Cloud Tier Ready' : 'API Key / Endpoint Active'}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--accent-success, #10b981)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <span title="Endpoint / API Key not configured" style={{ display: 'inline-flex', flexShrink: 0 }}>
                      <AlertCircle size={13} color="var(--accent-warning)" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Model Cards List */}
          <div
            className="modal-responsive-content"
            style={{
              gap: '10px',
            }}
          >
            {/* Informative Banner for Anticeil Pass Provider */}
            {selectedProviderId === 'anticeil' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(0, 115, 234, 0.08)',
                  border: '1px solid rgba(0, 115, 234, 0.2)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              >
                <Sparkles size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                <span>
                  {language === 'id'
                    ? 'Provider Anticeil Pass siap digunakan gratis tanpa input API key. Model ditenagai oleh Google Gemini & Groq Cloud LPU.'
                    : 'Anticeil Pass built-in provider is ready to use for free without any API key. Powered by Google Gemini & Groq Cloud LPU.'}
                </span>
              </div>
            )}

            {/* Unified Inline API Configuration Panel for Non-Anticeil Providers */}
            {selectedProviderId !== 'anticeil' && (() => {
              const provDef = PROVIDER_DEFINITIONS.find((p) => p.id === selectedProviderId);
              const cfg = apiKeys[selectedProviderId];
              const savedKey = cfg?.apiKey || '';
              const savedBaseUrl =
                selectedProviderId === 'omniroute'
                  ? (!cfg?.baseUrl || cfg?.baseUrl?.includes('openrouter.ai') ? 'http://localhost:20128/v1' : cfg.baseUrl)
                  : selectedProviderId === 'custom' || selectedProviderId === 'lmstudio'
                  ? (cfg?.baseUrl?.includes('openrouter.ai') ? 'http://localhost:1234/v1' : (cfg?.baseUrl || 'http://localhost:1234/v1'))
                  : (cfg?.baseUrl || provDef?.defaultBaseUrl || '');

              const currentKey = draftKeys[selectedProviderId]?.apiKey !== undefined
                ? draftKeys[selectedProviderId]!.apiKey!
                : savedKey;
              const currentBaseUrl = draftKeys[selectedProviderId]?.baseUrl !== undefined
                ? draftKeys[selectedProviderId]!.baseUrl!
                : savedBaseUrl;

              const isKeyDirty = currentKey !== savedKey;
              const isUrlDirty = draftKeys[selectedProviderId]?.baseUrl !== undefined && draftKeys[selectedProviderId]!.baseUrl !== savedBaseUrl;
              const isDirty = isKeyDirty || isUrlDirty || draftKeys[selectedProviderId]?.customHeaders !== undefined || draftKeys[selectedProviderId]?.reasoningEffort !== undefined;
              const hasSaved = savedStatus[selectedProviderId];
              const isVisible = visibleKeys[selectedProviderId];
              const isAdvOpen = isConfigExpanded[selectedProviderId] || false;

              const ts = testConnectionStatus[selectedProviderId];
              const isTesting = ts?.testing === true;
              const testRes = ts?.result;

              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 650, color: 'var(--text-primary)' }}>
                        {provDef?.name || selectedProviderId} {language === 'id' ? 'Konfigurasi' : 'Configuration'}
                      </span>
                      {hasKey ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--accent-success)',
                          }}
                        >
                          ✓ {language === 'id' ? 'AKTIF' : 'ACTIVE'}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-warning)',
                          }}
                        >
                          ⚠️ {language === 'id' ? 'BELUM TERHUBUNG' : 'NOT CONFIGURED'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {provDef?.docUrl && (
                        <a
                          href={provDef.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                            color: 'var(--brand-primary)',
                            textDecoration: 'none',
                          }}
                        >
                          <span>{t.settings.getApiKey}</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Anticeil Pass Banner */}
                  {(selectedProviderId === 'openai-compatible' || selectedProviderId === 'omniroute') && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={12} color="#60a5fa" />
                        <span>
                          <strong style={{ color: '#60a5fa' }}>Anticeil Pass</strong> — proxy cepat untuk model open-weights.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDraftBaseUrlChange(selectedProviderId, 'http://localhost:20128/v1')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#60a5fa',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '10.5px',
                          fontWeight: 600,
                        }}
                      >
                        Port 20128
                      </button>
                    </div>
                  )}

                  {/* Inputs Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {/* API Key Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {selectedProviderId === 'omniroute' || selectedProviderId === 'openai-compatible'
                          ? 'API Key (Opsional / Gateway Pass)'
                          : `${provDef?.name || selectedProviderId} API Key`}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={currentKey}
                          onChange={(e) => handleDraftKeyChange(selectedProviderId, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveInlineProvider(selectedProviderId);
                            }
                          }}
                          placeholder={
                            selectedProviderId === 'omniroute'
                              ? 'Lewati jika menggunakan OmniRoute lokal...'
                              : selectedProviderId === 'ollama'
                              ? 'Ollama tidak memerlukan API Key...'
                              : `Masukkan API Key ${provDef?.name || ''}...`
                          }
                          style={{
                            width: '100%',
                            padding: '6px 30px 6px 9px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '11.5px',
                            fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setVisibleKeys((p) => ({ ...p, [selectedProviderId]: !p[selectedProviderId] }))}
                          style={{
                            position: 'absolute',
                            right: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Base URL Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Base URL
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsConfigExpanded((p) => ({ ...p, [selectedProviderId]: !p[selectedProviderId] }))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--brand-primary)',
                            cursor: 'pointer',
                            fontSize: '10.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <span>{isAdvOpen ? 'Tutup Opsi Lanjutan' : 'Opsi Lanjutan & Header'}</span>
                          {isAdvOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={currentBaseUrl}
                        onChange={(e) => handleDraftBaseUrlChange(selectedProviderId, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveInlineProvider(selectedProviderId);
                          }
                        }}
                        placeholder={
                          selectedProviderId === 'omniroute' || selectedProviderId === 'openai-compatible'
                            ? 'http://localhost:20128/v1'
                            : selectedProviderId === 'ollama'
                            ? 'http://localhost:11434'
                            : (provDef?.defaultBaseUrl || 'https://api.openai.com/v1')
                        }
                        style={{
                          width: '100%',
                          padding: '6px 9px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '11.5px',
                          fontFamily: 'monospace',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Collapsible Advanced Section: Custom Headers & Reasoning Effort */}
                  {isAdvOpen && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px dashed var(--border-subtle)',
                      }}
                    >
                      {/* Reasoning Effort */}
                      {(() => {
                        const currentReasoningEffort: ReasoningEffort = draftKeys[selectedProviderId]?.reasoningEffort !== undefined
                          ? draftKeys[selectedProviderId]!.reasoningEffort!
                          : (cfg?.reasoningEffort || 'none');

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Reasoning Effort (Thinking Depth)
                              </label>
                            </div>
                            <select
                              value={currentReasoningEffort}
                              onChange={(e) => handleReasoningEffortChange(selectedProviderId, e.target.value as ReasoningEffort)}
                              style={{
                                width: '100%',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-main)',
                                color: 'var(--text-primary)',
                                fontSize: '11px',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="none">None (Standard Fast)</option>
                              <option value="low">Low (Quick Reasoning)</option>
                              <option value="medium">Medium (Balanced)</option>
                              <option value="high">High (Deep Verification)</option>
                            </select>
                          </div>
                        );
                      })()}

                      {/* Custom Headers */}
                      {(() => {
                        const customHeadersList = draftKeys[selectedProviderId]?.customHeaders !== undefined
                          ? draftKeys[selectedProviderId]!.customHeaders!
                          : Object.entries(cfg?.customHeaders || {}).map(([key, value]) => ({ key, value }));

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Custom HTTP Headers
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddCustomHeader(selectedProviderId)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  color: '#60a5fa',
                                  borderRadius: '3px',
                                  padding: '1px 6px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Plus size={9} />
                                <span>Add Header</span>
                              </button>
                            </div>

                            {customHeadersList.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {customHeadersList.map((hdr, idx) => (
                                  <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      value={hdr.key}
                                      onChange={(e) => handleUpdateCustomHeader(selectedProviderId, idx, 'key', e.target.value)}
                                      placeholder="Header Key"
                                      style={{
                                        flex: 1,
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-subtle)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: '10.5px',
                                        fontFamily: 'monospace',
                                        outline: 'none',
                                      }}
                                    />
                                    <input
                                      type="text"
                                      value={hdr.value}
                                      onChange={(e) => handleUpdateCustomHeader(selectedProviderId, idx, 'value', e.target.value)}
                                      placeholder="Header Value"
                                      style={{
                                        flex: 1,
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-subtle)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: '10.5px',
                                        fontFamily: 'monospace',
                                        outline: 'none',
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomHeader(selectedProviderId, idx)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '2px',
                                      }}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Tidak ada custom header yang diatur.
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Actions & Test Status Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => testConnection(selectedProviderId)}
                        disabled={isTesting}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 9px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: isTesting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <RefreshCw size={10} style={{ animation: isTesting ? 'spin 1s linear infinite' : 'none' }} />
                        <span>{isTesting ? (language === 'id' ? 'Menguji...' : 'Testing...') : (language === 'id' ? 'Uji Koneksi' : 'Test Connection')}</span>
                      </button>

                      {testRes && !isTesting && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: testRes.success ? 'var(--accent-success)' : '#ef4444',
                          }}
                        >
                          {testRes.success ? '✓' : '✗'} {testRes.message}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {hasSaved && (
                        <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600 }}>
                          ✓ {t.settings.saved}
                        </span>
                      )}
                      {isDirty && (
                        <button
                          type="button"
                          onClick={() => handleSaveInlineProvider(selectedProviderId)}
                          style={{
                            padding: '4px 12px',
                            background: 'var(--brand-primary, #0073ea)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 650,
                            cursor: 'pointer',
                          }}
                        >
                          {language === 'id' ? 'Simpan Pengaturan' : 'Save Settings'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Model Search Bar */}
            {models.length > 4 && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  placeholder={
                    language === 'id'
                      ? `Cari dari ${models.length} model... (mis. gemini, groq, sonnet, r1, flash)`
                      : `Search ${models.length} models... (e.g. gemini, groq, sonnet, r1, flash)`
                  }
                  style={{
                    width: '100%',
                    padding: '7px 28px 7px 30px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                {modelSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModelSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      fontSize: '11px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Status bar for live sync */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'var(--text-muted)',
                paddingBottom: '4px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>
                {filteredModels.length !== models.length
                  ? `${filteredModels.length} / ${models.length} ${t.models.modelsAvailable}`
                  : `${models.length} ${t.models.modelsAvailable}`}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isLiveFetched ? 'var(--accent-success)' : 'var(--text-muted)',
                  }}
                />
                {isLiveFetched ? t.models.liveApiSynced : 'Default'}
              </span>
            </div>

            {filteredModels.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Search size={22} style={{ opacity: 0.4 }} />
                <span>
                  {language === 'id'
                    ? `Tidak ada model yang cocok dengan "${modelSearchQuery}"`
                    : `No models match "${modelSearchQuery}"`}
                </span>
              </div>
            ) : (
              filteredModels.map((model) => {
              const isCurrent = currentModelId === model.id;
              const caps = model.capabilities;
              const hasVision = caps?.vision ?? model.supportsVision;
              const hasReasoning = caps?.reasoning ?? model.supportsReasoning;
              const hasDocs = (caps?.docAnalysis ?? (model.contextWindow >= 128000));
              const hasImageGen = caps?.imageGen ?? false;
              const hasFastLpu = caps?.fastLpu ?? (model.providerId === 'groq');

              return (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className="hover-card"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isCurrent ? 'var(--bg-subtle)' : 'var(--bg-input)',
                    border: isCurrent
                      ? '1.5px solid var(--brand-primary)'
                      : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: 'var(--inner-glow)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {model.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                          background: 'var(--bg-surface)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {model.id}
                      </span>
                      {model.isPopular && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(99, 102, 241, 0.18)',
                            color: '#818CF8',
                          }}
                        >
                          POPULAR
                        </span>
                      )}
                    </div>
                    {isCurrent && <Check size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
                  </div>

                  {/* Dynamic Capability Badges Strip (Each with Unique Color) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {hasVision && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(2, 132, 199, 0.1)',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          color: '#0369A1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Eye size={10} /> {t.models.vision}
                      </span>
                    )}

                    {hasReasoning && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(126, 34, 206, 0.1)',
                          border: '1px solid rgba(126, 34, 206, 0.28)',
                          color: '#6D28D9',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Brain size={10} /> {t.models.reasoning}
                      </span>
                    )}

                    {hasDocs && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(5, 150, 105, 0.1)',
                          border: '1px solid rgba(5, 150, 105, 0.28)',
                          color: '#047857',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <FileText size={10} /> {t.models.docsContext}
                      </span>
                    )}

                    {hasImageGen && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(180, 83, 9, 0.1)',
                          border: '1px solid rgba(180, 83, 9, 0.28)',
                          color: '#B45309',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Palette size={10} /> {t.models.imageGen}
                      </span>
                    )}

                    {hasFastLpu && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(6, 148, 162, 0.1)',
                          border: '1px solid rgba(6, 148, 162, 0.28)',
                          color: '#0E7490',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Zap size={10} /> {t.models.fastLpu}
                      </span>
                    )}

                    {(caps?.audio || caps?.tts || model.id.includes('4o')) && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(190, 18, 60, 0.1)',
                          border: '1px solid rgba(190, 18, 60, 0.25)',
                          color: '#BE123C',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Sparkles size={10} /> {t.models.audioTts}
                      </span>
                    )}

                    {(caps?.webSearch || model.providerId === 'gemini' || model.id.includes('sonar') || model.id.includes('compound')) && (
                       <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(21, 128, 61, 0.1)',
                          border: '1px solid rgba(21, 128, 61, 0.28)',
                          color: '#15803D',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Globe size={10} /> {t.models.webSearch}
                      </span>
                    )}

                    {(caps?.video || model.id.includes('video') || model.id.includes('luma') || model.id.includes('kling') || model.id.includes('svd') || model.id.includes('sora')) && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(194, 65, 12, 0.1)',
                          border: '1px solid rgba(194, 65, 12, 0.28)',
                          color: '#C2410C',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Video size={10} /> {t.models.videoGen}
                      </span>
                    )}
                  </div>

                  {model.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {model.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    <span>Context: {(model.contextWindow / 1000).toLocaleString()}k tokens</span>
                    {model.inputCostPer1M > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <DollarSign size={10} />
                        ${model.inputCostPer1M} in / ${model.outputCostPer1M} out (1M)
                      </span>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
