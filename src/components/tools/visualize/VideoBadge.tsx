import React from 'react';
import { X, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadedReference } from '@/types';

interface VideoBadgeProps {
  video: UploadedReference;
  onRemove?: () => void;
  className?: string;
}

export const VideoBadge: React.FC<VideoBadgeProps> = ({
  video,
  onRemove,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-2 py-1 text-[10px] font-medium text-foreground',
        className
      )}
    >
      <Film className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="truncate max-w-[120px]">
        {video.key || 'Source video'}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Remove source video"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
