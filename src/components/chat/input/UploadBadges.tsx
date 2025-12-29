import React from 'react';
import { ImageIcon, FileText, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadBadgesProps {
    isLoading: boolean;
    isImageMode: boolean;
    onImageUploadClick: () => void;
    onDocUploadClick: () => void;
    onCameraClick: () => void;
    allowImageUploadInImageMode?: boolean;
    disableImageUpload?: boolean;
}

export const UploadBadges: React.FC<UploadBadgesProps> = ({
    isLoading,
    isImageMode,
    onImageUploadClick,
    onDocUploadClick,
    onCameraClick,
    allowImageUploadInImageMode = false,
    disableImageUpload = false
}) => {
    const canUploadImage = !isLoading && (!isImageMode || allowImageUploadInImageMode) && !disableImageUpload;

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide mask-fade-right">
            
             {/* Image Upload */}
             <button
                type="button"
                onClick={() => {
                   if (canUploadImage) onImageUploadClick();
                }}
                disabled={!canUploadImage}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-[transform,box-shadow,background-color,opacity] duration-200 ease-out shrink-0",
                    !canUploadImage
                        ? "opacity-50 cursor-not-allowed bg-transparent border-border/20"
                        : "bg-transparent border-border/30 hover:shadow-md hover:-translate-y-0.5"
                )}
                aria-label="Bild hochladen"
                title="Bild hochladen"
            >
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="sr-only">Bild</span>
            </button>

            {/* Doc Upload */}
            <button
                type="button"
                onClick={() => {
                   if (!isLoading && !isImageMode) onDocUploadClick();
                }}
                disabled={isLoading || isImageMode}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-[transform,box-shadow,background-color,opacity] duration-200 ease-out shrink-0",
                    (isLoading || isImageMode)
                        ? "opacity-50 cursor-not-allowed bg-transparent border-border/20"
                        : "bg-transparent border-border/30 hover:shadow-md hover:-translate-y-0.5"
                )}
                aria-label="Dokument hochladen"
                title="Dokument hochladen"
            >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="sr-only">Dokument</span>
            </button>

             {/* Camera */}
             <button
                type="button"
                onClick={() => {
                   if (!isLoading && !isImageMode) onCameraClick();
                }}
                disabled={isLoading || isImageMode}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-[transform,box-shadow,background-color,opacity] duration-200 ease-out shrink-0",
                    (isLoading || isImageMode)
                        ? "opacity-50 cursor-not-allowed bg-transparent border-border/20"
                        : "bg-transparent border-border/30 hover:shadow-md hover:-translate-y-0.5"
                )}
                aria-label="Kamera öffnen"
                title="Kamera öffnen"
            >
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="sr-only">Kamera</span>
            </button>

        </div>
    );
};
