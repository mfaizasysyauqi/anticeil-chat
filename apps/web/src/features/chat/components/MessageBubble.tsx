'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Copy,
  Check,
  Sparkles,
  Coins,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Film,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ChatMessage, formatCostUsd, FileAttachment, formatBytes, getTranslation } from '@anticeil/core';
import { ThinkingTimeline } from './ThinkingTimeline';
import { MarkdownRenderer } from '../../../shared/components/MarkdownRenderer';
import { ToolResultCard } from '../../connectors/components/ToolResultCard';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

interface MessageBubbleProps {
  message: ChatMessage;
  sessionId: string;
}

export const MessageBubble = React.memo(function MessageBubble({ message, sessionId }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const editMessage = useChatStore((s) => s.editMessage);
  const navigateMessageVersion = useChatStore((s) => s.navigateMessageVersion);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);


  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditText(message.content);
    setIsEditing(true);
    setTimeout(() => {
      editTextareaRef.current?.focus();
      const len = editTextareaRef.current?.value.length ?? 0;
      editTextareaRef.current?.setSelectionRange(len, len);
    }, 50);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleSaveEdit = () => {
    if (!editText.trim() || editText.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    editMessage(sessionId, message.id, editText.trim());
    setIsEditing(false);
  };

  // Version navigation
  const versions = message.versions || [message.content];
  const versionIndex = message.versionIndex ?? 0;
  const hasVersions = versions.length > 1;

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text to speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getFileIcon = (att: FileAttachment) => {
    if (att.isImage) return <ImageIcon size={14} color="var(--brand-primary)" />;
    if (att.name.endsWith('.csv') || att.name.endsWith('.xlsx')) {
      return <FileSpreadsheet size={14} color="var(--accent-success)" />;
    }
    if (att.name.endsWith('.ts') || att.name.endsWith('.py') || att.name.endsWith('.js')) {
      return <FileCode size={14} color="var(--accent-info)" />;
    }
    return <FileText size={14} color="var(--accent-warning)" />;
  };

  // Detect direct video URLs from message content if videoUrl is not explicitly set
  const detectedVideoUrl =
    message.videoUrl ||
    message.content.match(/https?:\/\/[^\s<>"']+\.(?:mp4|webm|mov|mkv)(?:\?[^\s<>"']*)?/i)?.[0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '4px',
        width: '100%',
      }}
    >
      {/* Sender Header for Assistant */}
      {!isUser && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Bot size={12} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t.chat.assistant}
            </span>
          </div>

          {/* Assistant header: token + cost inline badges only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {message.tokensUsed && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                <Sparkles size={11} color="var(--brand-primary)" />
                {message.tokensUsed.total} {t.chat.tokensSuffix}
              </span>
            )}
            {message.estimatedCostUsd !== undefined && message.estimatedCostUsd > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                <Coins size={11} color="var(--accent-warning)" />
                {formatCostUsd(message.estimatedCostUsd)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grok-style Thinking & Step-Chain Timeline */}
      {!isUser && (
        <ThinkingTimeline
          reasoningContent={message.reasoningContent}
          isStreaming={message.status === 'streaming' && !message.content}
        />
      )}

      {/* Main Message Bubble */}
      <div
        style={{
          maxWidth: isUser ? '85%' : '100%',
          width: isUser ? 'auto' : '100%',
          borderRadius: isUser ? 'var(--radius-xl)' : '0',
          padding: isUser ? '10px 16px' : '2px 0',
          background: isUser ? 'var(--bg-user-bubble)' : 'transparent',
          border: isUser ? '1px solid var(--border-subtle)' : 'none',
          boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
        }}
        onMouseEnter={() => isUser && setIsHovered(true)}
        onMouseLeave={() => isUser && setIsHovered(false)}
      >
        {/* Edit button: appears on hover for user messages */}
        {isUser && !isEditing && isHovered && !isGenerating && (
          <button
            type="button"
            onClick={handleStartEdit}
            title={t.chat.editMessage}
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 2,
              transition: 'color 0.15s',
            }}
          >
            <Pencil size={11} />
          </button>
        )}
        {/* Attached Documents Preview (for User messages) */}
        {message.attachments && message.attachments.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            {message.attachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isUser ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  maxWidth: '260px',
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
              </div>
            ))}
          </div>
        )}

        {/* Message Content */}
        {isUser ? (
          isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                ref={editTextareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-focus)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: 1.55,
                  padding: '8px 10px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{
                    background: 'var(--brand-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {t.common.saveAndSubmit}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.55,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </div>
          )
        ) : (
          <div style={{ animation: 'fade-in 250ms ease-out both' }}>
            {message.toolResults && message.toolResults.length > 0 && (
              <div className="mb-3 space-y-2">
                {message.toolResults.map((result) => (
                  <ToolResultCard key={result.toolCallId} result={result} />
                ))}
              </div>
            )}
            <MarkdownRenderer content={message.content} />
          </div>
        )}
      </div>

      {/* Version navigator (for user messages with multiple versions) */}
      {isUser && hasVersions && !isEditing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            alignSelf: 'flex-end',
            marginTop: '2px',
            animation: 'fade-in 200ms ease-out both',
          }}
        >
          <button
            type="button"
            onClick={() => navigateMessageVersion(sessionId, message.id, 'prev')}
            disabled={versionIndex <= 0}
            title={t.chat.prevVersion}
            style={{
              background: 'transparent',
              border: 'none',
              color: versionIndex <= 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: versionIndex <= 0 ? 'not-allowed' : 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, userSelect: 'none' }}>
            {versionIndex + 1} / {versions.length}
          </span>
          <button
            type="button"
            onClick={() => navigateMessageVersion(sessionId, message.id, 'next')}
            disabled={versionIndex >= versions.length - 1}
            title={t.chat.nextVersion}
            style={{
              background: 'transparent',
              border: 'none',
              color: versionIndex >= versions.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: versionIndex >= versions.length - 1 ? 'not-allowed' : 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Typing Dot when streaming without content */}
      {!isUser && message.status === 'streaming' && !message.content && !message.reasoningContent ? (
        <div style={{ display: 'flex', gap: '4px', padding: '6px 0' }}>
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      ) : null}

      {/* Interactive AI Generated Video Player */}
      {detectedVideoUrl && (
        <InteractiveVideoPlayer videoUrl={detectedVideoUrl} />
      )}

      {/* Interactive AI Generated Image Output */}
      {message.imageUrl && (
        <InteractiveImageViewer imageUrl={message.imageUrl} />
      )}

      {/* 21st.dev Style Action Toolbar & Follow-Ups for Assistant Messages */}
      {!isUser && message.content && message.status !== 'streaming' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '4px',
            width: '100%',
            animation: 'fade-in 300ms ease-out both',
          }}
        >
          {/* Quick Action Icons Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              title={t.chat.copyResponse}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: copied ? 'var(--accent-success)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>

            {/* Thumbs Up */}
            <button
              type="button"
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              title={t.chat.goodResponse}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: feedback === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-subtle)',
                border: feedback === 'up' ? '1px solid var(--accent-success)' : '1px solid var(--border-subtle)',
                color: feedback === 'up' ? 'var(--accent-success)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ThumbsUp size={12} />
            </button>

            {/* Thumbs Down */}
            <button
              type="button"
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              title={t.chat.badResponse}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: feedback === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                border: feedback === 'down' ? '1px solid var(--accent-danger)' : '1px solid var(--border-subtle)',
                color: feedback === 'down' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ThumbsDown size={12} />
            </button>

            {/* Listen / TTS Button */}
            <button
              type="button"
              onClick={toggleSpeech}
              title={isSpeaking ? t.chat.stopListen : t.chat.listen}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: isSpeaking ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                border: isSpeaking ? '1px solid var(--accent-danger)' : '1px solid var(--border-subtle)',
                color: isSpeaking ? 'var(--accent-danger)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
              <span>{isSpeaking ? t.chat.stopListen : t.chat.listen}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Interactive Video Player component with Play/Pause, Mute/Unmute, and Download Video controls.
 */
function InteractiveVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_generated_video_${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <div
      style={{
        marginTop: '10px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        maxWidth: '560px',
        width: '100%',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Video Display Container */}
      <div style={{ position: 'relative', background: '#000000', cursor: 'pointer' }} onClick={togglePlay}>
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          loop
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '380px',
            display: 'block',
            objectFit: 'contain',
          }}
        />

        {/* Central Play/Pause Overlay Indicator */}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.65)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Play size={24} fill="#FFFFFF" style={{ marginLeft: '3px' }} />
          </div>
        )}
      </div>

      {/* Video Action Toolbar */}
      <div
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Play / Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Mute / Unmute button */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: isMuted ? 'var(--accent-warning)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '4px',
            }}
          >
            <Film size={11} color="var(--brand-primary)" />
            AI Video
          </span>
        </div>

        {/* Right side: Open tab & Download Video */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            style={{
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              padding: '4px',
            }}
          >
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={handleDownload}
            title="Download AI video"
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 10px',
              color: '#FB923C',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>Download Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Image Viewer component with Expand & Download Image controls.
 */
function InteractiveImageViewer({ imageUrl }: { imageUrl: string }) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_generated_image_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div
      style={{
        marginTop: '10px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        maxWidth: '512px',
        width: '100%',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <img
        src={imageUrl}
        alt="AI Generated Artwork"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      />
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          1024 × 1024 • AI Generated Image
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open full resolution"
            style={{
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              padding: '4px',
            }}
          >
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={handleDownload}
            title="Download image"
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 10px',
              color: '#FBBF24',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>Download Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
