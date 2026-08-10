"use client";

import { Download, Plus, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GalleryItem } from './Gallery';

function relativeTime(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.round(hours / 24)} Tg`;
}

interface Props {
  item: GalleryItem | null;
  onLoad?: (item: GalleryItem) => void;
  onRerun?: (item: GalleryItem) => void;
  onUseAsReference?: (item: GalleryItem) => void;
}

export function MetaRail({ item, onLoad, onRerun, onUseAsReference }: Props) {
  return (
    <aside className="glass-panel flex min-h-0 flex-col gap-3.5 overflow-y-auto border-l border-border/45 p-4">
      {!item ? (
        <div className="grid h-full place-items-center p-5 text-center text-xs text-muted-foreground/70">
          Wähl ein Ergebnis, um Prompt und Parameter zu sehen.
        </div>
      ) : (
        <>
          <Badge variant="secondary" className="self-start">
            {item.kind === 'video' ? 'Video' : 'Bild'}
          </Badge>

          <div className="overflow-hidden rounded-lg border border-border">
            {item.kind === 'video' ? (
              <video src={item.url} controls className="block h-auto w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt={item.prompt} className="block h-auto w-full" />
            )}
          </div>

          {item.prompt && (
            <p className="text-[13px] leading-relaxed text-foreground">{item.prompt}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {item.modelId && (
              <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {item.modelId}
              </span>
            )}
            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10.5px] tabular-nums text-muted-foreground">
              {relativeTime(item.timestamp)}
            </span>
          </div>

          <div className="mt-0.5 grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onLoad?.(item)}>
              <Download className="h-3 w-3" />
              Laden
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onRerun?.(item)}>
              <RotateCcw className="h-3 w-3" />
              Nochmal
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="col-span-2 gap-1.5"
              onClick={() => onUseAsReference?.(item)}
            >
              <Plus className="h-3 w-3" />
              Als Referenz übernehmen
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
