"use client";

import { X } from 'lucide-react';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import type { ModelParamSchema } from '@/lib/playground/param-schema';
import { cn } from '@/lib/utils';

export async function uploadPlaygroundReference(
  file: File,
  provider: 'pollinations' | 'pruna'
): Promise<string> {
  // Both upload routes expect a raw request body with an explicit content-type.
  // Multipart/form-data is rejected server-side to enforce size limits.
  const endpoint = provider === 'pruna'
    ? `/api/pruna/upload?filename=${encodeURIComponent(file.name)}`
    : '/api/media/upload';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed with status ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.url;
}

function labelFor(model: PlaygroundModelEntry, schema: ModelParamSchema | undefined, i: number): string {
  if (schema?.images.roles && schema.images.roles[i]) {
    return schema.images.roles[i];
  }
  if (model.referenceMode === 'start-end-frame') return i === 0 ? 'Start' : 'Ende';
  if (model.maxImages === 1) return 'Quelle';
  return `#${i + 1}`;
}

interface Props {
  model: PlaygroundModelEntry;
  schema?: ModelParamSchema;
  uploads: string[];
  onChange: (u: string[]) => void;
}

export function ReferenceSlots({ model, schema, uploads, onChange }: Props) {
  if (!model.supportsReference || model.maxImages === 0) return null;
  const maxImages = schema?.images.max ?? model.maxImages;

  // Nur ein freier Platz auf einmal. Zehn leere Kaesten sagen nichts; das
  // Limit steht als Hinweis darueber. Beim Start-Ende-Paar heisst das
  // ausserdem, dass das Endframe erst nach dem Startframe erscheint.
  const filled = uploads.filter(Boolean).length;
  const visible = Math.min(filled + 1, maxImages);
  const slots = Array.from({ length: visible }, (_, i) => i);

  const removeAt = (index: number) => {
    onChange(uploads.filter((_, i) => i !== index));
  };

  const addUrls = (urls: string[]) => {
    if (urls.length === 0) return;
    onChange([...uploads, ...urls].slice(0, maxImages));
  };

  /** Mehrere Dateien auf einmal, in der Reihenfolge der Auswahl. */
  const uploadFiles = async (files: File[]) => {
    const room = maxImages - filled;
    const taken = files.slice(0, room);
    const results = await Promise.all(
      taken.map(async (file) => {
        try {
          return await uploadPlaygroundReference(file, model.provider);
        } catch (err) {
          console.error('Failed to upload reference:', err);
          return null;
        }
      })
    );
    addUrls(results.filter((u): u is string => u !== null));
  };

  return (
    <div className="flex flex-col gap-1.5">
      {maxImages > 1 && (
        <p className="text-[10px] text-muted-foreground/75">
          {filled} von bis zu {maxImages} Bildern
        </p>
      )}
      <div role="group" aria-label="Referenzbilder" className="grid grid-cols-2 gap-2">
      {slots.map((i) => {
        const url = uploads[i];
        const label = labelFor(model, schema, i);

        return (
          <div
            key={i}
            className={cn(
              'relative aspect-square overflow-hidden rounded-xl border transition-colors',
              url ? 'border-solid border-border' : 'border-dashed border-border hover:border-primary/60'
            )}
          >
            {url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Referenzbild" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute left-1.5 top-1.5 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  {label}
                </span>
                <button
                  type="button"
                  aria-label={`${label} entfernen`}
                  onClick={() => removeAt(i)}
                  className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-black/85"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </>
            ) : (
              <label className="absolute inset-0 grid cursor-pointer place-items-center text-[10.5px] text-muted-foreground/80 transition-colors hover:text-foreground">
                {label}
                <input
                  type="file"
                  accept="image/*"
                  multiple={maxImages - filled > 1}
                  className="sr-only"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    // Zuruecksetzen, sonst feuert dieselbe Datei kein zweites Mal.
                    e.target.value = '';
                    await uploadFiles(files);
                  }}
                />
              </label>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
