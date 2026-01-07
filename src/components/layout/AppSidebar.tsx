"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  History,
  ChevronDown,
  X,
  UserRoundPen,
  Trash2,
  SunMoon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import { useToast } from '@/hooks/use-toast';

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
  onRequestEditTitle?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  onNewChat,
  allConversations = [],
  activeConversation = null,
  onSelectChat,
  onRequestEditTitle,
  onDeleteChat,
  isExpanded = false,
  onToggle
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [historyExpanded, setHistoryExpanded] = useState(true);

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleClose} />

      <aside className="fixed inset-y-0 left-0 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 z-50 animate-in slide-in-from-left duration-200">
        <div className="h-full flex flex-col p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/" onClick={handleClose}><div className="w-8 h-8" /></Link>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-7 w-7 rounded-full"><X className="h-4 w-4" /></Button>
          </div>

          <Button onClick={() => { onNewChat?.(); handleClose(); }} size="sm" className="rounded-lg mb-3 h-8 text-xs bg-primary/90 hover:bg-primary">
            <PlusIcon className="h-3.5 w-3.5 mr-1.5" /> Neue Konversation
          </Button>

          {/* Chat History */}
          <div className="flex-shrink-0">
            <button onClick={() => setHistoryExpanded(!historyExpanded)} className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Konversationen</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", historyExpanded && "rotate-180")} />
            </button>
            {historyExpanded && allConversations.length > 0 && (
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto space-y-1 mt-2 no-scrollbar">
                {allConversations.map((conv) => (
                  <div key={conv.id} className={cn("group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer", activeConversation?.id === conv.id ? "bg-accent" : "hover:bg-accent/40")}>
                    <button onClick={() => { onSelectChat?.(conv.id); handleClose(); }} className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium truncate mb-1">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(conv.updatedAt)}</p>
                    </button>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => onDeleteChat?.(conv.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-border/30 space-y-1">
            <Button variant="ghost" size="sm" onClick={() => { router.push('/settings'); handleClose(); }} className="w-full justify-start gap-2 h-8 text-xs font-normal">
              <UserRoundPen className="h-3.5 w-3.5" /> Personalisierung
            </Button>
            <div className="flex items-center h-8 px-2 text-xs">
              <SunMoon className="h-3.5 w-3.5 text-muted-foreground mr-2" />
              <span className="flex-1">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
