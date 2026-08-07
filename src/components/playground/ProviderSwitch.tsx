"use client";
import { useProviderMode } from '@/hooks/useProviderMode';
import type { ImageProvider } from '@/config/unified-image-models';
import styles from '../../app/playground/playground.module.css';

const OPTIONS: { id: ImageProvider; label: string }[] = [
  { id: 'pollinations', label: 'Pollinations' },
  { id: 'pruna', label: 'Pruna' },
];

export function ProviderSwitch() {
  const { providerMode, setProviderMode } = useProviderMode();
  return (
    <div role="tablist" aria-label="Provider" className={styles.segmented}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          role="tab"
          aria-selected={providerMode === opt.id}
          className={`${styles.segment} ${providerMode === opt.id ? styles.active : ''}`}
          onClick={() => setProviderMode(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
