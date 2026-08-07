"use client";
import { useEffect, useState } from 'react';
import { db, type Asset } from '@/lib/services/database';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
import styles from '../../app/playground/playground.module.css';

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

export function Gallery({ onPick }: { onPick: (item: GalleryItem) => void }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
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
  }, []);
  return (
    <div className={styles.galleryGrid}>
      {items.map((it) => (
        <button key={it.id} className={styles.galleryItem} onClick={() => onPick(it)}>
          {it.kind === 'video'
            ? <video src={it.url} muted playsInline />
            : <img src={it.url} alt={it.prompt} />}
          <div className={styles.itemScrim} />
          <div className={styles.itemMeta}><span className={styles.itemModel}>{it.modelId}</span></div>
        </button>
      ))}
    </div>
  );
}
