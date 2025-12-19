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
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';

function VisualizeProPageContent() {
  const chat = useChat();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  // Use the SHARED hook for model state - this is the same hook UnifiedImageTool uses
  const visualizeToolState = useUnifiedImageToolState();

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
    localStorage.setItem('unified-image-tool-draft', draft);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('draft');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, [draft]);

  // Sync model from URL on mount
  useEffect(() => {
    const modelFromUrl = searchParams.get('model');
    if (modelFromUrl && modelFromUrl !== visualizeToolState.selectedModelId) {
      visualizeToolState.setSelectedModelId(modelFromUrl);
    }
  }, [searchParams]);

  // Local state for selector popup visibility
  const [isVisualSelectorOpen, setIsVisualSelectorOpen] = useState(false);

  if (!isClient) {
    return <PageLoader text="VisualizePro wird geladen..." />;
  }

  return (
    <AppLayout
      appState="visualize"
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
      // USE THE SHARED HOOK STATE - now TopModelBar and UnifiedImageTool use the same state
      visualSelectedModelId={visualizeToolState.selectedModelId}
      onVisualModelChange={(id) => {
        visualizeToolState.setSelectedModelId(id);
        setIsVisualSelectorOpen(false);
        // Also update URL to stay in sync
        const url = new URL(window.location.href);
        url.searchParams.set('model', id);
        window.history.pushState({}, '', url.toString());
      }}
      isVisualModelSelectorOpen={isVisualSelectorOpen}
      onVisualModelSelectorToggle={() => setIsVisualSelectorOpen(!isVisualSelectorOpen)}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        <UnifiedImageTool
          password={replicateToolPassword}
          // Pass the shared tool state so UnifiedImageTool uses the SAME state
          sharedToolState={visualizeToolState}
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
