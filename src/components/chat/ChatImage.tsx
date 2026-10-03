'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import { Download, Maximize2, RotateCcw, Wand2 } from 'lucide-react';
import type { ChatImagePayload } from '@/types';
import { cn } from '@/lib/utils';
import { GenerationField } from '@/components/ascii/GenerationField';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import { BlobManager } from '@/lib/blob-manager';

interface ChatImageProps {
  image: ChatImagePayload;
  onRetry?: () => void;
  onZoom?: (src: string) => void;
  onOpenInCreate?: () => void;
  className?: string;
}

const MAX_LOAD_RETRIES = 6;

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Sekunden seit dem Mount, solange `running`. */
function useElapsed(running: boolean): number {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now - startedAt;
}

async function downloadImage(src: string, modelId?: string) {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = BlobManager.createURL(blob, 'chat-download');
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `heyhi-${modelId || 'bild'}-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Sofortiges Widerrufen bricht den Download in Safari und Firefox ab.
    window.setTimeout(() => BlobManager.releaseURL(objectUrl), 60_000);
  } catch {
    window.open(src, '_blank', 'noopener');
  }
}

/**
 * Ein erzeugtes Bild im Chat. Es steht fuer sich: keine Blase, kein Rahmen,
 * kein Schatten — nur der Eckenradius. Waehrend es entsteht, haelt das
 * ASCII-Feld genau seinen Platz; sobald das Bild dekodiert ist, loest es sich
 * aus dem Feld (Unschaerfe zu scharf). Nichts springt.
 */
export const ChatImage: React.FC<ChatImageProps> = ({ image, onRetry, onZoom, onOpenInCreate, className }) => {
  const isPending = image.status === 'pending';
  const isError = image.status === 'error';
  const { url: localUrl } = useAssetUrl(image.metadata?.assetId ?? undefined, image.url);
  const baseSrc = localUrl || image.url;

  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const elapsed = useElapsed(isPending || (!isError && !loaded));

  // Frisch erzeugte Media-URLs sind manchmal Sekunden nach der Antwort noch
  // nicht abrufbar. Ein paar Versuche mit wachsendem Abstand statt eines
  // kaputten Bildes.
  const src = attempt > 0 && baseSrc.startsWith('http')
    ? `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}r=${attempt}`
    : baseSrc;

  // Neue Quelle (Platzhalter → fertiges Bild, lokale Kopie geladen): von vorn.
  const [shownSrc, setShownSrc] = useState(baseSrc);
  if (shownSrc !== baseSrc) {
    setShownSrc(baseSrc);
    setLoaded(false);
    setAttempt(0);
  }

  const label = image.prompt || image.altText || 'Erzeugtes Bild';

  if (isError) {
    return (
      <figure className={cn('w-full max-w-[min(100%,22rem)]', className)}>
        <div className="relative flex aspect-square w-full flex-col items-start justify-end gap-3 overflow-hidden rounded-2xl bg-muted/40 p-4">
          <GenerationField active={false} className="absolute inset-0 rounded-2xl opacity-25" />
          <p className="relative text-sm text-foreground">{image.error || 'Das Bild konnte nicht erzeugt werden.'}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="press relative inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Erneut versuchen
            </button>
          )}
        </div>
        <figcaption className="mt-1.5 font-mono text-xs text-muted-foreground">
          {image.modelId ?? 'bild'} · nicht erzeugt
        </figcaption>
      </figure>
    );
  }

  const showField = isPending || !loaded;

  return (
    <figure className={cn('group w-full max-w-[min(100%,22rem)]', className)} aria-busy={isPending}>
      <div className="relative aspect-square w-full">
        <GenerationField
          active={showField}
          className={cn(
            'absolute inset-0 transition-[opacity,filter] duration-slow ease-out',
            showField ? 'opacity-100' : 'opacity-0 blur-[3px]',
          )}
        />
        {!isPending && src && (
          <button
            type="button"
            onClick={() => onZoom?.(baseSrc)}
            className="absolute inset-0 block cursor-zoom-in rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`Bild vergrößern: ${label}`}
          >
            <img
              key={src}
              src={src}
              alt={label}
              decoding="async"
              onLoad={(e) => {
                const img = e.currentTarget;
                // Erst zeigen, wenn dekodiert — sonst blitzt ein halbes Bild auf.
                (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).finally(() => setLoaded(true));
              }}
              onError={() => {
                if (attempt >= MAX_LOAD_RETRIES || !baseSrc.startsWith('http')) return;
                window.setTimeout(() => setAttempt((a) => a + 1), 1200 * (attempt + 1));
              }}
              className={cn(
                'h-full w-full rounded-2xl object-cover transition-[opacity,filter,transform] duration-slow ease-out',
                loaded ? 'scale-100 opacity-100 blur-0' : 'scale-[0.985] opacity-0 blur-[14px]',
              )}
            />
          </button>
        )}
        {!isPending && loaded && (
          <div className="reveal-on-hover pointer-events-none absolute bottom-2 right-2 flex gap-1.5">
            <MediaAction label="Vergrößern" onClick={() => onZoom?.(baseSrc)}><Maximize2 className="h-4 w-4" /></MediaAction>
            <MediaAction label="Herunterladen" onClick={() => void downloadImage(baseSrc, image.modelId)}><Download className="h-4 w-4" /></MediaAction>
            {onOpenInCreate && (
              <MediaAction label="In Create weiterarbeiten" onClick={onOpenInCreate} wide>
                <Wand2 className="h-4 w-4" />
                <span className="text-xs font-medium">Create</span>
              </MediaAction>
            )}
          </div>
        )}
      </div>
      <figcaption className="mt-1.5 font-mono text-xs tabular-nums text-muted-foreground" aria-live="off">
        {isPending
          ? `${image.modelId ?? 'bild'} · erzeugt · ${formatElapsed(elapsed)}`
          : image.modelId ?? ''}
      </figcaption>
    </figure>
  );
};

function MediaAction({ label, onClick, children, wide }: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'press pointer-events-auto inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-black/55 text-white backdrop-blur-md',
        'hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
        wide ? 'px-3.5' : 'w-11',
      )}
    >
      {children}
    </button>
  );
}
