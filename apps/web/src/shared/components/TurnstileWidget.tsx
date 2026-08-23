'use client';

import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error?: any) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'light',
}: TurnstileWidgetProps) {
  const [useFallbackKey, setUseFallbackKey] = useState(false);

  // Cloudflare official test key that always passes on localhost/dev
  const testKey = '1x00000000000000000000AA';
  const prodKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const siteKey = useFallbackKey || !prodKey ? testKey : prodKey;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '65px',
        width: '100%',
        margin: '6px 0',
      }}
    >
      <Turnstile
        siteKey={siteKey}
        options={{
          theme: theme === 'auto' ? 'auto' : theme,
          size: 'normal',
        }}
        onSuccess={(token) => {
          onVerify(token);
        }}
        onError={(err) => {
          console.warn('Turnstile error with key:', siteKey, err);
          // If custom key fails on localhost (e.g. domain restriction), automatically switch to test key
          if (!useFallbackKey) {
            setUseFallbackKey(true);
          }
          if (onError) onError(err);
        }}
        onExpire={() => {
          if (onExpire) onExpire();
        }}
      />
    </div>
  );
}
