'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, FileText, ImageIcon, VideoIcon } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export interface AttachmentItem {
    id: string;
    type: 'image' | 'document' | 'video';
    previewUrl?: string;
    fileName?: string;
    isUploading?: boolean;
}

interface AttachmentPreviewRowProps {
    items: AttachmentItem[];
    onRemove: (id: string) => void;
    maxItems?: number;
    className?: string;
}

export const AttachmentPreviewRow: React.FC<AttachmentPreviewRowProps> = ({
    items,
    onRemove,
    maxItems = 6,
    className,
}) => {
    const { t } = useLanguage();
    if (items.length === 0) return null;

    const visibleItems = items.slice(0, maxItems);
    const hiddenCount = items.length - visibleItems.length;

    return (
        <div className={cn('flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-1', className)}>
            {visibleItems.map((item) => {
                const itemLabel = item.fileName || t(`chat.attachment.${item.type}`);
                return <div key={item.id} className="relative flex-shrink-0 group">
                    {item.type === 'image' && item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.previewUrl}
                            alt={itemLabel}
                            className="h-12 w-12 rounded-lg object-cover border border-border/30"
                            loading="lazy"
                            decoding="async"
                        />
                    ) : item.type === 'video' ? (
                        <div role="img" aria-label={itemLabel} className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/30 bg-muted">
                            <VideoIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    ) : (
                        <div role="img" aria-label={itemLabel} className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/30 bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                    {item.isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background opacity-100 transition-opacity hover:opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100"
                        aria-label={`${t('chat.attachment.remove')}: ${itemLabel}`}
                    >
                        <X className="h-2.5 w-2.5" />
                    </button>
                </div>;
            })}

            {hiddenCount > 0 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/30 bg-muted/50 text-xs text-muted-foreground font-medium">
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};
