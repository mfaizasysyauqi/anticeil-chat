'use client';

import React from 'react';
import { Image as ImageIcon, Film, Music } from 'lucide-react';
import { ConnectorId } from '@anticeil/core';
import { Smithery as SmitheryIcon } from '@lobehub/icons';

interface LogoProps {
  size?: number;
  className?: string;
}

export function GmailLogo({ size = 20 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M45 16.2v20.6c0 2.9-2.3 5.2-5.2 5.2H36V22.9l-12 9-12-9V42H8.2C5.3 42 3 39.7 3 36.8V16.2c0-3.3 3.6-5.3 6.3-3.3L24 23.8l14.7-10.9c2.7-2 6.3 0 6.3 3.3z"
        fill="#EA4335"
      />
      <path d="M36 42h3.8c2.9 0 5.2-2.3 5.2-5.2V16.2L36 22.9V42z" fill="#34A853" />
      <path d="M12 42H8.2C5.3 42 3 39.7 3 36.8V16.2L12 22.9V42z" fill="#4285F4" />
      <path
        d="M38.7 12.9L24 23.8 9.3 12.9C6.6 10.9 3 12.9 3 16.2v1.5l21 15.6 21-15.6v-1.5c0-3.3-3.6-5.3-6.3-3.3z"
        fill="#EA4335"
      />
      <path d="M36 22.9l9-6.7v-1.5c0-3.3-3.6-5.3-6.3-3.3L36 13.4v9.5z" fill="#FBBC05" />
    </svg>
  );
}

export function CalendarLogo({ size = 20 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#FFFFFF" />
      <path d="M38 12H10c-2.2 0-4 1.8-4 4v22c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z" fill="#4285F4" />
      <path d="M38 6h-2v6h2V6zM12 6h-2v6h2V6z" fill="#1967D2" />
      <path d="M38 18H10V16h28v2z" fill="#1967D2" />
      <rect x="10" y="18" width="28" height="24" rx="2" fill="#FFFFFF" />
      <text
        x="24"
        y="36"
        fill="#4285F4"
        fontSize="17"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        31
      </text>
      <path d="M38 12H10c-2.2 0-4 1.8-4 4v4h36v-4c0-2.2-1.8-4-4-4z" fill="#4285F4" />
      <circle cx="16" cy="10" r="2" fill="#FFFFFF" />
      <circle cx="32" cy="10" r="2" fill="#FFFFFF" />
    </svg>
  );
}

export function GoogleDriveLogo({ size = 20 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16.5 6L4.5 27l6 10.5 12-21L16.5 6z" fill="#0066DA" />
      <path d="M31.5 6H16.5l6 10.5h15l-6-10.5z" fill="#00AC47" />
      <path d="M43.5 27L37.5 16.5H22.5l6 10.5h15z" fill="#EA4335" />
      <path d="M37.5 37.5H10.5L4.5 27h33l6 10.5z" fill="#FFBA00" />
      <path d="M22.5 16.5L10.5 37.5h15l12-21H22.5z" fill="#00AC47" />
    </svg>
  );
}

export function NotionLogo({ size = 20 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M6.06 17.27c2.5-.54 7.6-.82 12.78-1.09l44.38-3.26c3.27-.27 4.9.54 6.27 2.45l16.36 22.87c1.36 1.91 1.9 3.82 1.9 6.27v42.47c0 4.09-2.18 6.54-6.81 6.81l-50.65 3.27c-3.82.27-5.72-.27-7.63-2.73L6.33 77.24c-1.36-1.9-1.9-4.09-1.9-6.54V23.54c0-3.54 1.09-5.72 4.09-6.27h-2.46zm14.43 14.16c-3 0-3.82 1.9-3.82 4.36v42.2c0 2.45 1.36 3.54 3.82 3.27l7.63-.55V31.98l-7.63-.55zm53.64-7.09L37.7 26.26c-1.63.14-2.18.82-2.18 2.18v48.47c0 1.36.82 1.9 2.45 1.9l38.2-2.72c1.63-.14 2.45-.82 2.45-2.18V26.26c0-1.36-.54-2.04-2.45-1.92l-2.04.14zM47.24 37.97h7.91l14.44 24.5v-24.5h7.09v31.31h-7.09L54.6 64.24v13.07h-7.36V37.97z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GitHubLogo({ size = 20 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function CustomApiLogo({ size = 20 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#f59e0b" stroke="#d97706" />
    </svg>
  );
}

export function AnticeilImageLogo({ size = 20 }: LogoProps) {
  return <ImageIcon size={size} color="#38bdf8" />;
}

export function AnticeilVideoLogo({ size = 20 }: LogoProps) {
  return <Film size={size} color="#fb7185" />;
}

export function AnticeilAudioLogo({ size = 20 }: LogoProps) {
  return <Music size={size} color="#60a5fa" />;
}

export function ConnectorBrandIcon({ id, size = 20 }: { id: ConnectorId; size?: number }) {
  switch (id) {
    case 'gmail':
      return <GmailLogo size={size} />;
    case 'calendar':
      return <CalendarLogo size={size} />;
    case 'google_drive':
      return <GoogleDriveLogo size={size} />;
    case 'notion':
      return <NotionLogo size={size} />;
    case 'github':
      return <GitHubLogo size={size} />;
    case 'custom_webhook':
      return <CustomApiLogo size={size} />;
    case 'smithery':
      return <SmitheryIcon size={size} />;
    case 'anticeil_image':
      return <AnticeilImageLogo size={size} />;
    case 'anticeil_audio':
      return <AnticeilAudioLogo size={size} />;
    default:
      return <span style={{ fontSize: `${size}px` }}>🔌</span>;
  }
}
