"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Pencil,
  X,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ImageHistoryItem, Conversation } from '@/types';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../LanguageProvider';

interface AppSidebarProps {
  onNewChat?: () => void;
  onNewImage?: () => void;
  chatHistory?: Conversation[];
  imageHistory?: ImageHistoryItem[];
  onSelectChat?: (id: string) => void;
  onSelectImage?: (item: ImageHistoryItem) => void;
}

const CHAT_HISTORY_KEY = 'fluxflow-chatHistory';
const IMAGE_HISTORY_KEY = 'imageHistory';
const LEGACY_IMAGE_KEYS = [
  'unifiedImageToolHistory',
  'replicateToolHistory',
  'rdgrReplicateHistory',
  'visualizingLoopsHistory',
];

const AppSidebar: React.FC<AppSidebarProps> = ({
  onNewChat,
  onNewImage,
  chatHistory,
  imageHistory,
  onSelectChat,
  onSelectImage,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useLocalStorageState<boolean>('sidebarExpanded', true);
  const [activeSection, setActiveSection] = useState<'history' | 'gallery' | 'settings' | null>(null);
  const [localChatHistory, setLocalChatHistory] = useState<Conversation[]>([]);
  const [localImageHistory, setLocalImageHistory] = useState<ImageHistoryItem[]>([]);
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'User');
  const [chatSearch, setChatSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<ImageHistoryItem | null>(null);

  const isVisualizePage = pathname === '/visualizepro';
  const isGerman = language === 'de';
  const labels = {
    newConversation: isGerman ? 'Neues Gespräch' : 'New conversation',
    history: isGerman ? 'Gesprächs-Archiv' : 'Conversation history',
    search: isGerman ? 'Suchen...' : 'Search...',
    noChats: isGerman ? 'Keine Gespräche' : 'No conversations',
    newImage: isGerman ? 'Neue Visualisierung' : 'New visualization',
    gallery: isGerman ? 'Galerie' : 'Gallery',
    noImages: isGerman ? 'Keine Bilder' : 'No images',
    personalization: isGerman ? 'Personalisierung' : 'Personalization',
    languageLabel: isGerman ? 'Sprache' : 'Language',
    themeLabel: isGerman ? 'Theme' : 'Theme',
    reuse: isGerman ? 'Wiederverwenden' : 'Reuse',
    delete: isGerman ? 'Löschen' : 'Delete',
    download: isGerman ? 'Herunterladen' : 'Download',
    close: isGerman ? 'Schließen' : 'Close',
    conversations: isGerman ? 'Gespräche' : 'Conversations',
    visualize: isGerman ? 'Visualisieren' : 'Visualize',
  };

  // Chat history sync: prefer prop when provided, otherwise load from storage
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setLocalChatHistory(chatHistory);
      return;
    }
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalChatHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history', e);
    }
  }, [chatHistory]);

  // Image history load + migrate legacy keys
  useEffect(() => {
    if (imageHistory && imageHistory.length > 0) {
      setLocalImageHistory(imageHistory);
      return;
    }
    const collected: ImageHistoryItem[] = [];
    [IMAGE_HISTORY_KEY, ...LEGACY_IMAGE_KEYS].forEach((key) => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) collected.push(...parsed);
      } catch (e) {
        console.warn(`Failed to load image history from ${key}`, e);
      }
    });
    if (collected.length > 0) {
      const unique = new Map<string, ImageHistoryItem>();
      collected.forEach((item) => {
        if (!unique.has(item.id)) unique.set(item.id, item);
      });
      const sorted = Array.from(unique.values()).sort((a, b) =>
        (b.timestamp || '').localeCompare(a.timestamp || '')
      );
      const merged = sorted.slice(0, 200);
      setLocalImageHistory(merged);
      try {
        localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(merged));
        LEGACY_IMAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Failed to persist merged image history', e);
      }
    }
  }, [imageHistory]);

  const resolvedChatHistory = useMemo(() => {
    const source = localChatHistory;
    if (!chatSearch.trim()) return source;
    const term = chatSearch.toLowerCase();
    return source.filter((c) => (c.title || '').toLowerCase().includes(term));
  }, [localChatHistory, chatSearch]);
  const resolvedImageHistory = useMemo(
    () => (imageHistory && imageHistory.length > 0 ? imageHistory : localImageHistory),
    [imageHistory, localImageHistory]
  );

  const handleNewChat = () => {
    if (onNewChat) return onNewChat();
    router.push('/chat');
  };

  const handleNewImage = () => {
    if (onNewImage) return onNewImage();
    if (isVisualizePage) {
      router.refresh();
    } else {
      router.push('/visualizepro');
    }
  };

  const removeImageFromStorage = (id: string) => {
    const updated = (imageHistory && imageHistory.length > 0 ? imageHistory : localImageHistory).filter(
      (item) => item.id !== id
    );
    setLocalImageHistory(updated);
    try {
      localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to prune image history', e);
    }
  };

  const toggleSection = (section: 'history' | 'gallery' | 'settings') => {
    if (!isExpanded) {
      setIsExpanded(true);
      setActiveSection(section);
      return;
    }
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <aside
      className={cn(
        'bg-muted/30 border-r border-border transition-all duration-300 ease-in-out shrink-0 relative',
        isExpanded ? 'w-72' : 'w-16'
      )}
    >
      <div className="absolute inset-0" />
      <div
        className="flex flex-col h-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {isExpanded && (
            <span className="font-code text-sm font-semibold text-foreground/80">
              <span className="text-muted-foreground">(</span>
              <span className="text-foreground">!hey.hi</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
                {`'${userDisplayName && userDisplayName.trim() !== '' ? userDisplayName : 'john'}'`}
              </span>
              <span className="text-muted-foreground">)</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3">
          {/* Conversations group */}
          <div className="space-y-2">
            {isExpanded && <p className="px-4 text-[11px] uppercase tracking-wide text-muted-foreground">{labels.conversations}</p>}
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-11 rounded-lg',
                  !isExpanded && 'justify-center px-0'
                )}
                onClick={() => {
                  if (!isExpanded) setIsExpanded(true);
                  if (onNewChat) {
                    onNewChat();
                  } else {
                    router.push('/chat');
                  }
                }}
              >
                <MessageCirclePlus className="h-4 w-4 shrink-0" />
                {isExpanded && <span className="text-sm font-medium">{labels.newConversation}</span>}
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-11 rounded-lg',
                  !isExpanded && 'justify-center px-0',
                  activeSection === 'history' && 'bg-accent/40'
                )}
                onClick={() => toggleSection('history')}
              >
                <History className="h-4 w-4 shrink-0" />
                {isExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{labels.history}</span>
                    <ChevronRight
                      className={cn('h-4 w-4 transition-transform', activeSection === 'history' && 'rotate-90')}
                    />
                  </>
                )}
              </Button>
              {isExpanded && activeSection === 'history' && (
                <div className="mt-1 ml-2 mr-0 pr-2 space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                  <Input
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder={labels.search}
                    className="h-8 text-xs"
                  />
                  {resolvedChatHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-2">{labels.noChats}</p>
                  ) : (
                    resolvedChatHistory.slice(0, 20).map((chat: any) => (
                      <div
                        key={chat.id}
                        className="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-accent/30 flex items-center gap-2 group"
                      >
                        <button
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => {
                            if (onSelectChat) {
                              onSelectChat(chat.id);
                            } else {
                              router.push('/chat');
                            }
                          }}
                        >
                          <History className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[140px] flex-1">{chat.title || 'Untitled'}</span>
                        </button>
                        <button
                          className="opacity-60 hover:opacity-100 transition text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const next = resolvedChatHistory.filter((c: any) => c.id !== chat.id);
                            setLocalChatHistory(next);
                            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
                          }}
                          title="Löschen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="opacity-60 hover:opacity-100 transition text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const newTitle = prompt('Neuer Titel', chat.title || '');
                            if (newTitle === null) return;
                            const next = (chatHistory && chatHistory.length > 0 ? chatHistory : localChatHistory).map((c: any) =>
                              c.id === chat.id ? { ...c, title: newTitle } : c
                            );
                            setLocalChatHistory(next as any);
                            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
                          }}
                          title="Umbenennen"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visualize group */}
          <div className="space-y-2">
            {isExpanded && <p className="px-4 text-[11px] uppercase tracking-wide text-muted-foreground">{labels.visualize}</p>}
            <div className="px-2 space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-11 rounded-lg',
                  !isExpanded && 'justify-center px-0'
                )}
                onClick={handleNewImage}
              >
                <WandSparkles className="h-4 w-4 shrink-0" />
                {isExpanded && <span className="text-sm font-medium">{labels.newImage}</span>}
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-11 rounded-lg',
                  !isExpanded && 'justify-center px-0',
                  activeSection === 'gallery' && 'bg-accent/40'
                )}
                onClick={() => toggleSection('gallery')}
              >
                <Images className="h-4 w-4 shrink-0" />
                {isExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{labels.gallery}</span>
                    <ChevronRight
                      className={cn('h-4 w-4 transition-transform', activeSection === 'gallery' && 'rotate-90')}
                    />
                  </>
                )}
              </Button>
              {isExpanded && activeSection === 'gallery' && (
                <div className="mt-1 ml-2 mr-0 pr-2 max-h-64 overflow-y-auto no-scrollbar grid grid-cols-3 gap-1.5">
                  {resolvedImageHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-2 col-span-3">{labels.noImages}</p>
                  ) : (
                    resolvedImageHistory.slice(0, 30).map((item) => (
                      <div
                        key={item.id}
                        className="aspect-square rounded-md overflow-hidden relative group cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setPreviewImage(item);
                          navigator.clipboard?.writeText(item.prompt || '').catch(() => {});
                          if (onSelectImage) {
                            onSelectImage(item);
                          }
                        }}
                      >
                        {item.videoUrl ? (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-white/80">
                            Video
                          </div>
                        ) : (
                          <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover" />
                        )}
                        {!item.videoUrl && (
                          <>
                            <button
                              className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                fetch(item.imageUrl)
                                  .then((res) => res.blob())
                                  .then((blob) => {
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${(item.prompt || 'image').slice(0, 20)}.jpg`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  })
                                  .catch(() => window.open(item.imageUrl, '_blank'));
                              }}
                              title="Download"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              className="absolute bottom-1 left-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImageFromStorage(item.id);
                              }}
                              title="Delete"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personalization link */}
        <div className="border-t border-border/50 p-2">
          <Button
            variant="ghost"
            className={cn('w-full justify-start gap-3 h-11 rounded-lg', !isExpanded && 'justify-center px-0')}
            onClick={() => router.push('/settings')}
          >
            <UserRoundPen className="h-4 w-4 shrink-0" />
            {isExpanded && <span className="text-sm font-medium flex-1 text-left">{labels.personalization}</span>}
          </Button>
            {isExpanded && (
              <div className="mt-2 space-y-2 px-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{labels.languageLabel}</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{labels.themeLabel}</span>
                  <ThemeToggle />
                </div>
              </div>
            )}
        </div>
      </div>

      {previewImage && (
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-background/90 rounded-2xl p-4 shadow-xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setPreviewImage(null)}
                    aria-label={labels.close}
                  >
                    <X className="h-5 w-5" />
                  </button>
            <div className="w-full flex justify-center mb-4 relative">
              {previewImage.videoUrl ? (
                <video src={previewImage.videoUrl} controls className="max-h-[70vh] rounded-lg" />
              ) : (
                <>
                  <img src={previewImage.imageUrl} alt={previewImage.prompt} className="max-h-[70vh] rounded-lg" />
                  <button
                    className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full p-2 opacity-80 hover:opacity-100 transition"
                    title="Download"
                    onClick={() => {
                      fetch(previewImage.imageUrl)
                        .then((res) => res.blob())
                        .then((blob) => {
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${(previewImage.prompt || 'image').slice(0, 20)}.jpg`;
                          link.click();
                          URL.revokeObjectURL(url);
                        })
                        .catch(() => window.open(previewImage.imageUrl, '_blank'));
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{previewImage.prompt}</p>
            <div className="flex justify-between gap-3">
              <Button
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard?.writeText(previewImage.prompt || '').catch(() => {});
                      window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: previewImage.prompt || '' }));
                      if (onSelectImage) onSelectImage(previewImage);
                      setPreviewImage(null);
                    }}
                  >
                {labels.reuse}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  removeImageFromStorage(previewImage.id);
                  setPreviewImage(null);
                }}
              >
                {labels.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
