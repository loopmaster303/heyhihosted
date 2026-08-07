"use client";
import { useMemo, useState } from 'react';
import { isModelInMode, type PlaygroundMode } from '@/lib/playground/mode-mapping';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import { useLanguage } from '@/components/LanguageProvider';
import styles from '../../app/playground/playground.module.css';

interface Props {
  entries: PlaygroundModelEntry[];
  mode: PlaygroundMode;
  value: string | null;
  onChange: (id: string) => void;
  loading: boolean;
  fallbackActive: boolean;
}

export function ModelSelect({ entries, mode, value, onChange, loading, fallbackActive }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => entries.filter((e) => isModelInMode(e, mode)), [entries, mode]);
  const current = filtered.find((e) => e.id === value);

  return (
    <div className={`${styles.select} ${open ? styles.open : ''}`}>
      {fallbackActive && <p className={styles.warn}>{t('playground.fallbackNotice')}</p>}
      <button
        className={styles.selectBtn}
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose model"
        disabled={loading || filtered.length === 0}
      >
        <span className={styles.dot} aria-hidden />
        <span className={styles.modelName}>{current?.name ?? (loading ? 'Loading…' : t('playground.prunaEmpty'))}</span>
      </button>
      {open && (
        <ul className={styles.selectMenu} role="listbox">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                className={`${styles.selectItem} ${e.id === value ? styles.active : ''}`}
                onClick={() => {
                  onChange(e.id);
                  setOpen(false);
                }}
              >
                <span>{e.name}</span>
                {e.unmapped && <span className={styles.chip}>unmapped</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
