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
        <Route path="/" element={<Navigate to="/friends" replace />} />
        <Route path="/applications&activities" element={<CommunityPage />} />
        <Route path="/apps" element={<Navigate to="/applications&activities" replace />} />
        <Route path="/applications" element={<Navigate to="/applications&activities" replace />} />
        <Route path="/app-directory" element={<Navigate to="/applications&activities" replace />} />
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
        <Route path="*" element={<Navigate to="/friends" replace />} />
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
