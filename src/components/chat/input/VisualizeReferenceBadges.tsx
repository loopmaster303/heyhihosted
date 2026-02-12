import React from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
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

  const getLabel = () => {
    if (!selectedModelId) return 'Referenzen';
    // Check if video model
    if (selectedModelId === 'wan' || selectedModelId === 'seedance' || selectedModelId === 'seedance-pro') {
        return 'Start-Frame';
    }
    return 'Referenzen';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] text-foreground/70 font-semibold uppercase tracking-wider">
        {getLabel()} {uploadedImages.length}/{maxImages}
      </span>

      {uploadedImages.map((img, index) => (
        <div
          key={`${img.key || img.url}-${index}`}
          className="relative h-8 w-8 rounded-md border border-border/40 overflow-hidden bg-muted/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -top-1 -right-1 rounded-full bg-black/70 text-white p-0.5"
            aria-label="Remove reference"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {uploadedImages.length < maxImages && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled || isUploading}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-border/60 transition-[transform,box-shadow,background-color,opacity] duration-200 ease-out",
            disabled || isUploading
              ? "opacity-50 cursor-not-allowed bg-transparent"
              : "bg-transparent hover:bg-muted/30 hover:border-primary/40 hover:shadow-sm"
          )}
          aria-label="Add reference image"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {isUploading && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading
        </span>
      )}
    </div>
  );
};
