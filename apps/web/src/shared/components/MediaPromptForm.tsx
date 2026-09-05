'use client';

import React from 'react';
import { PromptBar, PromptBarProps } from './PromptBar';

export interface MediaPromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop?: () => void;
  isGenerating: boolean;
  placeholder: string;
  modelDisplayName: string;
  onModelSelectorOpen: () => void;
  language?: 'en' | 'id';
  brandColor?: string;
  additionalControls?: React.ReactNode;
}

export function MediaPromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  onStop,
  isGenerating,
  placeholder,
  modelDisplayName,
  onModelSelectorOpen,
  brandColor = 'var(--brand-primary)',
  additionalControls,
}: MediaPromptFormProps) {
  return (
    <PromptBar
      prompt={prompt}
      onPromptChange={onPromptChange}
      onSubmit={onSubmit}
      onStop={onStop}
      isGenerating={isGenerating}
      placeholder={placeholder}
      modelDisplayName={modelDisplayName}
      onModelSelectorOpen={onModelSelectorOpen}
      leftControls={additionalControls}
      brandColor={brandColor}
    />
  );
}
