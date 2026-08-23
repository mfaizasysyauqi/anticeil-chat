'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Bot,
  Code,
  Brain,
  PenTool,
  Languages,
  Plus,
  ArrowRight,
  Trash2,
  Cpu,
} from 'lucide-react';
import { Persona, getTranslation } from '@anticeil/core';
import { usePromptStore } from '../store/usePromptStore';
import { useChatStore } from '../../chat/store/useChatStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function PromptsView() {
  const router = useRouter();
  const personas = usePromptStore((s) => s.personas);
  const addCustomPersona = usePromptStore((s) => s.addCustomPersona);
  const deleteCustomPersona = usePromptStore((s) => s.deleteCustomPersona);
  const createSession = useChatStore((s) => s.createSession);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code': return <Code size={18} color="var(--brand-primary)" />;
      case 'Brain': return <Brain size={18} color="var(--accent-reasoning)" />;
      case 'PenTool': return <PenTool size={18} color="var(--accent-warning)" />;
      case 'Languages': return <Languages size={18} color="var(--accent-info)" />;
      default: return <Cpu size={18} color="var(--text-secondary)" />;
    }
  };

  const handleUsePersona = (persona: Persona) => {
    createSession(undefined, undefined, persona.systemPrompt);
    router.push('/');
  };

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    addCustomPersona({
      name: name.trim(),
      description: description.trim() || 'Custom created persona',
      systemPrompt: systemPrompt.trim(),
      icon: 'Bot',
      defaultTemperature: 0.7,
      suggestedStarters: ['Hello! How can you help me today?'],
      category: 'general',
    });

    setName('');
    setDescription('');
    setSystemPrompt('');
    setIsCreating(false);
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-xl)',
            gap: 'var(--space-lg)',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'var(--font-2xl)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: 'var(--space-xs)',
                color: 'var(--text-primary)',
              }}
            >
              {t.prompts.title}
            </h1>
            <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>
              {t.prompts.subtitle}
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--brand-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Plus size={15} />
            <span>{t.prompts.createCustom}</span>
          </button>
        </div>

        {/* New Persona Dialog Form */}
        {isCreating && (
          <form
            onSubmit={handleCreatePersona}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Create New Persona
            </h3>

            <input
              type="text"
              placeholder="Persona Name (e.g. Flutter Architect)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                padding: '10px var(--space-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-base)',
                outline: 'none',
              }}
            />

            <input
              type="text"
              placeholder="Brief Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '10px var(--space-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-base)',
                outline: 'none',
              }}
            />

            <textarea
              placeholder="System Prompt instructions for the AI..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              required
              rows={4}
              style={{
                padding: '10px var(--space-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-base)',
                outline: 'none',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '7px 16px',
                  background: 'var(--brand-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Persona
              </button>
            </div>
          </form>
        )}

        {/* Grid of Personas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {personas.map((persona) => {
            const isCustom = persona.id.startsWith('custom-');

            return (
              <div
                key={persona.id}
                className="hover-card"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--inner-glow)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {getPersonaIcon(persona.icon)}
                    </div>

                    {isCustom && (
                      <button
                        onClick={() => deleteCustomPersona(persona.id)}
                        title="Delete custom persona"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 'var(--space-xs)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>
                    {persona.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      marginBottom: 'var(--space-lg)',
                      minHeight: '36px',
                    }}
                  >
                    {persona.description}
                  </p>
                </div>

                <button
                  onClick={() => handleUsePersona(persona)}
                  className="clickable-pill"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  <span>{t.prompts.usePersona}</span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
