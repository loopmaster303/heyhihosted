
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 md:mt-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-lg font-code font-semibold">History</h3>
        <Button variant="ghost" size="sm" onClick={onClearHistory} aria-label="Clear history" className="text-muted-foreground hover:text-foreground">
          <Trash2 className="h-4 w-4 mr-1.5" />
          Clear
        </Button>
      </div>
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <div className="flex w-max space-x-3 p-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="group relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
              onClick={() => onSelectImage(item)}
            >
              <NextImage
                src={item.videoUrl ? 'https://placehold.co/400x400.png' : item.imageUrl}
                alt={item.prompt}
                fill
                style={{ objectFit: 'cover' }}
                className="bg-muted/30"
                data-ai-hint="gallery thumbnail"
              />
               {item.videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                <p className="text-white text-xs font-medium truncate">{item.prompt}</p>
                <p className="text-white/80 text-[10px]">{format(new Date(item.timestamp), "dd/MM/yy HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default ImageHistoryGallery;
