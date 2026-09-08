/**
 * useCoAuthorEditActions
 *
 * Reusable hook for Claude-style edit/undo actions in AI Co-Author.
 * Used by both DocsCoAuthorSidebar and DocsLandingView.
 */

import { useState, useRef, useEffect } from 'react';
import { useCoAuthorHistoryStore, CoAuthorMessage } from '../store/useCoAuthorHistoryStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { isCloudTier } from '@anticeil/core';

interface UseCoAuthorEditActionsProps {
  activeDocId: string | null;
  messages: CoAuthorMessage[];
  setMessages: React.Dispatch<React.SetStateAction<CoAuthorMessage[]>>;
}

interface UndoToastState {
  messageId: string;
  count: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

export function useCoAuthorEditActions({
  activeDocId,
  messages,
  setMessages,
}: UseCoAuthorEditActionsProps) {
  const historyStore = useCoAuthorHistoryStore();
  const authSession = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const isCloudUser = isCloudTier(tier);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Edit Handlers ───────────────────────────────────────────────────────

  const handleStartEdit = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (overrideContent?: string): Promise<string | undefined> => {
    const contentToUse = (overrideContent ?? editingContent).trim();
    if (!activeDocId || !editingMessageId || !contentToUse) return;

    const newContent = contentToUse;

    // Call store to edit message and delete subsequent messages
    historyStore.editMessage(activeDocId, editingMessageId, newContent);

    // Sync to cloud for starter+ users
    if (isCloudUser && authSession?.access_token) {
      historyStore.syncToCloud(activeDocId, authSession.access_token);
    }

    // Refresh messages from store to get the updated list (with deleted responses)
    const session = historyStore.getSession(activeDocId);
    if (session) {
      const msgIndex = session.messages.findIndex((m) => m.id === editingMessageId);
      const deletedCount = msgIndex >= 0 ? session.messages.length - msgIndex - 1 : 0;

      setMessages([...session.messages]);

      // Clear edit state
      setEditingMessageId(null);
      setEditingContent('');

      // Show undo toast if messages were deleted
      if (deletedCount > 0) {
        showUndoToast(editingMessageId, deletedCount);
      }
    }

    // Return new content so component can handle re-send
    return newContent;
  };

  // ── Undo Handlers ──────────────────────────────────────────────────────

  const showUndoToast = (messageId: string, count: number) => {
    if (undoToast?.timeoutId) {
      clearTimeout(undoToast.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      setUndoToast(null);
    }, 8000);

    setUndoToast({ messageId, count, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!activeDocId || !undoToast) return;

    const success = historyStore.undoDelete(activeDocId, undoToast.messageId);
    if (!success) return;

    // Sync to cloud
    if (isCloudUser && authSession?.access_token) {
      historyStore.syncToCloud(activeDocId, authSession.access_token);
    }

    // Refresh messages from store (clone to ensure React re-render)
    const session = historyStore.getSession(activeDocId);
    if (session) {
      setMessages([...session.messages]);
    }

    // Clear undo toast
    if (undoToast.timeoutId) {
      clearTimeout(undoToast.timeoutId);
    }
    setUndoToast(null);
  };

  // Clear undo toast timeout on unmount
  useEffect(() => {
    return () => {
      if (undoToast?.timeoutId) {
        clearTimeout(undoToast.timeoutId);
      }
    };
  }, [undoToast]);

  return {
    // Edit state
    editingMessageId,
    editingContent,
    setEditingContent,
    editTextareaRef,

    // Edit handlers
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,

    // Undo state
    undoToast,

    // Undo handlers
    handleUndoDelete,
  };
}
