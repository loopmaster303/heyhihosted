"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ParticleText } from '@/components/particle-text';
import { TopModelBar } from '@/components/layout/TopModelBar';
import { useMemo } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  appState?: 'landing' | 'chat' | 'visualize';
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
  // Chat Model Props
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  // Visualize Model Props
  visualSelectedModelId?: string;
  onVisualModelChange?: (modelId: string) => void;
  isVisualModelSelectorOpen?: boolean;
  onVisualModelSelectorToggle?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  appState,
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
  onDeleteChat,
  selectedModelId,
  onModelChange,
  visualSelectedModelId,
  onVisualModelChange,
  isVisualModelSelectorOpen,
  onVisualModelSelectorToggle,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useLocalStorageState<boolean>('sidebarExpanded', false);
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

  // Get username for heart icon
  const [userDisplayName, setUserDisplayName] = useState('user');
  useEffect(() => {
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) setUserDisplayName(savedName);
  }, []);

  // Header text for ParticleText
  const headerText = useMemo(() => {
    const safeName = ((userDisplayName || 'user').trim() || 'user').toLowerCase();
    return `(!hey.hi = '${safeName}')`;
  }, [userDisplayName]);

  return (
    <div
      className="relative flex flex-col h-screen bg-background text-foreground"
    >
      {/* GLOBAL TOP MODEL BAR - Sibling to all other content */}
      {appState && appState !== 'landing' && (
        <TopModelBar
          appState={appState as 'chat' | 'visualize'}
          sidebarExpanded={sidebarExpanded}
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
          visualSelectedModelId={visualSelectedModelId}
          onVisualModelChange={onVisualModelChange}
          isVisualModelSelectorOpen={isVisualModelSelectorOpen}
          onVisualModelSelectorToggle={onVisualModelSelectorToggle}
        />
      )}

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
          {/* Particle Header - NUR in Landing View */}
          {appState === 'landing' && (
            <div className={cn(
              "fixed top-16 sm:top-20 md:top-24 right-4 z-40 transition-all duration-700 pointer-events-none",
              sidebarExpanded ? "left-4 md:left-72" : "left-4"
            )}>
              <ParticleText
                text={headerText}
                className="w-full pointer-events-auto"
                particleColor="255, 105, 180"
              />
            </div>
          )}

          {/* Top Model Bar moved up to global level */}

          {/* Mobile User Icon - only visible on mobile when sidebar is collapsed */}
          {/* Mobile Menu Button */}
          {!sidebarExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-30 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300"
              onClick={() => setSidebarExpanded(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="mx-auto max-w-5xl h-full flex flex-col relative w-full px-2 md:px-4 bg-background pt-20 sm:pt-24">
            {children}
          </div>
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
};

export default AppLayout;
