"use client";

import { X } from 'lucide-react';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import { cn } from '@/lib/utils';

export async function uploadPlaygroundReference(
  file: File,
  provider: 'pollinations' | 'pruna'
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const endpoint = provider === 'pruna' ? '/api/pruna/upload' : '/api/media/upload';
  const res = await fetch(endpoint, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

function labelFor(model: PlaygroundModelEntry, i: number): string {
  if (model.referenceMode === 'start-end-frame') return i === 0 ? 'Start' : 'Ende';
  if (model.maxImages === 1) return 'Quelle';
  return `#${i + 1}`;
}

interface Props {
  model: PlaygroundModelEntry;
  uploads: string[];
  onChange: (u: string[]) => void;
}

export function ReferenceSlots({ model, uploads, onChange }: Props) {
  if (!model.supportsReference || model.maxImages === 0) return null;
  const slots = Array.from({ length: model.maxImages }, (_, i) => i);

  const removeAt = (index: number) => {
    // Drop the entry rather than blanking it, so the remaining images move up
    // and no empty slot is left stranded in the middle.
    onChange(uploads.filter((_, i) => i !== index));
  };

  const setAt = (index: number, url: string) => {
    const next = [...uploads];
    next[index] = url;
    onChange(next);
  };

  return (
    <div role="group" aria-label="Referenzbilder" className="grid grid-cols-2 gap-2">
      {slots.map((i) => {
        const url = uploads[i];
        const label = labelFor(model, i);

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
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setAt(i, await uploadPlaygroundReference(file, model.provider));
                    } catch (err) {
                      console.error('Failed to upload reference:', err);
                    }
                  }}
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
