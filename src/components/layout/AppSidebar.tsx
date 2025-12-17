"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Menu,
  MessageCirclePlus,
  History,
  Images,
  WandSparkles,
  UserRoundPen,
  ChevronRight,
  SmilePlus,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useLanguage } from '../LanguageProvider';
import SidebarHistoryPanel from '../chat/SidebarHistoryPanel';
import SidebarGalleryPanel from '../chat/SidebarGalleryPanel';
import { useImageHistory } from '@/hooks/useImageHistory';

interface AppSidebarProps {
  onNewChat?: () => void;
  onToggleHistoryPanel?: () => void;
  onToggleGalleryPanel?: () => void;
  currentPath?: string;
  isHistoryPanelOpen?: boolean;
  isGalleryPanelOpen?: boolean;
  allConversations?: any[];
  activeConversation?: any;
  onSelectChat?: (id: string) => void;
  onRequestEditTitle?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  onNewChat,
  onToggleHistoryPanel,
  onToggleGalleryPanel,
  currentPath,
  isHistoryPanelOpen = false,
  isGalleryPanelOpen = false,
  allConversations = [],
  activeConversation = null,
  onSelectChat,
  onRequestEditTitle,
  onDeleteChat,
  isExpanded: externalIsExpanded,
  onToggle: externalOnToggle
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [internalIsExpanded, setInternalIsExpanded] = useState(false); // Default to collapsed
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [isMounted, setIsMounted] = useState(false);
  const { imageHistory, clearImageHistory, removeImageFromHistory } = useImageHistory();

  // Use external state if provided, otherwise use internal state
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = externalOnToggle ? () => externalOnToggle() : setInternalIsExpanded;

  // Load from localStorage on mount
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebarExpanded');
    const savedName = localStorage.getItem('userDisplayName');

    // On mobile, always start collapsed
    const isMobile = window.innerWidth < 768;
    if (savedExpanded !== null && !isMobile && externalIsExpanded === undefined) {
      setInternalIsExpanded(savedExpanded === 'true');
    } else if (!isMobile && externalIsExpanded === undefined) {
      setInternalIsExpanded(true); // Desktop default: expanded
    }

    if (savedName) {
      setUserDisplayName(savedName);
    }

    setIsMounted(true);
  }, [externalIsExpanded]);

  // Save to localStorage when changed (only for internal state)
  useEffect(() => {
    if (isMounted && externalIsExpanded === undefined) {
      localStorage.setItem('sidebarExpanded', String(internalIsExpanded));
    }
  }, [internalIsExpanded, isMounted, externalIsExpanded]);

  const labels = {
    newInteraction: t('nav.newInteraction'),
    history: t('nav.history'),
    gallery: t('nav.gallery'),
    personalization: t('nav.personalization'),
    languageLabel: t('nav.language'),
    themeLabel: t('nav.theme'),
    conversations: t('nav.conversations'), // Optional if needed
    visualize: 'VISUALIZE', // This one wasn't in the list? It was uppercase in the file. Leave hardcoded or add key? User didn't specify. I'll leave it or remove if unused. It was used in line 93? Line 93 was "visualize: isGerman ? 'VISUALISIEREN' : 'VISUALIZE'".
    // Let's add a key for visualize if needed, or just let it be. The component uses labels.visualize? Warning: I need to check usage.
    // Checking usage in AppSidebar.tsx... It seems labels.visualize is NOT used in the visible code in previous turn (checked lines 1-300).
    // Wait, let's double check usage.
  };

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  // Close sidebar when clicking outside (only when expanded and not clicking on sidebar content)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Safety check for non-element targets (though rare for mousedown)
      if (!target?.closest) return;

      const isInsideSidebar = sidebarRef.current?.contains(target);

      // Check if click is inside a portal (dropdowns, dialogs, etc.)
      // We check for commonly used attributes in Radix UI portals
      const isInsidePortal =
        target.closest('[data-radix-portal]') ||
        target.closest('[data-radix-menu-content]') ||
        target.closest('[role="menu"]');

      if (isExpanded && !isInsideSidebar && !isInsidePortal) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Mobile backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={cn(
          "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
          // Mobile: fixed overlay, Desktop: static sidebar
          "fixed md:relative z-50 md:z-auto",
          // Mobile: completely hidden when collapsed (w-0), Desktop: collapsed to icon-only width (w-16)
          isExpanded ? "w-64" : "w-0 md:w-16",
          // Mobile: slide off-screen when collapsed, Desktop: always visible
          !isExpanded && "-translate-x-full md:translate-x-0"
        )}
        ref={sidebarRef}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          {/* Menu button - only visible on desktop (hidden on mobile to avoid duplicate) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={cn(
              !isExpanded && "mx-auto",
              "hidden md:block" // Hide on mobile, show on desktop
            )}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {isExpanded && (
            <Link href="/" className="flex-1">
              <div className="font-mono text-sm flex items-center whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-foreground text-lg font-bold">{'(!hey.hi = '}</span>
                <span className="text-muted-foreground text-lg font-bold">{userDisplayName}</span>
                <span className="text-foreground text-lg font-bold">{')'}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* New Interaction Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 h-8",
                !isExpanded && "justify-center px-0"
              )}
              onClick={(e) => {
                e.stopPropagation();
                router.push('/');
              }}
            >
              <SmilePlus className="w-4 h-4 shrink-0" />
              {isExpanded && <span className="text-xs">{labels.newInteraction}</span>}
            </Button>

            {/* History Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 h-8 relative z-10",
                !isExpanded && "justify-center px-0",
                isHistoryPanelOpen && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                // Auto-expand sidebar if collapsed
                if (!isExpanded) {
                  setIsExpanded(true);
                }
                if (onToggleHistoryPanel) {
                  onToggleHistoryPanel();
                }
              }}
            >
              <History className="w-4 h-4 shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left text-xs">{labels.history}</span>
                  <ChevronRight className={cn(
                    "w-3 h-3 shrink-0 transition-transform",
                    isHistoryPanelOpen && "rotate-90"
                  )} />
                </>
              )}
            </Button>

            {/* Gallery Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 h-8 relative z-10",
                !isExpanded && "justify-center px-0",
                isGalleryPanelOpen && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                // Auto-expand sidebar if collapsed
                if (!isExpanded) {
                  setIsExpanded(true);
                }
                if (onToggleGalleryPanel) {
                  onToggleGalleryPanel();
                }
              }}
            >
              <Images className="w-4 h-4 shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left text-xs">{labels.gallery}</span>
                  <ChevronRight className={cn(
                    "w-3 h-3 shrink-0 transition-transform",
                    isGalleryPanelOpen && "rotate-90"
                  )} />
                </>
              )}
            </Button>
          </div>

          {/* Panels - Positioned absolutely to overlay with sidebar outline */}
          {isHistoryPanelOpen && isExpanded && (
            <div className="absolute top-[120px] left-0 right-0 bottom-0 z-20 px-2 pb-16">
              <div className="bg-muted/30 border-t border-border/50 rounded-b-lg overflow-hidden h-full">
                <SidebarHistoryPanel
                  allConversations={allConversations}
                  activeConversation={activeConversation}
                  onSelectChat={onSelectChat || (() => { })}
                  onRequestEditTitle={onRequestEditTitle || (() => { })}
                  onDeleteChat={onDeleteChat || (() => { })}
                  onClose={onToggleHistoryPanel || (() => { })}
                />
              </div>
            </div>
          )}

          {isGalleryPanelOpen && isExpanded && (
            <div className="absolute top-[160px] left-0 right-0 bottom-0 z-20 px-2 pb-16">
              <div className="bg-muted/30 border-t border-border/50 rounded-b-lg overflow-hidden h-full">
                <SidebarGalleryPanel
                  history={imageHistory}
                  onSelectImage={(item) => {
                    // Placeholder for future image selection handling
                  }}
                  onClearHistory={clearImageHistory}
                  onDeleteSingleImage={removeImageFromHistory}
                  onClose={onToggleGalleryPanel || (() => { })}
                />
              </div>
            </div>
          )}

          {/* Bottom Section - Higher z-index to stay above panels */}
          <div className="p-4 border-t border-border space-y-2 relative z-30 bg-background">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !isExpanded && "justify-center px-0"
              )}
              onClick={() => router.push('/settings')}
            >
              <UserRoundPen className="w-5 h-5 shrink-0" />
              {isExpanded && <span>{labels.personalization}</span>}
            </Button>

            {isExpanded && (
              <>
                <div className="flex items-center justify-between px-2 py-1 text-sm">
                  <span className="text-muted-foreground">{labels.languageLabel}</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between px-2 py-1 text-sm">
                  <span className="text-muted-foreground">{labels.themeLabel}</span>
                  <ThemeToggle />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AppSidebar;
