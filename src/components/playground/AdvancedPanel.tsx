"use client";
import { useState } from 'react';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import styles from '../../app/playground/playground.module.css';

type Vals = { seed: string; negativePrompt: string; guidance: string; steps: string };
type Field = keyof Vals;

const KNOWN: Record<Field, string> = {
  seed: 'seed',
  negativePrompt: 'negative_prompt',
  guidance: 'guidance',
  steps: 'steps',
};

export function AdvancedPanel({ modelId, values, onChange }: { modelId: string; values: Vals; onChange: (patch: Partial<Vals>) => void }) {
  const [open, setOpen] = useState(false);
  const inputs = unifiedModelConfigs[modelId]?.inputs ?? [];
  const accepted = new Set(inputs.map((i) => i.name));
  const visibleFields = (Object.keys(KNOWN) as Field[]).filter((f) => accepted.has(KNOWN[f]));
  if (visibleFields.length === 0) return null;

  return (
    <div className={`${styles.advanced} ${open ? styles.open : ''}`}>
      <button className={styles.advancedToggle} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>Advanced</span>
        <span className={styles.chev}>▸</span>
      </button>
      {open && (
        <div className={styles.advancedBody}>
          {visibleFields.map((f) => (
            <div className={styles.miniField} key={f}>
              <label htmlFor={f}>{f}</label>
              <input id={f} value={values[f]} onChange={(e) => onChange({ [f]: e.target.value } as Partial<Vals>)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
