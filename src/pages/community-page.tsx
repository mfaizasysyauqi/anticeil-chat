import React from 'react';
import { ChatPageContent } from '@/chat/components/chat-page-content';
import { useColonyPageState } from '@/chat/hooks/use-colony-page-state';
import { AiCommandCenterProvider } from '@/features/ai-command-center';

export function CommunityPage() {
  const pageProps = useColonyPageState();
  return (
    <AiCommandCenterProvider>
      <ChatPageContent {...pageProps} />
    </AiCommandCenterProvider>
  );
}

export { CommunityPage as ColonyPage };
export { CommunityPage as MessagesPage };
export default CommunityPage;
