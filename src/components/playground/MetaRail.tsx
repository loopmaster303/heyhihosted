"use client";

import { Download, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GalleryItem } from './Gallery';

function relativeTime(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.round(hours / 24)} Tg`;
}

// Kuratierte Chips fuer die Detailansicht. Reihenfolge = Anzeigereihenfolge.
// Booleans nur wenn true ("fast", "audio", ...), lange Freitexte (negative_prompt)
// bleiben bewusst raus — sie landen ueber "Nochmal" wieder im Composer.
const CHIP_DEFS: {
  name: string;
  label?: string;
  booleanLabel?: string;
  format?: (v: string | number) => string;
}[] = [
  { name: 'aspect_ratio', label: 'ar' },
  { name: 'resolution', label: 'res' },
  { name: 'seed', label: 'seed' },
  { name: 'steps', label: 'steps' },
  { name: 'guidance', label: 'guid' },
  { name: 'duration', format: (v) => `${v} s` },
  { name: 'output_format' },
  { name: 'go_fast', booleanLabel: 'fast' },
  { name: 'audio', booleanLabel: 'audio' },
  { name: 'transparent', booleanLabel: 'alpha' },
];

export function chipsFor(params?: Record<string, string | number | boolean>): string[] {
  if (!params) return [];
  const out: string[] = [];
  for (const def of CHIP_DEFS) {
    const v = params[def.name];
    if (v === undefined || v === null) continue;
    if (typeof v === 'boolean') {
      if (v && def.booleanLabel) out.push(def.booleanLabel);
      continue;
    }
    out.push(def.format ? def.format(v) : def.label ? `${def.label} ${v}` : String(v));
  }
  return out;
}

interface Props {
  item: GalleryItem | null;
  className?: string;
  onLoad?: (item: GalleryItem) => void;
  onRerun?: (item: GalleryItem) => void;
  onUseAsReference?: (item: GalleryItem) => void;
  onDelete?: (item: GalleryItem) => void;
}

export function MetaRail({ item, className, onLoad, onRerun, onUseAsReference, onDelete }: Props) {
  return (
    <aside
      className={cn(
        'glass-panel flex min-h-0 flex-col gap-3.5 overflow-y-auto border-l border-border/45 p-4',
        className,
      )}
    >
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
            {chipsFor(item.params).map((chip) => (
              <span
                key={chip}
                className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10.5px] tabular-nums text-muted-foreground"
              >
                {chip}
              </span>
            ))}
            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10.5px] tabular-nums text-muted-foreground">
              {relativeTime(item.timestamp)}
            </span>
          </div>

          <div className="mt-0.5 grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="min-h-11 gap-1.5 xl:min-h-0" onClick={() => onLoad?.(item)}>
              <Download className="h-3 w-3" />
              Laden
            </Button>
            <Button variant="outline" size="sm" className="min-h-11 gap-1.5 xl:min-h-0" onClick={() => onRerun?.(item)}>
              <RotateCcw className="h-3 w-3" />
              Nochmal
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="col-span-2 min-h-11 gap-1.5 xl:min-h-0"
              onClick={() => onUseAsReference?.(item)}
            >
              <Plus className="h-3 w-3" />
              Als Referenz übernehmen
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="col-span-2 gap-1.5 text-destructive hover:border-destructive/55 hover:text-destructive"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-3 w-3" />
                Löschen
              </Button>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
