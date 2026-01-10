"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatProvider, useChat } from '@/components/ChatProvider';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoader from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/button';

function SettingsPageContent() {
  const chat = useChat();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <PageLoader text="Einstellungen werden geladen..." />;
  }

  return (
    <AppLayout
      onNewChat={() => {
        chat.startNewChat();
        router.push('/unified');
      }}
      onToggleHistoryPanel={chat.toggleHistoryPanel}
      currentPath="/settings"
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
      <main className="flex flex-col flex-grow items-center justify-center p-6 text-center gap-3">
        <h1 className="text-lg font-semibold">Personalisierung ist jetzt in der Sidebar</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Öffne die Sidebar und erweitere den Bereich direkt unter der Galerie, um Name, Zusatzanweisung, Default-Modelle, Farbschema und Sprache einzustellen.
        </p>
        <Button onClick={() => router.push('/unified')} variant="secondary">
          Zurück zur App
        </Button>
      </main>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary
      fallbackTitle="Einstellungen konnten nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden der Einstellungen. Bitte versuche es erneut."
    >
      <ChatProvider>
        <SettingsPageContent />
      </ChatProvider>
    </ErrorBoundary>
  );
}
