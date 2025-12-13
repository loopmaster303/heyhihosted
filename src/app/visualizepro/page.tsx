"use client";

import React, { useEffect, useState } from 'react';
import { ChatProvider } from '@/components/ChatProvider';
import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import { useChat } from '@/components/ChatProvider';
import PageLoader from '@/components/ui/PageLoader';

function VisualizeProPageContent() {
  const chat = useChat();
  const [isClient, setIsClient] = useState(false);
  const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <PageLoader text="VisualizePro wird geladen..." />;
  }

  return (
    <AppLayout
      onNewChat={chat.startNewChat}
      onToggleHistoryPanel={chat.toggleHistoryPanel}
      onToggleGalleryPanel={chat.toggleGalleryPanel}
      currentPath="/visualizepro"
      chatHistory={chat.allConversations.filter(c => c.toolType === 'long language loops')}
      onSelectChat={chat.selectChat}
      onRequestEditTitle={chat.requestEditTitle}
      onDeleteChat={chat.deleteChat}
      isHistoryPanelOpen={chat.isHistoryPanelOpen}
      isGalleryPanelOpen={chat.isGalleryPanelOpen}
      allConversations={chat.allConversations}
      activeConversation={chat.activeConversation}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        <UnifiedImageTool
          password={replicateToolPassword}
        />
      </div>
    </AppLayout>
  );
}

export default function VisualizeProPage() {
  return (
    <ErrorBoundary
      fallbackTitle="Bildgenerierung konnte nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden der Bildgenerierung. Bitte versuche es erneut."
    >
      <ChatProvider>
        <VisualizeProPageContent />
      </ChatProvider>
    </ErrorBoundary>
  );
}
