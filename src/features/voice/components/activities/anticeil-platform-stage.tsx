import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import type { ColonyChannel } from '@/chat/chat-types';
import { getPlatformSsoUrl } from '../../utils/platform-sso';
import { ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

export interface AnticeilPlatformStageProps {
  channel: ColonyChannel;
  socket?: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

export function AnticeilPlatformStage({
  channel: _channel,
  socket: _socket,
  currentUserName: _currentUserName,
  currentUser: _currentUser,
  participants: _participants = [],
}: AnticeilPlatformStageProps) {
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const ssoUrl = getPlatformSsoUrl();

  const handleOpenNewTab = () => {
    window.open(ssoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReload = () => {
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground select-none relative overflow-hidden">
      {/* Floating Action Controls in top-right corner */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleReload}
          title="Muat Ulang"
          aria-label="Muat Ulang"
          className="p-1.5 rounded-md bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/40 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleOpenNewTab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-md shadow-primary/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Buka di Tab Baru</span>
        </button>
      </div>

      {/* Embedded Platform / Flow IFrame Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-card">
        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-card">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold mb-1">Tidak dapat menampilkan Anticeil Flow dalam bingkai</h3>
            <p className="text-xs text-muted-foreground max-w-md mb-4 leading-relaxed">
              Browser Anda membatasi penyematan halaman karena kebijakan keamanan (CSP). Anda dapat tetap membuka dan menggunakan Anticeil Flow secara langsung.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReload}
                className="px-3 py-1.5 text-xs rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
              >
                Coba Lagi
              </button>
              <button
                onClick={handleOpenNewTab}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </button>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            src={ssoUrl}
            title="Anticeil Flow"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            allow="clipboard-read; clipboard-write; fullscreen"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  );
}

export const AnticeilFlowStage = AnticeilPlatformStage;
