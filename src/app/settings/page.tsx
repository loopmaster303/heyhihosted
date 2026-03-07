"use client";

import { useRouter } from 'next/navigation';
import { ChatProvider, useChatConversation, useChatPanels } from '@/components/ChatProvider';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

function SettingsPageContent() {
  const conversation = useChatConversation();
  const panels = useChatPanels();
  const { t } = useLanguage(); // keep for translated labels in this view
  const router = useRouter();

  return (
    <AppLayout
      onNewChat={() => {
        conversation.startNewChat();
        router.push('/unified');
      }}
      onToggleHistoryPanel={panels.toggleHistoryPanel}
      currentPath="/settings"
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
      <main className="flex flex-col flex-grow items-center justify-center p-6 text-center gap-3">
        <h1 className="text-lg font-semibold">{t('settings.sidebarNoticeTitle')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('settings.sidebarNoticeBody')}
        </p>
        <Button onClick={() => router.push('/unified')} variant="secondary">
          {t('settings.backToApp')}
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
