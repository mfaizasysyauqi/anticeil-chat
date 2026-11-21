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
      className="w-full h-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col font-sans select-none antialiased bg-background text-foreground"
    >
      <Routes>
        <Route path="/" element={<Navigate to="/ai" replace />} />
        <Route path="/ai" element={<CommunityPage />} />
        <Route path="/ai-center" element={<Navigate to="/ai" replace />} />
        <Route path="/command-center" element={<Navigate to="/ai" replace />} />
        <Route path="/applications" element={<CommunityPage />} />
        <Route path="/applications&activities" element={<Navigate to="/applications" replace />} />
        <Route path="/apps" element={<Navigate to="/applications" replace />} />
        <Route path="/app-directory" element={<Navigate to="/applications" replace />} />
        <Route path="/shop" element={<CommunityPage />} />
        <Route path="/store" element={<Navigate to="/shop" replace />} />
        <Route path="/quests" element={<CommunityPage />} />
        <Route path="/quest" element={<Navigate to="/quests" replace />} />
        <Route path="/friends" element={<CommunityPage />} />
        <Route path="/message-requests" element={<CommunityPage />} />
        <Route path="/notifications" element={<CommunityPage />} />
        <Route path="/calendar" element={<CommunityPage />} />
        <Route path="/assignments" element={<CommunityPage />} />
        <Route path="/calls" element={<CommunityPage />} />
        <Route path="/colonies" element={<CommunityPage />} />
        <Route path="/messages" element={<CommunityPage />} />
        <Route path="/channels/@me/:channelId?" element={<CommunityPage />} />
        <Route path="/channels/:colonyId?/:channelId?" element={<CommunityPage />} />
        <Route path="*" element={<Navigate to="/ai" replace />} />
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
