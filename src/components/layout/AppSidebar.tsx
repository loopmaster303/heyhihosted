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
  onDeleteChat
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [isMounted, setIsMounted] = useState(false);
  const { imageHistory, clearImageHistory, removeImageFromHistory } = useImageHistory();

  // Load from localStorage on mount
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebarExpanded');
    const savedName = localStorage.getItem('userDisplayName');

    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true');
    }
    if (savedName) {
      setUserDisplayName(savedName);
    }

    setIsMounted(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebarExpanded', String(isExpanded));
    }
  }, [isExpanded, isMounted]);

  const isGerman = language === 'de';
  const labels = {
    newInteraction: isGerman ? 'New Interaction' : 'New Interaction',
    history: isGerman ? 'Gesprächs-Archiv' : 'Conversation history',
    gallery: isGerman ? 'Galerie' : 'Gallery',
    personalization: isGerman ? 'Personalisierung' : 'Personalization',
    languageLabel: isGerman ? 'Sprache' : 'Language',
    themeLabel: isGerman ? 'Theme' : 'Theme',
    conversations: isGerman ? 'GESPRÄCHE' : 'CONVERSATIONS',
    visualize: isGerman ? 'VISUALISIEREN' : 'VISUALIZE',
  };

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  // Close sidebar when clicking outside (only when expanded and not clicking on sidebar content)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
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
    <div
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
        isExpanded ? "w-64" : "w-16"
      )}
      ref={sidebarRef}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {isExpanded && (
          <Link href="/" className="flex-1">
            <div className="font-mono text-sm flex items-center whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-foreground text-lg font-bold">{'(!hey.hi = '}</span>
              <span className="text-transparent bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text text-lg font-bold">{userDisplayName}</span>
              <span className="text-foreground text-lg font-bold">{')'}</span>
            </div>
          </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* New Interaction Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              !isExpanded && "justify-center px-0"
            )}
            onClick={() => {
              // Navigate to landing page
              router.push('/');
            }}
          >
            <SmilePlus className="w-5 h-5 shrink-0" />
            {isExpanded && <span>{labels.newInteraction}</span>}
          </Button>

          {/* GESPRÄCHE Section */}
          <div>
            {isExpanded && (
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                {labels.conversations}
              </div>
            )}

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !isExpanded && "justify-center px-0",
                isHistoryPanelOpen && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                console.log('History button clicked');
                // Auto-expand sidebar if collapsed
                if (!isExpanded) {
                  setIsExpanded(true);
                }
                if (onToggleHistoryPanel) {
                  onToggleHistoryPanel();
                } else {
                  console.error('onToggleHistoryPanel is not defined');
                }
              }}
            >
              <History className="w-5 h-5 shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">{labels.history}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0 transition-transform",
                    isHistoryPanelOpen && "rotate-90"
                  )} />
                </>
              )}
            </Button>
          </div>

          {/* VISUALISIEREN Section */}
          <div>
            {isExpanded && (
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                {labels.visualize}
              </div>
            )}

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                !isExpanded && "justify-center px-0",
                isGalleryPanelOpen && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                console.log('Gallery button clicked');
                // Auto-expand sidebar if collapsed
                if (!isExpanded) {
                  setIsExpanded(true);
                }
                if (onToggleGalleryPanel) {
                  onToggleGalleryPanel();
                } else {
                  console.error('onToggleGalleryPanel is not defined');
                }
              }}
            >
              <Images className="w-5 h-5 shrink-0" />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">{labels.gallery}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0 transition-transform",
                    isGalleryPanelOpen && "rotate-90"
                  )} />
                </>
              )}
            </Button>
          </div>

          {/* History Panel */}
          {isHistoryPanelOpen && isExpanded && (
            <div className="mt-2">
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

          {/* Gallery Panel */}
          {isGalleryPanelOpen && isExpanded && (
            <div className="mt-2">
              <SidebarGalleryPanel
                history={imageHistory}
                onSelectImage={(item) => {
                  // Handle image selection - could emit event or update state
                  console.log('Selected image:', item);
                }}
                onClearHistory={clearImageHistory}
                onDeleteSingleImage={removeImageFromHistory}
                onClose={onToggleGalleryPanel || (() => { })}
              />
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-2">
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
  );
};

export default AppSidebar;
