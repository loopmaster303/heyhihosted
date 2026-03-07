"use client";
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ChatProvider } from '@/components/ChatProvider';
import { useChatConversation, useChatPanels } from '@/components/ChatProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import AboutScrollContainer from '@/components/page/about/AboutScrollContainer';

function AboutPageContent() {
  const conversation = useChatConversation();
  const panels = useChatPanels();
  const router = useRouter();

  return (
    <AppLayout
        onNewChat={() => {
          conversation.startNewChat();
          router.push('/unified');
        }}
        onToggleHistoryPanel={panels.toggleHistoryPanel}
        currentPath="/about"
        chatHistory={conversation.allConversations.filter(c => c.toolType === 'long language loops')}
        onSelectChat={(id) => {
          conversation.selectChat(id);
          router.push('/unified');
        }}
        onDeleteChat={conversation.deleteChat}
        isHistoryPanelOpen={panels.isHistoryPanelOpen}
        allConversations={conversation.allConversations}
        activeConversation={conversation.activeConversation}
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
