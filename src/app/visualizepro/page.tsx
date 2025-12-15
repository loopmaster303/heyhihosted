"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatProvider } from '@/components/ChatProvider';
import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import { useChat } from '@/components/ChatProvider';
import PageLoader from '@/components/ui/PageLoader';

function VisualizeProPageContent() {
  const chat = useChat();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  const draft = useMemo(() => {
    const value = searchParams.get('draft');
    return value ? value : '';
  }, [searchParams]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prefill draft prompt from landing (no auto-send)
  useEffect(() => {
    if (!draft) return;
    // Set input in UnifiedImageTool via localStorage or state
    // Since UnifiedImageTool doesn't have direct access to ChatProvider,
    // we'll use localStorage to communicate the draft
    localStorage.setItem('unified-image-tool-draft', draft);
    // Clean URL to avoid re-prefill on refresh
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('draft');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

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
        <Suspense fallback={<PageLoader text="VisualizePro wird geladen..." />}>
          <VisualizeProPageContent />
        </Suspense>
      </ChatProvider>
    </ErrorBoundary>
  );
}
