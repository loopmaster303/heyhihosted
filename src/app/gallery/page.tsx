"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import { ChatProvider, useChatConversation, useChatPanels } from '@/components/ChatProvider';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useGalleryAssets } from '@/hooks/useGalleryAssets';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import type { Asset } from '@/lib/services/database';

import { motion } from 'framer-motion';
import { Download, Maximize2, X, Image as ImageIcon, Trash2, MessageSquare, Heart, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Individual Gallery Item Component
 * Manages its own Object URL lifecycle via useAssetUrl.
 */
const GalleryItem = ({ 
  asset, 
  onSelect,
  onToggleStar 
}: { 
  asset: Asset, 
  onSelect: (url: string, type: 'image' | 'video') => void,
  onToggleStar: (id: string) => void
}) => {
  const { url } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');
  
  if (!url) return null;

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="break-inside-avoid relative group rounded-xl overflow-hidden border border-glass-border bg-glass-background/30 backdrop-blur-md hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
        {asset.starred && (
          <div className="absolute top-2 left-2 z-10 text-yellow-400 text-sm leading-none drop-shadow">
            ★
          </div>
        )}
        {isVideo ? (
            <video 
                src={url} 
                className="w-full h-auto object-cover cursor-pointer"
                muted
                loop
                onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
                onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                onClick={() => onSelect(url, 'video')}
            />
        ) : (
            <Image
                src={url}
                alt={asset.prompt || "AI Art"}
                width={1600}
                height={1600}
                unoptimized
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                loading="lazy"
                onClick={() => onSelect(url, 'image')}
            />
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 pointer-events-none group-hover:pointer-events-auto">
            <p className="text-xs text-white/90 line-clamp-3 font-medium mb-1 font-mono leading-relaxed">
                {asset.prompt}
            </p>
            <p className="text-[10px] text-white/40 font-mono mb-3">{asset.modelId}</p>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(asset.timestamp).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                    <Button
                        size="icon"
                        className={cn(
                          "h-7 w-7 rounded-full bg-white/10 border-0 backdrop-blur-sm",
                          asset.starred ? "text-red-400 hover:bg-white/20" : "text-white hover:bg-primary hover:text-white"
                        )}
                        onClick={(e) => { e.stopPropagation(); onToggleStar(asset.id); }}
                    >
                        <Heart className={cn("h-3.5 w-3.5", asset.starred && "fill-current")} />
                    </Button>
                    <Button 
                        size="icon" 
                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-primary hover:text-white border-0 text-white backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `heyhi-${asset.id.slice(0, 8)}.${isVideo ? 'mp4' : 'png'}`;
                            link.click();
                        }}
                    >
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                        size="icon" 
                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-primary hover:text-white border-0 text-white backdrop-blur-sm"
                        onClick={() => onSelect(url, isVideo ? 'video' : 'image')}
                    >
                        <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    </motion.div>
  );
};

const VaultTrackItem = ({
  asset,
  onToggleStar,
}: {
  asset: Asset;
  onToggleStar: (id: string) => void;
}) => {
  const { url } = useAssetUrl(asset.id);
  const title = asset.prompt
    ? asset.prompt.split(' ').slice(0, 5).join(' ') + (asset.prompt.split(' ').length > 5 ? '…' : '')
    : 'untitled track';

  return (
    <div className="break-inside-avoid rounded-xl border border-glass-border bg-glass-background/30 backdrop-blur-md p-4 group hover:border-primary/30 transition-all duration-300">
      {url && (
        <audio controls src={url} className="w-full h-8 mb-3" style={{ accentColor: 'hsl(var(--primary))' }} />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono text-foreground/80 truncate font-medium">{title}</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{asset.modelId || 'elevenmusic'}</p>
        </div>
        <button
          onClick={() => onToggleStar(asset.id)}
          className={cn("shrink-0 text-sm", asset.starred ? "text-red-400" : "text-muted-foreground/40 hover:text-red-400")}
        >
          <Heart className={cn("h-4 w-4", asset.starred && "fill-current")} />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/40 font-mono mt-2">
        {new Date(asset.timestamp).toLocaleDateString()}
      </p>
    </div>
  );
};

function GalleryPageContent() {
  const conversation = useChatConversation();
  const panels = useChatPanels();
  const router = useRouter();
  const { assets, isLoading, clearAllAssets, toggleStarred } = useGalleryAssets();
  const [lightboxData, setLightboxData] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'tracks'>('images');

  const imageAssets = useMemo(
    () => assets.filter(a => !a.contentType?.startsWith('audio/')),
    [assets]
  );
  const trackAssets = useMemo(
    () => assets.filter(a => a.contentType?.startsWith('audio/')),
    [assets]
  );

  if (isLoading) {
    return <PageLoader text="Lade Artefakte..." />;
  }

  const setSelectedContent = (url: string, type: 'image' | 'video') => {
      setLightboxData({ url, type });
  };
  const activeCount = activeTab === 'images' ? imageAssets.length : trackAssets.length;
  const activeLabel = activeTab === 'images'
    ? (activeCount === 1 ? 'image' : 'images')
    : (activeCount === 1 ? 'track' : 'tracks');

  return (
    <AppLayout
        appState="gallery"
        currentPath="/gallery"
        onNewChat={() => { conversation.startNewChat(); router.push('/'); }}
        onToggleHistoryPanel={panels.toggleHistoryPanel}
        allConversations={conversation.allConversations} 
        activeConversation={conversation.activeConversation}
        isHistoryPanelOpen={panels.isHistoryPanelOpen}
    >
      <div className="flex flex-col h-full w-full bg-background text-foreground">
        
        {/* HEADER */}
        <div className="shrink-0 p-6 border-b border-glass-border backdrop-blur-md bg-glass-background/70 z-10 sticky top-0">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <span className="text-primary">/</span>
                    <span>pollinations_vault</span>
                    <span className="text-xs font-normal text-muted-foreground ml-2 border border-border/50 px-2 py-0.5 rounded-full bg-muted/20">
                        {activeCount} {activeLabel}
                    </span>
                </h1>
                
                {assets.length > 0 && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => {
                        if(confirm("Wirklich alle Artefakte aus dem Vault löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) clearAllAssets();
                     }}
                     className="text-red-500 hover:text-red-400 hover:bg-red-950/20 gap-2"
                   >
                     <Trash2 className="w-4 h-4" />
                     <span className="hidden sm:inline">Clear Vault</span>
                   </Button>
                )}
            </div>

            <div className="flex gap-1">
              {[
                { key: 'images', label: 'Images', icon: ImageIcon, count: imageAssets.length },
                { key: 'tracks', label: 'Tracks', icon: Music, count: trackAssets.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'images' | 'tracks')}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
                    activeTab === tab.key
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground border border-border/30"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span className="opacity-50 ml-1">{tab.count}</span>
                </button>
              ))}
            </div>
        </div>

        {/* GRID AREA */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-32">
            {activeTab === 'images' ? (
                imageAssets.length === 0 ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <div className="w-20 h-20 border-2 border-dashed border-current rounded-2xl mb-6 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-medium">Keine Artefakte gefunden.</p>
                        <p className="text-sm mt-2 text-center max-w-xs">
                            Bilder, die du im Chat generierst, werden automatisch hier lokal in deinem Vault gesichert.
                        </p>
                        <Button 
                            variant="outline" 
                            className="mt-8 gap-2"
                            onClick={() => router.push('/')}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Zum Chat
                        </Button>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 mx-auto">
                        {imageAssets.map((asset) => (
                            <GalleryItem 
                              key={asset.id} 
                              asset={asset} 
                              onSelect={setSelectedContent}
                              onToggleStar={toggleStarred}
                            />
                        ))}
                    </div>
                )
            ) : (
                trackAssets.length === 0 ? (
                    <div className="h-[40vh] flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <Music className="w-10 h-10 mb-4" />
                        <p className="text-sm font-medium">Keine Tracks gefunden.</p>
                        <p className="text-xs mt-1">Im Compose-Modus Musik generieren.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4 mx-auto">
                        {trackAssets.map((asset) => (
                            <VaultTrackItem
                              key={asset.id}
                              asset={asset}
                              onToggleStar={toggleStarred}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX */}
      {lightboxData && typeof document !== 'undefined' && createPortal(
        <div 
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxData(null)}
        >
            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                {lightboxData.type === 'video' ? (
                    <video 
                        src={lightboxData.url} 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-glass-heavy border border-white/10"
                        controls
                        autoPlay
                    />
                ) : (
                    <Image
                        src={lightboxData.url}
                        alt="Fullscreen view"
                        width={1920}
                        height={1080}
                        unoptimized
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-glass-heavy border border-white/10"
                    />
                )}
                <button 
                    onClick={() => setLightboxData(null)}
                    className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>
        </div>,
        document.body
      )}
    </AppLayout>
  );
}

// --- MAIN EXPORT WITH PROVIDERS ---
export default function GalleryPage() {
  return (
    <ErrorBoundary fallbackTitle="Gallery Error">
      <ChatProvider> 
        <GalleryPageContent />
      </ChatProvider>
    </ErrorBoundary>
  );
}
