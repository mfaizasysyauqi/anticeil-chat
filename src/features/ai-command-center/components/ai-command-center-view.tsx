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
  Radio,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ANTICEIL_APPS } from '@/features/voice/data/voice-activities';
import type {
  AiMessage,
  AiSession,
  AiToolCall,
  AiSystemContext,
  LaunchAppArgs,
  SendDirectMessageArgs,
  SendColonyChannelMessageArgs,
} from '../types';
import {
  getStoredGroqConfig,
  saveStoredSessions,
  getStoredSessions,
} from '../services/ai-storage';
import { executeGroqCommand } from '../services/groq-service';
import { GroqSettingsDialog } from './groq-settings-dialog';
import { useAiCommandCenterContext } from '../context/ai-command-center-context';

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
  onLaunchActivity?: (appId: string, fromChat?: boolean, channelId?: string, colonyId?: string) => void;
  onSendMessageToChannel?: (channelId: string, content: string) => Promise<any> | any;
  onSendDirectMessage?: (recipientIdOrName: string, content: string) => Promise<any> | any;
  onNavigateToChannel?: (colonyId: string, channelId: string) => void;
  onNavigateToDM?: (memberId: string) => void;
}

export function AiCommandCenterView(props: AiCommandCenterViewProps) {
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
    onLaunchActivity,
    onSendMessageToChannel,
    onSendDirectMessage,
    onNavigateToChannel,
    onNavigateToDM,
  } = props;
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const groqConfig = getStoredGroqConfig();

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
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    let targetSession = activeSession;
    if (!targetSession && onCreateNewSession) {
      targetSession = await onCreateNewSession(text.slice(0, 36));
    }
    if (!targetSession) return;

    setInputPrompt('');
    const userMessage: AiMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const currentMsgs = targetSession.messages || [];
    const updatedMessages = [...currentMsgs, userMessage];
    onUpdateSessionMessages(targetSession.id, updatedMessages);
    setIsLoading(true);

    try {
      const response = await executeGroqCommand({
        messages: updatedMessages,
        context: systemContext,
        config: groqConfig,
      });

      const assistantMessage: AiMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: response.replyText,
        createdAt: new Date().toISOString(),
        toolCalls: response.toolCalls,
      };

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
      if (onLaunchActivity) {
        onLaunchActivity(args.appId, false);
        toast.success(`Aplikasi ${args.appName || args.appId} diluncurkan!`);
        updateToolCallStatus(messageId, toolCall.id, 'executed', {
          success: true,
          message: `Aplikasi ${args.appName || args.appId} berhasil dibuka di workspace.`,
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
      <div className="h-12 border-b border-sidebar-border px-3.5 sm:px-4 md:px-5 lg:px-6 flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              title="Buka Navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground truncate">
                AI Command Center
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                Groq LPU Engine
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Active Model Pill */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-card border border-border/40 transition-colors flex items-center gap-1 cursor-pointer"
            title="Ubah Model / API Key"
          >
            <span className="max-w-[120px] truncate">{groqConfig.model}</span>
          </button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md"
            title="Pengaturan Mesin AI (Groq)"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          {/* Clear Session Chat */}
          {activeSession && messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClearSessionMessages(activeSession.id)}
              className="h-8 w-8 text-muted-foreground hover:text-red-400 rounded-md"
              title="Bersihkan Percakapan Sesi Ini"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 2. Messages & Capability Hero Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-4 md:px-5 lg:px-6 py-4 space-y-4 [scrollbar-width:thin]">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-6">
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-500/20 border border-primary/30 flex items-center justify-center text-primary shadow-xl">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Pusat Komando Cerdas Anticeil
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Kendalikan seluruh ekosistem Anticeil dalam hitungan milidetik dengan bahasa alami.
                Luncurkan aplikasi mandiri, kirim pengumuman ke saluran colony, atau balas pesan langsung tanpa repot.
              </p>
            </div>

            {/* Quick Action Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
              <button
                type="button"
                onClick={() => handleSendMessage('Buka Jamspace Whiteboard')}
                className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                  <span>🎨</span>
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
                  <span>🎬</span>
                  <span>YouTube Watch Together</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  Nonton video bersama dengan kontrol sinkronisasi realtime.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Kirim pesan ke channel general: Halo rekan-rekan semuanya!')}
                className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                  <span>📢</span>
                  <span>Kirim Pesan ke Channel</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  Kirim update cepat ke saluran colony tanpa berpindah halaman.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Kirim DM ke teman: Aku lagi online nih!')}
                className="p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs group-hover:text-primary transition-colors">
                  <span>✉️</span>
                  <span>Balas / Kirim Pesan Langsung</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  Kirim pesan personal ke teman dengan konfirmasi interaktif.
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
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
                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-xs'
                        : 'bg-card border border-border/60 text-foreground rounded-tl-xs shadow-xs whitespace-pre-wrap',
                    )}
                  >
                    {msg.content}
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

      {/* 3. Command Input Dock */}
      <div className="p-3 sm:p-4 border-t border-sidebar-border bg-background/95 backdrop-blur-xs shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center rounded-xl bg-card border border-border/80 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/80 transition-all shadow-xs"
          >
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ketik perintah (contoh: 'buka whiteboard', 'kirim pesan ke #general colony as: halo')..."
              className="min-h-[44px] max-h-32 w-full resize-none border-0 bg-transparent py-3 pl-3.5 pr-12 text-xs focus:outline-hidden placeholder:text-muted-foreground/60"
              rows={1}
            />

            <Button
              type="submit"
              size="icon"
              disabled={!inputPrompt.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary text-primary-foreground hover:opacity-90 rounded-lg cursor-pointer shrink-0 disabled:opacity-40"
              title="Kirim Perintah"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <span>⚡</span>
              <span>Didukung oleh inferensi Groq LPU Ultra-Fast</span>
            </span>
            <span className="hidden sm:inline">Tekan Enter untuk kirim, Shift+Enter untuk baris baru</span>
          </div>
        </div>
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
                Luncurkan Aplikasi: {args.appName || args.appId}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Mode: Standalone Workspace (Layar Penuh Mandiri)
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
