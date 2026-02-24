"use client";
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ChatProvider } from '@/components/ChatProvider';
import { useChat } from '@/components/ChatProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import AboutScrollContainer from '@/components/page/about/AboutScrollContainer';

function AboutPageContent() {
  const chat = useChat();
  const router = useRouter();

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
      <main className="flex flex-col flex-grow py-6 md:py-10">
        <AboutScrollContainer />
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
