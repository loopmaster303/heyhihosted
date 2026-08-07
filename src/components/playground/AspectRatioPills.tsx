"use client";

import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import styles from '../../app/playground/playground.module.css';

export function AspectRatioPills({
  modelId,
  value,
  onChange,
}: {
  modelId: string;
  value: string | null;
  onChange: (r: string) => void;
}) {
  const presets = getAspectRatioPresetsForModel(modelId);
  if (Object.keys(presets).length === 0) return null;

  return (
    <div className={styles.pillRow}>
      {Object.entries(presets).map(([ratio]) => (
        <button
          key={ratio}
          type="button"
          className={`${styles.pill} ${value === ratio ? styles.active : ''}`}
          onClick={() => onChange(ratio)}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
}
