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
import DecryptedText from '@/components/ui/DecryptedText';
import GradualBlur from '@/components/ui/GradualBlur';

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

const getInitialDisplayName = () => {
  if (typeof window === 'undefined') return 'user';

  const savedName = window.localStorage.getItem('userDisplayName');
  if (!savedName) return 'user';

  let parsed: unknown = savedName;
  try {
    parsed = JSON.parse(savedName);
  } catch {
    parsed = savedName;
  }

  if (typeof parsed === 'string' && parsed.trim()) {
    return parsed.trim();
  }

  return 'user';
};

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
  const { language } = useLanguage();

  // Get username for header display
  const [userDisplayName] = useState(getInitialDisplayName);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      
      {/* MINIMAL TOPBAR - Chat Mode Only */}
      {appState === 'chat' && (
        <>
          <header className="fixed top-3 left-14 right-0 z-50 h-10 flex items-center px-4">
            <span className="text-sm font-medium text-primary/70 truncate">
              <DecryptedText
                text={activeConversation?.title || 'hey.hi'}
                speed={50}
                sequential={false}
                revealDirection="start"
                animateOn="both"
              />
            </span>
          </header>
          {/* GradualBlur overlay */}
          <GradualBlur direction="top" height="50px" blurAmount={8} zIndex={40} className="!fixed !top-10" />
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
                    asciiFontSize={isMobile ? 7 : 10}
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
                <div className="mt-3 text-[10px] sm:text-xs text-foreground/50 font-medium tracking-wide pointer-events-auto text-center w-full max-w-xl mx-auto px-4 leading-relaxed">
                  NOTICE. For Full Access provide your own Pollen Key via Pollinations in the Sidebar. <br className="hidden sm:block" />
                  For more Informations visit: <a href="https://enter.pollinations.ai" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline decoration-border/30">enter.pollinations.ai</a>
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-5xl h-full flex flex-col relative w-full px-2 md:px-4 bg-background pt-20">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Button - Moved to root for better stacking context */}
      {!sidebarExpanded && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-4 z-[100] bg-background/60 backdrop-blur-md border border-border/40 shadow-glass transition-all duration-300 rounded-xl"
          onClick={() => setSidebarExpanded(true)}
        >
          <Menu className="w-5 h-5 opacity-70" />
        </Button>
      )}

      <OfflineIndicator />
    </div>
  );
};

export default AppLayout;
