"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { DEFAULT_IMAGE_MODEL, findVisiblePollinationsModelById } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';
import { useLanguage } from '../LanguageProvider';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DecryptedText from '@/components/ui/DecryptedText';
import GradualBlur from '@/components/ui/GradualBlur';
import { usePollenKey } from '@/hooks/usePollenKey';

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
  selectedImageModelId = DEFAULT_IMAGE_MODEL,
  visualSelectedModelId,
  onVisualModelChange,
  isVisualModelSelectorOpen,
  onVisualModelSelectorToggle,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useLocalStorageState<boolean>('sidebarExpanded', false);
  const { language } = useLanguage();
  const { isConnected, connectOAuth } = usePollenKey();

  // Get username for header display
  const [userDisplayName] = useState(getInitialDisplayName);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  );

  useEffect(() => {
    const syncViewportState = () => {
      setIsMobile(window.innerWidth < 640);
      setViewportHeight(window.innerHeight);
    };
    syncViewportState();
    window.addEventListener('resize', syncViewportState);
    return () => window.removeEventListener('resize', syncViewportState);
  }, []);

  const isShortViewport = viewportHeight < 820;
  const isVeryShortViewport = viewportHeight < 700;

  // Compute display names for the header
  const llmName = useMemo(() => {
      const model = findVisiblePollinationsModelById(selectedModelId);
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
    <div className="relative flex min-h-[100dvh] h-[100dvh] flex-col bg-background text-foreground overflow-hidden">
      
      {/* MINIMAL TOPBAR - Chat Mode Only */}
      {appState === 'chat' && (
        <>
          <header className="fixed top-3 left-14 right-0 z-50 h-11 flex items-center px-4">
            <span className="text-base md:text-lg font-medium text-primary/70 truncate">
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
            <div
              className={cn(
                "fixed left-4 right-4 z-40 transition-all duration-700 pointer-events-none flex flex-col items-center",
                isVeryShortViewport
                  ? "top-7 sm:top-8"
                  : isShortViewport
                    ? "top-9 sm:top-11 md:top-12"
                    : "top-12 sm:top-16 md:top-20"
              )}
            >
              <div className="flex flex-col items-center w-full">
                <div
                  className={cn(
                    "w-full pointer-events-auto",
                    isVeryShortViewport
                      ? "h-16 sm:h-20"
                      : isShortViewport
                        ? "h-20 sm:h-24 md:h-28"
                        : "h-28 sm:h-32 md:h-36"
                  )}
                >
                  <ASCIIText
                    text={headerText}
                    asciiFontSize={
                      isVeryShortViewport
                        ? (isMobile ? 5 : 7)
                        : isShortViewport
                          ? (isMobile ? 6 : 8)
                          : (isMobile ? 7 : 10)
                    }
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
                {!isVeryShortViewport && (
                  <div
                    className={cn(
                      "pointer-events-auto text-center w-full font-bold uppercase",
                      isShortViewport
                        ? "mt-1 text-[10px] sm:text-[11px] tracking-[0.22em]"
                        : "mt-2 text-[11px] sm:text-xs tracking-[0.28em]"
                    )}
                    style={{ color: 'rgba(179, 136, 255, 0.7)' }}
                  >
                    EVERYONE CAN SAY HI TO AI
                  </div>
                )}
                <div
                  className={cn(
                    "pointer-events-auto flex flex-col items-center",
                    isVeryShortViewport ? "mt-1 gap-0.5" : "mt-1 gap-1"
                  )}
                >
                  {isConnected ? (
                    <span
                      className={cn(
                        "font-bold text-green-500/80 uppercase",
                        isVeryShortViewport
                          ? "text-[9px] sm:text-[10px] tracking-[0.14em]"
                          : "text-[10px] sm:text-xs tracking-[0.2em]"
                      )}
                    >
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={connectOAuth}
                      className={cn(
                        "font-bold text-foreground/55 hover:text-foreground/80 uppercase transition-colors underline underline-offset-2",
                        isVeryShortViewport
                          ? "text-[9px] sm:text-[10px] tracking-[0.12em]"
                          : "text-[10px] sm:text-xs tracking-[0.2em]"
                      )}
                    >
                      Connect to Pollinations for full access
                    </button>
                  )}
                  {!isVeryShortViewport && (
                    <div
                      className={cn(
                        "font-bold text-foreground/55 uppercase text-center",
                        isShortViewport
                          ? "text-[9px] sm:text-[10px] tracking-[0.12em]"
                          : "text-[10px] sm:text-xs tracking-[0.18em]"
                      )}
                    >
                      Beta Test Phase ·{' '}
                      <Link href="/about" className="underline underline-offset-2 text-foreground/70 hover:text-foreground transition-colors">
                        Click here
                      </Link>
                      {' '}for more information.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              "mx-auto max-w-5xl h-full flex flex-col relative w-full px-2 md:px-4 bg-background",
              appState === 'landing'
                ? isVeryShortViewport
                  ? "pt-14"
                  : isShortViewport
                    ? "pt-16"
                    : "pt-20"
                : "pt-20"
            )}
          >
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
