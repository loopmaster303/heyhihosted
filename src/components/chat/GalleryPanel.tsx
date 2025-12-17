"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { Trash2, X, Download, Image as ImageIcon, Maximize2, Trash } from 'lucide-react';
import { format } from 'date-fns';
import type { ImageHistoryItem } from '@/types';
import { useLanguage } from '../LanguageProvider';
import ErrorBoundary from '../ErrorBoundary';

interface GalleryPanelProps {
    history: ImageHistoryItem[];
    onSelectImage: (item: ImageHistoryItem) => void;
    onClearHistory: () => void;
    onClose: () => void;
    onDeleteSingleImage?: (id: string) => void;
}

const GalleryPanel: FC<GalleryPanelProps> = ({ history, onSelectImage, onClearHistory, onClose, onDeleteSingleImage }) => {
    const { t } = useLanguage();
    const [isFullscreen, setIsFullscreen] = useState(false);

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

    const handleImageClick = (event: React.MouseEvent, item: ImageHistoryItem) => {
        if (isFullscreen) {
            event.stopPropagation();
            // Dispatch custom event to reuse prompt (similar to sidebar)
            window.dispatchEvent(new CustomEvent('sidebar-reuse-prompt', { detail: item.prompt }));
        } else {
            onSelectImage(item);
        }
    };

    const handleDeleteSingle = (event: React.MouseEvent, id: string) => {
        event.stopPropagation();
        if (onDeleteSingleImage) {
            onDeleteSingleImage(id);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-background border-l">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">{t('imageGen.history')}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(true)}
                            aria-label="Maximize gallery"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClearHistory} aria-label="Clear history" className="text-muted-foreground hover:text-foreground">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-grow overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8">
                            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-sm">{t('imageGen.noImages')}</p>
                        </div>
                    ) : (
                        <ErrorBoundary
                            fallbackTitle="Galerie konnte nicht geladen werden"
                            fallbackMessage="Es gab ein Problem beim Laden der Bilder."
                            showHomeButton={false}
                        >
                            <div className="grid grid-cols-2 gap-3 p-4">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                                        onClick={() => onSelectImage(item)}
                                    >
                                        <NextImage
                                            src={item.videoUrl ? 'https://placehold.co/400x400.png' : item.imageUrl}
                                            alt={item.prompt}
                                            fill
                                            unoptimized
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
                                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            onClick={(e) => handleDownload(e, item)}
                                            aria-label="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ErrorBoundary>
                    )}
                </ScrollArea>
            </div>

            {/* Fullscreen Gallery Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
                    <div className="flex flex-col h-full">
                        {/* Fullscreen Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <ImageIcon className="w-6 h-6 text-white" />
                                <h2 className="text-2xl font-semibold text-white">{t('imageGen.history')}</h2>
                                <span className="text-sm text-white/60">({history.length} {history.length === 1 ? 'Bild' : 'Bilder'})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearHistory}
                                    className="text-white/80 hover:text-white hover:bg-white/10"
                                >
                                    <Trash2 className="w-5 h-5 mr-2" />
                                    Alle löschen
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsFullscreen(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Fullscreen Content */}
                        <ScrollArea className="flex-1 overflow-y-auto p-6">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/60">
                                    <ImageIcon className="w-20 h-20 mb-6 opacity-30" />
                                    <p className="text-lg">{t('imageGen.noImages')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1800px] mx-auto">
                                    {history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                                            onClick={(e) => handleImageClick(e, item)}
                                        >
                                            <NextImage
                                                src={item.videoUrl ? 'https://placehold.co/600x600.png' : item.imageUrl}
                                                alt={item.prompt}
                                                fill
                                                unoptimized
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                                style={{ objectFit: 'cover' }}
                                                className="bg-muted/30"
                                            />
                                            {item.videoUrl && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                </div>
                                            )}

                                            {/* Image Info Overlay */}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <p className="text-white text-sm font-medium line-clamp-2 mb-1">{item.prompt}</p>
                                                <p className="text-white/70 text-xs">{format(new Date(item.timestamp), "dd.MM.yyyy HH:mm")}</p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
                                                    onClick={(e) => handleDownload(e, item)}
                                                    aria-label="Download"
                                                >
                                                    <Download className="h-4 w-4 text-gray-900" />
                                                </Button>
                                                {onDeleteSingleImage && (
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full bg-red-500/90 hover:bg-red-500 shadow-lg"
                                                        onClick={(e) => handleDeleteSingle(e, item.id)}
                                                        aria-label="Delete"
                                                    >
                                                        <Trash className="h-4 w-4 text-white" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Click to reuse prompt hint */}
                                            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <div className="bg-white/90 text-gray-900 text-xs font-medium px-2 py-1 rounded-full shadow-lg">
                                                    Klick = Prompt wiederverwenden
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            )}
        </>
    );
};

export default GalleryPanel;
