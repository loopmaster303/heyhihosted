"use client";
import { AsciiSpinner } from '@/components/ascii'
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Image as ImageIcon, Loader2, Play, X } from 'lucide-react';
import { db, type Asset } from '@/lib/services/database';
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';
import { BlobManager } from '@/lib/blob-manager';
import { cn } from '@/lib/utils';
import { RUN_CONTINUES_NOTICE } from '@/lib/playground/constants';

export interface GalleryItem {
  id: string;
  url: string;
  kind: 'image' | 'video' | 'audio';
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
  /** Nur bei `failed` gesetzt: der uebersetzte Satz. */
  message?: string;
  /** Roher Antwortkoerper — per "Details" aufklappbar, wird nie weggekuerzt. */
  raw?: string;
  /** Naechste Handlung aus der Uebersetzung: settings / retry / pick-model. */
  aktion?: 'settings' | 'retry' | 'pick-model';
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
    kind: a.contentType?.startsWith('video/')
      ? 'video'
      : a.contentType?.startsWith('audio/')
        ? 'audio'
        : 'image',
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

// Messwerte vom 2026-08-26: wan-t2v lag bei rund 45 s, VACE bei 348–700 s.
// Erwartung als Satz, nicht als Balken — Pruna liefert keinen Prozentwert.
const VIDEO_EXPECTATION: Record<string, { label: string; seconds: number }> = {
  vace: { label: 'VACE braucht typischerweise 6–12 Minuten', seconds: 600 },
  'wan-t2v': { label: 'Wan T2V braucht typischerweise etwa eine Minute', seconds: 45 },
};
const DEFAULT_VIDEO_EXPECTATION = { label: 'Video kann mehrere Minuten dauern', seconds: 300 };

/** Ab 60 s lesbar: 11:40 statt 700 s. */
function formatElapsed(secs: number): string {
  return secs >= 60
    ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
    : `${secs} s`;
}

function RunningCard({ run, onCancel }: { run: GalleryRun; onCancel?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - run.startedAt) / 1000));
  const expectation = VIDEO_EXPECTATION[run.modelId]
    ?? (run.isVideo ? DEFAULT_VIDEO_EXPECTATION : undefined);
  const overdue = !!expectation && secs >= expectation.seconds * 2;
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
      <span className="text-[11px] tabular-nums text-muted-foreground/80">{formatElapsed(secs)}</span>
      {expectation && (
        <span className="text-[10px] leading-snug text-muted-foreground/60">{expectation.label}</span>
      )}
      {overdue && (
        <span className="text-[10px] leading-snug text-amber-600/90">
          Dieser Lauf braucht ungewöhnlich lange.
        </span>
      )}
      {onCancel && (
        // Der Abbruch haengt an der Karte, nicht an der Leiste: bei mehreren
        // Laeufen muss erkennbar bleiben, welcher gemeint ist. Der Grund steht
        // sichtbar darunter statt in einem `title` — auf dem Telefon gibt es
        // kein Hover.
        <>
          <button
            type="button"
            onClick={onCancel}
            className="mt-1 min-h-11 rounded-md border border-border bg-background px-3 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground md:min-h-0 md:px-2"
          >
            Nicht mehr warten
          </button>
          <span className="text-[10px] leading-snug text-muted-foreground/70">
            {RUN_CONTINUES_NOTICE}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Audio-Karte: ein statischer Wellen-Balken als Tragflaeche (CSS, nach der
 * Modulregel — statisch gehoert in CSS, nicht in ASCII), der Player folgt
 * beim Klick. `<audio controls>` ist der einzige reliable Player auf allen
 * Plattformen.
 */
function AudioCard({ item }: { item: GalleryItem }) {
  return (
    <span className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted/40 p-3">
      <span aria-hidden="true" className="flex h-10 items-end gap-[2px]">
        {[3, 6, 10, 7, 4, 8, 12, 9, 5, 3, 7, 11, 8, 4, 6, 9, 5, 3].map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm bg-primary/60"
            style={{ height: `${h * 2}px` }}
          />
        ))}
      </span>
      <span className="text-[10px] font-mono text-muted-foreground">audio</span>
      <audio src={item.url} controls preload="none" className="w-full" />
    </span>
  );
}

function FailedCard({
  run,
  onRetry,
  onDismiss,
  onOpenSettings,
  onPickModel,
}: {
  run: GalleryRun;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
  onPickModel?: () => void;
}) {
  // Die Meldung wird nie abgeschnitten (F3): der Satz steht ungekuerzt auf der
  // Karte, der Rohtext ist hinter "Details" erreichbar.
  const [detailOpen, setDetailOpen] = useState(false);
  const hasDetail = !!run.raw;
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-center"
      style={{ aspectRatio: cssAspectRatio(run.aspectRatio) }}
    >
      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <span className="text-[11px] font-medium text-destructive">Fehlgeschlagen</span>
      <span className="text-[10px] leading-snug text-destructive/80">{run.message}</span>
      {hasDetail && (
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="text-[10px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          {detailOpen ? 'Details verbergen' : 'Details'}
        </button>
      )}
      {hasDetail && detailOpen && (
        <span className="max-h-24 w-full overflow-y-auto break-words rounded-md bg-background/70 p-1.5 text-left font-mono text-[9.5px] leading-snug text-muted-foreground">
          {run.raw}
        </span>
      )}
      <span className="font-mono text-[10px] text-muted-foreground">{run.modelId}</span>
      <div className="mt-1 flex items-center gap-1.5">
        {run.aktion === 'settings' && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-md border border-border bg-background px-2 py-1 text-[10.5px] font-medium text-foreground transition-colors hover:border-primary/55"
          >
            Einstellungen öffnen
          </button>
        )}
        {run.aktion === 'pick-model' && onPickModel && (
          <button
            type="button"
            onClick={onPickModel}
            className="rounded-md border border-border bg-background px-2 py-1 text-[10.5px] font-medium text-foreground transition-colors hover:border-primary/55"
          >
            Modell wählen
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-md border border-border bg-background px-3 py-1 text-[10.5px] font-medium text-foreground transition-colors hover:border-primary/55 md:min-h-0 md:px-2"
          >
            Erneut versuchen
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Verwerfen"
            className="grid size-11 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground md:size-6"
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
  /** Sichtbarer Herkunftsbereich. undefined = alles. */
  origins?: readonly AssetOrigin[];
  /** Laufende und gescheiterte Generierungen, neueste zuerst. */
  runs?: GalleryRun[];
  onCancelRun?: (id: string) => void;
  onRetryRun?: (id: string) => void;
  onDismissRun?: (id: string) => void;
  /** Handlung "Einstellungen öffnen" auf der Fehlerkarte. */
  onOpenSettings?: () => void;
  /** Handlung "Modell wählen" auf der Fehlerkarte. */
  onPickModel?: () => void;
  /** Meldet die frisch geladenen Items — fuer den URL-Tausch nach der Generierung (W5). */
  onItemsLoaded?: (items: GalleryItem[]) => void;
}

export function Gallery({
  selectedId,
  onSelect,
  refreshKey = 0,
  origins,
  runs = [],
  onCancelRun,
  onRetryRun,
  onDismissRun,
  onOpenSettings,
  onPickModel,
  onItemsLoaded,
}: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  // Ein 401 von Pollinations kommt im img-Tag an, nicht in unserem fetch. Ohne
  // diesen Merker zeigt die Karte einfach nichts und niemand weiß warum.
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  // Blob-URLs, die dieser Lauf erzeugt hat — beim naechsten Lauf und beim
  // Unmount wieder freigeben, sonst haelt jeder Refresh die Blobs im Speicher.
  const ownedUrls = useRef<string[]>([]);
  // origins ist ein Array und aendert seine Identitaet — der Effekt reagiert
  // deshalb auf einen stabilen Schluessel.
  const originKey = origins ? [...origins].sort().join(',') : '';

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const rows = await db.assets
        .orderBy('timestamp')
        .reverse()
        .filter((a) => isInScope(a, origins))
        .limit(50)
        .toArray();
      const next = rows
        .map((a) => toItem(a, created))
        .filter((x): x is GalleryItem => x !== null);
      if (cancelled) {
        created.forEach((u) => BlobManager.releaseURL(u));
        return;
      }
      ownedUrls.current.forEach((u) => BlobManager.releaseURL(u));
      ownedUrls.current = created;
      setItems(next);
      onItemsLoaded?.(next);
    })();
    return () => { cancelled = true; };
    // originKey statt origins: ein Array-Literal wechselt seine Identitaet,
    // der Schluessel nicht (W1).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, originKey]);

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

      {/* Unter 520px feste zwei Spalten: auto-fill mit 168px kippt sonst
          zwischen 375px (eine Spalte) und 390px (zwei) — zwei Telefone saeen
          voellig verschieden aus. Ab 520px liefert auto-fill von sich aus
          mindestens zwei, der Uebergang ist damit nahtlos und der Desktop
          unveraendert. */}
      <div className="grid grid-cols-2 gap-3 min-[520px]:[grid-template-columns:repeat(auto-fill,minmax(168px,1fr))]">
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
            onOpenSettings={onOpenSettings}
            onPickModel={onPickModel}
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
              ) : it.kind === 'audio' ? (
                <AudioCard item={it} />
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
