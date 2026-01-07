import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Download, Trash2, Maximize2, AlertTriangle } from 'lucide-react';
import { useImageHistory } from '@/hooks/useImageHistory';
import { useToast } from '@/hooks/use-toast';

interface GalleryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({ isOpen, onClose }) => {
  const { imageHistory, deleteItem, clearHistory } = useImageHistory();
  const { toast } = useToast();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  // Track erroneous images to show fallback UI
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleDownload = async (url: string, id: string) => {
    // If it's a blob, it's easy. If it's remote, we might have CORS issues.
    // Try fetch first, fallback to direct link opening if fetch fails.
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `heyhi-image-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Downloaded", description: "Image saved to device." });
    } catch (e) {
      console.error("Download failed, trying direct link:", e);
      // Fallback: Open in new tab which usually allows "Save Image As"
      window.open(url, '_blank');
    }
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <>
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 md:w-96 bg-background/80 backdrop-blur-xl border-l border-border/50 shadow-2xl z-[100] transition-transform duration-300 ease-in-out transform flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h2 className="font-mono text-sm font-bold tracking-wider text-primary">
            // IMAGE_VAULT
          </h2>
          <div className="flex items-center gap-2">
            {imageHistory.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearHistory}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
          {imageHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-16 h-16 border-2 border-dashed border-current rounded-lg mb-4 flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
              <p className="font-mono text-xs">NO_ASSETS_FOUND</p>
              <p className="text-xs mt-2 max-w-[200px]">Generated images will appear here safely stored in your local vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {imageHistory.map((item) => (
                <div key={item.id} className="group relative rounded-lg overflow-hidden border border-border/50 bg-black/20">
                  <div 
                    className="aspect-square relative cursor-pointer flex items-center justify-center bg-muted/20" 
                    onClick={() => !failedImages[item.id] && setFullscreenImage(item.imageUrl)}
                  >
                    {!failedImages[item.id] ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                        src={item.imageUrl} 
                        alt={item.prompt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={() => handleImageError(item.id)}
                        />
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-[10px] font-mono">ASSET_LOST</span>
                        </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      {!failedImages[item.id] && (
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
                            onClick={(e) => { e.stopPropagation(); setFullscreenImage(item.imageUrl); }}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                      )}
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
                        onClick={(e) => { e.stopPropagation(); handleDownload(item.imageUrl, item.id); }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 border-none"
                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-background/90 backdrop-blur-md">
                    <p className="text-[10px] font-mono text-muted-foreground line-clamp-2 leading-tight mb-1" title={item.prompt}>
                      {item.prompt}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                        {item.model}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Status */}
        <div className="p-2 border-t border-border/20 bg-background/50 text-[9px] font-mono text-center text-muted-foreground/40">
          LOCAL_STORAGE • ENCRYPTED • {imageHistory.length} ASSETS
        </div>
      </div>

      {/* Lightbox / Fullscreen View */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={fullscreenImage} 
            alt="Fullscreen Preview" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
        </div>
      )}
    </>
  );
};

export default GalleryPanel;
