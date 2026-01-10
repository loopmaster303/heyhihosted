"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { ChatProvider, useChat } from '@/components/ChatProvider'; 
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useGalleryAssets } from '@/hooks/useGalleryAssets';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import type { Asset } from '@/lib/services/database';
 
import { motion } from 'framer-motion';
import { Download, Maximize2, X, Image as ImageIcon, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

/**
 * Individual Gallery Item Component
 * Manages its own Object URL lifecycle via useAssetUrl.
 */
const GalleryItem = ({ asset, onSelect }: { asset: Asset, onSelect: (url: string, type: 'image' | 'video') => void }) => {
  const { url } = useAssetUrl(asset.id);
  const isVideo = asset.contentType?.startsWith('video/');
  
  if (!url) return null;

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="break-inside-avoid relative group rounded-xl overflow-hidden border border-glass-border bg-glass-background/30 backdrop-blur-md hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
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
            <img 
                src={url} 
                alt={asset.prompt || "AI Art"}
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                loading="lazy"
                onClick={() => onSelect(url, 'image')}
            />
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 pointer-events-none group-hover:pointer-events-auto">
            <p className="text-xs text-white/90 line-clamp-3 font-medium mb-3 font-mono leading-relaxed">
                {asset.prompt}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(asset.timestamp).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
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

function GalleryPageContent() {
  const chat = useChat();
  const router = useRouter();
  const { assets, isLoading, clearAllAssets } = useGalleryAssets();
  const [lightboxData, setLightboxData] = useState<{ url: string, type: 'image' | 'video' } | null>(null);

  if (isLoading) {
    return <PageLoader text="Lade Artefakte..." />;
  }

  const setSelectedContent = (url: string, type: 'image' | 'video') => {
      setLightboxData({ url, type });
  };

  return (
    <AppLayout
        appState="gallery"
        currentPath="/gallery"
        onNewChat={() => { chat.startNewChat(); router.push('/'); }}
        onToggleHistoryPanel={chat.toggleHistoryPanel}
        allConversations={chat.allConversations} 
        activeConversation={chat.activeConversation}
        isHistoryPanelOpen={chat.isHistoryPanelOpen}
    >
      <div className="flex flex-col h-full w-full bg-background text-foreground">
        
        {/* HEADER */}
        <div className="shrink-0 p-6 border-b border-glass-border backdrop-blur-md bg-glass-background/70 z-10 flex justify-between items-center sticky top-0">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                <span className="text-primary">/</span>
                <span>pollinations_vault</span>
                <span className="text-xs font-normal text-muted-foreground ml-2 border border-border/50 px-2 py-0.5 rounded-full bg-muted/20">
                    {assets.length} items
                </span>
            </h1>
            
            {assets.length > 0 && (
               <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => {
                    if(confirm("Wirklich alle Bilder aus dem Vault löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) clearAllAssets();
                 }}
                 className="text-red-500 hover:text-red-400 hover:bg-red-950/20 gap-2"
               >
                 <Trash2 className="w-4 h-4" />
                 <span className="hidden sm:inline">Clear Vault</span>
               </Button>
            )}
        </div>

        {/* GRID AREA */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-32">
            {assets.length === 0 ? (
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
                /* MASONRY GRID LAYOUT */
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 mx-auto">
                    {assets.map((asset) => (
                        <GalleryItem 
                          key={asset.id} 
                          asset={asset} 
                          onSelect={setSelectedContent} 
                        />
                    ))}
                </div>
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
                    <img 
                        src={lightboxData.url} 
                        alt="Fullscreen view" 
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
