"use client";
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ChatProvider } from '@/components/ChatProvider';
import { useChat } from '@/components/ChatProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useLanguage } from '@/components/LanguageProvider';

function AboutPageContent() {
  const chat = useChat();
  const { t } = useLanguage();
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
      <main className="flex flex-col flex-grow items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-code text-foreground">{t('about.title')}</h2>
        <p className="text-muted-foreground mt-4 max-w-md">
          {t('about.description')}
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
