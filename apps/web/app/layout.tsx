import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anticeil — Bring Your Own Key AI Assistant',
  description: 'Zero-proxy, 100% private cross-platform chatbot with your own API keys for OpenAI, Claude, Gemini, DeepSeek, Groq, & Ollama.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
