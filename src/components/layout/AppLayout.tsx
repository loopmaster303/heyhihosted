"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          isExpanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 relative bg-background w-full"
        >
          {/* Mobile Menu Button - only visible on mobile when sidebar is collapsed */}
          {!sidebarExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "fixed top-4 left-4 z-30 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300",
                // Only show on mobile, hide on desktop since sidebar has its own button
                "md:hidden"
              )}
              onClick={() => setSidebarExpanded(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="mx-auto max-w-5xl h-full flex flex-col relative w-full px-2 md:px-4 bg-background">
            {children}
          </div>
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
};

export default AppLayout;
