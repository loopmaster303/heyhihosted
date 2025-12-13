"use client";

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Images, Trash2, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import type { ImageHistoryItem } from '@/types';
import { useLanguage } from '../LanguageProvider';

interface SidebarGalleryPanelProps {
    history: ImageHistoryItem[];
    onSelectImage: (item: ImageHistoryItem) => void;
    onClearHistory: () => void;
    onClose: () => void;
}

const SidebarGalleryPanel: FC<SidebarGalleryPanelProps> = ({
    history,
    onSelectImage,
    onClearHistory,
    onClose
}) => {
    const { t } = useLanguage();

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
        <div className="border-t border-border bg-background">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Images className="w-4 h-4" />
                        <h3 className="text-sm font-semibold">Galerie</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearHistory}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="h-64 w-full">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                            <Images className="w-8 h-8 mb-2 opacity-50" />
                            <p>Keine Bilder vorhanden</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-square rounded-md overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                                    onClick={() => onSelectImage(item)}
                                >
                                    <Image
                                        src={item.videoUrl ? 'https://placehold.co/200x200.png' : item.imageUrl}
                                        alt={item.prompt}
                                        className="w-full h-full object-cover bg-muted/30"
                                        loading="lazy"
                                        width={200}
                                        height={200}
                                    />
                                    {item.videoUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                        <p className="text-white text-xs font-medium truncate" title={item.prompt}>
                                            {item.prompt}
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        onClick={(e) => handleDownload(e, item)}
                                        aria-label="Download"
                                    >
                                        <Download className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};

export default SidebarGalleryPanel;