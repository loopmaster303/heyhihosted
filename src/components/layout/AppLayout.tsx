"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { ParticleText } from '@/components/particle-text';
import AsciiHeader from './AsciiHeader';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';
import { useLanguage } from '../LanguageProvider';

interface AppLayoutProps {
  children: React.ReactNode;
  appState?: 'landing' | 'chat' | 'visualize' | 'studio';
  onNewChat?: () => void;
  onToggleHistoryPanel?: () => void;
  currentPath?: string;
  chatHistory?: any[];
  onSelectChat?: (id: string) => void;
  isHistoryPanelOpen?: boolean;
  allConversations?: any[];
  activeConversation?: any;
  onRequestEditTitle?: (id: string) => void;
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
  onRequestEditTitle,
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
  const [isMobile, setIsMobile] = useState(false);
  const { language } = useLanguage();

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Header text for ParticleText
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
                <AsciiHeader 
                  text={activeConversation?.title || 'hey.hi'}
                  className="h-16"
                />
                <div className="absolute top-1 right-4 text-[7px] text-primary/20 font-mono hidden md:block">
                  SYS.STATUS: ONLINE
                </div>
              </div>
          </header>
          
          {/* Expand Arrow - only visible when collapsed */}
          {headerCollapsed && (
            <button
              onClick={() => setHeaderCollapsed(false)}
              className="fixed top-0 right-1/2 translate-x-1/2 z-[70] p-1 rounded-b-md bg-primary/5 hover:bg-primary/15 border-x border-b border-primary/10 transition-all duration-300 opacity-50 hover:opacity-100"
              title="Header einblenden"
            >
              <div className="w-3 h-3 text-primary/60">
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
          onRequestEditTitle={onRequestEditTitle}
          onDeleteChat={onDeleteChat}
          isExpanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />
        <main className="flex-1 overflow-y-auto transition-all duration-300 relative bg-background w-full">
          {/* Particle Header - NUR in Landing View */}
          {appState === 'landing' && (
            <div className={cn(
              "fixed top-12 sm:top-16 md:top-20 right-4 z-40 transition-all duration-700 pointer-events-none flex flex-col items-center",
              sidebarExpanded ? "left-4 md:left-72" : "left-4"
            )}>
              {!isMobile ? (
                <div className="flex flex-col items-center w-full">
                  <ParticleText
                    text={headerText}
                    className="w-full pointer-events-auto"
                    particleColor="157, 92, 246"
                  />
                  <div className="mt-2 text-[10px] sm:text-xs font-bold tracking-[0.3em] text-foreground/40 uppercase pointer-events-auto text-center w-full">
                    EVERYONE CAN SAY HI TO AI
                  </div>
                </div>
              ) : (
                <div className="w-full pointer-events-auto text-center flex flex-col items-center">
                   <h1 
                      className="text-2xl sm:text-3xl font-bold tracking-tight opacity-90" 
                      style={{ 
                        fontFamily: '"JetBrains Mono", monospace', 
                        color: 'rgb(157, 92, 246)',
                        textShadow: '0 0 10px rgba(157, 92, 246, 0.3)'
                      }}
                   >
                      {headerText}
                   </h1>
                   <div className="mt-2 text-[10px] font-bold tracking-[0.3em] text-foreground/40 uppercase">
                     EVERYONE CAN SAY HI TO AI
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {!sidebarExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-12 left-4 z-[60] bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300"
              onClick={() => setSidebarExpanded(true)}
            >
              <Menu className="w-5 h-5" />
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