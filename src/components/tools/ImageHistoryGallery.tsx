
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { ImageHistoryItem } from '@/types';

interface ImageHistoryGalleryProps {
  history: ImageHistoryItem[];
  onSelectImage: (item: ImageHistoryItem) => void;
  onClearHistory: () => void;
}

const ImageHistoryGallery: FC<ImageHistoryGalleryProps> = ({ history, onSelectImage, onClearHistory }) => {
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">History</h3>
        <Button variant="ghost" size="sm" onClick={onClearHistory} aria-label="Clear history" className="text-muted-foreground hover:text-foreground">
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear
        </Button>
      </div>
      <ScrollArea className="h-full max-h-64">
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
