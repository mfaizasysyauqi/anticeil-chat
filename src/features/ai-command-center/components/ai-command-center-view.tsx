import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Settings2,
  Trash2,
  Menu,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Loader2,
  Share2,
  MessageCircle,
  Plus,
  Paperclip,
  X,
  ChevronDown,
  Check,
  Calculator,
  Gamepad2,
  Palette,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyIconBadge } from '@/components/ui/empty';
import { CommunityAvatar } from '@/chat/chat-avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAYOUT_PAGE_SPACING } from '@/lib/layout-constants';
import { ANTICEIL_APPS } from '@/features/voice/data/voice-activities';
import type {
  AiMessage,
  AiSession,
  AiToolCall,
  AiSystemContext,
  AiArtifact,
  LaunchAppArgs,
  SendDirectMessageArgs,
  SendColonyChannelMessageArgs,
} from '../types';
import {
  getStoredGroqConfig,
  saveStoredSessions,
  getStoredSessions,
  saveStoredGroqConfig,
  GROQ_MODELS,
  DEFAULT_GROQ_MODEL,
} from '../services/ai-storage';
import { useTranslation } from '@/core/i18n';
import { executeGroqCommand } from '../services/groq-service';
import { GroqSettingsDialog } from './groq-settings-dialog';
import { AiCommandCenterHeader } from './ai-command-center-header';
import { AiMarkdown } from './ai-markdown';
import { ArtifactViewer } from './artifact-viewer';
import { parseArtifactsFromMessage } from '../utils/artifact-parser';
import { useAiCommandCenterContext } from '../context/ai-command-center-context';
import { useResponsive } from '@/core/hooks/use-responsive';

export interface AiCommandCenterViewProps {
  sessions?: AiSession[];
  activeSessionId?: string | null;
  onCreateNewSession?: (title?: string) => Promise<AiSession> | AiSession;
  onUpdateSessionMessages?: (sessionId: string, messages: AiMessage[]) => void;
  onClearSessionMessages?: (sessionId: string) => void;
  colonies: any[];
  channels: any[];
  members: any[];
  friends: any;
  currentUser?: any;
  onOpenSidebar?: () => void;
  horizontalPadding?: string;
  onLaunchActivity?: (appId: string, fromChat?: boolean, channelId?: string, colonyId?: string) => void;
  onLaunchStandalone?: (appId: string) => void;
  onOpenApps?: () => void;
  onSendMessageToChannel?: (channelId: string, content: string) => Promise<any> | any;
  onSendDirectMessage?: (recipientIdOrName: string, content: string) => Promise<any> | any;
  onNavigateToChannel?: (colonyId: string, channelId: string) => void;
  onNavigateToDM?: (memberId: string) => void;
  requireAuth?: (action: () => void, title?: string, desc?: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AiCommandCenterView(props: AiCommandCenterViewProps) {
  const { t } = useTranslation();
  let contextValue: any = null;
  try {
    contextValue = useAiCommandCenterContext();
  } catch {}

  const sessions = props.sessions || contextValue?.sessions || [];
  const activeSessionId = props.activeSessionId ?? contextValue?.activeSessionId ?? null;
  const onCreateNewSession = props.onCreateNewSession || contextValue?.handleCreateNewSession;
  const onUpdateSessionMessages = props.onUpdateSessionMessages || contextValue?.handleUpdateSessionMessages || (() => {});
  const onClearSessionMessages = props.onClearSessionMessages || contextValue?.handleClearSessionMessages || (() => {});

  const {
    colonies,
    channels,
    members,
    friends,
    currentUser,
    onOpenSidebar,
    horizontalPadding = LAYOUT_PAGE_SPACING.HORIZONTAL,
    onLaunchActivity,
    onOpenApps,
    onSendMessageToChannel,
    onSendDirectMessage,
    onNavigateToChannel,
    onNavigateToDM,
    requireAuth,
  } = props;
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();

  // Desktop resizable width for Artifact Panel (default null = exactly 50% / 50% ratio with chat)
  const [artifactWidth, setArtifactWidth] = useState<number | null>(() => {
    try {
      localStorage.removeItem('anticeil_ai_artifact_width'); // Clean up legacy fixed width
      const saved = localStorage.getItem('anticeil_ai_custom_artifact_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 320 && val <= 1600) return val;
      }
    } catch {}
    return null; // Default: exactly 50% / 50%
  });
  const [isResizingArtifact, setIsResizingArtifact] = useState(false);

  const handleArtifactResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (artifactWidth === null && workspaceRef.current) {
      const currentArtifactPx = Math.round(workspaceRef.current.getBoundingClientRect().width * 0.5);
      setArtifactWidth(currentArtifactPx);
    }
    setIsResizingArtifact(true);
  };

  const handleArtifactResizeReset = () => {
    setArtifactWidth(null);
    try {
      localStorage.removeItem('anticeil_ai_custom_artifact_width');
      localStorage.removeItem('anticeil_ai_artifact_width');
    } catch {}
  };

  useEffect(() => {
    if (!isResizingArtifact) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const minWidth = 320;
      const maxWidth = Math.max(rect.width - 340, minWidth);
      const newWidth = Math.min(Math.max(rect.right - e.clientX, minWidth), maxWidth);
      setArtifactWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingArtifact(false);
      setArtifactWidth((current) => {
        if (current !== null) {
          try {
            localStorage.setItem('anticeil_ai_custom_artifact_width', String(current));
          } catch {}
        }
        return current;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingArtifact]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const maxAllowed = Math.max(rect.width - 340, 320);
      setArtifactWidth((prev) => (prev !== null ? Math.min(prev, maxAllowed) : null));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Auto-resize prompt textarea: strictly 1-line when empty/hint text, multi-line up to 7 lines (156px) for actual text with vertical scrollbar beyond 7 lines
  useEffect(() => {
    const adjustTextareaHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (!inputPrompt) {
        textarea.style.height = '36px';
        textarea.style.overflowY = 'hidden';
        return;
      }

      // Reset height to auto first to accurately measure scrollHeight
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      // 7 lines at 20px (leading-5) + 16px (py-2) = 156px
      if (scrollHeight > 156) {
        textarea.style.height = '156px';
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${Math.max(36, scrollHeight)}px`;
        textarea.style.overflowY = 'hidden';
      }
    };

    adjustTextareaHeight();
    window.addEventListener('resize', adjustTextareaHeight);
    return () => window.removeEventListener('resize', adjustTextareaHeight);
  }, [inputPrompt]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const [activeArtifact, setActiveArtifact] = useState<AiArtifact | null>(null);

  // Find latest artifact in current session for quick header toggle
  const latestArtifact = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.artifacts && msg.artifacts.length > 0) {
        return msg.artifacts[msg.artifacts.length - 1];
      }
      const { artifacts } = parseArtifactsFromMessage(msg.content);
      if (artifacts.length > 0) {
        return artifacts[artifacts.length - 1];
      }
    }
    return null;
  }, [messages]);

  const groqConfig = getStoredGroqConfig();
  const [selectedModel, setSelectedModel] = useState<string>(() => groqConfig.model || DEFAULT_GROQ_MODEL);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    saveStoredGroqConfig(groqConfig.apiKey, modelId);
    const found = GROQ_MODELS.find((m) => m.id === modelId);
    toast.success(`Model aktif diubah ke ${found?.name || modelId}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} berkas ditambahkan`);
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Listen to preset prompt events from sidebar
  useEffect(() => {
    const handlePreset = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        handleSendMessage(detail);
      }
    };
    window.addEventListener('anticeil_ai_preset_prompt', handlePreset);
    return () => window.removeEventListener('anticeil_ai_preset_prompt', handlePreset);
  }, [activeSession, isLoading]);

  // Build AI system context
  const systemContext: AiSystemContext = {
    colonies: colonies.map((c) => ({ id: c.id, name: c.name })),
    channels: channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      colonyId: ch.colonyId,
      type: ch.type,
    })),
    friends: Array.isArray(friends)
      ? friends.map((f: any) => ({ id: f.id, name: f.name, username: f.username }))
      : Array.isArray(friends?.allFriends)
      ? friends.allFriends.map((f: any) => ({ id: f.id, name: f.name, username: f.username }))
      : members.map((m: any) => ({ id: m.id, name: m.name, username: m.username })),
    apps: ANTICEIL_APPS.map((a) => ({
      id: a.id,
      name: a.title || (a as any).name || a.id,
      description: a.description,
    })),
    currentUser: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name || currentUser.username,
          username: currentUser.username,
          email: currentUser.email,
        }
      : undefined,
  };

  const handleSendMessage = async (promptToSend?: string) => {
    if (!currentUser && requireAuth) {
      requireAuth(
        () => handleSendMessage(promptToSend),
        t('Pusat Komando AI'),
        t('Masuk ke Anticeil untuk berinteraksi dan mengeksekusi perintah AI.'),
      );
      return;
    }
    const rawText = (promptToSend || inputPrompt).trim();
    if ((!rawText && attachedFiles.length === 0) || isLoading) return;

    let targetSession = activeSession;
    if (!targetSession && onCreateNewSession) {
      targetSession = await onCreateNewSession(rawText.slice(0, 36) || 'Berkas Lampiran');
    }
    if (!targetSession) return;

    let textToSend = rawText;
    const filesToProcess = [...attachedFiles];
    setInputPrompt('');
    setAttachedFiles([]);

    if (filesToProcess.length > 0) {
      const fileSummaries = await Promise.all(
        filesToProcess.map(async (file) => {
          if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|js|ts|tsx|jsx|css|html|csv)$/i)) {
            try {
              const content = await file.text();
              const truncated = content.length > 2500 ? content.slice(0, 2500) + '... (terpotong)' : content;
              return `\n[File: ${file.name}]\n\`\`\`\n${truncated}\n\`\`\``;
            } catch {
              return `\n[File: ${file.name} (${formatFileSize(file.size)})]`;
            }
          }
          return `\n[File: ${file.name} (${file.type || 'berkas'}, ${formatFileSize(file.size)})]`;
        })
      );
      textToSend = `${textToSend ? textToSend + '\n' : ''}${fileSummaries.join('\n')}`;
    }

    const userMessage: AiMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const currentMsgs = targetSession.messages || [];
    const updatedMessages = [...currentMsgs, userMessage];
    onUpdateSessionMessages(targetSession.id, updatedMessages);
    setIsLoading(true);

    try {
      const currentConfig = {
        ...groqConfig,
        model: selectedModel,
      };

      const response = await executeGroqCommand({
        messages: updatedMessages,
        context: systemContext,
        config: currentConfig,
      });

      const { artifacts } = parseArtifactsFromMessage(response.replyText);

      const assistantMessage: AiMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: response.replyText,
        createdAt: new Date().toISOString(),
        toolCalls: response.toolCalls,
        artifacts,
      };

      if (artifacts.length > 0) {
        setActiveArtifact(artifacts[0]);
      }

      onUpdateSessionMessages(targetSession.id, [...updatedMessages, assistantMessage]);
    } catch (err) {
      console.error('Failed to execute AI Command Center prompt:', err);
      toast.error('Gagal memproses perintah AI.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tool Call Actions Execution
  const handleExecuteTool = async (messageId: string, toolCall: AiToolCall) => {
    if (!activeSession) return;

    if (toolCall.function.name === 'launch_application') {
      const args = toolCall.parsedArgs as LaunchAppArgs;
      if (args.appId === 'apps-view' || args.appId === 'apps') {
        if (onOpenApps) {
          onOpenApps();
        } else if (typeof window !== 'undefined') {
          window.location.hash = '#apps';
          window.dispatchEvent(new CustomEvent('anticeil_navigate_view', { detail: 'apps' }));
        }
        toast.success(t('Halaman Aplikasi & Aktivitas dibuka! 🚀'));
        updateToolCallStatus(messageId, toolCall.id, 'executed', {
          success: true,
          message: 'Halaman Aplikasi & Aktivitas berhasil dibuka.',
        });
        return;
      }

      const normalizedAppId =
        args.appId === 'jamspace-whiteboard'
          ? 'whiteboard'
          : args.appId === 'anticeil-chess'
            ? 'chess'
            : args.appId === 'share-screen'
              ? 'screenshare'
              : args.appId === 'charting'
                ? 'tradingview'
                : args.appId === 'platform' || args.appId === 'anticeil-platform' || args.appId === 'flow'
                  ? 'anticeil-flow'
                  : args.appId === 'youtube'
                    ? 'watch-together'
                    : args.appId;

      if (props.onLaunchStandalone) {
        props.onLaunchStandalone(normalizedAppId);
        toast.success(`Aplikasi ${args.appName || normalizedAppId} dibuka dalam mode standalone! 🚀`);
        updateToolCallStatus(messageId, toolCall.id, 'executed', {
          success: true,
          message: `Aplikasi ${args.appName || normalizedAppId} berhasil dibuka dalam mode standalone.`,
        });
      } else if (onLaunchActivity) {
        onLaunchActivity(normalizedAppId, false);
        toast.success(`Aplikasi ${args.appName || normalizedAppId} diluncurkan! 🚀`);
        updateToolCallStatus(messageId, toolCall.id, 'executed', {
          success: true,
          message: `Aplikasi ${args.appName || normalizedAppId} berhasil dibuka di workspace.`,
        });
      }
    } else if (toolCall.function.name === 'send_colony_channel_message') {
      const args = toolCall.parsedArgs as SendColonyChannelMessageArgs;
      // Match colony and channel
      const targetColony = colonies.find(
        (c) =>
          c.name.toLowerCase().includes(args.colonyName.toLowerCase()) ||
          args.colonyName.toLowerCase().includes(c.name.toLowerCase()),
      );
      const targetChannel = channels.find(
        (ch) =>
          ch.name.toLowerCase().includes(args.channelName.toLowerCase()) ||
          args.channelName.toLowerCase().includes(ch.name.toLowerCase()),
      );

      const channelId = targetChannel?.id || 'general';
      try {
        if (onSendMessageToChannel) {
          await onSendMessageToChannel(channelId, args.content);
        }
        toast.success(`Pesan berhasil dikirim ke #${args.channelName}!`);
        updateToolCallStatus(messageId, toolCall.id, 'executed', {
          success: true,
          message: `Terkirim ke #${args.channelName} di ${targetColony?.name || args.colonyName}.`,
          targetId: channelId,
        });
      } catch (e) {
        toast.error('Gagal mengirim pesan ke saluran.');
      }
    } else if (toolCall.function.name === 'send_direct_message') {
      const args = toolCall.parsedArgs as SendDirectMessageArgs;
      try {
        if (onSendDirectMessage) {
          await onSendDirectMessage(args.recipient, args.content);
        }
        toast.success(`Pesan langsung berhasil dikirim ke ${args.recipient}!`);
        updateToolCallStatus(messageId, toolCall.id, 'executed', {
          success: true,
          message: `Pesan langsung terkirim ke ${args.recipient}.`,
        });
      } catch (e) {
        toast.error('Gagal mengirim pesan langsung.');
      }
    }
  };

  const updateToolCallStatus = (
    messageId: string,
    toolCallId: string,
    status: 'executed' | 'cancelled',
    result?: any,
  ) => {
    if (!activeSession) return;
    const updated = activeSession.messages.map((m) => {
      if (m.id !== messageId || !m.toolCalls) return m;
      return {
        ...m,
        toolCalls: m.toolCalls.map((tc) =>
          tc.id === toolCallId ? { ...tc, status, result } : tc,
        ),
      };
    });
    onUpdateSessionMessages(activeSession.id, updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 w-full bg-background relative overflow-hidden select-none">
      {/* 1. App Bar Header */}
      <AiCommandCenterHeader
        onOpenSidebar={onOpenSidebar}
        horizontalPadding={horizontalPadding}
        onClearSessionMessages={activeSession ? () => onClearSessionMessages(activeSession.id) : undefined}
        hasMessages={messages.length > 0}
        hasActiveArtifact={Boolean(activeArtifact || latestArtifact)}
        onToggleArtifactPanel={() => setActiveArtifact((prev) => (prev ? null : latestArtifact))}
      />

      {/* Main Workspace Area (Split view when activeArtifact is open) */}
      <div ref={workspaceRef} className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        {/* Left: Chat Feed & Command Input */}
        <div
          className={cn(
            'flex flex-col min-h-0 min-w-0 bg-background overflow-hidden',
            !isResizingArtifact && 'transition-all duration-150',
            activeArtifact
              ? 'hidden md:flex border-r border-border/80'
              : 'flex-1 w-full',
            activeArtifact && (artifactWidth ? 'flex-1' : 'md:basis-1/2 md:w-1/2 md:flex-1')
          )}
        >
          {/* 2. Messages & Capability Hero Feed (100% Symmetrical with App Bar via LAYOUT_PAGE_SPACING) */}
          <div
            className={cn(
              'flex-1 min-h-0 overflow-y-auto max-lg:scrollbar-none custom-scrollbar py-4 space-y-4 w-full',
              horizontalPadding || LAYOUT_PAGE_SPACING.BODY_HORIZONTAL,
            )}
          >
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-6">
                <div className="flex justify-center">
                  <EmptyIconBadge size="default">
                    <Sparkles className="stroke-[1.8]" />
                  </EmptyIconBadge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Pusat Komando Cerdas Anticeil
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Kendalikan seluruh ekosistem Anticeil dalam hitungan milidetik dengan bahasa alami.
                    Luncurkan aplikasi mandiri, buat Artifact interaktif (game, kalkulator, UI), atau kirim pesan langsung.
                  </p>
                </div>

                {/* Quick Action Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Buatkan kalkulator modern')}
                    className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                      <Calculator className="w-4 h-4 text-primary shrink-0" />
                      <span>Buat Kalkulator (Artifact)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      Menghasilkan aplikasi kalkulator web interaktif di panel Artifacts.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('Buatkan mini game retro')}
                    className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                      <Gamepad2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Buat Mini Game (Artifact)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      Membuat game arcade canvas yang bisa langsung dimainkan.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('Buka Jamspace Whiteboard')}
                    className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                      <Palette className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Buka Jamspace Whiteboard</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      Membuka canvas kolaboratif standalone untuk diagram & sketsa.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('Buka YouTube Watch Together')}
                    className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                      <Video className="w-4 h-4 text-red-500 shrink-0" />
                      <span>YouTube Watch Together</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      Nonton video bersama dengan kontrol sinkronisasi realtime.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%] ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={cn(
                          'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-xs whitespace-pre-wrap'
                            : 'bg-card border border-border/60 text-foreground rounded-tl-xs shadow-xs',
                        )}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <AiMarkdown
                            content={msg.content}
                            artifacts={msg.artifacts}
                            onOpenArtifact={(art) => setActiveArtifact(art)}
                            activeArtifactId={activeArtifact?.id}
                          />
                        )}
                      </div>

                  {/* Interactive Tool Calling Execution Cards */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="w-full space-y-2 mt-1">
                      {msg.toolCalls.map((tc) => (
                        <ToolExecutionCard
                          key={tc.id}
                          toolCall={tc}
                          onExecute={() => handleExecuteTool(msg.id, tc)}
                          onCancel={() => updateToolCallStatus(msg.id, tc.id, 'cancelled')}
                        />
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <CommunityAvatar
                    name={currentUser?.name || 'User'}
                    imageUrl={currentUser?.imageUrl}
                    size={32}
                    className="shrink-0 mt-0.5"
                  />
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-muted-foreground text-xs py-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex items-center gap-1.5 bg-card px-3 py-2 rounded-xl border border-border/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Memproses perintah dengan Groq LPU...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Command Input Dock (Full width, Gemini-style prompt form with file upload + model selector) */}
      <div
        className={cn(
          'sticky bottom-0 z-20 shrink-0 pb-2 sm:pb-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 bg-background flex flex-col w-full',
          horizontalPadding || LAYOUT_PAGE_SPACING.HORIZONTAL,
        )}
      >
        <div className="w-full flex flex-col gap-1.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex flex-col justify-center min-h-[52px] max-h-[50vh] rounded-[12px] bg-muted/70 dark:bg-card border border-border hover:border-foreground/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-3 py-1.5 transition-all shadow-xs w-full"
          >
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Attached file chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1.5 pb-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/80 border border-border/80 rounded-lg text-xs text-foreground animate-in fade-in duration-150"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="max-w-[140px] truncate font-medium">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">({formatFileSize(file.size)})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded-full hover:bg-background cursor-pointer"
                      title="Hapus file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Row: [+] Prefix -> Textarea -> [Model Selector Dropdown] -> [Send Button] */}
            <div className="flex items-end gap-1.5 w-full">
              {/* + Prefix button for file upload */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!currentUser && requireAuth) {
                    requireAuth(
                      () => fileInputRef.current?.click(),
                      t('Unggah Dokumen'),
                      t('Masuk ke Anticeil untuk menganalisis file dan dokumen.'),
                    );
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-full cursor-pointer shrink-0 mb-0.5"
                title="Unggah berkas / file"
                aria-label="Unggah berkas"
              >
                <Plus className="w-4 h-4" />
              </Button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ketik perintah (contoh: 'buka whiteboard', 'kirim pesan ke #general colony as: halo')..."
                className={cn(
                  "flex-1 resize-none border-0 bg-transparent py-2 px-2 text-xs leading-5 focus:outline-hidden placeholder:text-muted-foreground/60 transition-colors custom-scrollbar",
                  !inputPrompt
                    ? "h-[36px] min-h-[36px] max-h-[36px] overflow-hidden whitespace-nowrap text-ellipsis placeholder:truncate placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis"
                    : "min-h-[36px] max-h-[156px] whitespace-pre-wrap break-words"
                )}
                rows={1}
              />

              {/* Right Controls: Model Selector + Send Button */}
              <div className="flex items-center gap-1.5 shrink-0 pr-0.5 mb-0.5">
                {/* Gemini-style Model Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-full border border-border/60 transition-colors cursor-pointer select-none"
                      title="Ganti Model AI"
                    >
                      <span className="max-w-[70px] sm:max-w-[150px] truncate text-[11px] sm:text-xs">
                        {GROQ_MODELS.find((m) => m.id === selectedModel)?.name.replace(' Versatile', '').replace(' Instant', '') || selectedModel}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-64 p-1.5">
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                      Pilih Mesin AI (Groq LPU)
                    </DropdownMenuLabel>
                    {GROQ_MODELS.map((model) => {
                      const isSelected = model.id === selectedModel;
                      return (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => handleSelectModel(model.id)}
                          className="flex items-start gap-2 p-2 rounded-lg cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-xs font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                                {model.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                              {model.desc}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={() => setIsSettingsOpen(true)}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Settings2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Pengaturan Kunci API...</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Send Button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!inputPrompt.trim() && attachedFiles.length === 0) || isLoading}
                  className="h-8 w-8 bg-primary text-primary-foreground hover:opacity-90 rounded-full cursor-pointer shrink-0 disabled:opacity-40 shadow-xs"
                  title="Kirim Perintah"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Right: LibreChat-style Artifact Viewer Panel */}
    {activeArtifact && (
      <div
        className={cn(
          'relative flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#111214] border-l border-border/80 animate-in slide-in-from-right-4 duration-200',
          'w-full',
          artifactWidth ? 'md:w-auto shrink-0' : 'md:basis-1/2 md:w-1/2 md:flex-1',
          !isResizingArtifact && 'transition-all duration-150'
        )}
        style={!isMobile && artifactWidth ? { width: `${artifactWidth}px`, flex: 'none' } : undefined}
      >
        {/* Desktop Resize Handle on Left Border of Artifact Panel */}
        <div
          role="separator"
          aria-orientation="vertical"
          title="Tarik untuk mengubah ukuran artifact (Double-klik untuk reset ke 50/50)"
          onMouseDown={handleArtifactResizeStart}
          onDoubleClick={handleArtifactResizeReset}
          className="hidden md:flex absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-30 items-center justify-center select-none group"
        >
          <div
            className={cn(
              'w-1 h-8 rounded-full transition-colors',
              isResizingArtifact
                ? 'bg-primary'
                : 'bg-border/60 group-hover:bg-primary/80 group-hover:h-12'
            )}
          />
        </div>

        <ArtifactViewer
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
        />
      </div>
    )}

    {/* Fullscreen drag overlay while resizing to prevent iframes from trapping mouse events */}
    {isResizingArtifact && (
      <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
    )}
  </div>

  {/* Groq Settings Dialog */}
  <GroqSettingsDialog
    isOpen={isSettingsOpen}
    onClose={() => setIsSettingsOpen(false)}
  />
</div>
  );
}

/**
 * Interactive Tool Calling Card
 */
function ToolExecutionCard({
  toolCall,
  onExecute,
  onCancel,
}: {
  toolCall: AiToolCall;
  onExecute: () => void;
  onCancel: () => void;
}) {
  const isExecuted = toolCall.status === 'executed';
  const isCancelled = toolCall.status === 'cancelled';

  if (toolCall.function.name === 'launch_application') {
    const args = toolCall.parsedArgs as LaunchAppArgs;
    return (
      <div className="p-3 rounded-xl bg-card border border-primary/30 flex flex-col gap-2.5 shadow-sm text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">
                {args.appId === 'apps-view' || args.appId === 'apps'
                  ? 'Buka: Aplikasi & Aktivitas'
                  : `Luncurkan Aplikasi: ${args.appName || args.appId}`}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {args.appId === 'apps-view' || args.appId === 'apps'
                  ? 'Katalog & eksplorasi aplikasi resmi Anticeil'
                  : 'Mode: Standalone Workspace (Layar Penuh Mandiri)'}
              </span>
            </div>
          </div>

          {isExecuted && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Diluncurkan
            </span>
          )}
        </div>

        {!isExecuted && !isCancelled && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Button
              size="sm"
              onClick={onExecute}
              className="text-xs h-7 bg-primary text-primary-foreground font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" /> Buka Aplikasi Sekarang
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
            >
              Batalkan
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (toolCall.function.name === 'send_colony_channel_message') {
    const args = toolCall.parsedArgs as SendColonyChannelMessageArgs;
    return (
      <div className="p-3 rounded-xl bg-card border border-border flex flex-col gap-2 shadow-sm text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <div>
              <span className="text-xs font-bold text-foreground">
                Kirim Pesan ke Saluran #{args.channelName}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Colony: {args.colonyName}
              </span>
            </div>
          </div>

          {isExecuted && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terkirim
            </span>
          )}
        </div>

        <div className="p-2 rounded bg-background border border-border/40 text-xs font-mono text-foreground/90">
          "{args.content}"
        </div>

        {!isExecuted && !isCancelled && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Button
              size="sm"
              onClick={onExecute}
              className="text-xs h-7 bg-primary text-primary-foreground font-semibold gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" /> Kirim ke #{args.channelName} Sekarang
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
            >
              Batalkan
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (toolCall.function.name === 'send_direct_message') {
    const args = toolCall.parsedArgs as SendDirectMessageArgs;
    return (
      <div className="p-3 rounded-xl bg-card border border-border flex flex-col gap-2 shadow-sm text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">✉️</span>
            <div>
              <span className="text-xs font-bold text-foreground">
                Kirim Pesan Langsung (DM)
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Penerima: {args.recipient}
              </span>
            </div>
          </div>

          {isExecuted && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terkirim
            </span>
          )}
        </div>

        <div className="p-2 rounded bg-background border border-border/40 text-xs font-mono text-foreground/90">
          "{args.content}"
        </div>

        {!isExecuted && !isCancelled && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Button
              size="sm"
              onClick={onExecute}
              className="text-xs h-7 bg-primary text-primary-foreground font-semibold gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" /> Kirim DM Sekarang
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
            >
              Batalkan
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
