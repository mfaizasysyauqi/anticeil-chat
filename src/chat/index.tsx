import React from 'react';
import { ChatPageContent } from './components/chat-page-content';
import { useColonyPageState } from './hooks/use-colony-page-state';

export function ColonyPage() {
  const pageProps = useColonyPageState();
  return <ChatPageContent {...pageProps} />;
}

export { ColonyPage as MessagesPage };
export { ColonyPage as CommunityPage };
export default ColonyPage;
