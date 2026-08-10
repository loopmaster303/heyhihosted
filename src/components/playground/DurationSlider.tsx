"use client";

import { Slider } from '@/components/ui/slider';
import {
  getDurationOptionsSeconds,
  getDefaultDurationSeconds,
  getUnifiedModel,
} from '@/config/unified-image-models';

export function DurationSlider({
  modelId,
  value,
  onChange,
}: {
  modelId: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const model = getUnifiedModel(modelId);
  const options = getDurationOptionsSeconds(model);
  if (options.length === 0) return null;

  const min = options[0];
  const max = options[options.length - 1];
  const step = options.length > 1 ? options[1] - options[0] : 1;
  const current = value ?? getDefaultDurationSeconds(model) ?? min;

  return (
    <div className="flex items-center gap-3">
      <Slider
        aria-label="Dauer in Sekunden"
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={([next]) => onChange(next)}
        className="flex-1"
      />
      <span className="min-w-[34px] text-right text-xs tabular-nums text-foreground">
        {current}s
      </span>
    </div>
  );
}
