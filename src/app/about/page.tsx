"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ChatProvider } from '@/components/ChatProvider';
import { useChat } from '@/components/ChatProvider';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';

function AboutPageContent() {
  const chat = useChat();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <PageLoader text="Lade About-Seite..." />;
  }

  return (
    <AppLayout
      onNewChat={() => {
        chat.startNewChat();
        router.push('/unified');
      }}
      onToggleHistoryPanel={chat.toggleHistoryPanel}
      currentPath="/about"
      chatHistory={chat.allConversations.filter(c => c.toolType === 'long language loops')}
      onSelectChat={(id) => {
        chat.selectChat(id);
        router.push('/unified');
      }}
      onDeleteChat={chat.deleteChat}
      isHistoryPanelOpen={chat.isHistoryPanelOpen}
      allConversations={chat.allConversations}
      activeConversation={chat.activeConversation}
    >
      <main className="flex flex-col flex-grow items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-code text-white">about/hey.hi/readme</h2>
        <p className="text-gray-400 mt-4 max-w-md">
          This section is under construction. Come back soon to learn more about project!
        </p>
      </main>
    </AppLayout>
  );
}

export default function AboutPage() {
  return (
    <ErrorBoundary
      fallbackTitle="About-Seite konnte nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden der About-Seite. Bitte versuche es erneut."
    >
      <ChatProvider>
        <AboutPageContent />
      </ChatProvider>
    </ErrorBoundary>
  );
}
