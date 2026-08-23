'use client';

import React, { useState, useEffect } from 'react';
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
  FileText,
  Palette,
  Globe,
  Video,
  KeyRound,
} from 'lucide-react';
import {
  PROVIDER_DEFINITIONS,
  LLMProviderId,
  LLMModel,
  getTranslation,
} from '@chatbyok/core';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';

interface ModelSelectorModalProps {
  onClose: () => void;
}

export function ModelSelectorModal({ onClose }: ModelSelectorModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModelId = useSettingsStore((s) => s.activeModelId);

  const currentProviderId = activeSession?.providerId || activeProviderId || 'openai';
  const currentModelId = activeSession?.modelId || activeModelId;

  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderId>(currentProviderId);

  const updateSession = useChatStore((s) => s.updateSession);
  const setActiveProviderAndModel = useSettingsStore((s) => s.setActiveProviderAndModel);
  const hasConfiguredKey = useSettingsStore((s) => s.hasConfiguredKey);
  const getModelsForProvider = useSettingsStore((s) => s.getModelsForProvider);
  const refreshModels = useSettingsStore((s) => s.refreshModels);
  const isLoadingModels = useSettingsStore((s) => s.isLoadingModels);
  const dynamicModels = useSettingsStore((s) => s.dynamicModels);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

  const isCurrentProviderLoading = Boolean(isLoadingModels[selectedProviderId]);
  const models = getModelsForProvider(selectedProviderId);
  const isLiveFetched = Boolean(dynamicModels[selectedProviderId] && dynamicModels[selectedProviderId]!.length > 0);
  const hasKey = hasConfiguredKey(selectedProviderId);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  useEffect(() => {
    if (hasKey && !dynamicModels[selectedProviderId]) {
      refreshModels(selectedProviderId);
    }
  }, [selectedProviderId, hasKey, dynamicModels, refreshModels]);

  const handleSelectModel = (model: LLMModel) => {
    if (activeSession) {
      updateSession(activeSession.id, {
        providerId: model.providerId,
        modelId: model.id,
      });
    }
    setActiveProviderAndModel(model.providerId, model.id);
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
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t.models.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Shortcut: Settings API Keys */}
            <button
              onClick={() => {
                onClose();
                setSettingsOpen(true);
              }}
              title={language === 'id' ? 'Buka Pengaturan Kunci API' : 'Manage API Keys'}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 115, 234, 0.1)',
                border: '1px solid rgba(0, 115, 234, 0.25)',
                color: 'var(--brand-primary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <KeyRound size={12} />
              <span>{language === 'id' ? 'Atur API Key' : 'API Keys'}</span>
            </button>

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

        {/* Body: Two Column Provider & Models */}
        <div style={{ display: 'flex', flex: 1, minHeight: '380px', overflow: 'hidden' }}>
          {/* Provider Tabs */}
          <div
            style={{
              width: '200px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              overflowY: 'auto',
            }}
          >
            {PROVIDER_DEFINITIONS.map((provider) => {
              const isSelected = provider.id === selectedProviderId;
              const providerHasKey = hasConfiguredKey(provider.id);

              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProviderId(provider.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{provider.name}</span>
                  {!providerHasKey && (
                    <span title="API Key missing" style={{ display: 'inline-flex' }}>
                      <AlertCircle size={13} color="var(--accent-warning)" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Model Cards List */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Warning Banner if API Key is missing for this provider */}
            {!hasKey && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '12px',
                  color: 'var(--accent-warning)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>
                    {language === 'id'
                      ? `Kunci API ${PROVIDER_DEFINITIONS.find((p) => p.id === selectedProviderId)?.name} belum diatur.`
                      : `API Key for ${PROVIDER_DEFINITIONS.find((p) => p.id === selectedProviderId)?.name} is missing.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setSettingsOpen(true);
                  }}
                  style={{
                    backgroundColor: 'var(--accent-warning)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {language === 'id' ? 'Masukkan Key' : 'Enter Key'} →
                </button>
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
                {models.length} {t.models.modelsAvailable}
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

            {models.map((model) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
