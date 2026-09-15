'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
  ChevronRight,
  FileUp,
  Clock,
  LayoutGrid,
  Plug,
  PlusSquare,
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { toast } from '@/shared/hooks/useToast';
import {
  estimateTokens,
  getTranslation,
  FileAttachment,
  parseUploadedFile,
  formatBytes,
  getModelById,
  ConnectorId,
} from '@anticeil/core';
import { ModelSelectorModal } from './ModelSelectorModal';
import { ConnectorsModal } from '../../connectors/components/ConnectorsModal';
import { useConnectorsStore } from '../../connectors/store/useConnectorsStore';
import { ConnectorBrandIcon } from '../../connectors/components/ConnectorLogos';
import { useStorageStore } from '../../storage/store/useStorageStore';

const CONNECTOR_CHIPS: Array<{
  id: ConnectorId;
  label: string;
  bg: string;
  border: string;
}> = [
  {
    id: 'anticeil_image',
    label: 'Image AI',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'anticeil_audio',
    label: 'Audio AI',
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.25)',
  },
  {
    id: 'gmail',
    label: 'Gmail',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'google_drive',
    label: 'Drive',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'notion',
    label: 'Notion',
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.3)',
  },
];

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function ChatInput({ onSend, inputRef }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const connectors = useConnectorsStore((s) => s.connectors);
  const activeConnectorIds = useConnectorsStore((s) => s.activeConnectorIds);
  const toggleActiveConnector = useConnectorsStore((s) => s.toggleActiveConnector);

  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isGenerating = useChatStore((s) => s.isGenerating);
  const stopGeneration = useChatStore((s) => s.stopGeneration);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const activeProviderId = useSettingsStore((s) => s.activeProviderId);
  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const getModelsForProvider = useSettingsStore((s) => s.getModelsForProvider);

  const currentProviderId = activeSession?.providerId || activeProviderId;
  const currentModelId = activeSession?.modelId || activeModelId;

  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  // Resolve model display name from provider dynamic models or static registry
  const providerModels = getModelsForProvider(currentProviderId);
  const matchedModel = providerModels.find((m) => m.id === currentModelId) || getModelById(currentModelId);
  const modelDisplayName = matchedModel?.name || currentModelId || t.chat.selectModel;

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'id' ? 'id-ID' : 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast.info('Speech Recognition is not supported by your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  };

  // Auto-resize textarea height: min 2 lines (~44px), max 7 lines (~154px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 44;
      const maxHeight = 154;
      const targetHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textareaRef.current.style.height = `${targetHeight}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [text, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close Plus Dropdown Menu on Outside Click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);

  // Handle file upload
  const MAX_ATTACHMENTS_PER_MESSAGE = 5;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      toast.info(
        language === 'id'
          ? `Maksimal hanya dapat melampirkan ${MAX_ATTACHMENTS_PER_MESSAGE} berkas dalam satu pesan.`
          : `You can attach a maximum of ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsParsingFiles(true);
    const newAttachments: FileAttachment[] = [];
    const currentTotalBytes = attachments.reduce((acc, a) => acc + (a.size || 0), 0);

    for (let i = 0; i < files.length; i++) {
      if (!canFit(files[i].size)) {
        toast.error(language === 'id' ? 'Sisa kuota penyimpanan Anda tidak mencukupi untuk berkas ini.' : 'Not enough storage space in your quota.');
        continue;
      }
      try {
        const parsed = await parseUploadedFile(files[i], currentTotalBytes);
        newAttachments.push(parsed);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal memproses berkas';
        toast.error(message);
        console.warn('File validation/parsing error:', message);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsParsingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || isGenerating) return;

    // Grok/ChatGPT style: prompt user to sign in before sending their first prompt
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (attachments.length > 0) {
      const totalBytes = attachments.reduce((acc, a) => acc + (a.size || 0), 0);
      addUsage(totalBytes, 'docs');
    }

    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const estimatedTokens = estimateTokens(
    text + ' ' + attachments.map((a) => a.content).join(' ')
  );

  const getFileIcon = (att: FileAttachment) => {
    if (att.isImage) return <ImageIcon size={13} color="var(--brand-primary)" />;
    if (att.name.endsWith('.csv') || att.name.endsWith('.xlsx')) {
      return <FileSpreadsheet size={13} color="var(--accent-success)" />;
    }
    if (att.name.endsWith('.ts') || att.name.endsWith('.py') || att.name.endsWith('.js')) {
      return <FileCode size={13} color="var(--accent-info)" />;
    }
    return <FileText size={13} color="var(--accent-warning)" />;
  };

  return (
    <div
      className="chat-input-container"
      style={{
        padding: 'var(--space-sm) var(--page-pad-x) var(--space-xl) var(--page-pad-x)',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="chat-input-wrapper"
        style={{
          width: '100%',
          maxWidth: '860px',
          background: 'var(--bg-input)',
          border: `1px solid ${
            isListening
              ? 'var(--accent-danger)'
              : isFocused
              ? 'var(--border-strong)'
              : 'var(--border-subtle)'
          }`,
          borderRadius: 'var(--radius-xl)',
          boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 14px',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Attachment Chips Strip */}
        {attachments.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  maxWidth: '220px',
                }}
              >
                {getFileIcon(att)}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                  }}
                >
                  {att.name}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  ({formatBytes(att.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept=".pdf,.md,.txt,.docx,.xlsx,.csv,.pptx,.json,.ts,.js,.py,.html,.css,image/*"
          style={{ display: 'none' }}
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? t.chat.listeningVoice
              : t.chat.placeholder
          }
          rows={2}
          style={{
            width: '100%',
            minHeight: '44px',
            maxHeight: '154px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '22px',
            padding: '2px',
          }}
        />

        {/* Bottom Toolbar inside input (Grok Alignment & Ordering) */}
        <div
          className="chat-input-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '6px',
            gap: '8px',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {/* Left: Plus (+) Attach Button & Popup Menu */}
          <div
            ref={plusMenuRef}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              minWidth: 0,
              flex: '1 1 auto',
            }}
          >
            {/* File Upload / Plus Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen((prev) => !prev)}
              disabled={isParsingFiles}
              title="Add attachment, skills, or connectors"
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: isPlusMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                borderRadius: '50%',
                color: isPlusMenuOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={19} style={{ transform: isPlusMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Grok-Style Popup Menu */}
            {isPlusMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 10px)',
                  left: '0',
                  width: '210px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg, 14px)',
                  boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.35))',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 50,
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                {/* 1. Unggah file */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileUp size={16} color="var(--text-secondary)" />
                  <span style={{ flex: 1 }}>{t.connectors.uploadFile}</span>
                </button>

                {/* 2. Recent files */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="var(--text-secondary)" />
                    <span>{t.connectors.recentFiles}</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                {/* 3. Keterampilan */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    if (!user) {
                      openAuthModal('login');
                      return;
                    }
                    setIsModelSelectorOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutGrid size={16} color="var(--text-secondary)" />
                    <span>{t.connectors.skills}</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 4px' }} />

                {/* 5. Kelola Konektor */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsConnectorsModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-subtle, rgba(99, 102, 241, 0.12))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Plug size={16} color="var(--brand-primary)" />
                  <span style={{ color: 'var(--brand-primary)' }}>
                    {t.connectors.manageConnectors}
                  </span>
                </button>
              </div>
            )}

            {/* Quick toggle chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              {CONNECTOR_CHIPS.map((chip) => {
                if (!activeConnectorIds.includes(chip.id)) return null;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => toggleActiveConnector(chip.id)}
                    title={`${chip.label} Aktif (Klik untuk lepas sematan)`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      background: chip.bg,
                      border: `1px solid ${chip.border}`,
                      borderRadius: 'var(--radius-full, 9999px)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ConnectorBrandIcon id={chip.id} size={13} />
                    <span>{chip.label}</span>
                    <X size={11} style={{ opacity: 0.6, marginLeft: '2px' }} />
                  </button>
                );
              })}
            </div>

            {/* Token Counter (Subtle next to plus button) */}
            {(text.length > 0 || attachments.length > 0) && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginLeft: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={11} color="var(--brand-primary)" />
                ~{estimatedTokens} {t.chat.tokens}
              </span>
            )}
          </div>

          {/* Right Group (Grok Order: Model Selector -> Mic -> Send) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
            {/* 1. Model Selector Dropdown Text (Grok style) */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setIsModelSelectorOpen(true);
              }}
              title={t.models.title}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '4px 6px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                maxWidth: '160px',
                minWidth: 0,
                flexShrink: 1,
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  fontSize: '12.5px',
                  minWidth: 0,
                }}
              >
                {modelDisplayName}
              </span>
              <ChevronDown size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            </button>

            {/* 2. Speech-to-Text Mic Icon */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? t.chat.stopVoiceRecording : t.chat.speechToText}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: isListening ? 'var(--accent-danger)' : 'transparent',
                border: 'none',
                borderRadius: '50%',
                color: isListening ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                animation: isListening ? 'pulseDot 1s infinite' : 'none',
              }}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* 3. Send / Stop Button */}
            {isGenerating ? (
              <button
                onClick={stopGeneration}
                title={t.chat.stop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  background: 'var(--accent-danger)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                <Square size={13} fill="#FFFFFF" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                title={t.chat.send}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  background:
                    text.trim() || attachments.length > 0
                      ? 'var(--text-primary)'
                      : 'var(--bg-subtle)',
                  color:
                    text.trim() || attachments.length > 0
                      ? 'var(--bg-main)'
                      : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '50%',
                  boxShadow:
                    text.trim() || attachments.length > 0
                      ? 'var(--shadow-sm)'
                      : 'none',
                  cursor: text.trim() || attachments.length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowUp size={17} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {isModelSelectorOpen && (
        <ModelSelectorModal onClose={() => setIsModelSelectorOpen(false)} />
      )}

      {isConnectorsModalOpen && (
        <ConnectorsModal
          isOpen={isConnectorsModalOpen}
          onClose={() => setIsConnectorsModalOpen(false)}
        />
      )}
    </div>
  );
}
