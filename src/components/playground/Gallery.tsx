"use client";
import { AsciiSpinner } from '@/components/ascii'
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Image as ImageIcon, Loader2, Play, X } from 'lucide-react';
import { db, type Asset } from '@/lib/services/database';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
import { BlobManager } from '@/lib/blob-manager';
import { cn } from '@/lib/utils';

export interface GalleryItem {
  id: string;
  url: string;
  kind: 'image' | 'video';
  prompt: string;
  modelId: string;
  timestamp: number;
  params?: Record<string, string | number | boolean>;
}

/**
 * Ein Lauf, den die Galerie als Karte zeigt — laufend oder gescheitert. Beide
 * Zustaende teilen sich Position und Groesse, damit die Karte beim Kippen nicht
 * springt. Mehrere davon existieren gleichzeitig; die `id` haengt Nicht mehr
 * warten, Wiederholen und Verwerfen an genau einen Lauf.
 */
export interface GalleryRun {
  id: string;
  prompt: string;
  modelId: string;
  startedAt: number;
  isVideo: boolean;
  aspectRatio?: string;
  status: 'running' | 'failed';
  /** Nur bei `failed` gesetzt. */
  message?: string;
}

/**
 * Pruna ohne Pollen-Key liefert rohe Bytes: OutputService legt das Asset dann
 * mit `blob` und ohne `remoteUrl` ab. Nur auf remoteUrl zu schauen hiess, genau
 * diese Ergebnisse nie anzuzeigen. Die erzeugten Blob-URLs gibt der Effekt
 * unten wieder frei.
 */
function toItem(a: Asset, created: string[]): GalleryItem | null {
  let url = a.remoteUrl;
  if (!url && a.blob) {
    url = BlobManager.createURL(a.blob, 'playground-gallery');
    created.push(url);
  }
  if (!url) return null;
  return {
    id: a.id,
    url,
    kind: a.contentType?.startsWith('video/') ? 'video' : 'image',
    prompt: a.prompt ?? '',
    modelId: a.modelId ?? '',
    timestamp: a.timestamp,
    params: a.params,
  };
}

// "16:9" -> "16 / 9" fuer CSS. Ungueltige Werte fallen auf Quadrat zurueck.
function cssAspectRatio(ar?: string): string {
  return ar && /^\d+(\.\d+)?:\d+(\.\d+)?$/.test(ar) ? ar.replace(':', ' / ') : '1 / 1';
}

function RunningCard({ run, onCancel }: { run: GalleryRun; onCancel?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - run.startedAt) / 1000));
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-primary/35 bg-muted/30 p-3 text-center"
      style={{ aspectRatio: cssAspectRatio(run.aspectRatio) }}
    >
      <AsciiSpinner />
      <span className="text-[11px] font-medium text-foreground">Generiere…</span>
      <span className="font-mono text-[10.5px] text-muted-foreground">{run.modelId}</span>
      <span className="text-[11px] tabular-nums text-muted-foreground/80">{secs} s</span>
      {run.isVideo && (
        <span className="text-[10px] leading-snug text-muted-foreground/60">
          Video kann mehrere Minuten dauern
        </span>
      )}
      {onCancel && (
        // Der Abbruch haengt an der Karte, nicht an der Leiste: bei mehreren
        // Laeufen muss erkennbar bleiben, welcher gemeint ist.
        <button
          type="button"
          onClick={onCancel}
          title="Der Lauf läuft beim Anbieter weiter und wird berechnet."
          className="mt-1 rounded-md border border-border bg-background px-2 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground"
        >
          Nicht mehr warten
        </button>
      )}
    </div>
  );
}

function FailedCard({
  run,
  onRetry,
  onDismiss,
}: {
  run: GalleryRun;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-center"
      style={{ aspectRatio: cssAspectRatio(run.aspectRatio) }}
    >
      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <span className="text-[11px] font-medium text-destructive">Fehlgeschlagen</span>
      <span className="line-clamp-3 text-[10px] leading-snug text-destructive/80">{run.message}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{run.modelId}</span>
      <div className="mt-1 flex items-center gap-1.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border bg-background px-2 py-1 text-[10.5px] font-medium text-foreground transition-colors hover:border-primary/55"
          >
            Erneut versuchen
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Verwerfen"
            className="grid h-6 w-6 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  selectedId: string | null;
  onSelect: (item: GalleryItem) => void;
  /** Bump to re-read the store after a generation lands. */
  refreshKey?: number;
  /** Laufende und gescheiterte Generierungen, neueste zuerst. */
  runs?: GalleryRun[];
  onCancelRun?: (id: string) => void;
  onRetryRun?: (id: string) => void;
  onDismissRun?: (id: string) => void;
}

export function Gallery({
  selectedId,
  onSelect,
  refreshKey = 0,
  runs = [],
  onCancelRun,
  onRetryRun,
  onDismissRun,
}: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  // Ein 401 von Pollinations kommt im img-Tag an, nicht in unserem fetch. Ohne
  // diesen Merker zeigt die Karte einfach nichts und niemand weiß warum.
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  // Blob-URLs, die dieser Lauf erzeugt hat — beim naechsten Lauf und beim
  // Unmount wieder freigeben, sonst haelt jeder Refresh die Blobs im Speicher.
  const ownedUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const rows = await db.assets
        .where('conversationId')
        .equals(PLAYGROUND_CONVERSATION_ID)
        .reverse()
        .sortBy('timestamp');
      const next = rows
        .slice(0, 50)
        .map((a) => toItem(a, created))
        .filter((x): x is GalleryItem => x !== null);
      if (cancelled) {
        created.forEach((u) => BlobManager.releaseURL(u));
        return;
      }
      ownedUrls.current.forEach((u) => BlobManager.releaseURL(u));
      ownedUrls.current = created;
      setItems(next);
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => () => {
    ownedUrls.current.forEach((u) => BlobManager.releaseURL(u));
    ownedUrls.current = [];
  }, []);

  // Leere Galerie, aber eine laufende oder fehlgeschlagene Generierung
  // trotzdem zeigen — sonst wirkt die App waehrend des ersten Sends tot.
  if (items.length === 0 && runs.length === 0) {
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
        {runs.map((run) => (run.status === 'running' ? (
          <RunningCard
            key={run.id}
            run={run}
            onCancel={onCancelRun && (() => onCancelRun(run.id))}
          />
        ) : (
          <FailedCard
            key={run.id}
            run={run}
            onRetry={onRetryRun && (() => onRetryRun(run.id))}
            onDismiss={onDismissRun && (() => onDismissRun(run.id))}
          />
        )))}
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
