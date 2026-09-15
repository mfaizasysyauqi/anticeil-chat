import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '@/shared/components/ToastContainer';

export const metadata: Metadata = {
  title: 'Anticeil — Bring Your Own Key AI Assistant',
  description: 'Zero-proxy, 100% private cross-platform chatbot with your own API keys for OpenAI, Claude, Gemini, DeepSeek, Groq, & Ollama.',
  icons: {
    icon: '/anticeil-logo.png',
    apple: '/anticeil-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Blocking script: apply theme from localStorage before first paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('anticeil_settings_storage');
                  var theme = stored ? JSON.parse(stored).state.theme : 'system';
                  if (theme === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                    document.documentElement.setAttribute('data-theme', prefersLight ? 'light' : 'dark');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
