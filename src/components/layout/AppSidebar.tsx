"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useImageHistory } from '@/hooks/useImageHistory';
import type { ImageHistoryItem } from '@/types';

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

// Robust Image Component for Gallery with Retry Logic
const GalleryImage: React.FC<{ item: ImageHistoryItem; className?: string }> = ({ item, className }) => {
  const [errorCount, setErrorCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const isVideo = !!item.videoUrl;
  const baseUrl = item.videoUrl ? 'https://placehold.co/80x80.png' : item.imageUrl;
  
  // Use a reload token to force browser to re-fetch on error
  const [reloadToken, setReloadToken] = useState(0);
  const src = reloadToken > 0 ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}retry=${reloadToken}` : baseUrl;

  const handleError = () => {
    if (errorCount < 10) {
      const nextRetry = errorCount + 1;
      setErrorCount(nextRetry);
      // Wait longer with each retry (1.5s, 3s, 4.5s...)
      setTimeout(() => setReloadToken(nextRetry), 1500 * nextRetry);
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-muted/20", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={item.prompt}
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        )}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        loading="lazy"
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {isVideo && (
        <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5">
          <Video className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
};

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
  const [previewImage, setPreviewImage] = useState<ImageHistoryItem | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Close overlays on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
        setIsGalleryOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 mt-2">
                {allConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors",
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
                      <p className="text-xs font-medium truncate leading-none mb-1">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-none">{formatTime(conv.updatedAt)}</p>
                    </button>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onRequestEditTitle && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestEditTitle(conv.id);
                          }}
                          className="h-6 w-6"
                        >
                          <Pencil className="h-3 w-3" />
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
                          className="h-6 w-6 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
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
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Galerie
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setIsGalleryOpen(true)}
                  title="Alle anzeigen"
                >
                   <span className="text-[10px]">{imageHistory.length}</span>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer bg-muted/20"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
                        handleClose();
                    }}
                    title={item.prompt}
                  >
                    <GalleryImage item={item} />
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                       <button 
                          className="p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm transform hover:scale-110 transition-all"
                          title="Reuse Prompt"
                          onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
                              handleClose();
                          }}
                       >
                          <Pencil className="w-3 h-3" />
                       </button>

                      <button
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-sm transform hover:scale-110 transition-all"
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
                        <Download className="w-3 h-3" />
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
          <div className="pt-4 border-t border-border/30 space-y-1">
            {/* Personalisierung */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/settings');
                handleClose();
              }}
              className="w-full justify-start gap-2 h-8 text-xs font-normal"
            >
              <UserRoundPen className="h-3.5 w-3.5 shrink-0" />
              Personalisierung
            </Button>

            {/* Sprache */}
            <div className="flex items-center h-8 px-2 gap-2 text-xs">
              <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 font-normal">Sprache</span>
              <LanguageToggle />
            </div>

            {/* Theme */}
            <div className="flex items-center h-8 px-2 gap-2 text-xs">
              <SunMoon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 font-normal">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Lightbox Portal */}
      {previewImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-full max-h-full w-auto h-auto flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.videoUrl || previewImage.imageUrl}
              alt={previewImage.prompt}
              className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            />
            <p className="text-white/80 text-sm max-w-2xl text-center bg-black/50 p-2 rounded backdrop-blur-sm">
              {previewImage.prompt}
            </p>
            
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 sm:top-0 sm:-right-12 rounded-full bg-white/10 text-white p-3 hover:bg-white/20 transition-colors backdrop-blur-sm"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Full Gallery Overlay (Grid) */}
      {isGalleryOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-10 duration-200"
          onClick={() => setIsGalleryOpen(false)}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-border/40 bg-background/50 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Galerie ({imageHistory.length})
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsGalleryOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Grid Content */}
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {imageHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted/20 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => setPreviewImage(item)}
                >
                  <GalleryImage item={item} />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black"
                        title="Vorschau"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(item);
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black"
                        title="Download"
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
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-[10px] px-2 bg-white/90 hover:bg-white text-black font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.conversationId) {
                            onSelectChat?.(item.conversationId);
                            setIsGalleryOpen(false);
                            handleClose();
                          } else {
                             // Fallback
                             window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
                             setIsGalleryOpen(false);
                             handleClose();
                          }
                        }}
                      >
                        Zum Chat
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-[10px] px-2 bg-white/90 hover:bg-white text-black font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          // "Reuse in Studio" logic:
                          // We can use the same event or a new one, or direct routing with query params.
                          // For now, let's use the event which UnifiedImageTool listens to, or route to studio.
                          // Assuming Studio checks localStorage or event.
                          // Let's force a "edit this image" flow.
                          localStorage.setItem('unified-image-tool-state', JSON.stringify({
                              prompt: item.prompt,
                              selectedModelId: item.model,
                              // If we had the original params, we'd set them here.
                              // For now, prompt + model is a good start.
                          }));
                          router.push('/studio');
                          setIsGalleryOpen(false);
                          handleClose();
                        }}
                      >
                        Studio
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                        title="Löschen"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImageFromHistory(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AppSidebar;
