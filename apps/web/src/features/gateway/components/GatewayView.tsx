'use client';

import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Zap } from 'lucide-react';

export function GatewayView() {
  const [iframeKey, setIframeKey] = useState(0);
  const omniRouteUrl = '/api/omniroute-proxy/dashboard';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0b0f17',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Direct Native OmniRoute Frame */}
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
        <iframe
          key={iframeKey}
          src={omniRouteUrl}
          title="OmniRoute Native Gateway"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: '#0b0f17',
          }}
          allow="clipboard-read; clipboard-write; microphone; camera"
        />
      </div>
    </div>
  );
}
