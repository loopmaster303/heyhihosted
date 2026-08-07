"use client";
import type { PlaygroundMode } from '@/lib/playground/mode-mapping';
import styles from '../../app/playground/playground.module.css';

const MODES: PlaygroundMode[] = ['t2i', 'i2i', 't2v', 'i2v'];

export function ModeSwitch({
  value,
  onChange,
}: {
  value: PlaygroundMode;
  onChange: (m: PlaygroundMode) => void;
}) {
  return (
    <div role="tablist" aria-label="Mode" className={styles.segmented}>
      {MODES.map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={value === m}
          className={`${styles.segment} ${value === m ? styles.active : ''}`}
          onClick={() => onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
