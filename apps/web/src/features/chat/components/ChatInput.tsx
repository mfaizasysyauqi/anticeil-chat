'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  AtSign,
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
  const providerModels = useMemo(() => getModelsForProvider(currentProviderId), [getModelsForProvider, currentProviderId]);
  const matchedModel = useMemo(() => {
    return providerModels.find((m) => m.id === currentModelId) || getModelById(currentModelId);
  }, [providerModels, currentModelId]);
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
        padding: 'var(--space-xs) var(--page-pad-x) var(--space-lg) var(--page-pad-x)',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Cline-Style Main Input Card */}
        <div
          className="chat-input-wrapper"
          style={{
            width: '100%',
            background: 'var(--bg-input, #18181b)',
            border: `1px solid ${
              isListening
                ? 'var(--accent-danger)'
                : isFocused
                ? 'var(--border-strong)'
                : 'var(--border-subtle)'
            }`,
            borderRadius: '12px',
            boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px 8px 14px',
            position: 'relative',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
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
                : (language === 'id' ? 'Ketik pesan...' : 'Type a message...')
            }
            rows={2}
            style={{
              width: '100%',
              minHeight: '46px',
              maxHeight: '180px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              lineHeight: '21px',
              padding: '0',
            }}
          />

          {/* Bottom Row Inside Card: Cline Subtext Hint & Send/Stop Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              gap: '8px',
            }}
          >
            {/* Cline-style subtext helper */}
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                opacity: 0.75,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {language === 'id'
                ? 'Ketik @ untuk konteks, / untuk perintah, tahan Shift untuk seret berkas'
                : 'Type @ for context, / for slash commands, hold Shift to drag in files'}
            </span>

            {/* Send / Stop Icon Button inside bottom-right corner */}
            {isGenerating ? (
              <button
                type="button"
                onClick={stopGeneration}
                title={t.chat.stop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  background: 'var(--accent-danger, #ef4444)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Square size={12} fill="#FFFFFF" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                title={t.chat.send}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  background: 'transparent',
                  color:
                    text.trim() || attachments.length > 0
                      ? 'var(--brand-primary, #3b82f6)'
                      : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: text.trim() || attachments.length > 0 ? 'pointer' : 'default',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  opacity: text.trim() || attachments.length > 0 ? 1 : 0.45,
                }}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Cline-Style Dedicated Bottom Toolbar (Outside Input Card) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 4px',
            gap: '8px',
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Controls: @, +, Connectors, Model Badge, Token Counter */}
          <div
            ref={plusMenuRef}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            {/* 1. Mention Context (@) Button */}
            <button
              type="button"
              onClick={() => {
                setText((prev) => (prev ? `${prev} @` : '@'));
                textareaRef.current?.focus();
              }}
              title="Mention context / file (@)"
              style={{
                width: '24px',
                height: '24px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <AtSign size={14} />
            </button>

            {/* 2. Plus (+) Attach Button & Popup Menu */}
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen((prev) => !prev)}
              disabled={isParsingFiles}
              title="Add attachment, skills, or connectors (+)"
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isPlusMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: isPlusMenuOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                if (!isPlusMenuOpen) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Plus size={14} style={{ transform: isPlusMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Grok/Cline-Style Popup Menu */}
            {isPlusMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '0',
                  width: '210px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg, 12px)',
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
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FileUp size={15} color="var(--text-secondary)" />
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
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={15} color="var(--text-secondary)" />
                    <span>{t.connectors.recentFiles}</span>
                  </div>
                  <ChevronRight size={13} color="var(--text-muted)" />
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
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutGrid size={15} color="var(--text-secondary)" />
                    <span>{t.connectors.skills}</span>
                  </div>
                  <ChevronRight size={13} color="var(--text-muted)" />
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 4px' }} />

                {/* 4. Kelola Konektor */}
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
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--brand-primary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-subtle, rgba(99, 102, 241, 0.12))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Plug size={15} color="var(--brand-primary)" />
                  <span>{t.connectors.manageConnectors}</span>
                </button>
              </div>
            )}

            {/* Quick toggle connector chips */}
            {CONNECTOR_CHIPS.map((chip) => {
              if (!activeConnectorIds.includes(chip.id)) return null;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleActiveConnector(chip.id)}
                  title={`${chip.label} Aktif (Klik untuk lepas)`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    background: chip.bg,
                    border: `1px solid ${chip.border}`,
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ConnectorBrandIcon id={chip.id} size={12} />
                  <span>{chip.label}</span>
                  <X size={10} style={{ opacity: 0.6, marginLeft: '1px' }} />
                </button>
              );
            })}

            {/* 3. Cline-Style Model Selector Badge */}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                maxWidth: '260px',
                minWidth: 0,
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '12px',
                  minWidth: 0,
                }}
              >
                {currentProviderId === 'anticeil' ? 'Anticeil Pass' : currentProviderId}:{' '}
                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {modelDisplayName.replace(/ \((Anticeil Pass|Anticeil Free)\)/, '')}
                </strong>
              </span>
              <ChevronDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </button>

            {/* Token Counter */}
            {(text.length > 0 || attachments.length > 0) && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginLeft: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={11} color="var(--brand-primary)" />
                ~{estimatedTokens} {t.chat.tokens}
              </span>
            )}
          </div>

          {/* Right Controls: Voice Mic & Mode Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
            {/* Speech-to-Text Mic Icon */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? t.chat.stopVoiceRecording : t.chat.speechToText}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                background: isListening ? 'var(--accent-danger)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: isListening ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                animation: isListening ? 'pulseDot 1s infinite' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isListening) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isListening) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            {/* Cline-Style Mode Pill (Plan | Act) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--bg-subtle, rgba(255,255,255,0.06))',
                border: '1px solid var(--border-subtle)',
                borderRadius: '5px',
                padding: '2px',
                gap: '1px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '3px',
                  color: 'var(--text-muted)',
                  cursor: 'default',
                }}
              >
                Plan
              </span>
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '3px',
                  background: 'var(--brand-primary, #3b82f6)',
                  color: '#FFFFFF',
                  cursor: 'default',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                Act
              </span>
            </div>
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
