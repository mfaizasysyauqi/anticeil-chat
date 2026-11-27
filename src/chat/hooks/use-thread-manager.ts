import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { colonyApi } from '../chat-api';
import type {
  ColonyChannel,
  ColonyThread,
  ColonyMessage,
} from '@/chat/chat-types';

export interface UseThreadManagerOptions {
  activeChannel: ColonyChannel | null;
  activeChannelId?: string;
  currentUser: any;
  t: (key: string) => string;
}

export function useThreadManager({
  activeChannel,
  activeChannelId,
  currentUser,
  t,
}: UseThreadManagerOptions) {
  // ── Discord Threads ───────────────────────────────────
  const [isThreadsPopoverOpen, setIsThreadsPopoverOpen] = useState(false);
  const [channelThreads, setChannelThreads] = useState<ColonyThread[]>([]);
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [isCreateThreadModalOpen, setIsCreateThreadModalOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadInitialMsg, setNewThreadInitialMsg] = useState('');
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [activeThread, setActiveThread] = useState<ColonyThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ColonyMessage[]>([]);
  const [threadInputText, setThreadInputText] = useState('');
  const [isThreadDrawerOpen, setIsThreadDrawerOpen] = useState(false);

  // Forum Channel states
  const [forumSearchQuery, setForumSearchQuery] = useState('');
  const [forumSort, setForumSort] = useState<'newest' | 'active'>('newest');
  const [isForumComposerOpen, setIsForumComposerOpen] = useState(false);
  const [forumNewTitle, setForumNewTitle] = useState('');
  const [forumNewMessage, setForumNewMessage] = useState('');
  const [isSubmittingForumPost, setIsSubmittingForumPost] = useState(false);
  const [threadsMap, setThreadsMap] = useState<Record<string, ColonyThread[]>>({});

  // Load thread messages when an active thread is selected
  useEffect(() => {
    if (!activeThread) return;
    let mounted = true;
    const loadThreadMsgs = async () => {
      try {
        const msgs = await colonyApi.getThreadMessages(activeThread.id);
        if (mounted && msgs) {
          setThreadMessages(msgs);
        }
      } catch (err) {
        console.warn('Failed to load thread messages', activeThread.id, err);
      }
    };
    loadThreadMsgs();
    return () => {
      mounted = false;
    };
  }, [activeThread?.id]);

  // Thread Handlers
  const handleCreateThread = async (name: string, initialMessage?: string) => {
    if (!activeChannel) return;
    try {
      const created = await colonyApi.createThread(activeChannel.id, {
        name,
        creatorName: currentUser?.firstName || currentUser?.email || 'You',
        creatorAvatar: currentUser?.imageUrl ?? null,
        initialMessage,
      });

      setChannelThreads((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setActiveThread(created);
      setIsThreadDrawerOpen(true);
      setIsCreateThreadModalOpen(false);
      setIsThreadsPopoverOpen(false);
      toast.success(t(`Thread #${created.name} berhasil dibuat! 🧵`));
    } catch (err) {
      console.error('Failed to create thread', err);
      toast.error(t('Gagal membuat thread'));
      throw err;
    }
  };

  const handleSendThreadMessage = async (contentOrEvent?: string | React.FormEvent) => {
    if (contentOrEvent && typeof contentOrEvent !== 'string') {
      contentOrEvent.preventDefault();
    }
    const content = typeof contentOrEvent === 'string' ? contentOrEvent : threadInputText.trim();
    if (!content || !activeThread || !activeChannel) return;
    if (typeof contentOrEvent !== 'string') {
      setThreadInputText('');
    }
    const newMsg: ColonyMessage = {
      id: `msg_th_${Date.now()}`,
      channelId: activeChannel.id,
      threadId: activeThread.id,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.firstName || currentUser?.email || 'You',
      senderEmail: currentUser?.email || '',
      senderAvatar: currentUser?.imageUrl ?? null,
      senderRole: 'member',
      content,
      createdAt: new Date().toISOString(),
    };

    setThreadMessages((prev) => [...prev, newMsg]);

    try {
      const res = await colonyApi.sendThreadMessage(activeThread.id, activeChannel.id, {
        content,
        senderName: currentUser?.firstName || currentUser?.email || 'You',
        senderAvatar: currentUser?.imageUrl ?? null,
      });
      if (res && res.id) {
        setThreadMessages((prev) => prev.map((m) => (m.id === newMsg.id ? res : m)));
        setActiveThread((prev) =>
          prev
            ? {
                ...prev,
                messageCount: (prev.messageCount || 0) + 1,
                lastMessageAt: new Date().toISOString(),
              }
            : null,
        );
        setChannelThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? {
                  ...t,
                  messageCount: (t.messageCount || 0) + 1,
                  lastMessageAt: new Date().toISOString(),
                }
              : t,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to send thread message', err);
    }
  };

  // Forum Channel Create Post Handler
  const handleCreateForumPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !forumNewTitle.trim()) return;
    setIsSubmittingForumPost(true);
    try {
      const created = await colonyApi.createThread(activeChannel.id, {
        name: forumNewTitle.trim(),
        creatorName: currentUser?.firstName || currentUser?.email || 'You',
        creatorAvatar: currentUser?.imageUrl ?? null,
        initialMessage: forumNewMessage.trim() || undefined,
      });
      if (created) {
        setChannelThreads((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        setThreadsMap((prev) => ({
          ...prev,
          [activeChannel.id]: [
            created,
            ...(prev[activeChannel.id] || []).filter((t) => t.id !== created.id),
          ],
        }));
        setActiveThread(created);
        setIsForumComposerOpen(false);
        setForumNewTitle('');
        setForumNewMessage('');
        toast.success(t(`Post "${created.name}" berhasil dibuat! 💬`));
      }
    } catch (err) {
      console.error('Failed to create forum post', err);
      toast.error(t('Gagal membuat forum post'));
    } finally {
      setIsSubmittingForumPost(false);
    }
  };

  return {
    isThreadsPopoverOpen,
    setIsThreadsPopoverOpen,
    channelThreads,
    setChannelThreads,
    threadSearchQuery,
    setThreadSearchQuery,
    isCreateThreadModalOpen,
    setIsCreateThreadModalOpen,
    newThreadName,
    setNewThreadName,
    newThreadInitialMsg,
    setNewThreadInitialMsg,
    isSubmittingThread,
    setIsSubmittingThread,
    activeThread,
    setActiveThread,
    threadMessages,
    setThreadMessages,
    threadInputText,
    setThreadInputText,
    isThreadDrawerOpen,
    setIsThreadDrawerOpen,
    forumSearchQuery,
    setForumSearchQuery,
    forumSort,
    setForumSort,
    isForumComposerOpen,
    setIsForumComposerOpen,
    forumNewTitle,
    setForumNewTitle,
    forumNewMessage,
    setForumNewMessage,
    isSubmittingForumPost,
    setIsSubmittingForumPost,
    threadsMap,
    setThreadsMap,
    handleCreateThread,
    handleSendThreadMessage,
    handleCreateForumPost,
  };
}
