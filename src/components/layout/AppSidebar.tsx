"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu,
  MessageCirclePlus,
  History,
  Images,
  WandSparkles,
  UserRoundPen,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useLanguage } from '../LanguageProvider';

interface AppSidebarProps {
  onNewChat?: () => void;
  onNewImage?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ onNewChat, onNewImage }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [isMounted, setIsMounted] = useState(false);

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
    newConversation: isGerman ? 'Neues Gespräch' : 'New conversation',
    history: isGerman ? 'Gesprächs-Archiv' : 'Conversation history',
    newImage: isGerman ? 'Neue Visualisierung' : 'New visualization',
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

  return (
    <div
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
        isExpanded ? "w-64" : "w-16"
      )}
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
          <div className="font-mono text-sm flex-1">
            <span className="text-foreground">(!hey.hi = </span>
            <span className="text-pink-500 font-semibold">&apos;{userDisplayName}&apos;</span>
            <span className="text-foreground">)</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
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
              !isExpanded && "justify-center px-0"
            )}
            onClick={() => {
              router.push('/chat');
              onNewChat?.();
            }}
          >
            <MessageCirclePlus className="w-5 h-5 shrink-0" />
            {isExpanded && <span>{labels.newConversation}</span>}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              !isExpanded && "justify-center px-0"
            )}
            onClick={() => router.push('/chat')}
          >
            <History className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <>
                <span className="flex-1 text-left">{labels.history}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
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
              !isExpanded && "justify-center px-0"
            )}
            onClick={() => {
              router.push('/visualizepro');
              onNewImage?.();
            }}
          >
            <WandSparkles className="w-5 h-5 shrink-0" />
            {isExpanded && <span>{labels.newImage}</span>}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              !isExpanded && "justify-center px-0"
            )}
            onClick={() => router.push('/visualizepro')}
          >
            <Images className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <>
                <span className="flex-1 text-left">{labels.gallery}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </Button>
        </div>
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
  );
};

export default AppSidebar;
