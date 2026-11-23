import React from 'react';
import { ChatPageContent } from '@/chat/components/chat-page-content';
import { useColonyPageState } from '@/chat/hooks/use-colony-page-state';
import { AtlasAgentProvider } from '@/features/atlas-agent';

export function CommunityPage() {
  const pageProps = useColonyPageState();
  return (
    <AtlasAgentProvider>
      <ChatPageContent {...pageProps} />
    </AtlasAgentProvider>
  );
}

export { CommunityPage as ColonyPage };
export { CommunityPage as MessagesPage };
export default CommunityPage;
