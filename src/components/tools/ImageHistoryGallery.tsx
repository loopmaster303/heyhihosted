
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { Trash2, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { ImageHistoryItem } from '@/types';

interface ImageHistoryGalleryProps {
  history: ImageHistoryItem[];
  onSelectImage: (item: ImageHistoryItem) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

const ImageHistoryGallery: FC<ImageHistoryGalleryProps> = ({ history, onSelectImage, onClearHistory, onClose }) => {

  const handleDownload = async (event: React.MouseEvent, item: ImageHistoryItem) => {
    event.stopPropagation(); // Prevent selecting the image when downloading
    
    const url = item.videoUrl || item.imageUrl;
    const isVideo = !!item.videoUrl;
    
    try {
      // Using fetch to get the blob allows for more reliable downloads, especially for cross-origin resources
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      
      // Create a filename from prompt and timestamp
      const timestamp = format(new Date(item.timestamp), "yyyyMMdd_HHmmss");
      const safePrompt = item.prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const extension = isVideo ? 'mp4' : (blob.type.split('/')[1] || 'png');
      link.download = `${safePrompt}_${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback for when fetch fails (e.g. CORS issues): open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full max-h-80">
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">History</h3>
        <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onClearHistory} aria-label="Clear history" className="text-muted-foreground hover:text-foreground">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4 mr-1.5" />
                Close
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow overflow-y-auto">
        {history.length === 0 ? (
           <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
             No images generated yet.
           </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-md overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                onClick={() => onSelectImage(item)}
              >
                <NextImage
                  src={item.videoUrl ? 'https://placehold.co/400x400.png' : item.imageUrl}
                  alt={item.prompt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  style={{ objectFit: 'cover' }}
                  className="bg-muted/30"
                  data-ai-hint="gallery thumbnail"
                />
                {item.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{item.prompt}</p>
                  <p className="text-white/80 text-[10px]">{format(new Date(item.timestamp), "dd/MM/yy HH:mm")}</p>
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => handleDownload(e, item)}
                  aria-label="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

export default ImageHistoryGallery;
