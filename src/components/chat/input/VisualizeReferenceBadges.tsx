import React from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadedReference } from '@/types';

interface VisualizeReferenceBadgesProps {
  uploadedImages: UploadedReference[];
  maxImages: number;
  supportsReference: boolean;
  isUploading?: boolean;
  onRemove: (index: number) => void;
  onUploadClick: () => void;
  disabled?: boolean;
  selectedModelId?: string;
}

export const VisualizeReferenceBadges: React.FC<VisualizeReferenceBadgesProps> = ({
  uploadedImages,
  maxImages,
  supportsReference,
  isUploading = false,
  onRemove,
  onUploadClick,
  disabled = false,
  selectedModelId,
}) => {
  if (!supportsReference) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {uploadedImages.length < maxImages && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled || isUploading}
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-border/50 transition-[transform,box-shadow,background-color,opacity,border-color] duration-200 ease-out",
            disabled || isUploading
              ? "opacity-50 cursor-not-allowed bg-transparent"
              : "bg-transparent hover:bg-muted/20 hover:border-primary/35 hover:shadow-sm"
          )}
          aria-label="Add reference image"
        >
          <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}

      <span className="text-[10px] leading-none text-foreground/70 font-semibold tracking-[0.16em]">
        {uploadedImages.length}/{maxImages}
      </span>

      {uploadedImages.map((img, index) => (
        <div
          key={`${img.key || img.url}-${index}`}
          className="relative h-6 w-6 rounded-md border border-border/40 overflow-hidden bg-muted/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -top-1 -right-1 rounded-full bg-black/70 text-white p-0.5"
            aria-label="Remove reference"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}

      {isUploading && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading
        </span>
      )}
    </div>
  );
};
