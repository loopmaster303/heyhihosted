"use client";
import { useEffect, useState } from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import { db, type Asset } from '@/lib/services/database';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
import { cn } from '@/lib/utils';

export interface GalleryItem {
  id: string;
  url: string;
  kind: 'image' | 'video';
  prompt: string;
  modelId: string;
  timestamp: number;
}

function toItem(a: Asset): GalleryItem | null {
  const url = a.remoteUrl;
  if (!url) return null;
  return {
    id: a.id,
    url,
    kind: a.contentType?.startsWith('video/') ? 'video' : 'image',
    prompt: a.prompt ?? '',
    modelId: a.modelId ?? '',
    timestamp: a.timestamp,
  };
}

interface Props {
  selectedId: string | null;
  onSelect: (item: GalleryItem) => void;
  /** Bump to re-read the store after a generation lands. */
  refreshKey?: number;
}

export function Gallery({ selectedId, onSelect, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  // Ein 401 von Pollinations kommt im img-Tag an, nicht in unserem fetch. Ohne
  // diesen Merker zeigt die Karte einfach nichts und niemand weiß warum.
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await db.assets
        .where('conversationId')
        .equals(PLAYGROUND_CONVERSATION_ID)
        .reverse()
        .sortBy('timestamp');
      if (cancelled) return;
      setItems(rows.slice(0, 50).map(toItem).filter((x): x is GalleryItem => x !== null));
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted/40 text-primary">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Noch nichts generiert</h3>
          <p className="mt-1 text-xs text-muted-foreground">Schreib einen Prompt und drück Senden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75">
          Ausgabe
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground/60">
          {items.length} {items.length === 1 ? 'Objekt' : 'Objekte'}
        </span>
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))' }}
      >
        {items.map((it) => {
          const selected = it.id === selectedId;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect(it)}
              aria-current={selected ? true : undefined}
              className={cn(
                'group relative block w-full overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5',
                selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/55'
              )}
            >
              {/* Media keeps its natural aspect ratio — never cropped. */}
              {broken[it.id] ? (
                <span className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-muted/40 p-3 text-center">
                  <span className="text-[11px] font-medium text-foreground">Nicht abrufbar</span>
                  <span className="text-[10px] leading-snug text-muted-foreground">
                    {it.modelId} braucht vermutlich einen Key
                  </span>
                </span>
              ) : it.kind === 'video' ? (
                <video
                  src={it.url}
                  muted
                  playsInline
                  className="block h-auto w-full"
                  onError={() => setBroken((b) => ({ ...b, [it.id]: true }))}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.url}
                  alt={it.prompt}
                  className="block h-auto w-full"
                  onError={() => setBroken((b) => ({ ...b, [it.id]: true }))}
                />
              )}

              {it.kind === 'video' && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-md bg-black/65 text-white backdrop-blur-sm">
                  <Play className="h-2.5 w-2.5" fill="currentColor" />
                </span>
              )}

              <span
                className={cn(
                  'pointer-events-none absolute inset-x-0 bottom-0 h-[54%] bg-gradient-to-t from-black/85 to-transparent transition-opacity group-hover:opacity-100',
                  selected ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'absolute inset-x-2 bottom-1.5 flex items-center gap-1.5 text-[10px] text-white/95 transition-opacity group-hover:opacity-100',
                  selected ? 'opacity-100' : 'opacity-0'
                )}
              >
                <span className="font-semibold">{it.modelId}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
