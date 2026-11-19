import React from 'react';
import { ChatPageContent } from './components/chat-page-content';
import { useColonyPageState } from './hooks/use-colony-page-state';
import { AiCommandCenterProvider } from '@/features/ai-command-center';

export function ColonyPage() {
  const pageProps = useColonyPageState();
  return (
    <AiCommandCenterProvider>
      <ChatPageContent {...pageProps} />
    </AiCommandCenterProvider>
  );
}

export { ColonyPage as MessagesPage };
export { ColonyPage as CommunityPage };
export default ColonyPage;
