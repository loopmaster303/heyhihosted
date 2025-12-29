"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  History,
  ImageIcon,
  ChevronDown,
  X,
  UserRoundPen,
  Trash2,
  Pencil,
  Download,
  Languages,
  SunMoon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useImageHistory } from '@/hooks/useImageHistory';

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
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const { imageHistory, removeImageFromHistory } = useImageHistory();

  const handleClose = () => {
    if (onToggle) onToggle();
  };

  const formatTime = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Jetzt';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Gestern';
    return `${diffDays}d`;
  };

  const galleryImages = imageHistory.slice(0, 6);

  // Don't render anything if not expanded
  if (!isExpanded) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <aside
        className="fixed inset-y-0 left-0 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 z-50 animate-in slide-in-from-left duration-200"
      >
        <div className="h-full flex flex-col p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/" onClick={handleClose}>
              <span className="text-xs font-medium text-primary">
                say hey.hi to ai
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-7 w-7 rounded-full hover:bg-accent/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* New Conversation */}
          <Button
            onClick={() => {
              if (onNewChat) onNewChat();
              handleClose();
            }}
            size="sm"
            className="rounded-lg mb-3 h-8 text-xs bg-primary/90 hover:bg-primary"
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
            Neue Konversation
          </Button>

          {/* Conversations Section */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Konversationen
              </span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", historyExpanded && "rotate-180")} />
            </button>

            {historyExpanded && allConversations.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1 mt-1">
                {allConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                      activeConversation?.id === conv.id
                        ? "bg-accent"
                        : "hover:bg-accent/40"
                    )}
                  >
                    <button
                      onClick={() => {
                        onSelectChat?.(conv.id);
                        handleClose();
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-xs font-medium truncate">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(conv.updatedAt)}</p>
                    </button>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onRequestEditTitle && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestEditTitle(conv.id);
                          }}
                          className="h-5 w-5"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                      )}
                      {onDeleteChat && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(conv.id);
                          }}
                          className="h-5 w-5 hover:text-destructive"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gallery Section */}
          {galleryImages.length > 0 && (
            <div className="flex-shrink-0 mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Galerie
                </span>
                <span className="text-[10px] text-muted-foreground">{imageHistory.length}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {galleryImages.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-lg overflow-hidden hover:ring-1 hover:ring-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
                      handleClose();
                    }}
                    title={item.prompt}
                  >
                    { (item.videoUrl || item.imageUrl) ? (
                      <Image
                        src={item.videoUrl ? 'https://placehold.co/80x80.png' : item.imageUrl}
                        alt={item.prompt}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-800"
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
                      >
                        <Download className="w-2.5 h-2.5" />
                      </button>
                      <button
                        className="p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImageFromHistory(item.id);
                        }}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Section */}
          <div className="pt-3 border-t border-border/30 space-y-0.5">
            {/* Personalisierung */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/settings');
                handleClose();
              }}
              className="w-full justify-start gap-2 h-7 text-xs"
            >
              <UserRoundPen className="h-3.5 w-3.5 shrink-0" />
              Personalisierung
            </Button>

            {/* Sprache */}
            <div className="flex items-center h-7 px-2 gap-2 text-xs">
              <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1">Sprache</span>
              <LanguageToggle />
            </div>

            {/* Theme */}
            <div className="flex items-center h-7 px-2 gap-2 text-xs">
              <SunMoon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
