"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  History,
  ChevronDown,
  Menu,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GallerySidebarSection from '@/components/gallery/GallerySidebarSection';
import PersonalizationSidebarSection from '@/components/sidebar/PersonalizationSidebarSection';
import { useLanguage } from '@/components/LanguageProvider';

interface ConversationItem {
  id: string;
  title: string;
  updatedAt?: Date | string;
}

interface AppSidebarProps {
  onNewChat?: () => void;
  currentPath?: string;
  allConversations?: ConversationItem[];
  activeConversation?: ConversationItem | null;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  onNewChat,
  allConversations = [],
  activeConversation = null,
  onSelectChat,
  onDeleteChat,
  isExpanded = false,
  onToggle
}) => {
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const { t } = useLanguage();

  const handleClose = () => {
    if (onToggle) onToggle();
  };

  const formatTime = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Jetzt';
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  if (!isExpanded) return null;

  return (
    <>
      <div className="fixed inset-0 bg-white/5 backdrop-blur-sm z-40 transition-opacity" onClick={handleClose} />

      <aside className="fixed inset-y-0 left-0 w-72 bg-sidebar-background/85 backdrop-blur-2xl border-r border-sidebar-border/40 z-50 animate-in slide-in-from-left duration-300 shadow-glass">
        <div className="h-full flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" onClick={handleClose} className="opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-glow-primary" />
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full hover:bg-primary/10" aria-label="Collapse sidebar">
              <Menu className="h-4 w-4 opacity-60" />
            </Button>
          </div>

          <Button onClick={() => { onNewChat?.(); handleClose(); }} size="sm" className="rounded-xl mb-6 h-9 text-xs bg-primary/80 hover:bg-primary text-primary-foreground shadow-glow-primary border-0">
            <PlusIcon className="h-4 w-4 mr-2" /> {t('nav.newConversation')}
          </Button>

          {/* Chat History */}
          <div className="flex-shrink-0">
            <button onClick={() => setHistoryExpanded(!historyExpanded)} className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors uppercase tracking-wider">
              <span className="flex items-center gap-2"><History className="h-3.5 w-3.5" /> {t('nav.history')}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", historyExpanded && "rotate-180")} />
            </button>
            {historyExpanded && allConversations.length > 0 && (
              <div className="max-h-[calc(100vh-340px)] overflow-y-auto space-y-1 mt-3 no-scrollbar pr-1">
                {allConversations.map((conv) => (
                  <div key={conv.id} className={cn(
                    "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border border-transparent", 
                    activeConversation?.id === conv.id ? "bg-primary/10 border-primary/20 shadow-sm" : "hover:bg-primary/5"
                  )}>
                    <button onClick={() => { onSelectChat?.(conv.id); handleClose(); }} className="flex-1 min-w-0 text-left">
                      <p className={cn("text-xs font-medium truncate mb-0.5", activeConversation?.id === conv.id ? "text-primary" : "text-foreground/80 group-hover:text-foreground")}>{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground/60">{formatTime(conv.updatedAt)}</p>
                    </button>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => onDeleteChat?.(conv.id)} className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <GallerySidebarSection />
          <PersonalizationSidebarSection />

          <div className="flex-1" />
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
