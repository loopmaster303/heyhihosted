"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Heart,
  Download,
  Trash2,
  Languages,
  SunMoon,
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
      setInternalIsExpanded(false); // Desktop default: collapsed (like mobile)
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
    newInteraction: t('nav.newInteraction') || 'Neuer Chat',
    history: t('nav.history') || 'Historie',
    gallery: t('nav.gallery') || 'Meine Inhalte',
    personalization: t('nav.personalization') || 'Personalisierung',
    languageLabel: t('nav.language') || 'Sprache',
    themeLabel: t('nav.theme') || 'Theme',
    conversations: 'Chats',
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
          // Mobile: fixed overlay, Desktop: static sidebar but still z-50 to overlay header
          "fixed md:relative z-50",
          // Mobile & Desktop: completely hidden when collapsed (w-0)
          isExpanded ? "w-72" : "w-0 overflow-hidden",
          // Slide off-screen when collapsed
          !isExpanded && "-translate-x-full"
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
              !isExpanded && "hidden",
              "hidden md:block" // Hide on mobile, show on desktop
            )}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {isExpanded && (
            <Link href="/" className="flex-1">
              <div className="font-mono text-sm flex items-center whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-[rgb(255,105,180)] font-semibold tracking-tight">say hey.hi to ai</span>
              </div>
            </Link>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto pt-2 space-y-2">
            {/* New Interaction Button */}
            <div className="px-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 h-8",
                  !isExpanded && "justify-center px-0"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNewChat) {
                    onNewChat();
                  }
                  setIsExpanded(false);
                }}
              >
                <SmilePlus className="w-4 h-4 shrink-0" />
                {isExpanded && <span className="text-xs">{labels.newInteraction}</span>}
              </Button>
            </div>

            {/* Meine Inhalte (Gallery) Section */}
            <div className="space-y-1">
              <div className="px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 h-8 relative z-10",
                    !isExpanded && "justify-center px-0",
                    isGalleryPanelOpen && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    if (!isExpanded) setIsExpanded(true);
                    if (onToggleGalleryPanel) onToggleGalleryPanel();
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Images className="w-4 h-4 shrink-0" />
                      {isExpanded && <span className="text-[13px] font-medium">{labels.gallery}</span>}
                    </div>
                    {isExpanded && (
                      <ChevronRight className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-transform text-muted-foreground",
                        isGalleryPanelOpen && "rotate-90"
                      )} />
                    )}
                  </div>
                </Button>
              </div>

              {/* Inline Gallery Panel */}
              {isGalleryPanelOpen && isExpanded && (
                <div className="mt-1">
                  <SidebarGalleryPanel
                    history={imageHistory}
                    onSelectImage={(item) => {
                      window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
                      setIsExpanded(false);
                      if (onToggleGalleryPanel) onToggleGalleryPanel();
                    }}
                    onClearHistory={clearImageHistory}
                    onDeleteSingleImage={removeImageFromHistory}
                    onClose={onToggleGalleryPanel || (() => { })}
                  />
                </div>
              )}

              {/* 3-Image Preview Grid (Gemini Style) */}
              {isExpanded && imageHistory.length > 0 && !isGalleryPanelOpen && (
                <div className="grid grid-cols-3 gap-1.5 px-2 mt-1 mb-4">
                  {imageHistory.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border border-border/10 shadow-sm"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
                        if (isGalleryPanelOpen && onToggleGalleryPanel) onToggleGalleryPanel();
                        setIsExpanded(false);
                      }}
                      title={item.prompt}
                    >
                      <Image
                        src={item.videoUrl ? 'https://placehold.co/150x150.png' : item.imageUrl}
                        alt={item.prompt}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      {/* Hover action buttons */}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-800 transition-colors"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const url = item.videoUrl || item.imageUrl;
                            try {
                              const response = await fetch(url);
                              const blob = await response.blob();
                              const objectUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = objectUrl;
                              link.download = `image_${item.id}.${blob.type.split('/')[1] || 'png'}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(objectUrl);
                            } catch {
                              window.open(url, '_blank');
                            }
                          }}
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          className="p-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImageFromHistory(item.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Section */}
            <div className="space-y-1">
              <div className="px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 h-8 relative z-10",
                    !isExpanded && "justify-center px-0",
                    isHistoryPanelOpen && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    if (!isExpanded) setIsExpanded(true);
                    if (onToggleHistoryPanel) onToggleHistoryPanel();
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
              </div>

              {/* Inline History Panel */}
              {isHistoryPanelOpen && isExpanded && (
                <div className="mt-1">
                  <SidebarHistoryPanel
                    allConversations={allConversations}
                    activeConversation={activeConversation}
                    onSelectChat={onSelectChat || (() => { })}
                    onRequestEditTitle={onRequestEditTitle || (() => { })}
                    onDeleteChat={onDeleteChat || (() => { })}
                    onClose={onToggleHistoryPanel || (() => { })}
                  />
                </div>
              )}
            </div>
          </div>



          {/* Bottom Section - Higher z-index to stay above panels */}
          <div className="p-4 border-t border-border space-y-1 relative z-30 bg-background">
            {/* Personalisierung */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 h-8",
                !isExpanded && "justify-center px-0"
              )}
              onClick={() => router.push('/settings')}
            >
              <UserRoundPen className="w-4 h-4 shrink-0" />
              {isExpanded && <span className="text-[13px] font-medium">{labels.personalization}</span>}
            </Button>

            {/* Sprache */}
            <div className={cn(
              "flex items-center h-8 px-2",
              !isExpanded && "justify-center px-0"
            )}>
              <Languages className="w-4 h-4 shrink-0" />
              {isExpanded && (
                <>
                  <span className="ml-2 flex-1 text-[13px] font-medium">{labels.languageLabel}</span>
                  <LanguageToggle />
                </>
              )}
            </div>

            {/* App Design */}
            <div className={cn(
              "flex items-center h-8 px-2",
              !isExpanded && "justify-center px-0"
            )}>
              <SunMoon className="w-4 h-4 shrink-0" />
              {isExpanded && (
                <>
                  <span className="ml-2 flex-1 text-[13px] font-medium">{labels.themeLabel}</span>
                  <ThemeToggle />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppSidebar;
