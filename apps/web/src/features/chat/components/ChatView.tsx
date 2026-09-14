'use client';

import React, { useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { BuildPreviewPanel } from './BuildPreviewPanel';
import { useChatStore } from '../store/useChatStore';
import { useBuildStore } from '../store/useBuildStore';

export function ChatView() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isBuildOpen = useBuildStore((s) => s.isOpen);
  const isFullscreen = useBuildStore((s) => s.isFullscreen);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-switch to canvas-only on mobile/tablet (< 1024px) when in split mode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        const { isOpen, isFullscreen: fs } = useBuildStore.getState();
        // In split view (open but not fullscreen) → force fullscreen/canvas-only
        if (isOpen && !fs) {
          useBuildStore.setState({ isFullscreen: true });
        }
      }
    };
    window.addEventListener('resize', handleResize);
    // Run once on mount too
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showChatStream = !isBuildOpen || !isFullscreen;

  const handleSend = (text: string, attachments?: any[]) => {
    sendMessage(text, attachments);
  };

  const handleSelectStarter = (starterText: string) => {
    sendMessage(starterText);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left Chat Stream */}
      {showChatStream && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <MessageList onSelectStarter={handleSelectStarter} />
          <ChatInput onSend={handleSend} inputRef={inputRef} />
        </div>
      )}

      {/* Right Live Sandbox / Build Mode Panel */}
      <BuildPreviewPanel />
    </div>
  );
}
