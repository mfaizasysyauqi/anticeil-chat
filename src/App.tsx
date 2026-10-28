import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/socket-provider';
import { ThemeProvider, useTheme } from '@/core/theme';
import { I18nProvider } from '@/core/i18n';
import { CommunityPage } from '@/chat';

function AppContent() {
  const { theme } = useTheme();

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col font-sans select-none antialiased bg-background text-foreground"
    >
      <Routes>
        <Route path="/" element={<CommunityPage />} />
        <Route path="/messages" element={<CommunityPage />} />
        <Route path="/channels/:hubId?/:channelId?" element={<CommunityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" theme={theme === 'light' ? 'light' : 'dark'} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </SocketProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
