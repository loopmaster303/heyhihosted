"use client";
import { getDurationOptionsSeconds, getDefaultDurationSeconds, getUnifiedModel } from '@/config/unified-image-models';
import styles from '../../app/playground/playground.module.css';

export function DurationSlider({ modelId, value, onChange }: { modelId: string; value: number | null; onChange: (v: number) => void }) {
  const model = getUnifiedModel(modelId);
  const options = getDurationOptionsSeconds(model);
  if (options.length === 0) return null;
  const min = options[0];
  const max = options[options.length - 1];
  const step = options.length > 1 ? options[1] - options[0] : 1;
  const current = value ?? getDefaultDurationSeconds(model) ?? min;
  const pct = max === min ? 100 : ((current - min) / (max - min)) * 100;
  return (
    <div className={styles.sliderRow}>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ ['--slider-pct' as any]: `${pct}%` }}
      />
      <div className={styles.sliderValue}>{current}s</div>
    </div>
  );
}
