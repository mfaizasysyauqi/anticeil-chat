'use client';

import React, { useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { BuildPreviewPanel } from './BuildPreviewPanel';
import { useChatStore } from '../store/useChatStore';

export function ChatView() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

      {/* Right Live Sandbox / Build Mode Panel */}
      <BuildPreviewPanel />
    </div>
  );
}
