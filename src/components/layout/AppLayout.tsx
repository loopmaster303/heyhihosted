"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';

interface AppLayoutProps {
  children: React.ReactNode;
  onNewChat?: () => void;
  onToggleHistoryPanel?: () => void;
  onToggleGalleryPanel?: () => void;
  currentPath?: string;
  chatHistory?: any[];
  onSelectChat?: (id: string) => void;
  isHistoryPanelOpen?: boolean;
  isGalleryPanelOpen?: boolean;
  allConversations?: any[];
  activeConversation?: any;
  onRequestEditTitle?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onNewChat,
  onToggleHistoryPanel,
  onToggleGalleryPanel,
  currentPath,
  chatHistory = [],
  onSelectChat,
  isHistoryPanelOpen = false,
  isGalleryPanelOpen = false,
  allConversations = [],
  activeConversation = null,
  onRequestEditTitle,
  onDeleteChat
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useLocalStorageState<boolean>('sidebarExpanded', true);

  return (
    <div
      className="relative flex flex-col h-screen bg-background text-foreground"
    >
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          onNewChat={onNewChat}
          onToggleHistoryPanel={onToggleHistoryPanel}
          onToggleGalleryPanel={onToggleGalleryPanel}
          currentPath={currentPath}
          isHistoryPanelOpen={isHistoryPanelOpen}
          isGalleryPanelOpen={isGalleryPanelOpen}
          allConversations={allConversations}
          activeConversation={activeConversation}
          onSelectChat={onSelectChat}
          onRequestEditTitle={onRequestEditTitle}
          onDeleteChat={onDeleteChat}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300 relative bg-background"
          )}
          onClick={() => setSidebarExpanded(false)}
        >
          <div className="mx-auto max-w-5xl h-full flex flex-col relative w-full shadow-sm bg-background">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
