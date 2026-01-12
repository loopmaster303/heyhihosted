"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';
import { useLanguage } from '../LanguageProvider';
import dynamic from 'next/dynamic';

// Dynamic import for ASCIIText (canvas-based, client-only)
const ASCIIText = dynamic(() => import('@/components/ui/ASCIIText'), {
  ssr: false,
  loading: () => <div className="h-28 sm:h-32" />,
});

interface AppLayoutProps {
  children: React.ReactNode;
  appState?: 'landing' | 'chat' | 'visualize' | 'studio' | 'gallery';
  onNewChat?: () => void;
  onToggleHistoryPanel?: () => void;
  currentPath?: string;
  chatHistory?: any[];
  onSelectChat?: (id: string) => void;
  isHistoryPanelOpen?: boolean;
  allConversations?: any[];
  activeConversation?: any;
  onDeleteChat?: (id: string) => void;
  isAiResponding?: boolean;
  // Chat Model Props
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  selectedResponseStyleName?: string;
  selectedImageModelId?: string;
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
  currentPath,
  chatHistory = [],
  onSelectChat,
  isHistoryPanelOpen = false,
  allConversations = [],
  activeConversation = null,
  onDeleteChat,
  isAiResponding = false,
  selectedModelId,
  onModelChange,
  selectedResponseStyleName = "Basic",
  selectedImageModelId = "nanobanana",
  visualSelectedModelId,
  onVisualModelChange,
  isVisualModelSelectorOpen,
  onVisualModelSelectorToggle,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useLocalStorageState<boolean>('sidebarExpanded', false);
  const [headerCollapsed, setHeaderCollapsed] = useLocalStorageState<boolean>('headerCollapsed', false);
  const { language } = useLanguage();

  // Get username for header display
  const [userDisplayName, setUserDisplayName] = useState('user');
  useEffect(() => {
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) {
      let parsed = savedName;
      try { parsed = JSON.parse(savedName); } catch {}
      if (typeof parsed === 'string' && parsed.trim()) {
        setUserDisplayName(parsed.trim());
      }
    }
  }, []);

  // Compute display names for the header
  const llmName = useMemo(() => {
      const model = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId);
      return model ? model.name : (selectedModelId || "ai");
  }, [selectedModelId]);

  const imageName = useMemo(() => {
      const model = getUnifiedModel(selectedImageModelId);
      return model ? model.name : (selectedImageModelId || "vision");
  }, [selectedImageModelId]);

  // Header text for ASCII header
  const headerText = useMemo(() => {
    const safeName = ((userDisplayName || 'user').trim() || 'user').toLowerCase();
    return `(!hey.hi = '${safeName}')`;
  }, [userDisplayName]);

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground overflow-hidden">
      
      {/* CYBER STYLE HEADER - ONLY IN CHAT */}
      {appState === 'chat' && (
        <>
          <header 
            onClick={() => !headerCollapsed && setHeaderCollapsed(true)}
            className={cn(
              "fixed top-12 left-0 right-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out",
              headerCollapsed ? "h-0 opacity-0 -translate-y-full pointer-events-none" : "h-auto opacity-100 translate-y-0 cursor-pointer"
            )}>
              <div className={cn("w-full relative transition-all duration-300", sidebarExpanded ? "md:pl-72" : "pl-0")}>
                <div className="mx-auto max-w-5xl px-4">
                  <div className="glass-panel py-2 px-6 rounded-2xl">
                    <h1 className="text-center text-[clamp(20px,3vw,40px)] font-bold tracking-tight text-primary/80 py-2">
                      {activeConversation?.title || 'hey.hi'}
                    </h1>
                  </div>
                </div>
                <div className="absolute top-1 right-4 text-[7px] text-primary/30 font-mono hidden md:block">
                  SYS.STATUS: ONLINE
                </div>
              </div>
          </header>
          
          {/* Expand Arrow - only visible when collapsed */}
          {headerCollapsed && (
            <button
              onClick={() => setHeaderCollapsed(false)}
              className="fixed top-0 right-1/2 translate-x-1/2 z-[70] p-1 rounded-b-xl bg-primary/10 hover:bg-primary/20 backdrop-blur-md border-x border-b border-primary/20 transition-all duration-300 opacity-60 hover:opacity-100 shadow-glow-primary"
              title="Header einblenden"
            >
              <div className="w-3 h-3 text-primary/80">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          )}
        </>
      )}

      <div className={cn("flex flex-1 overflow-hidden transition-all duration-500 ease-in-out", "mt-0")}>
        <AppSidebar
          onNewChat={onNewChat}
          currentPath={currentPath}
          allConversations={allConversations}
          activeConversation={activeConversation}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
          isExpanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />
        <main className="flex-1 overflow-y-auto transition-all duration-300 relative bg-background w-full">
          {/* ASCII Header - NUR in Landing View */}
          {appState === 'landing' && (
            <div className="fixed top-12 sm:top-16 md:top-20 left-4 right-4 z-40 transition-all duration-700 pointer-events-none flex flex-col items-center">
              <div className="flex flex-col items-center w-full">
                <div className="w-full h-28 sm:h-32 md:h-36 pointer-events-auto">
                  <ASCIIText
                    text={headerText}
                    asciiFontSize={10}
                    densityScale={1.2}
                    enableWaves={true}
                    enableGlitch={true}
                    glitchDurationMs={2000}
                    glitchIntervalMs={120000}
                    glitchIntensity={1.5}
                    color="rgba(179, 136, 255, 0.95)"
                    className="w-full h-full"
                  />
                </div>
                <div className="mt-2 text-[10px] sm:text-xs font-bold tracking-[0.3em] text-foreground/30 uppercase pointer-events-auto text-center w-full">
                  EVERYONE CAN SAY HI TO AI
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {!sidebarExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-12 left-4 z-[60] bg-background/60 backdrop-blur-md border border-border/40 shadow-glass transition-all duration-300 rounded-xl"
              onClick={() => setSidebarExpanded(true)}
            >
              <Menu className="w-5 h-5 opacity-70" />
            </Button>
          )}

          <div className="mx-auto max-w-5xl h-full flex flex-col relative w-full px-2 md:px-4 bg-background pt-28 sm:pt-32">
            {children}
          </div>
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
};

export default AppLayout;
