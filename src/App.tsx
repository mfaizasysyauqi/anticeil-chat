import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/socket-provider';
import { CommunityPage } from '@/chat';

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="w-screen h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans select-none antialiased">
          <Routes>
            <Route path="/" element={<CommunityPage />} />
            <Route path="/channels/:hubId?/:channelId?" element={<CommunityPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" theme="dark" />
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}
