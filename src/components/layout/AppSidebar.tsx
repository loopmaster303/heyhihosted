"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Info,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useImageHistory } from '@/hooks/useImageHistory';
import type { ImageHistoryItem } from '@/types';
import { DatabaseService } from '@/lib/services/database';
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

/**
 * Smart Gallery Image Component
 * Zieht das Bild direkt aus dem Vault.
 */
const GalleryThumbnail: React.FC<{ 
  item: ImageHistoryItem; 
  onClick: () => void;
  onDelete: (id: string) => void;
}> = ({ item, onClick, onDelete }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const localUrl = await DatabaseService.getAssetUrl(item.id);
      if (active) {
        setSrc(localUrl || item.imageUrl);
      }
    };
    load();
    return () => { active = false; };
  }, [item.id, item.imageUrl]);

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted/10 border border-border/20 hover:border-primary/50 transition-all cursor-pointer">
      {src ? (
        <img
          src={src}
          alt=""
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
          )}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-muted/20" />
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform hover:scale-110"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 transition-transform hover:scale-110"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
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
  const { toast } = useToast();
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const { imageHistory, deleteItem } = useImageHistory();
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);

  const handleClose = () => {
    if (onToggle) onToggle();
  };

  const handleDownload = async (item: ImageHistoryItem) => {
    try {
      const url = await DatabaseService.getAssetUrl(item.id) || item.imageUrl;
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `heyhi-${item.id}.jpg`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      toast({ title: "Heruntergeladen" });
    } catch (e) {
      window.open(item.imageUrl, '_blank');
    }
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({ title: "Prompt kopiert" });
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
              <div className="max-h-40 overflow-y-auto space-y-1 mt-2 no-scrollbar">
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

          {/* NEUE MINI GALERIE */}
          {imageHistory.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border/30">
              <div className="flex items-center gap-1.5 px-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <ImageIcon className="h-3.5 w-3.5" /> Galerie
              </div>
              <div className="grid grid-cols-3 gap-2 px-1">
                {imageHistory.slice(0, 9).map((item) => (
                  <GalleryThumbnail 
                    key={item.id} 
                    item={item} 
                    onClick={() => setSelectedImage(item)} 
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </div>
          )}

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

      {/* FULLSCREEN LIGHTBOX PORTAL */}
      {selectedImage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-5xl flex flex-col md:flex-row gap-6 bg-card/50 p-4 rounded-3xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Bild-Bereich */}
            <div className="flex-1 relative aspect-square md:aspect-auto h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black/20">
              <img 
                src={selectedImage.imageUrl} // Hier wird im useEffect der GalleryThumbnail bereits der Vault-Link gesetzt, falls verfügbar
                alt="" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Info-Bereich */}
            <div className="w-full md:w-80 flex flex-col gap-4 text-left">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-primary">Image Info</h3>
                <button onClick={() => setSelectedImage(null)} className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Model</p>
                <p className="text-sm font-mono bg-white/5 p-2 rounded-lg">{selectedImage.model}</p>
              </div>

              <div className="flex-1 space-y-2 overflow-hidden flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Prompt</p>
                <div className="flex-1 bg-white/5 p-3 rounded-lg overflow-y-auto no-scrollbar relative group">
                  <p className="text-xs font-mono leading-relaxed opacity-80">{selectedImage.prompt}</p>
                  <button onClick={() => copyPrompt(selectedImage.prompt)} className="absolute top-2 right-2 p-1.5 rounded-md bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button onClick={() => handleDownload(selectedImage)} className="w-full gap-2 rounded-xl bg-white text-black hover:bg-white/90">
                  <Download className="w-4 h-4" /> Save
                </Button>
                <Button variant="destructive" onClick={() => { deleteItem(selectedImage.id); setSelectedImage(null); }} className="w-full gap-2 rounded-xl">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AppSidebar;
