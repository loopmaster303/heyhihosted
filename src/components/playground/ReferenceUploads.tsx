"use client";

import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import styles from '../../app/playground/playground.module.css';

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
  if (model.referenceMode === 'start-end-frame') return i === 0 ? 'Start' : 'End';
  if (model.maxImages === 1) return 'Source';
  return `#${i + 1}`;
}

interface Props {
  model: PlaygroundModelEntry;
  uploads: string[];
  onChange: (u: string[]) => void;
}

export function ReferenceUploads({ model, uploads, onChange }: Props) {
  if (!model.supportsReference || model.maxImages === 0) return null;
  const slots = Array.from({ length: model.maxImages }, (_, i) => i);

  return (
    <div className={styles.uploadSlots} role="group" aria-label="Reference images">
      {slots.map((i) => {
        const url = uploads[i];
        return (
          <label key={i} className={`${styles.uploadSlot} ${url ? styles.filled : ''}`}>
            <span className={styles.slotLabel}>{labelFor(model, i)}</span>
            {url ? (
              <img src={url} alt="reference" />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploadedUrl = await uploadPlaygroundReference(file, model.provider);
                    const next = [...uploads];
                    next[i] = uploadedUrl;
                    onChange(next);
                  } catch (err) {
                    console.error('Failed to upload reference:', err);
                  }
                }}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
